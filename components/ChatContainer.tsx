import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { FiTrash2, FiSearch, FiChevronDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import MessageItem from './MessageItem';
import MessageSkeleton from './MessageSkeleton';
import { useMessages } from '../context/MessageContext';
import EmptyChat from './EmptyChat';

interface ChatContainerProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    codeTheme: 'dark' | 'light';
    autoScroll: boolean;
    fontSize: number;
  };
  onSettingChange?: (key: string, value: any) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ settings, onSettingChange }) => {
  const { t } = useTranslation('common');
  const { 
    messages, 
    isLoading, 
    isRegenerating, 
    regeneratingId,
    editMessage,
    regenerateResponse,
    clearMessages
  } = useMessages();
  
  const [copied, setCopied] = useState<{[key: number]: boolean}>({});
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (settings.autoScroll && chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, settings.autoScroll]);
  
  // Use debounced search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchValue);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchValue]);
  
  // Optimized scroll handling with useCallback
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // Track if user is at bottom of scroll to enable auto-scrolling
    if (atBottom && !settings.autoScroll) {
      onSettingChange?.('autoScroll', true);
    } else if (!atBottom && settings.autoScroll && !isLoading) {
      onSettingChange?.('autoScroll', false);
    }
  }, [settings.autoScroll, isLoading, onSettingChange]);
  
  // Add scroll listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied({...copied, [index]: true});
    
    setTimeout(() => {
      setCopied({...copied, [index]: false});
    }, 2000);
  };
  
  const handleClearChat = () => {
    if (window.confirm(t('clearConfirmation'))) {
      clearMessages();
    }
  };
  
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };
  
  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;
  
  const highlightSearchText = (content: string) => {
    if (!searchQuery) return content;
    
    const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? `<span class="${styles.searchHighlight}">${part}</span>` 
        : part
    ).join('');
  };

  return (
    <>
      <div className={styles.chatActions}>
        <button 
          className={`${styles.actionButton} ${showSearch ? styles.activeAction : ''}`}
          onClick={toggleSearch}
          aria-label={t('search')}
        >
          <FiSearch />
          <span className={styles.actionText}>{t('search')}</span>
        </button>
        <button 
          className={styles.actionButton}
          onClick={handleClearChat}
          disabled={messages.length === 0}
          aria-label={t('clear')}
        >
          <FiTrash2 />
          <span className={styles.actionText}>{t('clear')}</span>
        </button>
      </div>
      
      {showSearch && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
            autoFocus
          />
        </div>
      )}
      
      <div 
        className={`${styles.chatContainer} ${settings.autoScroll ? styles.autoScroll : ''}`}
        ref={chatContainerRef}
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyChat />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {filteredMessages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  index={index}
                  copied={copied}
                  copyToClipboard={copyToClipboard}
                  openFeedbackModal={(id) => console.log('Feedback for:', id)}
                  regenerateResponse={regenerateResponse}
                  editMessage={editMessage}
                  isRegenerating={isRegenerating && regeneratingId === message.id}
                  codeTheme={settings.codeTheme}
                />
              ))}
            </AnimatePresence>
            {isLoading && (
              <MessageSkeleton theme={settings.theme === 'dark' ? 'dark' : 'light'} />
            )}
          </>
        )}
        
        {/* Scroll to bottom button */}
        {!settings.autoScroll && messages.length > 3 && (
          <motion.button 
            className={styles.scrollToBottomButton}
            onClick={() => {
              chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
              onSettingChange?.('autoScroll', true);
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <FiChevronDown />
          </motion.button>
        )}
      </div>
    </>
  );
};

export default ChatContainer;
