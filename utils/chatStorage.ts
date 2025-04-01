import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storage';

// Define message interface
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model: string;
  reactions?: string[];
  feedbackGiven?: boolean;
}

// Save messages to local storage
export function saveMessages(messages: Message[]): boolean {
  return saveToStorage(STORAGE_KEYS.MESSAGES, messages);
}

// Load messages from local storage
export function loadMessages(): Message[] {
  return loadFromStorage<Message[]>(STORAGE_KEYS.MESSAGES, []);
}

// Create debounced auto-save function
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
export function autoSaveMessages(messages: Message[]) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveMessages(messages);
    saveTimeout = null;
  }, 500); // 500ms debounce
  
  // Return cleanup function
  return () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  };
}

// Clear all chat messages
export function clearAllMessages(): boolean {
  return saveToStorage(STORAGE_KEYS.MESSAGES, []);
}
