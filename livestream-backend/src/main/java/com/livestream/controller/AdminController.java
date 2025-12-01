package com.livestream.controller;

import com.livestream.dto.StreamDto;
import com.livestream.service.StreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin APIs for managing streams (requires ADMIN role)")
@SecurityRequirement(name = "api")
public class AdminController {
    
    private final StreamService streamService;

    // Stream Management
    @PostMapping("/stream/start")
    @Operation(summary = "Start a new stream", description = "Create and start a new live stream")
    public ResponseEntity<StreamDto> startStream(
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String hlsUrl) {
        
        StreamDto stream = streamService.startStream(userId, title, description, hlsUrl);
        return ResponseEntity.ok(stream);
    }

    @PostMapping("/stream/{id}/end")
    @Operation(summary = "End a stream", description = "Stop an active stream")
    public ResponseEntity<StreamDto> endStream(@PathVariable Long id) {
        StreamDto stream = streamService.endStream(id);
        if (stream == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stream);
    }

    @PutMapping("/stream/{id}")
    @Operation(summary = "Update stream info", description = "Update stream title or description")
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
    @Operation(summary = "Get user streams", description = "Get all streams for a specific user")
    public ResponseEntity<List<StreamDto>> getUserStreams(@PathVariable Long userId) {
        List<StreamDto> streams = streamService.getStreamsByUserId(userId);
        return ResponseEntity.ok(streams);
    }

    // Viewer Count Management
    @PutMapping("/stream/{id}/viewer-count")
    @Operation(summary = "Update viewer count", description = "Update the viewer count for a stream")
    public ResponseEntity<Map<String, Object>> updateViewerCount(
            @PathVariable Long id,
            @RequestParam int count) {
        
        streamService.updateViewerCount(id, count);
        return ResponseEntity.ok(Map.of("success", true, "viewerCount", count));
    }
    
    // Note: Comments are now handled in real-time via WebSocket only
    // They are not stored in database, only kept in memory (frontend handles last 50)
}

