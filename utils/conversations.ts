import { Message } from './chatStorage';
import { generateId } from './storageHelpers';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storage';

// Interface for conversation metadata
export interface ConversationMeta {
  id: string;
  title: string; // Generated from first user message
  timestamp: number;
  lastMessage: string; // Preview of last message
  messageCount: number;
}

// Interface for a full conversation
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Load all conversation metadata
export function loadConversationList(): ConversationMeta[] {
  return loadFromStorage<ConversationMeta[]>(STORAGE_KEYS.CONVERSATIONS, []);
}

// Save conversation list
export function saveConversationList(conversations: ConversationMeta[]): boolean {
  return saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations);
}

// Load a specific conversation
export function loadConversation(id: string): Conversation | null {
  const conversations = loadFromStorage<Record<string, Conversation>>(
    STORAGE_KEYS.CONVERSATION_DATA, 
    {}
  );
  return conversations[id] || null;
}

// Save a conversation
export function saveConversation(conversation: Conversation): boolean {
  const conversations = loadFromStorage<Record<string, Conversation>>(
    STORAGE_KEYS.CONVERSATION_DATA, 
    {}
  );
  
  conversations[conversation.id] = conversation;
  return saveToStorage(STORAGE_KEYS.CONVERSATION_DATA, conversations);
}

// Create a new conversation
export function createConversation(initialMessage?: Message): Conversation {
  const id = generateId();
  const timestamp = Date.now();
  
  return {
    id,
    title: initialMessage?.content.slice(0, 50) + '...' || 'New Conversation',
    messages: initialMessage ? [initialMessage] : [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// Update conversation metadata in the list
export function updateConversationMeta(conversation: Conversation): boolean {
  const list = loadConversationList();
  
  const lastMessage = conversation.messages.length > 0 
    ? conversation.messages[conversation.messages.length - 1].content 
    : '';
  
  const meta: ConversationMeta = {
    id: conversation.id,
    title: conversation.title,
    timestamp: conversation.updatedAt,
    lastMessage: lastMessage.slice(0, 100) + (lastMessage.length > 100 ? '...' : ''),
    messageCount: conversation.messages.length
  };
  
  const existingIndex = list.findIndex(c => c.id === conversation.id);
  
  if (existingIndex >= 0) {
    list[existingIndex] = meta;
  } else {
    list.unshift(meta);
  }
  
  return saveConversationList(list);
}

// Delete a conversation
export function deleteConversation(id: string): boolean {
  // Remove from list
  const list = loadConversationList().filter(c => c.id !== id);
  const listSaved = saveConversationList(list);
  
  // Remove conversation data
  const conversations = loadFromStorage<Record<string, Conversation>>(
    STORAGE_KEYS.CONVERSATION_DATA, 
    {}
  );
  
  delete conversations[id];
  const dataSaved = saveToStorage(STORAGE_KEYS.CONVERSATION_DATA, conversations);
  
  return listSaved && dataSaved;
}

// Generate title from conversation content using first user message
export function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Conversation';
  
  // Take first ~50 chars from first user message
  let title = firstUserMessage.content.slice(0, 50).trim();
  if (firstUserMessage.content.length > 50) {
    title += '...';
  }
  
  return title;
}
