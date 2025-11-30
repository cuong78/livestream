package com.livestream.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id", nullable = false)
    private Stream stream;
    
    @Column(name = "display_name", nullable = false)
    private String displayName;
    
    @Column(nullable = false, length = 500)
    private String content;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
