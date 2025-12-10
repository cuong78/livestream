package com.livestream.repository;

import com.livestream.entity.DailyRecording;
import com.livestream.entity.DailyRecording.DailyRecordingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyRecordingRepository extends JpaRepository<DailyRecording, Long> {
    
    /**
     * Find daily recording by date
     */
    Optional<DailyRecording> findByRecordingDate(LocalDate recordingDate);
    
    /**
     * Find all daily recordings after a specific date with a specific status
     * Used to get recent recordings for replay
     */
    List<DailyRecording> findByRecordingDateAfterAndStatusOrderByRecordingDateDesc(
            LocalDate date, DailyRecordingStatus status);
    
    /**
     * Find all daily recordings between two dates with READY status
     */
    List<DailyRecording> findByRecordingDateBetweenAndStatusOrderByRecordingDateDesc(
            LocalDate startDate, LocalDate endDate, DailyRecordingStatus status);
    
    /**
     * Find all daily recordings older than a specific date
     */
    List<DailyRecording> findByRecordingDateBefore(LocalDate date);
    
    /**
     * Find all daily recordings with a specific status
     */
    List<DailyRecording> findByStatusOrderByRecordingDateDesc(DailyRecordingStatus status);
    
    /**
     * Check if a recording exists for a specific date
     */
    boolean existsByRecordingDate(LocalDate recordingDate);
    
    /**
     * Find recent recordings (last N days) that are ready
     */
    List<DailyRecording> findTop3ByStatusOrderByRecordingDateDesc(DailyRecordingStatus status);
}
