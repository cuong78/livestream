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
 * Entity representing a single recording segment from a live stream session.
 * Multiple recordings can exist for the same date if the stream was interrupted.
 */
@Entity
@Table(name = "recordings", indexes = {
    @Index(name = "idx_recording_date", columnList = "recording_date"),
    @Index(name = "idx_recording_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recording {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    private Stream stream;
    
    @Column(name = "recording_date", nullable = false)
    private LocalDate recordingDate;
    
    @Column(name = "stream_key")
    private String streamKey;
    
    @Column(name = "app_name")
    private String appName;
    
    @Column(name = "file_path", length = 500)
    private String filePath;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecordingStatus status = RecordingStatus.RECORDING;
    
    @Column(name = "segment_order")
    @Builder.Default
    private Integer segmentOrder = 0;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum RecordingStatus {
        RECORDING,   // Currently recording
        READY,       // Recording complete, ready for processing
        PROCESSING,  // Being merged into daily recording
        MERGED,      // Successfully merged into daily recording
        FAILED,      // Processing failed
        DELETED      // File has been deleted
    }
}
