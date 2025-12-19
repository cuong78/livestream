package com.livestream.dto;

import com.livestream.entity.DailyRecording.DailyRecordingStatus;
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
public class DailyRecordingDto {
    private Long id;
    private LocalDate recordingDate;
    private String title;
    private String videoUrl;
    private String thumbnailUrl;
    private Long durationSeconds;
    private Long fileSizeBytes;
    private Integer segmentCount;
    private DailyRecordingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Helper method to format duration as HH:MM:SS
     */
    public String getFormattedDuration() {
        if (durationSeconds == null || durationSeconds == 0) {
            return "00:00:00";
        }
        long hours = durationSeconds / 3600;
        long minutes = (durationSeconds % 3600) / 60;
        long seconds = durationSeconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }
}
