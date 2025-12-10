package com.livestream.service;

import com.livestream.dto.SaveLocationRequest;
import com.livestream.dto.UserLocationDto;
import com.livestream.entity.User;
import com.livestream.entity.UserLocation;
import com.livestream.repository.UserLocationRepository;
import com.livestream.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserLocationService {
    
    private final UserLocationRepository locationRepository;
    private final UserRepository userRepository;
    private final GoongService goongService;
    
    /**
     * Save user location with reverse geocoding
     */
    @Transactional
    public UserLocationDto saveLocation(Long userId, SaveLocationRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Call Goong API to get address from lat/lng
        Map<String, String> addressData = goongService.reverseGeocode(
                request.getLatitude(), 
                request.getLongitude()
        );
        
        // Create location entity
        UserLocation location = UserLocation.builder()
                .user(user)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(addressData.get("address"))
                .city(addressData.get("city"))
                .district(addressData.get("district"))
                .ward(addressData.get("ward"))
                .country(addressData.get("country"))
                .ipAddress(ipAddress)
                .userAgent(request.getUserAgent())
                .build();
        
        UserLocation saved = locationRepository.save(location);
        
        log.info("Saved location for user {}: {}, {}", userId, saved.getCity(), saved.getAddress());
        
        return mapToDto(saved);
    }
    
    /**
     * Save anonymous user location (without userId)
     */
    @Transactional
    public UserLocationDto saveAnonymousLocation(SaveLocationRequest request, String ipAddress) {
        // Call Goong API to get address from lat/lng
        Map<String, String> addressData = goongService.reverseGeocode(
                request.getLatitude(), 
                request.getLongitude()
        );
        
        // Create location entity without user
        UserLocation location = UserLocation.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(addressData.get("address"))
                .city(addressData.get("city"))
                .district(addressData.get("district"))
                .ward(addressData.get("ward"))
                .country(addressData.get("country"))
                .ipAddress(ipAddress)
                .userAgent(request.getUserAgent())
                .build();
        
        UserLocation saved = locationRepository.save(location);
        
        log.info("Saved anonymous location: {}, {}", saved.getCity(), saved.getAddress());
        
        return mapToDto(saved);
    }
    
    /**
     * Get current location for a user
     */
    public UserLocationDto getCurrentLocation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return locationRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .map(this::mapToDto)
                .orElse(null);
    }
    
    /**
     * Get all locations for a user
     */
    public List<UserLocationDto> getUserLocations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return locationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all latest locations (for admin dashboard)
     */
    public List<UserLocationDto> getAllLatestLocations() {
        return locationRepository.findLatestLocationPerUser()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get statistics by city
     */
    public Map<String, Long> getLocationStatsByCity() {
        List<Object[]> results = locationRepository.countUsersByCity();
        return results.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
    
    /**
     * Map entity to DTO
     */
    private UserLocationDto mapToDto(UserLocation location) {
        return UserLocationDto.builder()
                .id(location.getId())
                .userId(location.getUser() != null ? location.getUser().getId() : null)
                .username(location.getUser() != null ? location.getUser().getUsername() : "Anonymous")
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .address(location.getAddress())
                .city(location.getCity())
                .district(location.getDistrict())
                .ward(location.getWard())
                .country(location.getCountry())
                .ipAddress(location.getIpAddress())
                .createdAt(location.getCreatedAt())
                .build();
    }
}
