package com.livestream.service;

import com.livestream.dto.GoongGeocodeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class GoongService {
    
    @Value("${goong.api-key}")
    private String apiKey;
    
    @Value("${goong.geocode-url:https://rsapi.goong.io/geocode}")
    private String geocodeUrl;
    
    private final RestTemplate restTemplate;
    
    public GoongService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Reverse geocode: Convert lat/lng to address
     */
    public Map<String, String> reverseGeocode(Double latitude, Double longitude) {
        try {
            String latlng = latitude + "," + longitude;
            
            String url = UriComponentsBuilder.fromHttpUrl(geocodeUrl)
                    .queryParam("latlng", latlng)
                    .queryParam("api_key", apiKey)
                    .toUriString();
            
            log.info("Calling Goong Geocode API: lat={}, lng={}", latitude, longitude);
            
            GoongGeocodeResponse response = restTemplate.getForObject(url, GoongGeocodeResponse.class);
            
            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                return parseAddress(response.getResults().get(0));
            }
            
            log.warn("No results from Goong API for lat={}, lng={}", latitude, longitude);
            return getDefaultAddress(latitude, longitude);
            
        } catch (Exception e) {
            log.error("Error calling Goong API", e);
            return getDefaultAddress(latitude, longitude);
        }
    }
    
    /**
     * Parse address components from Goong response
     */
    private Map<String, String> parseAddress(GoongGeocodeResponse.Result result) {
        Map<String, String> addressMap = new HashMap<>();
        
        addressMap.put("address", result.getFormattedAddress());
        addressMap.put("country", "Vietnam");
        
        if (result.getAddressComponents() != null) {
            for (GoongGeocodeResponse.AddressComponent component : result.getAddressComponents()) {
                if (component.getTypes() != null) {
                    if (component.getTypes().contains("administrative_area_level_1")) {
                        // Tỉnh/Thành phố
                        addressMap.put("city", component.getLongName());
                    } else if (component.getTypes().contains("administrative_area_level_2")) {
                        // Quận/Huyện
                        addressMap.put("district", component.getLongName());
                    } else if (component.getTypes().contains("sublocality_level_1") || 
                             component.getTypes().contains("administrative_area_level_3")) {
                        // Phường/Xã
                        addressMap.put("ward", component.getLongName());
                    } else if (component.getTypes().contains("country")) {
                        addressMap.put("country", component.getLongName());
                    }
                }
            }
        }
        
        log.info("Parsed address: {}", addressMap);
        return addressMap;
    }
    
    /**
     * Get default address when API fails
     */
    private Map<String, String> getDefaultAddress(Double latitude, Double longitude) {
        Map<String, String> addressMap = new HashMap<>();
        addressMap.put("address", String.format("Location: %.6f, %.6f", latitude, longitude));
        addressMap.put("country", "Vietnam");
        return addressMap;
    }
}
