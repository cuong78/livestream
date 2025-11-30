package com.livestream.controller;

import com.livestream.dto.StreamDto;
import com.livestream.service.StreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stream")
@RequiredArgsConstructor
public class StreamController {
    
    private final StreamService streamService;

    @GetMapping("/current")
    public ResponseEntity<StreamDto> getCurrentStream() {
        StreamDto stream = streamService.getCurrentLiveStream();
        return ResponseEntity.ok(stream);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StreamDto> getStreamById(@PathVariable Long id) {
        StreamDto stream = streamService.getStreamById(id);
        if (stream == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stream);
    }
}
