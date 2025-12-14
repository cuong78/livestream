package com.livestream.repository;

import com.livestream.entity.Recording;
import com.livestream.entity.Recording.RecordingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, Long> {
    
    /**
     * Find all recordings for a specific date, ordered by segment order
     */
    List<Recording> findByRecordingDateOrderBySegmentOrderAsc(LocalDate recordingDate);
    
    /**
     * Find all recordings for a specific date with a specific status
     */
    List<Recording> findByRecordingDateAndStatusOrderBySegmentOrderAsc(
            LocalDate recordingDate, RecordingStatus status);
    
    /**
     * Find recording by file path
     */
    Optional<Recording> findByFilePath(String filePath);
    
    /**
     * Count recordings for a specific date
     */
    @Query("SELECT COUNT(r) FROM Recording r WHERE r.recordingDate = :date")
    int countByRecordingDate(@Param("date") LocalDate date);
    
    /**
     * Find all recordings older than a specific date
     */
    List<Recording> findByRecordingDateBefore(LocalDate date);
    
    /**
     * Find all recordings for a specific date
     */
    List<Recording> findByRecordingDate(LocalDate recordingDate);
    
    /**
     * Find all recordings with READY status for a specific date
     */
    List<Recording> findByRecordingDateAndStatus(LocalDate recordingDate, RecordingStatus status);
    
    /**
     * Find the latest recording that is still in RECORDING status
     */
    Optional<Recording> findFirstByStatusOrderByCreatedAtDesc(RecordingStatus status);
    
    /**
     * Find recordings by stream key and date
     */
    List<Recording> findByStreamKeyAndRecordingDateOrderBySegmentOrderAsc(
            String streamKey, LocalDate recordingDate);
}
