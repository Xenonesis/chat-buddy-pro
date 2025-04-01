import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { FiMessageSquare, FiCode, FiBookOpen, FiZap, FiEdit3, FiFeather } from 'react-icons/fi';
import styles from '../styles/ChatModeSelector.module.css';

export type ChatMode = 'standard' | 'creative' | 'precise' | 'coding' | 'learning' | 'concise';

interface ChatModeSelectorProps {
  selectedMode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ selectedMode, onChange }) => {
  const { t } = useTranslation('common');
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const chatModes = [
    { 
      id: 'standard', 
      name: t('standardMode'),
      description: t('standardModeDesc'),
      icon: <FiMessageSquare /> 
    },
    { 
      id: 'creative', 
      name: t('creativeMode'),
      description: t('creativeModeDesc'),
      icon: <FiFeather /> 
    },
    { 
      id: 'precise', 
      name: t('preciseMode'),
      description: t('preciseModeDesc'),
      icon: <FiZap /> 
    },
    { 
      id: 'coding', 
      name: t('codingMode'),
      description: t('codingModeDesc'),
      icon: <div className={styles.codingIcon}><FiCode /></div> 
    },
    { 
      id: 'learning', 
      name: t('learningMode'),
      description: t('learningModeDesc'),
      icon: <FiBookOpen /> 
    },
    { 
      id: 'concise', 
      name: t('conciseMode'),
      description: t('conciseModeDesc'),
      icon: <FiEdit3 /> 
    }
  ];

  const handleModeSelect = (mode: ChatMode) => {
    onChange(mode);
    setShowOptions(false);
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find selected mode details
  const selectedModeDetails = chatModes.find(mode => mode.id === selectedMode);

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={styles.chatModeButton} 
        onClick={() => setShowOptions(!showOptions)}
        aria-expanded={showOptions}
        aria-haspopup="true"
      >
        <span className={styles.chatModeIconWrapper}>
          {selectedModeDetails?.icon}
        </span>
        <span className={styles.chatModeName}>{selectedModeDetails?.name}</span>
      </button>
      
      {showOptions && (
        <div className={styles.chatModeOptions}>
          {chatModes.map((mode) => (
            <button
              key={mode.id}
              className={`${styles.chatModeOption} ${selectedMode === mode.id ? styles.activeChatMode : ''}`}
              onClick={() => handleModeSelect(mode.id as ChatMode)}
            >
              <div className={styles.chatModeIconWrapper}>
                {mode.icon}
              </div>
              <div className={styles.chatModeDetails}>
                <div className={styles.chatModeTitle}>{mode.name}</div>
                <div className={styles.chatModeDesc}>{mode.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatModeSelector;
