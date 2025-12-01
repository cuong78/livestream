package com.livestream.controller;

import com.livestream.entity.BlockedIp;
import com.livestream.service.IpBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/blocked-ips")
@RequiredArgsConstructor
@Tag(name = "Admin - IP Blocking", description = "Admin APIs for managing blocked IPs")
@SecurityRequirement(name = "Bearer Authentication")
public class BlockedIpController {
    
    private final IpBlockService ipBlockService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all blocked IPs", description = "Get list of all blocked IP addresses (Admin only)")
    public ResponseEntity<List<BlockedIp>> getAllBlockedIps() {
        List<BlockedIp> blockedIps = ipBlockService.getAllBlocked();
        return ResponseEntity.ok(blockedIps);
    }
    
    @PostMapping("/block")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Block an IP address", description = "Block a specific IP address from accessing chat (Admin only)")
    public ResponseEntity<?> blockIp(
            @RequestParam String ipAddress,
            @RequestParam(required = false, defaultValue = "Spam or inappropriate behavior") String reason,
            @RequestParam String adminUsername) {
        
        try {
            BlockedIp blockedIp = ipBlockService.blockIp(ipAddress, reason, adminUsername);
            return ResponseEntity.ok(blockedIp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Unblock an IP address", description = "Remove IP address from blocked list (Admin only)")
    public ResponseEntity<?> unblockIp(@PathVariable Long id) {
        try {
            ipBlockService.unblockIp(id);
            return ResponseEntity.ok(Map.of("message", "IP address unblocked successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
