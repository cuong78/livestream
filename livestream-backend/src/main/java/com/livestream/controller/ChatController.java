package com.livestream.controller;

import com.livestream.dto.CommentDto;
import com.livestream.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {
    
    private final CommentService commentService;

    @MessageMapping("/comment")
    @SendTo("/topic/live-comments")
    public CommentDto sendComment(CommentDto commentDto, SimpMessageHeaderAccessor headerAccessor) {
        // Get IP address from WebSocket session (for tracking/ban feature)
        String ipAddress = (String) headerAccessor.getSessionAttributes().get("ip");
        
        // Delegate to service layer
        CommentDto savedComment = commentService.createComment(commentDto, ipAddress);
        
        return savedComment != null ? savedComment : commentDto;
    }
}
