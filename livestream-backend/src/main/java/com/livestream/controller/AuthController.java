package com.livestream.controller;

import com.livestream.dto.LoginRequest;
import com.livestream.dto.LoginResponse;
import com.livestream.dto.UserDto;
import com.livestream.entity.User;
import com.livestream.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authService.authenticateUser(request.getUsername(), request.getPassword())
            .map(user -> {
                // TODO: Generate JWT token here
                String token = "jwt-token-placeholder";
                
                UserDto userDto = UserDto.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .streamKey(user.getStreamKey())
                    .role(user.getRole().name())
                    .build();
                
                LoginResponse response = LoginResponse.builder()
                    .token(token)
                    .user(userDto)
                    .build();
                
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String email) {
        
        try {
            User user = authService.registerUser(username, password, email);
            
            UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .streamKey(user.getStreamKey())
                .role(user.getRole().name())
                .build();
            
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam Long userId,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        
        try {
            authService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/regenerate-stream-key")
    public ResponseEntity<?> regenerateStreamKey(@RequestParam Long userId) {
        try {
            String newStreamKey = authService.regenerateStreamKey(userId);
            return ResponseEntity.ok(Map.of("success", true, "streamKey", newStreamKey));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
