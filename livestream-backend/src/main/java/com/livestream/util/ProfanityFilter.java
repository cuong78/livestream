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
        "cave", "gái điếm", "ma men", "ma túy", "cá độ", "cá cược", "đánh bạc"
    ));
    
   
    
    private static final Pattern URL_PATTERN = Pattern.compile(
        "(?:https?://)?(?:www\\.)?[a-zA-Z0-9-]+\\.[a-z]{2,}(?:/[^\\s]*)?"
    );
    
    // XSS Protection Patterns
    private static final Pattern SVG_XSS_PATTERN = Pattern.compile(
        "<svg[^>]*on\\w+[^>]*>",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern JAVASCRIPT_PROTOCOL = Pattern.compile(
        "javascript:",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern IFRAME_PATTERN = Pattern.compile(
        "<iframe[^>]*>",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "<script[^>]*>",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern IMG_ONERROR_PATTERN = Pattern.compile(
        "<img[^>]*onerror[^>]*>",
        Pattern.CASE_INSENSITIVE
    );
    
    /**
     * Check if text contains profanity or prohibited content
     */
    public static boolean containsProfanity(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        
        String lowerText = text.toLowerCase();
        
        // Check bad words - use word boundaries to avoid false positives
        for (String badWord : BAD_WORDS) {
            // Create pattern with word boundaries (không match nếu là phần của từ khác)
            String pattern = "\\b" + Pattern.quote(badWord) + "\\b";
            if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(lowerText).find()) {
                return true;
            }
        }
        
     
        
        // Check URLs
        if (URL_PATTERN.matcher(text).find()) {
            return true;
        }
        
        // Check XSS patterns
        if (SVG_XSS_PATTERN.matcher(text).find()) {
            return true;
        }
        
        if (JAVASCRIPT_PROTOCOL.matcher(text).find()) {
            return true;
        }
        
        if (IFRAME_PATTERN.matcher(text).find()) {
            return true;
        }
        
        if (SCRIPT_PATTERN.matcher(text).find()) {
            return true;
        }
        
        if (IMG_ONERROR_PATTERN.matcher(text).find()) {
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
        
        String lowerText = text.toLowerCase();
        
        for (String badWord : BAD_WORDS) {
            String pattern = "\\b" + Pattern.quote(badWord) + "\\b";
            if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(lowerText).find()) {
                return "Nội dung chứa từ ngữ không phù hợp";
            }
        }
        
    
        
        if (URL_PATTERN.matcher(text).find()) {
            return "Không được để link website";
        }
        
        if (SVG_XSS_PATTERN.matcher(text).find() || 
            JAVASCRIPT_PROTOCOL.matcher(text).find() ||
            IFRAME_PATTERN.matcher(text).find() ||
            SCRIPT_PATTERN.matcher(text).find() ||
            IMG_ONERROR_PATTERN.matcher(text).find()) {
            return "Phát hiện mã độc XSS - nội dung không an toàn";
        }
        
        return null;
    }
}
