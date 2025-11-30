package com.livestream.service;

import com.livestream.dto.StreamDto;
import com.livestream.entity.Stream;
import com.livestream.entity.User;
import com.livestream.repository.StreamRepository;
import com.livestream.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreamService {
    
    private final StreamRepository streamRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public StreamDto getCurrentLiveStream() {
        return streamRepository
            .findFirstByStatusOrderByStartedAtDesc(Stream.StreamStatus.LIVE)
            .map(this::mapToDto)
            .orElse(null);
    }

    @Transactional
    public StreamDto startStream(Long userId, String title, String description, String hlsUrl) {
        // Check if user already has a live stream
        streamRepository.findFirstByUserIdAndStatus(userId, Stream.StreamStatus.LIVE)
            .ifPresent(existingStream -> {
                log.warn("User {} already has a live stream, ending it", userId);
                endStream(existingStream.getId());
            });

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Stream stream = Stream.builder()
            .user(user)
            .title(title)
            .description(description)
            .status(Stream.StreamStatus.LIVE)
            .hlsUrl(hlsUrl)
            .startedAt(LocalDateTime.now())
            .viewerCount(0)
            .build();

        Stream savedStream = streamRepository.save(stream);
        log.info("Stream started: id={}, userId={}, title={}", savedStream.getId(), userId, title);
        
        return mapToDto(savedStream);
    }

    @Transactional
    public StreamDto endStream(Long streamId) {
        return streamRepository.findById(streamId)
            .map(stream -> {
                stream.setStatus(Stream.StreamStatus.ENDED);
                stream.setEndedAt(LocalDateTime.now());
                Stream updatedStream = streamRepository.save(stream);
                log.info("Stream ended: id={}, duration={} minutes", 
                         streamId, 
                         java.time.Duration.between(stream.getStartedAt(), stream.getEndedAt()).toMinutes());
                return mapToDto(updatedStream);
            })
            .orElse(null);
    }

    @Transactional
    public void incrementViewerCount(Long streamId) {
        streamRepository.findById(streamId)
            .ifPresent(stream -> {
                stream.setViewerCount(stream.getViewerCount() + 1);
                streamRepository.save(stream);
            });
    }

    @Transactional
    public void decrementViewerCount(Long streamId) {
        streamRepository.findById(streamId)
            .ifPresent(stream -> {
                if (stream.getViewerCount() > 0) {
                    stream.setViewerCount(stream.getViewerCount() - 1);
                    streamRepository.save(stream);
                }
            });
    }

    @Transactional
    public void updateViewerCount(Long streamId, int count) {
        streamRepository.findById(streamId)
            .ifPresent(stream -> {
                stream.setViewerCount(count);
                streamRepository.save(stream);
            });
    }

    @Transactional(readOnly = true)
    public List<StreamDto> getStreamsByUserId(Long userId) {
        return streamRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StreamDto getStreamById(Long streamId) {
        return streamRepository.findById(streamId)
            .map(this::mapToDto)
            .orElse(null);
    }

    @Transactional
    public StreamDto updateStreamInfo(Long streamId, String title, String description) {
        return streamRepository.findById(streamId)
            .map(stream -> {
                if (title != null) {
                    stream.setTitle(title);
                }
                if (description != null) {
                    stream.setDescription(description);
                }
                Stream updatedStream = streamRepository.save(stream);
                log.info("Stream updated: id={}", streamId);
                return mapToDto(updatedStream);
            })
            .orElse(null);
    }

    private StreamDto mapToDto(Stream stream) {
        return StreamDto.builder()
            .id(stream.getId())
            .title(stream.getTitle())
            .description(stream.getDescription())
            .status(stream.getStatus())
            .viewerCount(stream.getViewerCount())
            .startedAt(stream.getStartedAt())
            .hlsUrl(stream.getHlsUrl())
            .build();
    }
}
