package com.livestream.controller;

import com.livestream.dto.SaveLocationRequest;
import com.livestream.dto.UserLocationDto;
import com.livestream.entity.User;
import com.livestream.service.UserLocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Location", description = "User location tracking APIs")
public class LocationController {
    
    private final UserLocationService locationService;
    
    @PostMapping
    @Operation(summary = "Save user location", description = "Save current user's geolocation")
    public ResponseEntity<UserLocationDto> saveLocation(
            @Valid @RequestBody SaveLocationRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIp(httpRequest);
        
        UserLocationDto location;
        if (user != null) {
            location = locationService.saveLocation(user.getId(), request, ipAddress);
        } else {
            location = locationService.saveAnonymousLocation(request, ipAddress);
        }
        
        return ResponseEntity.ok(location);
    }
    
    @GetMapping("/current")
    @Operation(summary = "Get current location", description = "Get authenticated user's current location")
    public ResponseEntity<UserLocationDto> getCurrentLocation(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        UserLocationDto location = locationService.getCurrentLocation(user.getId());
        if (location == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(location);
    }
    
    @GetMapping("/history")
    @Operation(summary = "Get location history", description = "Get authenticated user's location history")
    public ResponseEntity<List<UserLocationDto>> getLocationHistory(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<UserLocationDto> locations = locationService.getUserLocations(user.getId());
        return ResponseEntity.ok(locations);
    }
    
    @GetMapping("/admin/all")
    @Operation(summary = "Get all locations", description = "Admin: Get all users' latest locations")
    public ResponseEntity<List<UserLocationDto>> getAllLocations() {
        List<UserLocationDto> locations = locationService.getAllLatestLocations();
        return ResponseEntity.ok(locations);
    }
    
    @GetMapping("/admin/stats")
    @Operation(summary = "Get location statistics", description = "Admin: Get location statistics by city")
    public ResponseEntity<Map<String, Long>> getLocationStats() {
        Map<String, Long> stats = locationService.getLocationStatsByCity();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If multiple IPs, get the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
