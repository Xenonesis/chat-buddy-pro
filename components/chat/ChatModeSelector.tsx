import React from 'react';
import { 
  FiMessageSquare, FiTarget, FiFeather, FiCode, 
  FiBook, FiZap
} from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { useChatContext, ChatMode } from '../../contexts/ChatContext';
import { useChatActions } from '../../hooks/useChatActions';
import styles from '../../styles/Home.module.css';

const ChatModeSelector: React.FC = () => {
  const { t } = useTranslation('common');
  const { chatMode } = useChatContext();
  const { handleChatModeChange } = useChatActions();

  const chatModeConfig = {
    standard: {
      name: t('standardMode'),
      description: t('standardModeDesc'),
      icon: <FiMessageSquare size={18} />,
      color: '#0070f3'
    },
    creative: {
      name: t('creativeMode'),
      description: t('creativeModeDesc'),
      icon: <FiFeather size={18} />,
      color: '#8b5cf6'
    },
    precise: {
      name: t('preciseMode'),
      description: t('preciseModeDesc'),
      icon: <FiTarget size={18} />,
      color: '#10b981'
    },
    coding: {
      name: t('codingMode'),
      description: t('codingModeDesc'),
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
      icon: <FiBook size={18} />,
      color: '#3b82f6'
    },
    concise: {
      name: t('conciseMode'),
      description: t('conciseModeDesc'),
      icon: <FiZap size={18} />,
      color: '#ec4899'
    }
  };

  return (
    <div className={styles.chatModeSelector}>
      <h3>{t('chatModes')}</h3>
      <p>{t('chatModesDesc')}</p>
      
      <div className={styles.chatModeOptions}>
        {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => (
          <button
            key={mode}
            className={`${styles.chatModeCard} ${chatMode === mode ? styles.activeChatMode : ''}`}
            onClick={() => handleChatModeChange(mode)}
            style={{ 
              borderColor: chatMode === mode ? chatModeConfig[mode].color : 'transparent',
              backgroundColor: chatMode === mode 
                ? `${chatModeConfig[mode].color}10` // 10% opacity 
                : 'transparent'
            }}
          >
            <div 
              className={styles.chatModeIcon} 
              style={{ color: chatModeConfig[mode].color }}
            >
              {chatModeConfig[mode].icon}
            </div>
            <div className={styles.chatModeInfo}>
              <div className={styles.chatModeName}>{chatModeConfig[mode].name}</div>
              <div className={styles.chatModeDesc}>{chatModeConfig[mode].description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatModeSelector;
