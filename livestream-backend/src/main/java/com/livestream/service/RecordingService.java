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
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
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
    
    private static final int MAX_MERGE_RETRIES = 2;
    private static final int RETRY_DELAY_MS = 10000;
    
    // Lock to prevent parallel merges for the same date
    private final Set<LocalDate> mergingDates = ConcurrentHashMap.newKeySet();
    
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
     * Merge all recordings of a specific date into one video with retry logic
     */
    @Async
    @Transactional
    public void mergeRecordingsForDate(LocalDate date) {
        // Prevent parallel merges for the same date
        if (!mergingDates.add(date)) {
            log.warn("Merge already in progress for date: {}, skipping duplicate request", date);
            return;
        }
        
        // Check if already merged or processing
        Optional<DailyRecording> existingOpt = dailyRecordingRepository.findByRecordingDate(date);
        if (existingOpt.isPresent()) {
            DailyRecording existing = existingOpt.get();
            if (existing.getStatus() == DailyRecordingStatus.PROCESSING) {
                log.warn("Merge already processing for date: {}, skipping", date);
                mergingDates.remove(date);
                return;
            }
            if (existing.getStatus() == DailyRecordingStatus.READY && existing.getVideoUrl() != null) {
                log.warn("Video already merged for date: {}, skipping", date);
                mergingDates.remove(date);
                return;
            }
        }
        
        try {
            for (int attempt = 1; attempt <= MAX_MERGE_RETRIES; attempt++) {
                log.info("Merge attempt {} of {} for date: {}", attempt, MAX_MERGE_RETRIES, date);
                
                boolean success = attemptMerge(date);
                
                if (success) {
                    log.info("Merge successful on attempt {} for date: {}", attempt, date);
                    return;
                }
                
                if (attempt < MAX_MERGE_RETRIES) {
                    log.warn("Merge failed on attempt {}, retrying in {} seconds...", attempt, RETRY_DELAY_MS / 1000);
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.error("Retry interrupted for date: {}", date);
                        return;
                    }
                }
            }
            
            log.error("All {} merge attempts failed for date: {}", MAX_MERGE_RETRIES, date);
        } finally {
            // Always release the lock
            mergingDates.remove(date);
        }
    }
    
    /**
     * Attempt to merge recordings for a specific date
     */
    private boolean attemptMerge(LocalDate date) {
        List<Recording> recordings = recordingRepository
                .findByRecordingDateAndStatusOrderBySegmentOrderAsc(date, RecordingStatus.READY);
        
        if (recordings.isEmpty()) {
            log.warn("No ready recordings found for date: {}", date);
            return false;
        }
        
        // Update daily recording status to PROCESSING
        Optional<DailyRecording> dailyRecordingOpt = dailyRecordingRepository.findByRecordingDate(date);
        if (dailyRecordingOpt.isEmpty()) {
            log.error("Daily recording not found for date: {}", date);
            return false;
        }
        
        DailyRecording dailyRecording = dailyRecordingOpt.get();
        dailyRecording.setStatus(DailyRecordingStatus.PROCESSING);
        dailyRecordingRepository.save(dailyRecording);
        
        try {
            String outputFileName = date.toString() + ".mp4";
            String outputFilePath = outputPath + "/daily/" + outputFileName;
            String backupFilePath = outputPath + "/daily/" + date.toString() + ".mp4.bak";
            
            // Ensure output directories exist
            Files.createDirectories(Paths.get(outputPath + "/daily"));
            Files.createDirectories(Paths.get(outputPath + "/thumbnails"));
            
            // Backup existing file if it exists
            Path outputFile = Paths.get(outputFilePath);
            if (Files.exists(outputFile)) {
                Files.copy(outputFile, Paths.get(backupFilePath), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                log.info("Backed up existing video to: {}", backupFilePath);
            }
            
            // Merge recordings using FFmpeg
            boolean mergeSuccess = mergeWithFFmpeg(recordings, outputFilePath);
            
            if (mergeSuccess) {
                // Validate merged video
                if (!validateMergedVideo(outputFilePath)) {
                    log.error("Merged video validation failed for date: {}", date);
                    
                    // Restore backup if validation fails
                    if (Files.exists(Paths.get(backupFilePath))) {
                        Files.copy(Paths.get(backupFilePath), outputFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        log.info("Restored backup video after validation failure");
                    }
                    
                    dailyRecording.setStatus(DailyRecordingStatus.FAILED);
                    dailyRecordingRepository.save(dailyRecording);
                    return false;
                }
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
                
                // Mark all segments as merged and delete FLV files
                for (Recording recording : recordings) {
                    recording.setStatus(RecordingStatus.MERGED);
                    recordingRepository.save(recording);
                    
                    // Delete FLV segment file to save disk space
                    try {
                        String flvPath = recording.getFilePath();
                        if (flvPath.startsWith("./objs/nginx/html/recordings/")) {
                            flvPath = flvPath.replace("./objs/nginx/html/recordings/", "/recordings/");
                        }
                        if (Files.deleteIfExists(Paths.get(flvPath))) {
                            log.info("Deleted FLV segment after successful merge: {}", flvPath);
                        }
                    } catch (IOException e) {
                        log.warn("Failed to delete FLV segment: {}", recording.getFilePath(), e);
                    }
                }
                
                // Delete backup file after successful merge and validation
                Files.deleteIfExists(Paths.get(backupFilePath));
                log.info("Deleted backup file after successful merge");
                
                log.info("Successfully merged {} recordings for date: {}, output: {}", 
                        recordings.size(), date, outputFilePath);
                return true;
            } else {
                dailyRecording.setStatus(DailyRecordingStatus.FAILED);
                dailyRecordingRepository.save(dailyRecording);
                log.error("Failed to merge recordings for date: {}", date);
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error merging recordings for date: {}", date, e);
            dailyRecording.setStatus(DailyRecordingStatus.FAILED);
            dailyRecordingRepository.save(dailyRecording);
            return false;
        }
    }
    
    /**
     * Validate merged video file to ensure it's not corrupted
     * Uses fast validation without counting frames (which is very slow for large files)
     */
    private boolean validateMergedVideo(String videoPath) {
        try {
            log.info("Validating merged video: {}", videoPath);
            
            // Fast validation: check duration and file size only (no frame counting)
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "format=duration,size",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    videoPath
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                log.error("Video validation failed with exit code: {}", exitCode);
                return false;
            }
            
            String[] lines = output.toString().trim().split("\n");
            if (lines.length < 2) {
                log.error("Video validation failed: insufficient output");
                return false;
            }
            
            try {
                // ffprobe outputs: duration (line 1), then size (line 2)
                double duration = Double.parseDouble(lines[0].trim());
                long fileSize = Long.parseLong(lines[1].trim());
                
                // Validate: duration > 0 and file size > 1MB (basic sanity check)
                if (duration <= 0 || fileSize < 1_000_000) {
                    log.error("Video validation failed: duration={}, fileSize={}", duration, fileSize);
                    return false;
                }
                
                log.info("Video validated successfully: {} seconds, {} bytes", duration, fileSize);
                return true;
                
            } catch (NumberFormatException e) {
                log.error("Video validation failed: invalid output format", e);
                return false;
            }
            
        } catch (IOException | InterruptedException e) {
            log.error("Error validating video: {}", videoPath, e);
            return false;
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
            // Use -c copy for fast stream copy (no re-encoding)
            // Add -movflags +faststart to move moov atom to beginning for web streaming
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
                    String filePath = r.getFilePath();
                    if (filePath.startsWith("./objs/nginx/html/recordings/")) {
                        filePath = filePath.replace("./objs/nginx/html/recordings/", "/recordings/");
                    }
                    Files.deleteIfExists(Paths.get(filePath));
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
     * Delete recording for a specific date (admin function)
     */
    @Transactional
    public boolean deleteRecordingByDate(LocalDate date) {
        log.info("Admin request: Deleting recording for date: {}", date);
        
        Optional<DailyRecording> dailyRecordingOpt = dailyRecordingRepository.findByRecordingDate(date);
        if (dailyRecordingOpt.isEmpty()) {
            log.warn("No daily recording found for date: {}", date);
            return false;
        }
        
        DailyRecording dr = dailyRecordingOpt.get();
        
        try {
            // Delete video file
            if (dr.getFilePath() != null) {
                Files.deleteIfExists(Paths.get(dr.getFilePath()));
                log.info("Deleted video file: {}", dr.getFilePath());
            }
            
            // Delete thumbnail (if local file)
            if (dr.getThumbnailUrl() != null && !dr.getThumbnailUrl().contains("cloudinary")) {
                String thumbnailPath = dr.getThumbnailUrl()
                        .replace(thumbnailUrlBase, outputPath + "/thumbnails");
                Files.deleteIfExists(Paths.get(thumbnailPath));
            }
            
            // Update status to DELETED
            dr.setStatus(DailyRecordingStatus.DELETED);
            dailyRecordingRepository.save(dr);
            
            // Delete segment recordings for this date
            List<Recording> segments = recordingRepository.findByRecordingDate(date);
            for (Recording r : segments) {
                try {
                    if (r.getFilePath() != null) {
                        // Convert SRS path to container path
                        String filePath = r.getFilePath();
                        if (filePath.startsWith("./objs/nginx/html/recordings/")) {
                            filePath = filePath.replace("./objs/nginx/html/recordings/", "/recordings/");
                        }
                        Files.deleteIfExists(Paths.get(filePath));
                    }
                    r.setStatus(RecordingStatus.DELETED);
                    recordingRepository.save(r);
                } catch (IOException e) {
                    log.error("Failed to delete segment: {}", r.getFilePath(), e);
                }
            }
            
            log.info("Successfully deleted recording for date: {}", date);
            return true;
            
        } catch (IOException e) {
            log.error("Failed to delete recording for date: {}", date, e);
            return false;
        }
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
        // Add cache-busting timestamp to video URL
        String videoUrl = entity.getVideoUrl();
        if (videoUrl != null && entity.getUpdatedAt() != null) {
            long timestamp = entity.getUpdatedAt().toEpochSecond(java.time.ZoneOffset.UTC);
            videoUrl = videoUrl + "?v=" + timestamp;
        }
        
        return DailyRecordingDto.builder()
                .id(entity.getId())
                .recordingDate(entity.getRecordingDate())
                .title(entity.getTitle())
                .videoUrl(videoUrl)
                .thumbnailUrl(entity.getThumbnailUrl())
                .durationSeconds(entity.getDurationSeconds())
                .fileSizeBytes(entity.getFileSizeBytes())
                .segmentCount(entity.getSegmentCount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
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
