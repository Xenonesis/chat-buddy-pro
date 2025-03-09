/**
 * Local Storage utility for BuddyChat
 * Handles saving and loading data with error handling and versioning
 */

// Current storage version - increment when making breaking changes to storage structure
const STORAGE_VERSION = 1;

// Storage keys
export const STORAGE_KEYS = {
  MESSAGES: 'buddychat_messages',
  SETTINGS: 'buddychat_settings',
  USERNAME: 'buddychat_username',
  QUESTION_HISTORY: 'buddychat_questionHistory',
  SUGGESTIONS: 'buddychat_usedSuggestions',
  THEME: 'buddychat_theme',
  ONBOARDING: 'buddychat_hasSeenOnboarding',
  STORAGE_VERSION: 'buddychat_version',
  API_KEYS: 'buddychat_apiKeys' // Added for secure API key storage
};

// Maximum sizes in bytes (approximate)
const MAX_MESSAGES_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_HISTORY_ITEMS = 50;

/**
 * Save data to local storage with error handling
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.error(`Error saving to localStorage (${key}):`, err);
    
    // Check if it's a quota exceeded error
    if (err instanceof DOMException && 
        (err.name === 'QuotaExceededError' || 
         err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      
      // If messages are too large, trim them
      if (key === STORAGE_KEYS.MESSAGES) {
        trimMessages();
        // Try again after trimming
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (err) {
          console.error(`Still unable to save after trimming:`, err);
        }
      }
    }
    
    return false;
  }
}

/**
 * Save sensitive data with basic masking in console logs
 */
export function saveSensitiveToStorage<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    
    // Only log masked data to avoid security risks
    const maskedData = maskSensitiveData(data);
    console.log(`Saved to ${key}:`, maskedData);
    
    return true;
  } catch (err) {
    console.error(`Error saving sensitive data to localStorage (${key}):`, err);
    return false;
  }
}

/**
 * Helper to mask sensitive data in logs
 */
function maskSensitiveData<T>(data: T): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    const masked = { ...data } as any;
    
    // Mask any key that looks like an API key
    Object.keys(masked).forEach(key => {
      if (
        typeof masked[key] === 'string' && 
        (key.toLowerCase().includes('key') || key.toLowerCase().includes('token'))
      ) {
        if (masked[key]) {
          const length = masked[key].length;
          if (length > 8) {
            masked[key] = `${masked[key].substring(0, 4)}...${masked[key].substring(length - 4)}`;
          } else if (length > 0) {
            masked[key] = '******';
          }
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key]);
      }
    });
    
    return masked;
  }
  
  return data;
}

/**
 * Load data from local storage with error handling
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    
    // Special handling for settings to inject API keys
    if (key === STORAGE_KEYS.SETTINGS) {
      try {
        const settings = JSON.parse(serialized) as any;
        
        // If we have stored API keys and settings has apiKeys placeholder
        if (settings && settings.apiKeys) {
          const apiKeysData = localStorage.getItem(STORAGE_KEYS.API_KEYS);
          if (apiKeysData) {
            const apiKeys = JSON.parse(apiKeysData);
            settings.apiKeys = apiKeys;
          }
        }
        
        return settings as T;
      } catch (err) {
        console.error('Error merging API keys with settings:', err);
      }
    }
    
    return JSON.parse(serialized) as T;
  } catch (err) {
    console.error(`Error loading from localStorage (${key}):`, err);
    return defaultValue;
  }
}

/**
 * Remove data from local storage with error handling
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`Error removing from localStorage (${key}):`, err);
    return false;
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Trim old messages when storage is full
 */
function trimMessages(): void {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!serialized) return;
    
    const messages = JSON.parse(serialized);
    if (!Array.isArray(messages)) return;
    
    // Remove the oldest 20% of messages
    const trimCount = Math.max(1, Math.floor(messages.length * 0.2));
    const trimmedMessages = messages.slice(trimCount);
    
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(trimmedMessages));
    console.log(`Trimmed ${trimCount} old messages due to storage limits`);
  } catch (err) {
    console.error(`Error trimming messages:`, err);
  }
}

/**
 * Initialize storage version
 */
export function initStorage(): void {
  // Check and update storage version
  const version = loadFromStorage<number>(STORAGE_KEYS.STORAGE_VERSION, 0);
  if (version < STORAGE_VERSION) {
    // Handle migration if needed in future versions
    
    // Update version
    saveToStorage(STORAGE_KEYS.STORAGE_VERSION, STORAGE_VERSION);
  }
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
