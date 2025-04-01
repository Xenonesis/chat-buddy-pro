import React from 'react';
import { FiSettings, FiSearch } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { useChatContext } from '../../contexts/ChatContext';
import ModelSelector from './ModelSelector';
import styles from '../../styles/Home.module.css';

interface ChatHeaderProps {
  onOpenSettings: () => void;
  onToggleSearch: () => void;
  showSearch: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onOpenSettings, 
  onToggleSearch,
  showSearch
}) => {
  const { t } = useTranslation('common');
  const { username } = useChatContext();
  
  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        <h1 className={styles.appName}>{t('title')}</h1>
        <span className={styles.welcomeUsername}>
          {username}
        </span>
      </div>
      
      <ModelSelector />
      
      <div className={styles.headerActions}>
        <button 
          className={`${styles.actionButton} ${showSearch ? styles.activeAction : ''}`} 
          onClick={onToggleSearch}
          aria-label={t('search')}
        >
          <FiSearch />
        </button>
        <button 
          className={styles.actionButton} 
          onClick={onOpenSettings}
          aria-label={t('settings')}
        >
          <FiSettings />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
