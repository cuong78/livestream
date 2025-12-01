package com.livestream.service;

import com.livestream.entity.BlockedIp;
import com.livestream.repository.BlockedIpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IpBlockService {
    
    private final BlockedIpRepository blockedIpRepository;
    
    /**
     * Check if IP address is blocked
     */
    public boolean isBlocked(String ipAddress) {
        return blockedIpRepository.existsByIpAddress(ipAddress);
    }
    
    /**
     * Block an IP address
     */
    @Transactional
    public BlockedIp blockIp(String ipAddress, String reason, String blockedBy) {
        if (blockedIpRepository.existsByIpAddress(ipAddress)) {
            throw new RuntimeException("IP address is already blocked");
        }
        
        BlockedIp blockedIp = BlockedIp.builder()
                .ipAddress(ipAddress)
                .reason(reason)
                .blockedAt(LocalDateTime.now())
                .blockedBy(blockedBy)
                .build();
        
        BlockedIp saved = blockedIpRepository.save(blockedIp);
        log.info("IP {} blocked by {} for reason: {}", ipAddress, blockedBy, reason);
        return saved;
    }
    
    /**
     * Unblock an IP address
     */
    @Transactional
    public void unblockIp(Long id) {
        BlockedIp blockedIp = blockedIpRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blocked IP not found"));
        
        blockedIpRepository.delete(blockedIp);
        log.info("IP {} unblocked", blockedIp.getIpAddress());
    }
    
    /**
     * Get all blocked IPs
     */
    public List<BlockedIp> getAllBlocked() {
        return blockedIpRepository.findAll();
    }
}
