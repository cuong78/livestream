package com.livestream.controller;

import com.livestream.dto.LoginRequest;
import com.livestream.dto.LoginResponse;
import com.livestream.dto.UserDto;
import com.livestream.entity.User;
import com.livestream.service.AuthService;
import com.livestream.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration APIs")
public class AuthController {
    
    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get JWT token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful",
                content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        }
        
        // Check oversized input (max 255 characters)
        if (request.getUsername().length() > 255 || request.getPassword().length() > 255) {
            return ResponseEntity.status(413).body(Map.of("error", "Input too large"));
        }
        
        return authService.authenticateUser(request.getUsername(), request.getPassword())
            .map(user -> {
                // Generate JWT token
                String token = jwtService.generateToken(
                    user.getUsername(), 
                    user.getId(), 
                    user.getRole().name()
                );
                
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
                
                return ResponseEntity.ok((Object) response);
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }
    
    @PostMapping("/register")
    @Operation(summary = "Register", description = "Register new user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registration successful"),
        @ApiResponse(responseCode = "400", description = "Invalid input or user already exists"),
        @ApiResponse(responseCode = "413", description = "Input too large")
    })
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String email = request.get("email");
        
        // Input validation with proper HTTP status codes
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        
        if (password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        }
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        
        // Check oversized input (max 255 characters)
        if (username.length() > 255 || password.length() > 255 || email.length() > 255) {
            return ResponseEntity.status(413).body(Map.of("error", "Input too large"));
        }
        
        try {
            User user = authService.registerUser(username, password, email);
            
            UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .streamKey(user.getStreamKey())
                .role(user.getRole().name())
                .build();
            
            return ResponseEntity.ok(Map.of("message", "User registered successfully", "user", userDto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
