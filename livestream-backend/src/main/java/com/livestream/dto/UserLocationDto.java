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
public class UserLocationDto {
    private Long id;
    private Long userId;
    private String username;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String country;
    private String ipAddress;
    private LocalDateTime createdAt;
}
