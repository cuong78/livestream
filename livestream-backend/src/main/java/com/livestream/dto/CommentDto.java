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
}
