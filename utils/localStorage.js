import { safeJsonParse } from './safeJson';

/**
 * Safely get and parse an item from localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if not found or invalid
 * @returns {any} The parsed value or default
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, defaultValue);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safely store an item in localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - The value to store
 * @returns {boolean} Success status
 */
export function setStorageItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clean up potentially corrupted localStorage items
 */
export function cleanupStorage() {
  const keysToCheck = ['messages', 'chatMessages', 'usedSuggestions', 'questionHistory'];
  
  keysToCheck.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        // Try to parse it - if it fails, remove the item
        JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Removing corrupted localStorage item: ${key}`);
      localStorage.removeItem(key);
    }
  });
}
