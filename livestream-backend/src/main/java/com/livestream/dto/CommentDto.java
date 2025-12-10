package com.livestream.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDto {
    private Long id;
    private String displayName;
    private String content;
    private LocalDateTime createdAt;
    private String parentId; // ID of parent comment if this is a reply
    private String replyTo; // Display name of person being replied to
    private String ipAddress; // IP address of the commenter (for admin only)
    private Boolean isAdmin; // Whether the commenter is an admin
    private String adminUsername; // Admin username if commenter is logged in as admin (for verification)
    
    // Location fields
    private Double latitude;
    private Double longitude;
    private String city; // City from Goong API
    private String address; // Full address from Goong API
}
