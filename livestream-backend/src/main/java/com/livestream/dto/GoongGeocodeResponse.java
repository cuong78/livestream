package com.livestream.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoongGeocodeResponse {
    
    private List<Result> results;
    private String status;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        
        @JsonProperty("formatted_address")
        private String formattedAddress;
        
        @JsonProperty("address_components")
        private List<AddressComponent> addressComponents;
        
        private Geometry geometry;
        
        @JsonProperty("place_id")
        private String placeId;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AddressComponent {
        
        @JsonProperty("long_name")
        private String longName;
        
        @JsonProperty("short_name")
        private String shortName;
        
        private List<String> types;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {
        private Location location;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private Double lat;
        private Double lng;
    }
}
