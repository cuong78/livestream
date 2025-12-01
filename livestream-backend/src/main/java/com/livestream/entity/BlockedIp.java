package com.livestream.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_ips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIp {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String ipAddress;
    
    @Column(length = 500)
    private String reason;
    
    @Column(nullable = false)
    private LocalDateTime blockedAt;
    
    @Column(nullable = false)
    private String blockedBy; // Username of admin who blocked this IP
    
    @PrePersist
    protected void onCreate() {
        blockedAt = LocalDateTime.now();
    }
}
