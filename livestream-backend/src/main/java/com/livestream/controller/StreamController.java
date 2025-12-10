package com.livestream.controller;

import com.livestream.dto.StreamDto;
import com.livestream.entity.User;
import com.livestream.repository.UserRepository;
import com.livestream.service.RecordingService;
import com.livestream.service.StreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/stream")
@RequiredArgsConstructor
@Tag(name = "Stream", description = "Public stream APIs")
@Slf4j
public class StreamController {
    
    private final StreamService streamService;
    private final UserRepository userRepository;
    private final RecordingService recordingService;
    
    @Value("${stream.hls.base-url}")
    private String hlsBaseUrl;

    @GetMapping("/current")
    @Operation(summary = "Get current live stream", description = "Get the currently active live stream (public)")
    public ResponseEntity<StreamDto> getCurrentStream() {
        StreamDto stream = streamService.getCurrentLiveStream();
        return ResponseEntity.ok(stream);
    }

    // SRS Callbacks
    @PostMapping("/callback/publish")
    @Operation(summary = "SRS publish callback", description = "Called by SRS when stream starts")
    public ResponseEntity<Map<String, Object>> onPublish(@RequestBody Map<String, Object> payload) {
        log.info("SRS Publish callback: {}", payload);
        
        try {
            String stream = (String) payload.get("stream");
            String app = (String) payload.get("app");
            
            if (stream != null) {
                // Find user by stream key
                Optional<User> userOpt = userRepository.findByStreamKey(stream);
                
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String hlsUrl = String.format("%s/%s/%s/index.m3u8", hlsBaseUrl, app, stream);
                    
                    // Start stream in database
                    StreamDto streamDto = streamService.startStream(
                        user.getId(),
                        user.getUsername() + "'s Live Stream",
                        "Live streaming now!",
                        hlsUrl
                    );
                    
                    log.info("Stream started successfully for user: {}, streamId: {}", user.getUsername(), streamDto.getId());
                    return ResponseEntity.ok(Map.of("code", 0, "streamId", streamDto.getId()));
                } else {
                    log.warn("Stream key not found: {}", stream);
                    return ResponseEntity.status(403).body(Map.of("code", 1, "message", "Invalid stream key"));
                }
            }
            
            return ResponseEntity.ok(Map.of("code", 0));
        } catch (Exception e) {
            log.error("Error in publish callback", e);
            return ResponseEntity.ok(Map.of("code", 0)); // Return 0 to allow stream
        }
    }

    @PostMapping("/callback/unpublish")
    @Operation(summary = "SRS unpublish callback", description = "Called by SRS when stream stops")
    public ResponseEntity<Map<String, Object>> onUnpublish(@RequestBody Map<String, Object> payload) {
        log.info("SRS Unpublish callback: {}", payload);
        
        try {
            String stream = (String) payload.get("stream");
            
            if (stream != null) {
                // Find user by stream key and end their stream
                userRepository.findByStreamKey(stream).ifPresent(user -> {
                    StreamDto currentStream = streamService.getCurrentLiveStream();
                    if (currentStream != null) {
                        streamService.endStream(currentStream.getId());
                        log.info("Stream ended for user: {}", user.getUsername());
                    }
                });
                
                // Mark all active recordings as complete
                recordingService.markAllActiveRecordingsComplete(stream);
            }
        } catch (Exception e) {
            log.error("Error in unpublish callback", e);
        }
        
        return ResponseEntity.ok(Map.of("code", 0));
    }

    @PostMapping("/callback/play")
    @Operation(summary = "SRS play callback", description = "Called by SRS when viewer starts watching")
    public ResponseEntity<Map<String, Object>> onPlay(@RequestBody Map<String, Object> payload) {
        log.info("SRS Play callback: {}", payload);
        // TODO: Increment viewer count
        return ResponseEntity.ok(Map.of("code", 0));
    }

    @PostMapping("/callback/stop")
    @Operation(summary = "SRS stop callback", description = "Called by SRS when viewer stops watching")
    public ResponseEntity<Map<String, Object>> onStop(@RequestBody Map<String, Object> payload) {
        log.info("SRS Stop callback: {}", payload);
        // TODO: Decrement viewer count
        return ResponseEntity.ok(Map.of("code", 0));
    }
}
