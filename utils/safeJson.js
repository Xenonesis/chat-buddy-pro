/**
 * Safe JSON parsing utility
 * Handles edge cases and prevents crashes on invalid JSON
 */

/**
 * Safely parse JSON with fallback to default value
 */
export function safeJsonParse(jsonString, defaultValue) {
  try {
    // Handle non-string values
    if (typeof jsonString !== 'string') {
      console.warn('Attempted to parse non-string value:', jsonString);
      return defaultValue;
    }
    
    // Handle empty strings
    if (!jsonString.trim()) {
      return defaultValue;
    }
    
    // Check for simple non-JSON values (numbers, etc)
    if (/^\d+$/.test(jsonString.trim())) {
      // This is just a number, not valid JSON
      console.warn('Detected non-JSON plain text value:', jsonString);
      return defaultValue;
    }
    
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('JSON parsing error:', e);
    return defaultValue;
  }
}
