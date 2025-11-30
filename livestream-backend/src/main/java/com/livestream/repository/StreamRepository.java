package com.livestream.repository;

import com.livestream.entity.Stream;
import com.livestream.entity.Stream.StreamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StreamRepository extends JpaRepository<Stream, Long> {
    Optional<Stream> findFirstByStatusOrderByStartedAtDesc(StreamStatus status);
    List<Stream> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Stream> findFirstByUserIdAndStatus(Long userId, StreamStatus status);
}
