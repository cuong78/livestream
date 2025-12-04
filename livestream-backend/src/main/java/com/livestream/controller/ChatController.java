package com.livestream.controller;

import com.livestream.dto.CommentDto;
import com.livestream.dto.MatchInfoDto;
import com.livestream.service.ViewerCountService;
import com.livestream.util.ProfanityFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {
    
    private final RedisTemplate<String, String> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ViewerCountService viewerCountService;
    
    private static final int MAX_DISPLAY_NAME_LENGTH = 50;
    private static final int MAX_CONTENT_LENGTH = 500;
    private static final int MIN_CONTENT_LENGTH = 1;
    private static final int RATE_LIMIT_SECONDS = 3; // 1 comment per 3 seconds
    private static final String RATE_LIMIT_PREFIX = "rate_limit:comment:";
    private static final String COMMENTS_HISTORY_KEY = "chat:comments:history";
    private static final int MAX_COMMENTS_HISTORY = 50; // Keep last 50 comments
    private static final long COMMENTS_TTL_HOURS = 24; // Comments expire after 24 hours

    @MessageMapping("/comment")
    public void sendComment(CommentDto commentDto, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Get IP address from WebSocket session
            String ipAddress = (String) headerAccessor.getSessionAttributes().get("ip");
            if (ipAddress == null) {
                ipAddress = headerAccessor.getSessionId(); // Fallback to session ID
            }
            
            log.info("Received comment from IP: {}, DisplayName: {}, Content: {}", 
                ipAddress, commentDto.getDisplayName(), commentDto.getContent());
            
            // Validate display name
            if (commentDto.getDisplayName() == null || commentDto.getDisplayName().trim().isEmpty()) {
                log.warn("Validation failed: Empty display name");
                return; // Silently reject
            }
            if (commentDto.getDisplayName().length() > MAX_DISPLAY_NAME_LENGTH) {
                log.warn("Validation failed: Display name too long");
                return;
            }
            
            // Validate content
            if (commentDto.getContent() == null || commentDto.getContent().trim().isEmpty()) {
                log.warn("Validation failed: Empty content");
                return;
            }
            if (commentDto.getContent().length() < MIN_CONTENT_LENGTH || 
                commentDto.getContent().length() > MAX_CONTENT_LENGTH) {
                log.warn("Validation failed: Content length invalid");
                return;
            }
            
            // Check profanity filter
            if (ProfanityFilter.containsProfanity(commentDto.getDisplayName())) {
                log.warn("Validation failed: Profanity in display name");
                return;
            }
            if (ProfanityFilter.containsProfanity(commentDto.getContent())) {
                log.warn("Validation failed: Profanity in content");
                return;
            }
            
            // Rate limiting check (skip if Redis unavailable)
            try {
                String rateLimitKey = RATE_LIMIT_PREFIX + ipAddress;
                Boolean hasRecentComment = redisTemplate.hasKey(rateLimitKey);
                
                if (Boolean.TRUE.equals(hasRecentComment)) {
                    log.warn("Rate limit hit for IP: {}", ipAddress);
                    return;
                }
                
                // Set rate limit
                redisTemplate.opsForValue().set(rateLimitKey, "1", RATE_LIMIT_SECONDS, TimeUnit.SECONDS);
            } catch (Exception redisException) {
                log.warn("Redis unavailable, skipping rate limit check: {}", redisException.getMessage());
                // Continue without rate limiting if Redis is down
            }
            
            // Set timestamp for the comment
            commentDto.setCreatedAt(LocalDateTime.now());
            
            // Set IP address (will be sent to admin only)
            commentDto.setIpAddress(ipAddress);
            
            // Save to Redis history (last 50 comments)
            saveCommentToHistory(commentDto);
            
            // Broadcast to all clients (no database storage)
            log.info("Broadcasting comment to all clients");
            messagingTemplate.convertAndSend("/topic/live-comments", commentDto);
            
        } catch (Exception e) {
            log.error("Error processing comment", e);
        }
    }
    
    /**
     * Save comment to Redis for history (last 50 comments)
     */
    private void saveCommentToHistory(CommentDto commentDto) {
        try {
            // Convert comment to JSON (include IP address)
            String commentJson = String.format(
                "{\"displayName\":\"%s\",\"content\":\"%s\",\"createdAt\":\"%s\",\"ipAddress\":\"%s\"}",
                commentDto.getDisplayName(),
                commentDto.getContent().replace("\"", "\\\""),
                commentDto.getCreatedAt(),
                commentDto.getIpAddress() != null ? commentDto.getIpAddress() : ""
            );
            
            // Add to Redis list (LPUSH for newest first)
            redisTemplate.opsForList().leftPush(COMMENTS_HISTORY_KEY, commentJson);
            
            // Trim to keep only last 50 comments
            redisTemplate.opsForList().trim(COMMENTS_HISTORY_KEY, 0, MAX_COMMENTS_HISTORY - 1);
            
            // Set TTL on the list
            redisTemplate.expire(COMMENTS_HISTORY_KEY, COMMENTS_TTL_HOURS, TimeUnit.HOURS);
            
            log.debug("Comment saved to Redis history");
        } catch (Exception e) {
            log.warn("Failed to save comment to Redis history: {}", e.getMessage());
        }
    }
    
    /**
     * Get recent comments history for new clients
     */
    @MessageMapping("/comments/history")
    @SendTo("/topic/comments-history")
    public List<String> getCommentsHistory() {
        try {
            // Get last 50 comments from Redis (reverse order to get oldest first)
            List<String> comments = redisTemplate.opsForList().range(COMMENTS_HISTORY_KEY, 0, MAX_COMMENTS_HISTORY - 1);
            if (comments != null) {
                // Reverse to show oldest first
                List<String> reversed = new ArrayList<>(comments);
                Collections.reverse(reversed);
                log.info("Returning {} comments from history", reversed.size());
                return reversed;
            }
        } catch (Exception e) {
            log.error("Failed to fetch comments history", e);
        }
        return new ArrayList<>();
    }
    
    /**
     * Delete a comment (Admin only)
     */
    @MessageMapping("/comment/delete")
    public void deleteComment(CommentDto commentDto) {
        try {
            log.info("Delete comment request: displayName={}, createdAt={}", 
                commentDto.getDisplayName(), commentDto.getCreatedAt());
            
            // Remove comment from Redis history
            deleteCommentFromHistory(commentDto);
            
            // Broadcast delete event to all clients
            messagingTemplate.convertAndSend("/topic/comment-deleted", commentDto);
            
            log.info("Comment deleted from history and delete event broadcasted");
        } catch (Exception e) {
            log.error("Failed to delete comment", e);
        }
    }
    
    /**
     * Delete comment from Redis history
     */
    private void deleteCommentFromHistory(CommentDto commentDto) {
        try {
            // Get all comments from Redis
            List<String> comments = redisTemplate.opsForList().range(COMMENTS_HISTORY_KEY, 0, -1);
            
            if (comments != null && !comments.isEmpty()) {
                // Find and remove the matching comment
                for (String commentJson : comments) {
                    if (commentJson.contains("\"displayName\":\"" + commentDto.getDisplayName() + "\"") &&
                        commentJson.contains("\"createdAt\":\"" + commentDto.getCreatedAt() + "\"")) {
                        
                        // Remove from Redis list
                        Long removed = redisTemplate.opsForList().remove(COMMENTS_HISTORY_KEY, 1, commentJson);
                        
                        if (removed != null && removed > 0) {
                            log.info("Comment removed from Redis history: displayName={}, createdAt={}", 
                                commentDto.getDisplayName(), commentDto.getCreatedAt());
                        } else {
                            log.warn("Comment not found in Redis history");
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to delete comment from Redis history", e);
        }
    }
    
    /**
     * Request current viewer count
     */
    @MessageMapping("/viewer-count/request")
    public void requestViewerCount(SimpMessageHeaderAccessor headerAccessor) {
        try {
            int count = viewerCountService.getCurrentCount();
            String sessionId = headerAccessor.getSessionId();
            
            log.info("Viewer count request from session: {}, sending count: {}", sessionId, count);
            
            // Send current count back to requesting client via broadcast
            // (All clients will receive but it's the most reliable way)
            messagingTemplate.convertAndSend("/topic/viewer-count", Map.of("count", count));
            
        } catch (Exception e) {
            log.error("Failed to send viewer count", e);
        }
    }
    
    /**
     * Update match info (Admin only)
     * Broadcast current match information to all viewers
     */
    @MessageMapping("/match-info/update")
    public void updateMatchInfo(MatchInfoDto matchInfoDto) {
        try {
            matchInfoDto.setCreatedAt(LocalDateTime.now());
            matchInfoDto.setStatus("active");
            matchInfoDto.setAction("update");
            
            log.info("Match info update: Match #{}, Red: {}kg, Blue: {}kg", 
                matchInfoDto.getMatchNumber(), 
                matchInfoDto.getRedWeight(), 
                matchInfoDto.getBlueWeight());
            
            // Save to Redis for persistence
            String matchKey = "match:current";
            String matchJson = String.format(
                "{\"matchNumber\":%d,\"redWeight\":%.2f,\"blueWeight\":%.2f,\"status\":\"%s\",\"createdAt\":\"%s\"}",
                matchInfoDto.getMatchNumber(),
                matchInfoDto.getRedWeight(),
                matchInfoDto.getBlueWeight(),
                matchInfoDto.getStatus(),
                matchInfoDto.getCreatedAt()
            );
            
            redisTemplate.opsForValue().set(matchKey, matchJson, 2, TimeUnit.HOURS);
            
            // Broadcast to all clients
            messagingTemplate.convertAndSend("/topic/match-info", matchInfoDto);
            
            log.info("Match info broadcasted successfully");
        } catch (Exception e) {
            log.error("Failed to update match info", e);
        }
    }
    
    /**
     * Clear match info (Admin only)
     * Remove match information from screen
     */
    @MessageMapping("/match-info/clear")
    public void clearMatchInfo() {
        try {
            log.info("Clearing match info");
            
            // Remove from Redis
            redisTemplate.delete("match:current");
            
            // Broadcast clear action
            MatchInfoDto clearDto = MatchInfoDto.builder()
                .action("clear")
                .build();
            
            messagingTemplate.convertAndSend("/topic/match-info", clearDto);
            
            log.info("Match info cleared successfully");
        } catch (Exception e) {
            log.error("Failed to clear match info", e);
        }
    }
    
    /**
     * Get current match info for new clients
     */
    @MessageMapping("/match-info/request")
    public void requestMatchInfo() {
        try {
            String matchKey = "match:current";
            String matchJson = redisTemplate.opsForValue().get(matchKey);
            
            if (matchJson != null && !matchJson.isEmpty()) {
                log.info("Sending current match info: {}", matchJson);
                // Parse and send (simplified - in production use proper JSON parsing)
                messagingTemplate.convertAndSend("/topic/match-info", matchJson);
            }
        } catch (Exception e) {
            log.warn("No active match info or error: {}", e.getMessage());
        }
    }
}
