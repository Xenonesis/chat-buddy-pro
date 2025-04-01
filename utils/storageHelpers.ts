import { Message } from './chatStorage';
import { isStorageAvailable } from './storage';

// Helper to generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Create a new message object
export function createMessage(role: 'user' | 'assistant', content: string, model: string = ''): Message {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
    model
  };
}

// Check if storage is working
export function checkStorageAvailability(): boolean {
  const available = isStorageAvailable();
  if (!available) {
    console.warn('Local storage is not available. Chat history will not be saved.');
  }
  return available;
}

// Event listener for storage changes (for multi-tab support)
export function setupStorageListener(onStorageChange: (messages: Message[]) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'buddychat_messages' && event.newValue) {
      try {
        const messages = JSON.parse(event.newValue);
        if (Array.isArray(messages)) {
          onStorageChange(messages);
        }
      } catch (error) {
        console.error('Error parsing messages from storage event:', error);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
