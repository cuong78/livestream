package com.livestream.controller;

import com.livestream.dto.DailyRecordingDto;
import com.livestream.service.RecordingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recordings")
@RequiredArgsConstructor
@Tag(name = "Recordings", description = "Video recording and replay APIs")
@Slf4j
public class RecordingController {
    
    private final RecordingService recordingService;
    
    /**
     * Get recent recordings (last 3 days)
     * Public endpoint for viewers to see available replays
     */
    @GetMapping("/recent")
    @Operation(summary = "Get recent recordings", 
               description = "Get recordings from last 3 days that are ready for playback")
    public ResponseEntity<List<DailyRecordingDto>> getRecentRecordings() {
        List<DailyRecordingDto> recordings = recordingService.getRecentRecordings();
        return ResponseEntity.ok(recordings);
    }
    
    /**
     * Get recording by specific date
     */
    @GetMapping("/date/{date}")
    @Operation(summary = "Get recording by date", 
               description = "Get a specific recording by date (format: yyyy-MM-dd)")
    public ResponseEntity<DailyRecordingDto> getRecordingByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return recordingService.getRecordingByDate(date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * SRS DVR callback - called when a DVR file is created
     */
    @PostMapping("/callback/dvr")
    @Operation(summary = "SRS DVR callback", 
               description = "Called by SRS when a DVR recording file is created")
    public ResponseEntity<Map<String, Object>> onDvr(@RequestBody Map<String, Object> payload) {
        log.info("SRS DVR callback received: {}", payload);
        
        try {
            String app = (String) payload.get("app");
            String stream = (String) payload.get("stream");
            String file = (String) payload.get("file");
            
            if (app != null && stream != null && file != null) {
                recordingService.onDvrCallback(app, stream, file);
                log.info("DVR recording registered: app={}, stream={}, file={}", app, stream, file);
            }
            
            return ResponseEntity.ok(Map.of("code", 0));
            
        } catch (Exception e) {
            log.error("Error processing DVR callback", e);
            return ResponseEntity.ok(Map.of("code", 0)); // Return 0 to not block SRS
        }
    }
    
    /**
     * Admin endpoint to manually trigger merge for a specific date
     */
    @PostMapping("/admin/merge/{date}")
    @Operation(summary = "Trigger merge", 
               description = "Admin endpoint to manually trigger video merge for a specific date")
    public ResponseEntity<Map<String, Object>> triggerMerge(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Manual merge triggered for date: {}", date);
        
        try {
            recordingService.triggerMerge(date);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Merge process started for date: " + date
            ));
        } catch (Exception e) {
            log.error("Error triggering merge", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Admin endpoint to manually trigger cleanup of old recordings
     */
    @PostMapping("/admin/cleanup")
    @Operation(summary = "Trigger cleanup", 
               description = "Admin endpoint to manually trigger cleanup of old recordings")
    public ResponseEntity<Map<String, Object>> triggerCleanup() {
        log.info("Manual cleanup triggered");
        
        try {
            recordingService.deleteOldRecordings();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cleanup process completed"
            ));
        } catch (Exception e) {
            log.error("Error triggering cleanup", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Admin endpoint to delete recording for a specific date
     */
    @DeleteMapping("/admin/delete/{date}")
    @Operation(summary = "Delete recording by date", 
               description = "Admin endpoint to delete video recording for a specific date")
    public ResponseEntity<Map<String, Object>> deleteRecordingByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Admin request: Delete recording for date: {}", date);
        
        try {
            boolean success = recordingService.deleteRecordingByDate(date);
            if (success) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Recording deleted for date: " + date
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "No recording found for date: " + date
                ));
            }
        } catch (Exception e) {
            log.error("Error deleting recording", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error: " + e.getMessage()
            ));
        }
    }
}
