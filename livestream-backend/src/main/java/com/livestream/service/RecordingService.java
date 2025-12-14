package com.livestream.service;

import com.livestream.dto.DailyRecordingDto;
import com.livestream.dto.RecordingDto;
import com.livestream.entity.DailyRecording;
import com.livestream.entity.DailyRecording.DailyRecordingStatus;
import com.livestream.entity.Recording;
import com.livestream.entity.Recording.RecordingStatus;
import com.livestream.repository.DailyRecordingRepository;
import com.livestream.repository.RecordingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingService {
    
    private final RecordingRepository recordingRepository;
    private final DailyRecordingRepository dailyRecordingRepository;
    
    @Value("${recording.base-path:/usr/local/srs/objs/nginx/html/recordings}")
    private String recordingBasePath;
    
    @Value("${recording.output-path:/usr/local/srs/objs/nginx/html/videos}")
    private String outputPath;
    
    @Value("${recording.video-url-base:http://localhost:8081/videos}")
    private String videoUrlBase;
    
    @Value("${recording.thumbnail-url-base:http://localhost:8081/videos/thumbnails}")
    private String thumbnailUrlBase;
    
    @Value("${recording.retention-days:3}")
    private int retentionDays;
    
    /**
     * Callback from SRS when DVR file is created
     */
    @Transactional
    public RecordingDto onDvrCallback(String app, String stream, String filePath) {
        // Parse date from file path: .../2025-12-10/timestamp.flv
        LocalDate recordingDate = parseDateFromPath(filePath);
        
        // Count existing recordings for this date to determine segment order
        int segmentOrder = recordingRepository.countByRecordingDate(recordingDate) + 1;
        
        Recording recording = Recording.builder()
                .recordingDate(recordingDate)
                .streamKey(stream)
                .appName(app)
                .filePath(filePath)
                .segmentOrder(segmentOrder)
                .status(RecordingStatus.READY) // Set to READY immediately for auto-merge
                .startedAt(LocalDateTime.now())
                .build();
        
        Recording saved = recordingRepository.save(recording);
        log.info("DVR recording registered: app={}, stream={}, file={}, date={}, segmentOrder={}", 
                app, stream, filePath, recordingDate, segmentOrder);
        
        // Ensure daily recording entry exists
        ensureDailyRecordingExists(recordingDate);
        
        return toDto(saved);
    }
    
    /**
     * Mark recording as complete when stream ends
     */
    @Transactional
    public void markRecordingComplete(String filePath) {
        recordingRepository.findByFilePath(filePath)
                .ifPresent(recording -> {
                    recording.setStatus(RecordingStatus.READY);
                    recording.setEndedAt(LocalDateTime.now());
                    
                    // Try to get file size
                    try {
                        Path path = Paths.get(filePath);
                        if (Files.exists(path)) {
                            recording.setFileSizeBytes(Files.size(path));
                        }
                    } catch (IOException e) {
                        log.warn("Could not get file size for: {}", filePath);
                    }
                    
                    recordingRepository.save(recording);
                    log.info("Recording marked as complete: {}", filePath);
                });
    }
    
    /**
     * Mark all active recordings as complete (called on unpublish)
     */
    @Transactional
    public void markAllActiveRecordingsComplete(String streamKey) {
        LocalDate today = LocalDate.now();
        List<Recording> activeRecordings = recordingRepository
                .findByStreamKeyAndRecordingDateOrderBySegmentOrderAsc(streamKey, today);
        
        for (Recording recording : activeRecordings) {
            if (recording.getStatus() == RecordingStatus.RECORDING) {
                recording.setStatus(RecordingStatus.READY);
                recording.setEndedAt(LocalDateTime.now());
                recordingRepository.save(recording);
                log.info("Marked recording as complete: id={}", recording.getId());
            }
        }
    }
    
    /**
     * Ensure a daily recording entry exists for the given date
     */
    private void ensureDailyRecordingExists(LocalDate date) {
        if (!dailyRecordingRepository.existsByRecordingDate(date)) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String title = "Video Xem Lại Tối " + date.format(formatter) + " – CLB Gà Chọi Long Thần Sói";
            
            DailyRecording dailyRecording = DailyRecording.builder()
                    .recordingDate(date)
                    .title(title)
                    .status(DailyRecordingStatus.PENDING)
                    .build();
            
            dailyRecordingRepository.save(dailyRecording);
            log.info("Created daily recording entry for date: {}", date);
        }
    }
    
    /**
     * Merge all recordings of a specific date into one video
     */
    @Async
    @Transactional
    public void mergeRecordingsForDate(LocalDate date) {
        log.info("Starting merge process for date: {}", date);
        
        List<Recording> recordings = recordingRepository
                .findByRecordingDateAndStatusOrderBySegmentOrderAsc(date, RecordingStatus.READY);
        
        if (recordings.isEmpty()) {
            log.warn("No ready recordings found for date: {}", date);
            return;
        }
        
        // Update daily recording status to PROCESSING
        Optional<DailyRecording> dailyRecordingOpt = dailyRecordingRepository.findByRecordingDate(date);
        if (dailyRecordingOpt.isEmpty()) {
            log.error("Daily recording not found for date: {}", date);
            return;
        }
        
        DailyRecording dailyRecording = dailyRecordingOpt.get();
        dailyRecording.setStatus(DailyRecordingStatus.PROCESSING);
        dailyRecordingRepository.save(dailyRecording);
        
        try {
            String outputFileName = date.toString() + ".mp4";
            String outputFilePath = outputPath + "/daily/" + outputFileName;
            String thumbnailFileName = date.toString() + ".jpg";
            String thumbnailFilePath = outputPath + "/thumbnails/" + thumbnailFileName;
            
            // Ensure output directories exist
            Files.createDirectories(Paths.get(outputPath + "/daily"));
            Files.createDirectories(Paths.get(outputPath + "/thumbnails"));
            
            // Merge recordings using FFmpeg
            boolean mergeSuccess = mergeWithFFmpeg(recordings, outputFilePath);
            
            if (mergeSuccess) {
                // Use simple base image as thumbnail (date will be shown in title below)
                String thumbnailUrl = "https://res.cloudinary.com/duklfdbqf/image/upload/v1764830389/unnamed_1_hcdvhw.jpg";
                
                // Get duration and file size
                long duration = getVideoDuration(outputFilePath);
                long fileSize = Files.size(Paths.get(outputFilePath));
                
                // Update daily recording
                dailyRecording.setFilePath(outputFilePath);
                dailyRecording.setVideoUrl(videoUrlBase + "/daily/" + outputFileName);
                dailyRecording.setThumbnailUrl(thumbnailUrl);
                dailyRecording.setDurationSeconds(duration);
                dailyRecording.setFileSizeBytes(fileSize);
                dailyRecording.setSegmentCount(recordings.size());
                dailyRecording.setStatus(DailyRecordingStatus.READY);
                dailyRecordingRepository.save(dailyRecording);
                
                // Mark all segments as merged
                for (Recording recording : recordings) {
                    recording.setStatus(RecordingStatus.MERGED);
                    recordingRepository.save(recording);
                }
                
                log.info("Successfully merged {} recordings for date: {}, output: {}", 
                        recordings.size(), date, outputFilePath);
            } else {
                dailyRecording.setStatus(DailyRecordingStatus.FAILED);
                dailyRecordingRepository.save(dailyRecording);
                log.error("Failed to merge recordings for date: {}", date);
            }
            
        } catch (Exception e) {
            log.error("Error merging recordings for date: {}", date, e);
            dailyRecording.setStatus(DailyRecordingStatus.FAILED);
            dailyRecordingRepository.save(dailyRecording);
        }
    }
    
    /**
     * Merge multiple FLV files into one MP4 using FFmpeg
     */
    private boolean mergeWithFFmpeg(List<Recording> recordings, String outputPath) {
        try {
            // Create a temporary file list for FFmpeg concat
            Path listFile = Files.createTempFile("ffmpeg_list_", ".txt");
            StringBuilder content = new StringBuilder();
            
            for (Recording r : recordings) {
                // FFmpeg concat format: file 'path'
                // Convert SRS relative path to container absolute path
                String filePath = r.getFilePath();
                if (filePath.startsWith("./objs/nginx/html/recordings/")) {
                    filePath = filePath.replace("./objs/nginx/html/recordings/", "/recordings/");
                }
                content.append("file '").append(filePath).append("'\n");
            }
            
            Files.writeString(listFile, content.toString());
            log.debug("FFmpeg concat list file created: {}", listFile);
            
            // Build FFmpeg command
            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", listFile.toString(),
                    "-c", "copy",
                    "-movflags", "+faststart",
                    outputPath
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output for logging
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("FFmpeg: {}", line);
                }
            }
            
            int exitCode = process.waitFor();
            
            // Clean up temp file
            Files.deleteIfExists(listFile);
            
            if (exitCode == 0) {
                log.info("FFmpeg merge completed successfully: {}", outputPath);
                return true;
            } else {
                log.error("FFmpeg merge failed with exit code: {}", exitCode);
                return false;
            }
            
        } catch (IOException | InterruptedException e) {
            log.error("Error running FFmpeg merge", e);
            return false;
        }
    }
    
    /**
     * Generate thumbnail from video
     */
    private void generateThumbnail(String videoPath, String thumbnailPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-i", videoPath,
                    "-ss", "00:00:10",  // Take frame at 10 seconds
                    "-vframes", "1",
                    "-vf", "scale=640:360",
                    thumbnailPath
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                log.info("Thumbnail generated: {}", thumbnailPath);
            } else {
                log.warn("Failed to generate thumbnail, exit code: {}", exitCode);
            }
            
        } catch (IOException | InterruptedException e) {
            log.warn("Error generating thumbnail", e);
        }
    }
    
    /**
     * Get video duration in seconds using FFprobe
     */
    private long getVideoDuration(String videoPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    videoPath
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                if (line != null) {
                    return (long) Double.parseDouble(line.trim());
                }
            }
            
            process.waitFor();
            
        } catch (IOException | InterruptedException | NumberFormatException e) {
            log.warn("Error getting video duration", e);
        }
        
        return 0;
    }
    
    /**
     * Get recent recordings (last N days based on retention)
     */
    @Transactional(readOnly = true)
    public List<DailyRecordingDto> getRecentRecordings() {
        LocalDate cutoffDate = LocalDate.now().minusDays(retentionDays);
        
        return dailyRecordingRepository
                .findByRecordingDateAfterAndStatusOrderByRecordingDateDesc(
                        cutoffDate, DailyRecordingStatus.READY)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get recording by specific date
     */
    @Transactional(readOnly = true)
    public Optional<DailyRecordingDto> getRecordingByDate(LocalDate date) {
        return dailyRecordingRepository.findByRecordingDate(date)
                .filter(r -> r.getStatus() == DailyRecordingStatus.READY)
                .map(this::toDto);
    }
    
    /**
     * Delete recordings older than retention period
     */
    @Transactional
    public void deleteOldRecordings() {
        LocalDate cutoffDate = LocalDate.now().minusDays(retentionDays);
        log.info("Deleting recordings older than: {}", cutoffDate);
        
        // Delete daily recordings
        List<DailyRecording> oldDailyRecordings = dailyRecordingRepository
                .findByRecordingDateBefore(cutoffDate);
        
        for (DailyRecording dr : oldDailyRecordings) {
            try {
                // Delete video file
                if (dr.getFilePath() != null) {
                    Files.deleteIfExists(Paths.get(dr.getFilePath()));
                    log.info("Deleted video file: {}", dr.getFilePath());
                }
                
                // Delete thumbnail
                if (dr.getThumbnailUrl() != null) {
                    String thumbnailPath = dr.getThumbnailUrl()
                            .replace(thumbnailUrlBase, outputPath + "/thumbnails");
                    Files.deleteIfExists(Paths.get(thumbnailPath));
                }
                
                dr.setStatus(DailyRecordingStatus.DELETED);
                dailyRecordingRepository.save(dr);
                
            } catch (IOException e) {
                log.error("Failed to delete file: {}", dr.getFilePath(), e);
            }
        }
        
        // Delete segment recordings
        List<Recording> oldRecordings = recordingRepository.findByRecordingDateBefore(cutoffDate);
        
        for (Recording r : oldRecordings) {
            try {
                if (r.getFilePath() != null) {
                    Files.deleteIfExists(Paths.get(r.getFilePath()));
                }
                r.setStatus(RecordingStatus.DELETED);
                recordingRepository.save(r);
                
            } catch (IOException e) {
                log.error("Failed to delete segment: {}", r.getFilePath(), e);
            }
        }
        
        log.info("Cleanup completed. Deleted {} daily recordings and {} segments",
                oldDailyRecordings.size(), oldRecordings.size());
    }
    
    /**
     * Manually trigger merge for a specific date (admin function)
     */
    public void triggerMerge(LocalDate date) {
        mergeRecordingsForDate(date);
    }
    
    /**
     * Parse recording date from file path
     * Path format: ./objs/nginx/html/recordings/live/stream/2025-12-10/timestamp.flv
     */
    private LocalDate parseDateFromPath(String filePath) {
        try {
            // Extract date part from path (format: YYYY-MM-DD)
            String[] parts = filePath.split("/");
            for (String part : parts) {
                if (part.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    return LocalDate.parse(part);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse date from path: {}, using today", filePath);
        }
        // Fallback to today if parsing fails
        return LocalDate.now();
    }
    
    // DTO Mappers
    
    private DailyRecordingDto toDto(DailyRecording entity) {
        return DailyRecordingDto.builder()
                .id(entity.getId())
                .recordingDate(entity.getRecordingDate())
                .title(entity.getTitle())
                .videoUrl(entity.getVideoUrl())
                .thumbnailUrl(entity.getThumbnailUrl())
                .durationSeconds(entity.getDurationSeconds())
                .fileSizeBytes(entity.getFileSizeBytes())
                .segmentCount(entity.getSegmentCount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
    
    private RecordingDto toDto(Recording entity) {
        return RecordingDto.builder()
                .id(entity.getId())
                .recordingDate(entity.getRecordingDate())
                .streamKey(entity.getStreamKey())
                .appName(entity.getAppName())
                .filePath(entity.getFilePath())
                .durationSeconds(entity.getDurationSeconds())
                .fileSizeBytes(entity.getFileSizeBytes())
                .status(entity.getStatus())
                .segmentOrder(entity.getSegmentOrder())
                .startedAt(entity.getStartedAt())
                .endedAt(entity.getEndedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
