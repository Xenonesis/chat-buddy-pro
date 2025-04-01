import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { 
  FiCopy, FiCheck, FiSend, FiSettings, FiDownload, FiUpload, FiMic, 
  FiStopCircle, FiTrash2, FiSearch, FiPaperclip, FiX, FiImage,
  FiHeart, FiThumbsUp, FiThumbsDown, FiBookmark, FiGlobe, FiMoon, FiSun,
  FiRefreshCw, FiMessageSquare, FiEye, FiEyeOff, FiZoomIn, FiLayers, FiInfo,
  FiFeather, FiTarget, FiCode, FiBook, FiZap, FiChevronDown, FiThermometer, FiAlignLeft, FiCommand, FiChevronRight
} from 'react-icons/fi';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  STORAGE_KEYS, 
  saveToStorage, 
  loadFromStorage, 
  removeFromStorage,
  saveSensitiveToStorage,
  isStorageAvailable,
  initStorage,
  debounce 
} from '../utils/storage';
import DataManagement from '../components/DataManagement';

// Import CodeBlock component dynamically with SSR disabled
const CodeBlock = dynamic(
  () => import('../components/CodeBlock'),
  { ssr: false }
);

// Add chat mode type
type ChatMode = 'standard' | 'creative' | 'precise' | 'coding' | 'learning' | 'concise';

// Enhanced message interface
interface Message {
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

// Enhanced settings interface
interface Settings {
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
  chatMode: ChatMode; // Add chat mode to settings
  apiKeys: {
    gemini: string;
    claude: string;
    mistral: string;
  };
}

// Quick Command interface
interface QuickCommand {
  title: string;
  template: string;
  icon: React.ReactNode;
  color: string;
  category: 'explain' | 'code' | 'compare' | 'summarize' | 'brainstorm' | 'plan' | 'debug' | 'analyze';
}

// Import new components
import MessageItem from '../components/MessageItem';
import AnimatedBackground from '../components/AnimatedBackground';
import MessageSkeleton from '../components/MessageSkeleton';

// Import the new username utilities
import { getUsername, saveUsername } from '../utils/userStorage';
import { safeJsonParse } from '../utils/safeJson';
import { getStorageItem, setStorageItem } from '../utils/localStorage';

// Import SettingsPanel component
import SettingsPanel from '../components/SettingsPanel';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<{[key: number]: boolean}>({});
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [settings, setSettings] = useState<Settings>({
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
    chatMode: 'standard', // Add default chat mode
    apiKeys: {
      gemini: '',
      claude: '',
      mistral: ''
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions] = useState([
    "Explain quantum computing",
    "Write a creative story",
    "Help me debug my code",
    "Translate to Spanish"
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageGen, setShowImageGen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [reactions] = useState(['❤️', '👍', '👎', '😊', '🤔']);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<{[key: string]: number}>({});
  const [trendingSuggestion, setTrendingSuggestion] = useState<string | null>(null);
  const [lastAssistantResponse, setLastAssistantResponse] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackForMessageId, setFeedbackForMessageId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'unhelpful' | 'other'>('other');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [username, setUsername] = useState<string>('User');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'profile' | 'behavior' | 'ai' | 'apiKeys' | 'chatModes'>('appearance');
  const [showChatModeOptions, setShowChatModeOptions] = useState(false);
  const [showQuickCommands, setShowQuickCommands] = useState<boolean>(false);
  
  const { t, i18n } = useTranslation('common');
  
  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  // Scroll to bottom effect
  useEffect(() => {
    if (settings.autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, settings.autoScroll]);

  // First-time user onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();
      }
      if (e.key === 'Escape') {
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update the theme handling
  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setSettings(prev => ({ ...prev, theme: savedTheme as 'light' | 'dark' }));
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSettings(prev => ({ ...prev, theme: prefersDark ? 'dark' : 'light' }));
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);
  
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopied({ [index]: true });
    setTimeout(() => setCopied({ [index]: false }), 2000);
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'gemini': return '🌟';
      case 'claude': return '🎭';
      case 'mistral': return '🌪️';
      default: return '🤖';
    }
  };

  // Chat mode configurationiguration with improved icons
  const chatModes = {
    standard: {
      name: t('standardMode'),
      description: t('standardModeDesc'),
      temperature: 0.7,
      responseLength: 'medium' as const,
      icon: <FiMessageSquare size={18} />,
      color: '#0070f3'
    },
    creative: {
      name: t('creativeMode'),
      description: t('creativeModeDesc'),
      temperature: 0.9,
      responseLength: 'medium' as const,
      icon: <FiFeather size={18} />,
      color: '#8b5cf6'
    },
    precise: {
      name: t('preciseMode'),
      description: t('preciseModeDesc'),
      temperature: 0.3,
      responseLength: 'medium' as const,
      icon: <FiTarget size={18} />,
      color: '#10b981'
    },
    coding: {
      name: t('codingMode'),
      description: t('codingModeDesc'),
      temperature: 0.5,
      responseLength: 'medium' as const,
      // Enhanced coding icon with brackets
      icon: (
        <div className={styles.codingIcon}>
          <FiCode size={18} />
        </div>
      ),
      color: '#f59e0b'
    },
    learning: {
      name: t('learningMode'),
      description: t('learningModeDesc'),
      temperature: 0.6,
      responseLength: 'long' as const,
      icon: <FiBook size={18} />,
      color: '#3b82f6'
    },
    concise: {
      name: t('conciseMode'),
      description: t('conciseModeDesc'),
      temperature: 0.4,
      responseLength: 'short' as const,
      icon: <FiZap size={18} />,
      color: '#ec4899'
    }
  };

  // Handle chat mode change
  const handleChatModeChange = (mode: ChatMode) => {
    setChatMode(mode);
    // Update temperature and responseLength based on the selected mode
    setSettings(prev => ({
      ...prev,
      chatMode: mode,
      temperature: chatModes[mode].temperature,
      responseLength: chatModes[mode].responseLength
    }));
    
    // After state update, add data attribute for CSS animation targeting
    setTimeout(() => {
      const modeCards = document.querySelectorAll(`.${styles.chatModeCard}`);
      modeCards.forEach(card => {
        if (card.textContent?.includes(chatModes[mode].name)) {
          card.setAttribute('data-mode', mode);
        }
      });
    }, 0);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Track the question in history
    setQuestionHistory(prev => [...prev, input.trim()]);

    setIsLoading(true);
    const userMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now(), model };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    const messageStartTime = Date.now();
    // Add a system prompt prefix based on the chat mode
    const currentMode = settings.chatMode;
    let systemPrompt = '';
    switch(currentMode) {
      case 'creative':
        systemPrompt = "I want you to be creative, imaginative and expressive in your responses. Feel free to explore interesting ideas and unique angles.";
        break;
      case 'precise':
        systemPrompt = "I want you to be factual, precise, and concise. Focus on accuracy and clarity in your responses.";
        break;
      case 'coding':
        systemPrompt = "I want you to focus on providing code, technical explanations, and programming help. Use proper formatting for code blocks.";
        break;
      case 'learning':
        systemPrompt = "I want you to explain concepts thoroughly in an educational manner. Break down complex topics and provide examples to help understanding.";
        break;
      case 'concise':
        systemPrompt = "I want you to be brief and to the point. Provide short, direct answers without unnecessary details.";
        break;
      default: // standard
        systemPrompt = ""; // No special prompt for standard mode
    }

    // Create the full message with system prompt if needed
    const fullMessage = systemPrompt ? `${systemPrompt}\n\nUser query: ${input}` : input;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: fullMessage,
          model,
          responseLength: chatModes[currentMode].responseLength,
          temperature: chatModes[currentMode].temperature,
          chatMode: currentMode, // Pass the chat mode to the API
          apiKey: settings.apiKeys[model as keyof typeof settings.apiKeys] || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific API key related errors
        if (errorData.requiresApiKey) {
          setApiKeyStatus({
            ...apiKeyStatus,
            [model]: { isValid: false, message: t('missingApiKey') }
          });
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${t('missingApiKey')}`,
            timestamp: Date.now(),
            model
          }]);
          return; // Early return - finally block will still execute
        }
        
        if (errorData.invalidApiKey) {
          setApiKeyStatus({
            ...apiKeyStatus,
            [model]: { isValid: false, message: t('invalidApiKey') }
          }); 
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${t('invalidApiKey')}`,
            timestamp: Date.now(),
            model
          }]);
          return; // Early return - finally block will still execute
        }
        
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Clear any previous error status on successful request
      setApiKeyStatus({
        ...apiKeyStatus,
        [model]: { isValid: true, message: '' }
      });

      if (model === 'claude') {
        // Handle streaming response for Claude
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: '', timestamp: Date.now(), model }]);

        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.text) {
                    fullText += data.text;
                    setMessages((prev) => [
                      ...prev.slice(0, -1),
                      { id: Date.now().toString(), role: 'assistant', content: fullText, timestamp: Date.now(), model }
                    ]);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } finally {
          reader?.releaseLock();
        }
      } else {
        // Handle regular responses for other models
        const data = await response.json();
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text || 'Sorry, I could not process that.',
          timestamp: Date.now(),
          model
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`,
        timestamp: Date.now(),
        model
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = async () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognition.start();
      setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
    }
  };

  const exportChat = () => {
    const chatData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.json`;
    a.click();
  };

  const importChat = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMessages = JSON.parse(e.target?.result as string);
          setMessages(importedMessages);
        } catch (error) {
          console.error('Error importing chat:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Add message reaction
  const addReaction = (messageId: string, reaction: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId
          ? { 
              ...msg, 
              reactions: msg.reactions?.includes(reaction)
                ? msg.reactions.filter(r => r !== reaction)
                : [...(msg.reactions || []), reaction]
            }
          : msg
      )
    );
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Generate image from prompt
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await response.json();
      
      if (data.imageUrl) {
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `![Generated Image](${data.imageUrl})`,
          timestamp: Date.now(),
          model: 'image-generator',
          isGenerated: true
        };
        setMessages(prev => [...prev, newMessage]);
        setImagePrompt('');
        setShowImageGen(false);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearChat = () => {
    if (window.confirm(t('clearConfirmation'))) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  };

  // Complete onboarding
  const completeOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  // Change language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng).then(() => {
      setSettings(prev => ({ ...prev, language: lng }));
    }).catch(error => console.error('Error changing language:', error));
  };

  // Add typing status indicator
  useEffect(() => {
    if (isLoading) {
      const phrases = [
        "Thinking...", 
        "Processing...", 
        "Analyzing...",
        "Generating response..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setTypingStatus(phrases[i % phrases.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setTypingStatus(null);
    }
  }, [isLoading]);

  // Add auto progress bar during loading
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);
  
  // Track user activity
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const defaultSuggestions = [
    "Explain quantum computing",
    "Write a creative story",
    "Help me debug my code",
    "Translate to Spanish"
  ];

  const extractTopics = useCallback((text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    
    // Expanded list of common words to filter out
    const commonWords = [
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'to', 'for', 'and', 
      'or', 'but', 'in', 'on', 'at', 'by', 'with', 'about', 'as', 'if', 
      'of', 'this', 'that', 'these', 'those', 'it', 'its', 'from', 'be', 
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 
      'can', 'could', 'may', 'might', 'must', 'me', 'my', 'mine', 'your',
      'yours', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs'
    ];

    // Filter out common words and punctuation
    const topics = words
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .map(word => word.replace(/[^a-z0-9]/g, ''))
      .filter(word => word.length > 3);
    
    // Extract phrases (pairs of adjacent words) that might be more meaningful
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i].replace(/[^a-z0-9]/g, '');
      const word2 = words[i + 1].replace(/[^a-z0-9]/g, '');
      if (word1.length > 2 && word2.length > 2 && 
          !commonWords.includes(word1) && !commonWords.includes(word2)) {
        phrases.push(`${word1} ${word2}`);
      }
    }
    
    return [...Array.from(new Set(topics)), ...phrases.slice(0, 3)];
  }, []);
  
  // Enhanced suggestion generation with more context awareness
  const generateRelatedSuggestions = useCallback((topics: string[], recentMessages: Message[]): string[] => {
    if (topics.length === 0) return defaultSuggestions;
    
    const suggestions: string[] = [];
    const topicDict: {[key: string]: boolean} = {};
    topics.forEach(topic => topicDict[topic] = true);

    // Check for question patterns in recent history
    const hasQuestions = recentMessages.some(msg => 
      msg.role === 'user' && msg.content.includes('?')
    );
    
    // Check if user has been discussing code
    const isCodeDiscussion = topics.some(t => 
      ['code', 'programming', 'debug', 'function', 'class', 'error', 'javascript', 'python', 'java', 'react'].includes(t)
    );
    
    // Check if user has been asking for creative content
    const isCreativeDiscussion = topics.some(t => 
      ['write', 'story', 'creative', 'generate', 'poem', 'script', 'fiction', 'character'].includes(t)
    );
    
    // Get last assistant response to provide continuity
    const lastResponse = recentMessages.findLast(msg => msg.role === 'assistant')?.content || '';
    setLastAssistantResponse(lastResponse);
    
    // Add follow-up suggestion based on last response    
    if (lastResponse && lastResponse.length > 20) {
      suggestions.push('Can you explain that in simpler terms?');
      suggestions.push('Give me more detailed examples');
    }

    // Generate programming/coding related suggestions
    if (isCodeDiscussion) {
      suggestions.push('How do I optimize this code?');
      suggestions.push('Explain clean code principles');
      suggestions.push('What design pattern should I use for this?');
      suggestions.push('Debug this code for me');
      suggestions.push('Convert this code to TypeScript');
    }

    // Generate creative writing suggestions
    if (isCreativeDiscussion) {
      suggestions.push('Write a sci-fi short story');
      suggestions.push('Create a character profile');
      suggestions.push('Write a poem about nature');
      suggestions.push('Generate a creative plot twist');
    }
    
    // Domain-specific suggestions
    if (topicDict['quantum'] || topicDict['physics'] || topicDict['computing']) {
      suggestions.push('Explain quantum entanglement');
      suggestions.push('How does quantum computing differ from classical?');
      suggestions.push('What are the limitations of quantum computers?');
    }

    if (topicDict['translate'] || topicDict['language']) {
      suggestions.push('Translate to French');
      suggestions.push('Help me learn basic phrases in Spanish');
      suggestions.push('Compare Spanish and Italian grammar');
    }

    if (topicDict['history'] || topicDict['war'] || topicDict['century']) {
      suggestions.push('What caused World War II?');
      suggestions.push('Explain the significance of the Renaissance');
      suggestions.push('Tell me about ancient civilizations');
    }

    if (topicDict['math'] || topicDict['calculus'] || topicDict['equation']) {
      suggestions.push('How do I solve differential equations?');
      suggestions.push('Explain linear algebra concepts');
      suggestions.push('Help me understand probability theory');
    }

    // Generate follow-up questions
    for (const topic of topics) {
      if (topic.length > 4) {
        suggestions.push(`Tell me more about ${topic}`);
        suggestions.push(`What are common misconceptions about ${topic}?`);
      }
    }
    
    // Add suggestions to reframe the discussion
    suggestions.push('Can you explain this from a different perspective?');
    suggestions.push('What\'s the practical application of this?');
    
    // Ensure we return unique suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions));

    // Calculate most effective suggestions
    const ranked = uniqueSuggestions
      .sort((a, b) => (usedSuggestions[b] || 0) - (usedSuggestions[a] || 0))
      .slice(0, 5);
    
    // Randomly pick one suggestion to be trending (for UI highlight)
    if (ranked.length > 0) {
      const randomIndex = Math.floor(Math.random() * ranked.length);
      setTrendingSuggestion(ranked[randomIndex]);
    }

    return ranked;
  }, [defaultSuggestions, usedSuggestions]);

  // Track which suggestions are used
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setUsedSuggestions(prev => ({
      ...prev,
      [suggestion]: (prev[suggestion] || 0) + 1
    }));
    
    // Focus input after selecting suggestion
    inputRef.current?.focus();
  };
  
  // Update suggestions when message history changes
  useEffect(() => {
    if (questionHistory.length === 0) {
      setDynamicSuggestions(defaultSuggestions);
      return;
    }
    
    const recentQuestions = questionHistory.slice(-5);
    const allTopics: string[] = [];
    recentQuestions.forEach(question => {
      const topics = extractTopics(question);
      allTopics.push(...topics);
    });
    
    // Also analyze recent messages for better context
    const newSuggestions = generateRelatedSuggestions(
      allTopics, 
      messages.slice(-5)
    );
    
    setDynamicSuggestions(newSuggestions.length > 0 ? newSuggestions : defaultSuggestions);
  }, [messages, questionHistory, extractTopics, generateRelatedSuggestions, defaultSuggestions]);

  // Store suggestions in local storage
  useEffect(() => {
    const savedUsedSuggestions = localStorage.getItem('usedSuggestions');
    if (savedUsedSuggestions) {
      setUsedSuggestions(JSON.parse(savedUsedSuggestions));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(usedSuggestions).length > 0) {
      localStorage.setItem('usedSuggestions', JSON.stringify(usedSuggestions));
    }
  }, [usedSuggestions]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('questionHistory');
    if (savedHistory) {
      setQuestionHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (questionHistory.length > 0) {
      localStorage.setItem('questionHistory', JSON.stringify(questionHistory.slice(-10)));
    }
  }, [questionHistory]);

  // Reset settings to default
  const resetSettings = () => {
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
    
    setSettings(defaultSettings);
    localStorage.setItem('chatSettings', JSON.stringify(defaultSettings));
    
    // Also reset the model to default
    setModel(defaultSettings.defaultModel);
    
    // Update language if needed
    if (defaultSettings.language !== settings.language) {
      changeLanguage(defaultSettings.language);
    }
  };

  // Save all settings to localStorage
  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings) as Settings;
      setSettings(parsedSettings);
      
      // Also set the model to the default from settings
      setModel(parsedSettings.defaultModel);
    } else {
      // If no saved settings, check system theme preference
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSettings(prev => ({
        ...prev, 
        theme: prefersDark ? 'dark' : 'light' 
      }));
    }
  }, []);
  
  // System theme preference listener
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSettings(prev => ({
          ...prev,
          theme: e.matches ? 'dark' : 'light'
        }));
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);
  
  // Apply message spacing class based on settings
  const getMessageSpacingClass = useCallback(() => {
    switch(settings.messageSpacing) {
      case 'compact': return styles.spacingCompact;
      case 'spacious': return styles.spacingSpacious;
      default: return '';
    }
  }, [settings.messageSpacing]);

  // Function to regenerate an assistant response
  const regenerateResponse = async (messageId: string) => {
    // Find the message by ID
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return; // Can't regenerate if it's not found or is first message

    // Find the preceding user message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    if (userMessageIndex < 0) return; // No preceding user message found
    
    const userMessage = messages[userMessageIndex];
    
    // Set regenerating state
    setIsRegenerating(true);
    
    // Remove this assistant response and all following messages
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    
    // Send the user message again to get a new response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content, 
          model,
          responseLength: settings.responseLength,
          temperature: settings.temperature + 0.1, // Increase temperature slightly for more variety
          apiKey: settings.apiKeys[model as keyof typeof settings.apiKeys] || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      // Process response based on model
      if (model === 'claude') {
        // Handle streaming response for Claude (same as in sendMessage)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: '', timestamp: Date.now(), model }]);

        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.text) {
                    fullText += data.text;
                    setMessages((prev) => [
                      ...prev.slice(0, -1),
                      { id: Date.now().toString(), role: 'assistant', content: fullText, timestamp: Date.now(), model }
                    ]);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } finally {
          reader?.releaseLock();
        }
      } else {
        // Handle regular responses for other models
        const data = await response.json();
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text || 'Sorry, I could not regenerate a response.',
          timestamp: Date.now(),
          model
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error regenerating response:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to regenerate response'}`,
        timestamp: Date.now(),
        model
      }]);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Open feedback modal for a specific message
  const openFeedbackModal = (messageId: string) => {
    setFeedbackForMessageId(messageId);
    setShowFeedbackModal(true);
    setFeedbackMessage('');
    setFeedbackType('other');
  };

  // Submit feedback
  const submitFeedback = () => {
    // In a real app, you'd send this to your server/analytics
    console.log('Feedback submitted:', {
      messageId: feedbackForMessageId,
      type: feedbackType,
      message: feedbackMessage,
    });
    
    // Add a visual indicator to the message that feedback was given
    if (feedbackForMessageId) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === feedbackForMessageId
            ? { ...msg, feedbackGiven: true }
            : msg
        )
      );
    }
    
    // Close the modal
    setShowFeedbackModal(false);
    setFeedbackForMessageId(null);
    
    // Show confirmation toast or notification
    alert('Thank you for your feedback!');
  };

  // Check for username on first load and also ensure it integrates well with other settings
  useEffect(() => {
    const savedUsername = getUsername();
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      // Only show username prompt if we don't have a name yet
      setShowUsernamePrompt(true);
    }
    
    // Also load general settings
    const settings = getStorageItem('chatSettings');
    if (settings) {
      setSettings(settings);
      // Also set the model to the default from settings
      setModel(settings.defaultModel);
    } else {
      // If no saved settings, check system theme preference
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSettings(prev => ({
        ...prev, 
        theme: prefersDark ? 'dark' : 'light' 
      }));
    }
  }, []);
  
  // Save username to localStorage when changed
  useEffect(() => {
    if (username !== 'User') {
      saveUsername(username);
    }
  }, [username]);

  // Handle username submission with improved validation
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername.length > 0) {
      setShowUsernamePrompt(false);
      setUsername(trimmedUsername);
      saveUsername(trimmedUsername);
    }
  };

  // Add state for showing/hiding API keys
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({
    gemini: false,
    claude: false,
    mistral: false
  });

  // Add state for API key status/errors
  const [apiKeyStatus, setApiKeyStatus] = useState<{[key: string]: {isValid: boolean; message: string}}>({});
  
  // Add state for data management visibility
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Initialize storage when component mounts
  useEffect(() => {
    if (isStorageAvailable()) {
      initStorage();
      loadAllUserData();
    } else {
      // Handle case where localStorage is unavailable
      alert(t('storageUnavailable'));
    }
  }, []);

  // Load all user data from localStorage
  const loadAllUserData = useCallback(() => {
    // Load messages
    const savedMessages = loadFromStorage<Message[]>(STORAGE_KEYS.MESSAGES, []);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }

    // Load username
    const savedUsername = getUsername();
    setUsername(savedUsername);

    // Load settings including API keys securely
    const savedSettings = loadFromStorage<Settings | null>(STORAGE_KEYS.SETTINGS, null);
    if (savedSettings) {
      // For backwards compatibility, ensure apiKeys exist
      const updatedSettings = {
        ...savedSettings,
        apiKeys: savedSettings.apiKeys || {
          gemini: '',
          claude: '',
          mistral: ''
        }
      };
      setSettings(updatedSettings);
      
      // Also set the model to the default from settings
      setModel(updatedSettings.defaultModel);
    } else {
      // If no saved settings, check system theme preference
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSettings(prev => ({
        ...prev, 
        theme: prefersDark ? 'dark' : 'light' 
      }));
    }

    // Load question history
    const savedHistory = loadFromStorage<string[]>(STORAGE_KEYS.QUESTION_HISTORY, []);
    if (savedHistory.length > 0) {
      setQuestionHistory(savedHistory);
    }

    // Load suggestion usage data
    const savedUsedSuggestions = loadFromStorage<{[key: string]: number}>(
      STORAGE_KEYS.SUGGESTIONS, 
      {}
    );
    if (Object.keys(savedUsedSuggestions).length > 0) {
      setUsedSuggestions(savedUsedSuggestions);
    }

    // Check if user has completed onboarding
    const hasSeenOnboarding = loadFromStorage<boolean>(STORAGE_KEYS.ONBOARDING, false);
    setShowOnboarding(!hasSeenOnboarding);
  }, [setMessages, setUsername, setSettings, setModel, setQuestionHistory, setUsedSuggestions, setShowOnboarding, setShowUsernamePrompt]);

  // Create debounced save functions for frequently updated data
  const debouncedSaveMessages = useCallback(
    debounce((data: Message[]) => {
      saveToStorage(STORAGE_KEYS.MESSAGES, data);
    }, 500),
    []
  );

  const debouncedSaveSettings = useCallback(
    debounce((data: Settings) => {
      // Save settings but handle API keys specially
      const settingsWithoutKeys = {
        ...data,
        apiKeys: {
          gemini: data.apiKeys.gemini ? '[SECURED]' : '',
          claude: data.apiKeys.claude ? '[SECURED]' : '',
          mistral: data.apiKeys.mistral ? '[SECURED]' : ''
        }
      };
      
      // Save main settings without actual API key values (for privacy)
      saveToStorage(STORAGE_KEYS.SETTINGS, settingsWithoutKeys);
      
      // Save API keys separately and securely
      if (data.apiKeys.gemini || data.apiKeys.claude || data.apiKeys.mistral) {
        saveSensitiveToStorage(STORAGE_KEYS.API_KEYS, data.apiKeys);
      }
        
      // Also save theme separately for quick access
      saveToStorage(STORAGE_KEYS.THEME, data.theme);
    }, 500),
    []
  );

  // Reset all data function for DataManagement component
  const clearAllData = () => {
    setMessages([]);
    setInput('');
    setQuestionHistory([]);
    setShowOnboarding(true);
    setUsedSuggestions({});
    setSettings({
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
    });
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Add state for expanded explanations
  const [expandedExplanations, setExpandedExplanations] = useState<{[key: string]: string}>({});
  const [isExplaining, setIsExplaining] = useState<{[key: string]: boolean}>({});
  const [detailLevel, setDetailLevel] = useState<'simple' | 'detailed' | 'technical'>('detailed');

  // Function to request more detailed explanation
  const requestDetailedExplanation = async (messageId: string, messageContent: string) => {
    // Find the message by ID
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex < 0) return;

    // Mark this message as currently being explained
    setIsExplaining(prev => ({...prev, [messageId]: true}));
    
    // Generate prompt based on detail level
    let explainPrompt: string;
    switch(detailLevel) {
      case 'simple':
        explainPrompt = `Explain the following in simpler, more beginner-friendly terms: "${messageContent}"`;
        break;
      case 'technical':
        explainPrompt = `Provide a more technical and in-depth explanation of: "${messageContent}"`;
        break;
      default:
        explainPrompt = `Please elaborate on your previous response and provide more details about: "${messageContent}"`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: explainPrompt, 
          model,
          responseLength: settings.responseLength,
          temperature: settings.temperature,
          apiKey: settings.apiKeys[model as keyof typeof settings.apiKeys] || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      const explanationText = data.text || 'Sorry, I could not generate a more detailed explanation.';
      // Save the expanded explanation
      setExpandedExplanations(prev => ({...prev, [messageId]: explanationText}));
    } catch (error: any) {
      console.error('Error getting explanation:', error);
      setExpandedExplanations(prev => ({
        ...prev,
        [messageId]: `Error generating explanation: ${error.message || 'Unknown error'}`
      }));
    } finally {
      setIsExplaining(prev => ({...prev, [messageId]: false}));
    }
  };

  // Quick commands list
  const quickCommands = useMemo<QuickCommand[]>(() => [
    {
      title: t('explainCommand'),
      template: t('explainTemplate'),
      icon: <FiBook />,
      color: '#0070f3',
      category: 'explain'
    },
    {
      title: t('codeCommand'),
      template: t('codeTemplate'),
      icon: <FiCode />,
      color: '#f59e0b',
      category: 'code'
    },
    {
      title: t('compareCommand'),
      template: t('compareTemplate'),
      icon: <FiTarget />,
      color: '#10b981',
      category: 'compare'
    },
    {
      title: t('summarizeCommand'),
      template: t('summarizeTemplate'),
      icon: <FiFeather />,
      color: '#8b5cf6',
      category: 'summarize'
    },
    {
      title: t('brainstormCommand'),
      template: t('brainstormTemplate'),
      icon: <FiZap />,
      color: '#ec4899',
      category: 'brainstorm'
    },
    {
      title: t('planCommand'),
      template: t('planTemplate'), 
      icon: <FiTarget />,
      color: '#3b82f6',
      category: 'plan'
    },
    {
      title: t('debugCommand'),
      template: t('debugTemplate'),
      icon: <FiCode />,
      color: '#ef4444',
      category: 'debug'
    },
    {
      title: t('analyzeCommand'),
      template: t('analyzeTemplate'),
      icon: <FiTarget />,
      color: '#059669',
      category: 'analyze'
    }
  ], [t]);

  // Function to insert quick command template into input
  const insertQuickCommand = (template: string) => {
    setInput(template);
    setShowQuickCommands(false);
    // Focus input after selecting template
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Toggle quick commands panel
  const toggleQuickCommands = () => {
    setShowQuickCommands(prev => !prev);
    // Close other panels when opening quick commands
    if (!showQuickCommands) {
      setShowSettings(false);
      setShowSearch(false);
      setShowImageGen(false);
    }
  };

  // Add handler functions for SettingsPanel
  
  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => {
      if (setting === 'apiKeys') {
        return {
          ...prev,
          apiKeys: value
        };
      }
      return {
        ...prev,
        [setting]: value
      };
    });
  };

  const handleExportChat = () => {
    exportChat();
  };

  const handleImportChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    importChat(e);
  };

  const handleClearChat = () => {
    clearChat();
  };

  const handleClearAllData = () => {
    if (window.confirm(t('clearAllDataConfirmation'))) {
      clearAllData();
    }
  };

  return (
    <div className={`${styles.container} ${styles[settings.theme]}`}>
      <Head>
        <title>Buddy Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content={settings.theme === 'dark' ? '#141e30' : '#e0eafc'} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      
      {/* Username prompt modal */}
      {showUsernamePrompt && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.usernamePrompt}`}>
            <h2>{t('welcomeMessage')}</h2>
            <p>{t('enterUsernamePrompt')}</p>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('yourName')}
                className={styles.usernameInput}
                autoFocus
              />
              <button 
                type="submit"
                disabled={username.trim().length === 0}
              >
                {t('continue')}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {loadingProgress > 0 && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${loadingProgress}%`, transition: loadingProgress === 100 ? 'width 0.4s ease-out' : 'width 0.8s ease' }}
          ></div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.logoSection}>
          <h1>{t('title')}</h1>
          <span className={styles.beta}>BETA</span>
        </div>
        
        <div className={styles.headerControls}>
          <button 
            onClick={toggleTheme} 
            className={styles.headerThemeToggle}
            aria-label={settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {settings.theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>

          <div className={styles.chatModeSelector}>
            <button 
              className={styles.chatModeButton} 
              onClick={() => setShowChatModeOptions(!showChatModeOptions)}
              style={{ 
                color: chatModes[settings.chatMode].color,
                borderColor: chatModes[settings.chatMode].color 
              }}
            >
              {chatModes[settings.chatMode].icon}
              <span className={styles.chatModeName}>
                {chatModes[settings.chatMode].name}
              </span>
              <FiChevronDown />
            </button>

            {showChatModeOptions && (
              <div className={styles.chatModeOptions}>
                {(Object.keys(chatModes) as ChatMode[]).map((mode) => (
                  <button 
                    key={mode}
                    className={`${styles.chatModeOption} ${settings.chatMode === mode ? styles.activeChatMode : ''}`}
                    onClick={() => {
                      handleChatModeChange(mode);
                      setShowChatModeOptions(false);
                    }}
                  >
                    <div className={styles.chatModeIconWrapper} style={{ color: chatModes[mode].color }}>
                      {chatModes[mode].icon}
                    </div>
                    <div className={styles.chatModeDetails}>
                      <span className={styles.chatModeTitle}>{chatModes[mode].name}</span>
                      <span className={styles.chatModeDesc}>{chatModes[mode].description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className={styles.modelSelect}
          >
            <option value="gemini">Gemini AI {getModelIcon('gemini')}</option>
            <option value="claude">Claude 3.5 {getModelIcon('claude')}</option>
            <option value="mistral">Mistral AI {getModelIcon('mistral')}</option>
          </select>
          <div className={styles.langSelector}>
            <FiGlobe />
            <select 
              value={settings.language} 
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.chatActions}>
        <div>
          <button
            onClick={toggleQuickCommands}
            className={`${styles.actionButton} ${showQuickCommands ? styles.activeAction : ''}`}
            aria-label={t('quickCommands')}
          >
            <FiCommand />
            <span className={styles.actionText}>{t('quickCommands')}</span>
          </button>
          <button className={styles.actionButton} onClick={() => setShowSettings(!showSettings)}>
            <FiSettings /> <span className={styles.actionText}>{t('settings')}</span>
          </button>
          <button className={styles.actionButton} onClick={() => setShowSearch(!showSearch)}>
            <FiSearch /> <span className={styles.actionText}>{t('search')}</span>
          </button>
          <button className={styles.actionButton} onClick={() => setShowDataManagement(!showDataManagement)}>
            <FiTrash2 /> <span className={styles.actionText}>{t('dataManagement')}</span>
          </button>
        </div>
        <div className={styles.actionIconsGroup}>
          <button 
            className={`${styles.actionButton} ${styles.iconButton}`} 
            onClick={exportChat}
            title={t('export')}
          >
            <FiDownload />
          </button>
          <label 
            className={`${styles.actionButton} ${styles.iconButton}`}
            title={t('import')}
          >
            <FiUpload />
            <input type="file" onChange={importChat} accept=".json" hidden />
          </label>
          <button 
            className={`${styles.actionButton} ${styles.iconButton}`} 
            onClick={clearChat}
            title={t('clear')}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {showDataManagement && (
        <DataManagement 
          onExport={exportChat}
          onImport={importChat}
          onClearChat={clearChat}
          onClearAllData={clearAllData}
        />
      )}

      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsHeader}>
            <h3>{t('settings')}</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setShowSettings(false)}
            >
              <FiX />
            </button>
          </div>

          <div className={styles.settingsTabs}>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'appearance' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('appearance')}
            >
              {t('appearance')}
            </button>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'profile' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('profile')}
            >
              {t('profile')}
            </button>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'behavior' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('behavior')}
            >
              {t('behavior')}
            </button>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'ai' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('ai')}
            >
              {t('aiSettings')}
            </button>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'apiKeys' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('apiKeys')}
            >
              {t('apiKeys')}
            </button>
            <button 
              className={`${styles.tabButton} ${settingsTab === 'chatModes' ? styles.activeTab : ''}`}
              onClick={() => setSettingsTab('chatModes')}
            >
              {t('chatModes')}
            </button>
          </div>

          <div className={styles.settingsContent}>
            {settingsTab === 'appearance' && (
              <>
                <div className={styles.settingItem}>
                  <label>{t('theme')}</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      theme: e.target.value as Settings['theme']
                    }))}
                  >
                    <option value="light">{t('lightMode')}</option>
                    <option value="dark">{t('darkMode')}</option>
                    <option value="system">{t('systemPreference')}</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <label>{t('fontSize')}: {settings.fontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      fontSize: Number(e.target.value)
                    }))}
                  />
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('messageSpacing')}</label>
                  <select
                    value={settings.messageSpacing}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      messageSpacing: e.target.value as Settings['messageSpacing']
                    }))}
                  >
                    <option value="compact">{t('compact')}</option>
                    <option value="comfortable">{t('comfortable')}</option>
                    <option value="spacious">{t('spacious')}</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <label>{t('codeTheme')}</label>
                  <select
                    value={settings.codeTheme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      codeTheme: e.target.value as Settings['codeTheme']
                    }))}
                  >
                    <option value="dark">{t('dark')}</option>
                    <option value="light">{t('light')}</option>
                  </select>
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('enableAnimations')}</label>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      id="animations-toggle"
                      checked={settings.enableAnimations}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        enableAnimations: e.target.checked
                      }))}
                    />
                    <label htmlFor="animations-toggle" className={styles.toggleLabel}></label>
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'profile' && (
              <>
                <div className={styles.settingItem}>
                  <label>{t('username')}</label>
                  <div className={styles.profileNameEdit}>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('yourName')}
                    />
                  </div>
                </div>
                <div className={styles.profileSection}>
                  <div className={styles.avatar}>
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileInfo}>
                    <p className={styles.profileLabel}>{t('chatHistory')}</p>
                    <p>{messages.length} {t('messages')}</p>
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'behavior' && (
              <>
                <div className={styles.settingItem}>
                  <label>{t('language')}</label>
                  <select
                    value={settings.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <label>{t('autoScroll')}</label>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      id="autoscroll-toggle"
                      checked={settings.autoScroll}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        autoScroll: e.target.checked
                      }))}
                    />
                    <label htmlFor="autoscroll-toggle" className={styles.toggleLabel}></label>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('sendWithEnter')}</label>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      id="sendwithenter-toggle"
                      checked={settings.sendWithEnter}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        sendWithEnter: e.target.checked
                      }))}
                    />
                    <label htmlFor="sendwithenter-toggle" className={styles.toggleLabel}></label>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('smartSuggestions')}</label>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      id="suggestions-toggle"
                      checked={settings.smartSuggestions}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        smartSuggestions: e.target.checked
                      }))}
                    />
                    <label htmlFor="suggestions-toggle" className={styles.toggleLabel}></label>
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'ai' && (
              <>
                <div className={styles.settingItem}>
                  <label>{t('defaultModel')}</label>
                  <select
                    value={settings.defaultModel}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      defaultModel: e.target.value
                    }))}
                  >
                    <option value="gemini">Gemini {getModelIcon('gemini')}</option>
                    <option value="claude">Claude {getModelIcon('claude')}</option>
                    <option value="mistral">Mistral {getModelIcon('mistral')}</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <label>{t('responseLength')}</label>
                  <select
                    value={settings.responseLength}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      responseLength: e.target.value as Settings['responseLength']
                    }))}
                  >
                    <option value="short">{t('short')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="long">{t('long')}</option>
                  </select>
                </div>

                <div className={styles.settingItem}>
                  <label>{t('temperature')}: {settings.temperature.toFixed(1)}</label>
                  <div className={styles.sliderWithLabels}>
                    <span className={styles.sliderLabel}>{t('precise')}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        temperature: parseFloat(e.target.value)
                      }))}
                    />
                    <span className={styles.sliderLabel}>{t('creative')}</span>
                  </div>
                </div>
              </>
            )}

            {settingsTab === 'apiKeys' && (
              <>
                <div className={styles.apiKeysInfo}>
                  <p>{t('apiKeysDescription')}</p>
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('geminiApiKey')}</label>
                  <div className={styles.apiKeyInput}>
                    <input
                      type={showApiKey.gemini ? "text" : "password"}
                      value={settings.apiKeys.gemini}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        apiKeys: {
                          ...prev.apiKeys,
                          gemini: e.target.value
                        }
                      }))}
                      placeholder={t('enterApiKey')}
                      className={apiKeyStatus.gemini?.isValid === false ? styles.invalidApiKey : ''}
                    />
                    <button 
                      className={styles.apiKeyVisibilityBtn}
                      onClick={() => toggleApiKeyVisibility('gemini')}
                      type="button"
                    >
                      {showApiKey.gemini ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: {
                            ...prev.apiKeys,
                            gemini: ''
                          }
                        }));
                        setApiKeyStatus(prev => ({
                          ...prev,
                          gemini: { isValid: true, message: '' }
                        }));
                      }}
                      title={t('clear')}
                      type="button"
                    >
                      <FiX />
                    </button>
                  </div>
                  {apiKeyStatus.gemini?.isValid === false && (
                    <div className={styles.apiKeyError}>{apiKeyStatus.gemini.message}</div>
                  )}
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('claudeApiKey')}</label>
                  <div className={styles.apiKeyInput}>
                    <input
                      type={showApiKey.claude ? "text" : "password"}
                      value={settings.apiKeys.claude}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        apiKeys: {
                          ...prev.apiKeys,
                          claude: e.target.value
                        }
                      }))}
                      placeholder={t('enterApiKey')}
                      className={apiKeyStatus.claude?.isValid === false ? styles.invalidApiKey : ''}
                    />
                    <button 
                      className={styles.apiKeyVisibilityBtn}
                      onClick={() => toggleApiKeyVisibility('claude')}
                      type="button"
                    >
                      {showApiKey.claude ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: {
                            ...prev.apiKeys,
                            claude: ''
                          }
                        }));
                        setApiKeyStatus(prev => ({
                          ...prev,
                          claude: { isValid: true, message: '' }
                        }));
                      }}
                      title={t('clear')}
                      type="button"
                    >
                      <FiX />
                    </button>
                  </div>
                  {apiKeyStatus.claude?.isValid === false && (
                    <div className={styles.apiKeyError}>{apiKeyStatus.claude.message}</div>
                  )}
                </div>
                
                <div className={styles.settingItem}>
                  <label>{t('mistralApiKey')}</label>
                  <div className={styles.apiKeyInput}>
                    <input
                      type={showApiKey.mistral ? "text" : "password"}
                      value={settings.apiKeys.mistral}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        apiKeys: {
                          ...prev.apiKeys,
                          mistral: e.target.value
                        }
                      }))}
                      placeholder={t('enterApiKey')}
                      className={apiKeyStatus.mistral?.isValid === false ? styles.invalidApiKey : ''}
                    />
                    <button 
                      className={styles.apiKeyVisibilityBtn}
                      onClick={() => toggleApiKeyVisibility('mistral')}
                      type="button"
                    >
                      {showApiKey.mistral ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          apiKeys: {
                            ...prev.apiKeys,
                            mistral: ''
                          }
                        }));
                        setApiKeyStatus(prev => ({
                          ...prev,
                          mistral: { isValid: true, message: '' }
                        }));
                      }}
                      title={t('clear')}
                      type="button"
                    >
                      <FiX />
                    </button>
                  </div>
                  {apiKeyStatus.mistral?.isValid === false && (
                    <div className={styles.apiKeyError}>{apiKeyStatus.mistral.message}</div>
                  )}
                </div>

                <div className={styles.apiKeysTip}>
                  <p>{t('apiKeysSecurity')}</p>
                </div>
              </>
            )}
            
            {settingsTab === 'chatModes' && (
              <div className={styles.chatModesSettings}>
                <p className={styles.settingsDescription}>{t('chatModesDesc')}</p>
                
                {(Object.keys(chatModes) as ChatMode[]).map((mode) => (
                  <div 
                    key={mode} 
                    className={`${styles.chatModeCard} ${settings.chatMode === mode ? styles.activeChatModeCard : ''}`}
                    onClick={() => handleChatModeChange(mode)}
                  >
                    <div className={styles.chatModeCardHeader}>
                      <div 
                        className={styles.chatModeCardIcon}
                        style={{ backgroundColor: `${chatModes[mode].color}20`, color: chatModes[mode].color }}
                      >
                        {chatModes[mode].icon}
                      </div>
                      <div className={styles.chatModeCardTitle}>
                        {chatModes[mode].name}
                      </div>
                    </div>
                    <div className={styles.chatModeCardDesc}>
                      {chatModes[mode].description}
                    </div>
                    <div className={styles.chatModeCardDetails}>
                      <span className={styles.chatModeDetailItem}>
                        <FiThermometer /> {t('temperature')}: {chatModes[mode].temperature}
                      </span>
                      <span className={styles.chatModeDetailItem}>
                        <FiAlignLeft /> {t(chatModes[mode].responseLength + 'Responses')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.settingsFooter}>
            <button 
              className={styles.resetButton}
              onClick={resetSettings}
            >
              {t('resetToDefaults')}
            </button>
          </div>
        </div>
      )}

      {showSearch && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
          />
        </div>
      )}

      {showImageGen && (
        <div className={styles.imageGenContainer}>
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder={t('imagePromptPlaceholder')}
            className={styles.searchInput}
          />
          <div className={styles.imageGenButtons}>
            <button 
              onClick={generateImage}
              disabled={isLoading || !imagePrompt.trim()}
            >
              {isLoading ? t('generating') : t('generate')}
            </button>
            <button onClick={() => setShowImageGen(false)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showQuickCommands && (
        <div className={styles.quickCommandsContainer}>
          <div className={styles.quickCommandsHeader}>
            <h3>{t('quickCommandsTitle')}</h3>
            <p className={styles.quickCommandsDescription}>{t('quickCommandsDescription')}</p>
          </div>
          <div className={styles.quickCommandsList}>
            {quickCommands.map((command, index) => (
              <button 
                key={index}
                className={styles.quickCommandCard}
                onClick={() => insertQuickCommand(command.template)}
                style={{ borderLeft: `3px solid ${command.color}` }}
              >
                <div className={styles.quickCommandIcon} style={{ color: command.color }}>
                  {command.icon}
                </div>
                <div className={styles.quickCommandContent}>
                  <div className={styles.quickCommandTitle}>{command.title}</div>
                  <div className={styles.quickCommandTemplate}>{command.template}</div>
                </div>
                <FiChevronRight className={styles.quickCommandArrow} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div 
        className={`${styles.chatContainer} ${getMessageSpacingClass()}`} 
        ref={chatContainerRef}
      >
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.welcomeMessage}>
              <h2 className={styles.welcomeTitle}>{t('welcomeTitle')}</h2>
              <p>{t('welcomeMessage')}</p>
              
              <div className={styles.modelBadges}>
                <div className={styles.modelBadge} onClick={() => setModel('gemini')}>
                  <span className={styles.modelIcon}>✨</span> Gemini
                </div>
                <div className={styles.modelBadge} onClick={() => setModel('claude')}>
                  <span className={styles.modelIcon}>🎭</span> Claude
                </div>
                <div className={styles.modelBadge} onClick={() => setModel('mistral')}>
                  <span className={styles.modelIcon}>🌪️</span> Mistral
                </div>
              </div>
            </div>
            
            <div className={styles.quickStartContainer}>
              <div 
                className={styles.quickStartCard}
                onClick={() => setInput("Explain how artificial intelligence works in simple terms")}
              >
                <div className={styles.quickStartIcon}>
                  <FiBook />
                </div>
                <h3 className={styles.quickStartTitle}>Learn Something</h3>
                <p className={styles.quickStartDesc}>Ask about any topic to get a clear explanation</p>
              </div>
              
              <div 
                className={styles.quickStartCard}
                onClick={() => setInput("Write a creative short story about a time traveler")}
              >
                <div className={styles.quickStartIcon}>
                  <FiFeather />
                </div>
                <h3 className={styles.quickStartTitle}>Get Creative</h3>
                <p className={styles.quickStartDesc}>Generate stories, poems, or creative content</p>
              </div>
              
              <div 
                className={styles.quickStartCard}
                onClick={() => setInput("Help me debug this code: function add(a, b) { retur a + b; }")}
              >
                <div className={styles.quickStartIcon}>
                  <FiCode />
                </div>
                <h3 className={styles.quickStartTitle}>Code Assistant</h3>
                <p className={styles.quickStartDesc}>Get help with coding problems or questions</p>
              </div>
            </div>
          </div>
        )}
        
        {filteredMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            index={index}
            copied={copied}
            copyToClipboard={copyToClipboard}
            addReaction={addReaction}
            openFeedbackModal={openFeedbackModal}
            regenerateResponse={regenerateResponse}
            isRegenerating={isRegenerating}
            codeTheme={settings.codeTheme}
          />
        ))}
        
        {isLoading && <MessageSkeleton theme={settings.theme === 'dark' ? 'dark' : 'light'} />}
        
        {typingStatus && (
          <div className={styles.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      <div className={styles.suggestions}>
        <AnimatePresence mode="wait">
          {dynamicSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`${styles.suggestionButton} ${
                suggestion === trendingSuggestion ? styles.trendingSuggestion : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
          <button 
            className={styles.suggestionButton}
            onClick={() => setShowImageGen(true)}
          >
            <FiImage /> {t('generateImage')}
          </button>
        </AnimatePresence>
      </div>

      <div className={`${styles.inputFormContainer}`}>
        <form 
          onSubmit={sendMessage} 
          className={`${styles.inputForm} ${inputFocused ? styles.inputFormFocused : ''}`}
        >
          <button
            type="button"
            onClick={startVoiceInput}
            className={`${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
          >
            <FiMic />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isLoading ? "Waiting for response..." : t('askAnything')}
            disabled={isLoading}
            className={`${styles.inputField} ${isLoading ? styles.inputDisabled : ''}`}
            style={{ fontSize: `${settings.fontSize}px` }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && settings.sendWithEnter && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
              if (e.key === '/' && !input && !showQuickCommands) {
                e.preventDefault();
                setShowQuickCommands(true);
              }
            }}
          />
          <button 
            type="button"
            onClick={toggleQuickCommands}
            className={`${styles.quickCommandButton} ${showQuickCommands ? styles.active : ''}`}
            title={t('quickCommands')}
          >
            <FiCommand />
          </button>
          <button 
            type="button"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isLoading}
            className={styles.attachButton}
          >
            <FiPaperclip />
            <input 
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </button>
          <button 
            type="submit" 
            disabled={isLoading || (!input.trim() && !file)}
          >
            {isLoading ? (
              <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <FiSend />
            )}
          </button>
        </form>
      </div>

      {file && (
        <div className={styles.fileAttachment}>
          <FiPaperclip /> {file.name}
          <span className={styles.fileRemove} onClick={() => setFile(null)}>
            <FiX />
          </span>
        </div>
      )}

      <div className={styles.shortcuts}>
        {t('shortcuts')}
      </div>

      {showOnboarding && (
        <div className={styles.onboardingModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalStep}>
              <div className={styles.stepIndicator}>
                {[0, 1, 2].map((step) => (
                  <div 
                    key={step} 
                    className={`${styles.stepDot} ${onboardingStep === step ? styles.active : ''}`}
                    onClick={() => setOnboardingStep(step)}
                  />
                ))}
              </div>

              {onboardingStep === 0 && (
                <>
                  <h2>{t('welcomeToChat')}</h2>
                  <p>{t('onboardingStep1')}</p>
                </>
              )}
              {onboardingStep === 1 && (
                <>
                  <h2>{t('aiModels')}</h2>
                  <p>{t('onboardingStep2')}</p>
                </>
              )}
              {onboardingStep === 2 && (
                <>
                  <h2>{t('customization')}</h2>
                  <p>{t('onboardingStep3')}</p>
                </>
              )}
              <div className={styles.modalButtons}>
                {onboardingStep > 0 && (
                  <button onClick={() => setOnboardingStep(prev => prev - 1)}>
                    {t('back')}
                  </button>
                )}
                {onboardingStep === 0 && <div></div>}
                {onboardingStep < 2 ? (
                  <button onClick={() => setOnboardingStep(prev => prev + 1)}>
                    {t('next')}
                  </button>
                ) : (
                  <button onClick={completeOnboarding}>
                    {t('getStarted')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={toggleTheme} 
        className={`${styles.themeSwitcher} ${styles.mobileOnly}`}
        aria-label={settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {settings.theme === 'light' ? <FiMoon /> : <FiSun />}
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div className={styles.feedbackModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{t('provideFeedback')}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowFeedbackModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.feedbackOptions}>
              <button 
                className={`${styles.feedbackOption} ${feedbackType === 'helpful' ? styles.selected : ''}`}
                onClick={() => setFeedbackType('helpful')}
              >
                <FiThumbsUp /> {t('helpful')}
              </button>
              <button 
                className={`${styles.feedbackOption} ${feedbackType === 'unhelpful' ? styles.selected : ''}`}
                onClick={() => setFeedbackType('unhelpful')}
              >
                <FiThumbsDown /> {t('unhelpful')}
              </button>
            </div>
            
            <textarea
              className={styles.feedbackTextarea}
              placeholder={t('feedbackPlaceholder')}
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              rows={4}
            />
            <div className={styles.modalButtons}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowFeedbackModal(false)}
              >
                {t('cancel')}
              </button>
              <button 
                className={styles.submitButton}
                onClick={submitFeedback}
                disabled={!feedbackType}
              >
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingChange={handleSettingChange}
          onClose={() => setShowSettings(false)}
          onExportChat={handleExportChat}
          onImportChat={handleImportChat}
          onClearChat={handleClearChat}
          onClearAllData={handleClearAllData}
          currentMessages={messages.length > 0 ? [...messages] : []} 
        />
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
