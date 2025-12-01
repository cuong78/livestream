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
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
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
}
