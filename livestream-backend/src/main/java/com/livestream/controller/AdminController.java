package com.livestream.controller;

import com.livestream.dto.CommentDto;
import com.livestream.dto.StreamDto;
import com.livestream.service.CommentService;
import com.livestream.service.StreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final StreamService streamService;
    private final CommentService commentService;

    // Stream Management
    @PostMapping("/stream/start")
    public ResponseEntity<StreamDto> startStream(
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String hlsUrl) {
        
        StreamDto stream = streamService.startStream(userId, title, description, hlsUrl);
        return ResponseEntity.ok(stream);
    }

    @PostMapping("/stream/{id}/end")
    public ResponseEntity<StreamDto> endStream(@PathVariable Long id) {
        StreamDto stream = streamService.endStream(id);
        if (stream == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stream);
    }

    @PutMapping("/stream/{id}")
    public ResponseEntity<StreamDto> updateStream(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description) {
        
        StreamDto stream = streamService.updateStreamInfo(id, title, description);
        if (stream == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stream);
    }

    @GetMapping("/streams/user/{userId}")
    public ResponseEntity<List<StreamDto>> getUserStreams(@PathVariable Long userId) {
        List<StreamDto> streams = streamService.getStreamsByUserId(userId);
        return ResponseEntity.ok(streams);
    }

    // Comment Management
    @GetMapping("/stream/{streamId}/comments")
    public ResponseEntity<List<CommentDto>> getStreamComments(
            @PathVariable Long streamId,
            @RequestParam(defaultValue = "100") int limit) {
        
        List<CommentDto> comments = commentService.getRecentComments(streamId, limit);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comment/{id}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long id) {
        boolean deleted = commentService.deleteComment(id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted"));
    }

    // Viewer Count Management
    @PutMapping("/stream/{id}/viewer-count")
    public ResponseEntity<Map<String, Object>> updateViewerCount(
            @PathVariable Long id,
            @RequestParam int count) {
        
        streamService.updateViewerCount(id, count);
        return ResponseEntity.ok(Map.of("success", true, "viewerCount", count));
    }
}
