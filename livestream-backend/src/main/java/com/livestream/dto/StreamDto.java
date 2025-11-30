package com.livestream.dto;

import com.livestream.entity.Stream.StreamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreamDto {
    private Long id;
    private String title;
    private String description;
    private StreamStatus status;
    private Integer viewerCount;
    private LocalDateTime startedAt;
    private String hlsUrl;
}
