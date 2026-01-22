package com.livestream.scheduler;

import com.livestream.service.RecordingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingScheduler {
    
    private final RecordingService recordingService;
    
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
    
    
}
