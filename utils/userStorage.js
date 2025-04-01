import { STORAGE_KEYS } from './storage';

/**
 * Get username from storage, properly handling plain string values
 * @returns {string} The username or 'User' if not found
 */
export function getUsername() {
  try {
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
    
    if (!username) return 'User';
    
    // Return the username directly without parsing
    return username;
  } catch (error) {
    console.error('Error retrieving username:', error);
    return 'User';
  }
}

/**
 * Save username to storage as a plain string value (not JSON)
 * @param {string} username - The username to store
 */
export function saveUsername(username) {
  try {
    if (username && username.trim()) {
      // Store as plain string, not JSON
      localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
    }
  } catch (error) {
    console.error('Error saving username:', error);
  }
}
