package com.livestream.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing a merged daily recording.
 * Contains all stream segments from a single day merged into one video file.
 */
@Entity
@Table(name = "daily_recordings", indexes = {
    @Index(name = "idx_daily_recording_date", columnList = "recording_date"),
    @Index(name = "idx_daily_recording_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRecording {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "recording_date", nullable = false, unique = true)
    private LocalDate recordingDate;
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "file_path", length = 500)
    private String filePath;
    
    @Column(name = "video_url", length = 500)
    private String videoUrl;
    
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;
    
    @Column(name = "segment_count")
    @Builder.Default
    private Integer segmentCount = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DailyRecordingStatus status = DailyRecordingStatus.PENDING;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum DailyRecordingStatus {
        PENDING,     // Waiting for stream to end
        PROCESSING,  // Merging segments
        READY,       // Video ready for playback
        FAILED,      // Processing failed
        DELETED      // Video has been deleted (older than 3 days)
    }
}
