package com.livestream.scheduler;

import com.livestream.service.RecordingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Scheduled tasks for recording management:
 * 1. Merge yesterday's recordings into a single video file
 * 2. Clean up old recordings (older than 3 days)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingScheduler {
    
    private final RecordingService recordingService;
    
    /**
     * Merge yesterday's recordings at 00:30 every day
     * This gives time for any late-night streams to complete
     */
    @Scheduled(cron = "0 30 0 * * *")
    public void mergeYesterdayRecordings() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("Scheduled task: Starting merge for recordings of {}", yesterday);
        
        try {
            recordingService.mergeRecordingsForDate(yesterday);
            log.info("Scheduled task: Merge completed for {}", yesterday);
        } catch (Exception e) {
            log.error("Scheduled task: Failed to merge recordings for {}", yesterday, e);
        }
    }
    
    /**
     * Clean up old recordings at 01:00 every day
     * Removes recordings older than the retention period (default 3 days)
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void cleanupOldRecordings() {
        log.info("Scheduled task: Starting cleanup of old recordings");
        
        try {
            recordingService.deleteOldRecordings();
            log.info("Scheduled task: Cleanup completed");
        } catch (Exception e) {
            log.error("Scheduled task: Failed to cleanup old recordings", e);
        }
    }
    
    /**
     * Check for any pending merges every hour
     * This catches any recordings that might have been missed
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkPendingMerges() {
        // This could be enhanced to check for any PENDING daily recordings
        // and trigger merge if all segments are READY
        log.debug("Scheduled task: Checking for pending merges");
    }
}
