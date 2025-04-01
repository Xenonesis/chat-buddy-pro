import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS, saveToStorage, loadFromStorage } from '../utils/storage';

// Types
export type ChatMode = 'standard' | 'creative' | 'precise' | 'coding' | 'learning' | 'concise';

export interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: number;
  model: string;
  reactions?: string[];
  attachments?: string[];
  isGenerated?: boolean;
  feedbackGiven?: boolean;
}

export interface Settings {
  responseLength: 'short' | 'medium' | 'long';
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  autoScroll: boolean;
  sendWithEnter: boolean;
  language: string;
  codeTheme: 'dark' | 'light';
  messageSpacing: 'compact' | 'comfortable' | 'spacious';
  defaultModel: string;
  temperature: number;
  enableAnimations: boolean;
  smartSuggestions: boolean;
  chatMode: ChatMode;
  apiKeys: {
    gemini: string;
    claude: string;
    mistral: string;
  };
}

interface ChatContextProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  model: string;
  setModel: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatMode: ChatMode;
  setChatMode: React.Dispatch<React.SetStateAction<ChatMode>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  loadingProgress: number;
  setLoadingProgress: React.Dispatch<React.SetStateAction<number>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  isRegenerating: boolean;
  setIsRegenerating: React.Dispatch<React.SetStateAction<boolean>>;
  regeneratingId: string | null;
  setRegeneratingId: React.Dispatch<React.SetStateAction<string | null>>;
}

const defaultSettings: Settings = {
  responseLength: 'medium',
  theme: 'light',
  fontSize: 16,
  autoScroll: true,
  sendWithEnter: true,
  language: 'en',
  codeTheme: 'dark',
  messageSpacing: 'comfortable',
  defaultModel: 'gemini',
  temperature: 0.7,
  enableAnimations: true,
  smartSuggestions: true,
  chatMode: 'standard',
  apiKeys: {
    gemini: '',
    claude: '',
    mistral: ''
  }
};

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [username, setUsername] = useState<string>('User');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = loadFromStorage(STORAGE_KEYS.MESSAGES, []);
    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage(STORAGE_KEYS.MESSAGES, messages);
    }
  }, [messages]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
    if (savedSettings) {
      setSettings(savedSettings);
      
      // Also update dependent states
      if (savedSettings.chatMode) {
        setChatMode(savedSettings.chatMode);
      }
      
      if (savedSettings.defaultModel) {
        setModel(savedSettings.defaultModel);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        model,
        setModel,
        isLoading,
        setIsLoading,
        chatMode,
        setChatMode,
        settings,
        setSettings,
        loadingProgress,
        setLoadingProgress,
        username,
        setUsername,
        isRegenerating,
        setIsRegenerating,
        regeneratingId,
        setRegeneratingId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
