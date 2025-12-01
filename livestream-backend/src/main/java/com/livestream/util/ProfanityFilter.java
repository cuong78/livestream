package com.livestream.util;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Profanity filter for Vietnamese and English bad words
 */
public class ProfanityFilter {
    
    private static final Set<String> BAD_WORDS = new HashSet<>(Arrays.asList(
        // Vietnamese profanity
        "đm", "dm", "dcm", "dcmm", "dmm", "đmm", "vl", "vcl", "vkl", "cc", "cặc", "buồi", 
        "lồn", "lon", "dit", "đit", "địt", "fuck", "shit", "bitch", "ass", "damn",
        "chó", "dog", "ngu", "ngốc", "khốn", "súc vật", "con chó", "thằng", "đĩ", 
        "cave", "gái điếm", "ma men", "ma túy", "cá độ", "cá cược", "đánh bạc",
        // Phone patterns
        "zalo", "facebook", "fb", "phone", "số đt", "sđt", "liên hệ"
    ));
    
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "(?:\\+84|0)\\s?(?:[0-9]{9,10})|" +  // Vietnamese phone
        "(?:[0-9]{3}[-\\s]?){2}[0-9]{3,4}"    // Generic phone pattern
    );
    
    private static final Pattern URL_PATTERN = Pattern.compile(
        "(?:https?://)?(?:www\\.)?[a-zA-Z0-9-]+\\.[a-z]{2,}(?:/[^\\s]*)?"
    );
    
    /**
     * Check if text contains profanity or prohibited content
     */
    public static boolean containsProfanity(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        
        String lowerText = text.toLowerCase().replaceAll("\\s+", "");
        
        // Check bad words
        for (String badWord : BAD_WORDS) {
            if (lowerText.contains(badWord)) {
                return true;
            }
        }
        
        // Check phone numbers
        if (PHONE_PATTERN.matcher(text).find()) {
            return true;
        }
        
        // Check URLs
        if (URL_PATTERN.matcher(text).find()) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the reason why text was filtered
     */
    public static String getFilterReason(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }
        
        String lowerText = text.toLowerCase().replaceAll("\\s+", "");
        
        for (String badWord : BAD_WORDS) {
            if (lowerText.contains(badWord)) {
                return "Nội dung chứa từ ngữ không phù hợp";
            }
        }
        
        if (PHONE_PATTERN.matcher(text).find()) {
            return "Không được để số điện thoại";
        }
        
        if (URL_PATTERN.matcher(text).find()) {
            return "Không được để link website";
        }
        
        return null;
    }
}
