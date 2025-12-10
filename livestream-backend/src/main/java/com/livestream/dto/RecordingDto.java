package com.livestream.dto;

import com.livestream.entity.Recording.RecordingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordingDto {
    private Long id;
    private LocalDate recordingDate;
    private String streamKey;
    private String appName;
    private String filePath;
    private Long durationSeconds;
    private Long fileSizeBytes;
    private RecordingStatus status;
    private Integer segmentOrder;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}
