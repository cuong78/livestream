package com.livestream.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchInfoDto {
    private Integer matchNumber;      // Số cặp (1, 2, 3, ...)
    private Double redWeight;         // Trọng lượng gà đỏ (kg)
    private Double blueWeight;        // Trọng lượng gà xanh (kg)
    private String status;            // "active", "finished", "upcoming"
    private LocalDateTime createdAt;
    private String action;            // "update" hoặc "clear"
}
