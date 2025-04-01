import React, { useRef, useState } from 'react';
import { FiSend, FiCommand, FiMic, FiStopCircle } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { useChatContext } from '../../contexts/ChatContext';
import { useChatActions } from '../../hooks/useChatActions';
import styles from '../../styles/Home.module.css';

interface MessageInputProps {
  onToggleQuickCommands: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onToggleQuickCommands }) => {
  const { t } = useTranslation('common');
  const { 
    input, 
    setInput, 
    isLoading, 
    settings
  } = useChatContext();
  const { sendMessage } = useChatActions();
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Voice input function
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
  
  // Handle input change with auto-grow functionality
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-grow textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    sendMessage(e);
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (settings.sendWithEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className={styles.inputContainer}>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <button 
            type="button"
            onClick={onToggleQuickCommands}
            className={styles.quickCommandsButton} 
            aria-label={t('quickCommands')}
          >
            <FiCommand />
          </button>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={t('askAnything')}
            disabled={isLoading}
            rows={1}
            className={styles.messageInput}
            autoFocus
          />
          
          <button 
            type="button"
            onClick={startVoiceInput}
            className={styles.voiceButton} 
            aria-label={isRecording ? t('stopRecording') : t('startRecording')}
          >
            {isRecording ? <FiStopCircle /> : <FiMic />}
          </button>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className={styles.sendButton}
        >
          <FiSend />
        </button>
      </form>
      
      <div className={styles.inputHint}>
        {settings.sendWithEnter ? (
          <span>{t('shortcuts')}</span>
        ) : (
          <span>{t('pressShiftEnter')}</span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
