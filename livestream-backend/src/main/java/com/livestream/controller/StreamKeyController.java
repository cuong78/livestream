package com.livestream.controller;

import com.livestream.entity.User;
import com.livestream.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "User APIs (requires authentication)")
@SecurityRequirement(name = "api")
public class StreamKeyController {
    
    private final AuthService authService;
    
    @Value("${stream.rtmp.url}")
    private String rtmpUrl;
    
    @Value("${stream.hls.base-url}")
    private String hlsBaseUrl;
    
    @GetMapping("/stream-settings")
    @Operation(
        summary = "Get stream settings", 
        description = "Get RTMP URL and stream key for authenticated user"
    )
    public ResponseEntity<Map<String, String>> getStreamSettings(Authentication authentication) {
        String username = authentication.getName();
        User user = authService.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, String> response = new HashMap<>();
        response.put("streamKey", user.getStreamKey());
        response.put("rtmpUrl", rtmpUrl);
        response.put("hlsBaseUrl", hlsBaseUrl);
        response.put("fullRtmpUrl", rtmpUrl + "/" + user.getStreamKey());
        
        return ResponseEntity.ok(response);
    }
}
