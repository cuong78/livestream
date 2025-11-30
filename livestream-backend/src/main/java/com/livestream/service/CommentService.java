package com.livestream.service;

import com.livestream.dto.CommentDto;
import com.livestream.entity.Comment;
import com.livestream.entity.Stream;
import com.livestream.repository.CommentRepository;
import com.livestream.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final StreamRepository streamRepository;

    @Transactional
    public CommentDto createComment(CommentDto commentDto, String ipAddress) {
        // Get current live stream
        Stream currentStream = streamRepository
            .findFirstByStatusOrderByStartedAtDesc(Stream.StreamStatus.LIVE)
            .orElse(null);
        
        if (currentStream == null) {
            log.warn("No live stream available to add comment");
            return null;
        }

        // Save comment to database
        Comment comment = Comment.builder()
            .stream(currentStream)
            .displayName(commentDto.getDisplayName())
            .content(commentDto.getContent())
            .ipAddress(ipAddress)
            .build();
        
        Comment savedComment = commentRepository.save(comment);
        log.info("Comment saved: id={}, displayName={}, streamId={}", 
                 savedComment.getId(), savedComment.getDisplayName(), currentStream.getId());
        
        // Return DTO
        return mapToDto(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByStreamId(Long streamId) {
        return commentRepository.findByStreamIdAndIsDeletedFalseOrderByCreatedAtAsc(streamId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getRecentComments(Long streamId, int limit) {
        return commentRepository.findTop100ByStreamIdAndIsDeletedFalseOrderByCreatedAtDesc(streamId)
            .stream()
            .limit(limit)
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public boolean deleteComment(Long commentId) {
        return commentRepository.findById(commentId)
            .map(comment -> {
                comment.setIsDeleted(true);
                commentRepository.save(comment);
                log.info("Comment deleted: id={}", commentId);
                return true;
            })
            .orElse(false);
    }

    private CommentDto mapToDto(Comment comment) {
        return CommentDto.builder()
            .id(comment.getId())
            .displayName(comment.getDisplayName())
            .content(comment.getContent())
            .createdAt(comment.getCreatedAt())
            .build();
    }
}
