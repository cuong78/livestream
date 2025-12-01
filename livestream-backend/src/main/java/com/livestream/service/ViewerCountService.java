package com.livestream.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ViewerCountService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final AtomicInteger viewerCount = new AtomicInteger(0);
    
    /**
     * Get current viewer count
     */
    public int getCurrentCount() {
        return viewerCount.get();
    }
    
    /**
     * Event listener for WebSocket connections
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        int count = viewerCount.incrementAndGet();
        log.info("New WebSocket connection. Current viewer count: {}", count);
        broadcastViewerCount(count);
    }
    
    /**
     * Send current viewer count to a specific user
     */
    public void sendCountToUser(String sessionId) {
        try {
            int count = viewerCount.get();
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/viewer-count", Map.of("count", count));
            log.debug("Sent viewer count {} to session {}", count, sessionId);
        } catch (Exception e) {
            log.error("Failed to send viewer count to user", e);
        }
    }
    
    /**
     * Event listener for WebSocket disconnections
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        int count = viewerCount.decrementAndGet();
        if (count < 0) {
            viewerCount.set(0);
            count = 0;
        }
        log.info("WebSocket disconnected. Current viewer count: {}", count);
        broadcastViewerCount(count);
    }
    
    /**
     * Broadcast current viewer count to all clients
     */
    private void broadcastViewerCount(int count) {
        try {
            messagingTemplate.convertAndSend("/topic/viewer-count", Map.of("count", count));
            log.debug("Broadcasted viewer count: {}", count);
        } catch (Exception e) {
            log.error("Failed to broadcast viewer count", e);
        }
    }
}
