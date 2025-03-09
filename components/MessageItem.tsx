import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiThumbsUp, FiThumbsDown, FiMoreHorizontal, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/Home.module.css';
import CodeBlock from './CodeBlock';

interface MessageItemProps {
  message: {
    id: string;
    role: string;
    content: string;
    timestamp: number;
    model: string;
    reactions?: string[];
    feedbackGiven?: boolean;
  };
  index: number;
  copied: {[key: number]: boolean};
  copyToClipboard: (text: string, index: number) => void;
  addReaction?: (messageId: string, reaction: string) => void;
  openFeedbackModal?: (messageId: string) => void;
  regenerateResponse?: (messageId: string) => void;
  isRegenerating?: boolean;
  codeTheme: 'dark' | 'light';
}

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: [0.2, 0.65, 0.3, 0.9]
    }
  },
  hover: { 
    y: -3,
    transition: { 
      duration: 0.2
    }
  }
};

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  index, 
  copied, 
  copyToClipboard,
  addReaction,
  openFeedbackModal,
  regenerateResponse,
  isRegenerating,
  codeTheme
}) => {
  const { t } = useTranslation('common');
  const [showActions, setShowActions] = useState(false);
  
  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const getModelIcon = (model: string) => {
    switch (model) {
      case 'gemini': return '🌟';
      case 'claude': return '🎭';
      case 'mistral': return '🌪️';
      case 'image-generator': return '🖼️';
      default: return '🤖';
    }
  };

  return (
    <motion.div 
      className={`${styles.message} ${styles[message.role]}`}
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={messageVariants}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      layout
    >
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <div className={styles.avatar}>
            {message.role === 'user' ? '👤' : getModelIcon(message.model)}
          </div>
          <div>{message.role === 'user' ? 'You' : message.model.charAt(0).toUpperCase() + message.model.slice(1)}</div>
          <div className={styles.timestamp}>{formattedTimestamp}</div>
          
          <button
            onClick={() => copyToClipboard(message.content, index)}
            className={styles.copyButton}
            aria-label={t('copy')}
            title={t('copy')}
          >
            {copied[index] ? '✓' : <FiCopy />}
          </button>
        </div>
        
        <div className={styles.textContent}>
          <ReactMarkdown
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match && match[1] ? match[1] : '';
                
                if (!inline && language) {
                  return (
                    <div data-language={language}>
                      <CodeBlock
                        language={language}
                        value={String(children).replace(/\n$/, '')}
                        theme={codeTheme}
                        {...props}
                      />
                    </div>
                  );
                }
                return <code className={className} {...props}>{children}</code>;
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {message.role === 'assistant' && addReaction && (
          <div className={styles.reactions}>
            {message.feedbackGiven && (
              <span className={styles.feedbackGiven}>
                {t('thanksFeedback')}
              </span>
            )}
            {!message.feedbackGiven && (
              <>
                <button
                  onClick={() => openFeedbackModal?.(message.id)}
                  className={styles.reactionButton}
                >
                  <FiThumbsUp />
                </button>
                <button
                  onClick={() => openFeedbackModal?.(message.id)}
                  className={styles.reactionButton}
                >
                  <FiThumbsDown />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {showActions && message.role === 'assistant' && (
        <motion.div 
          className={styles.messageActions}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {regenerateResponse && (
            <button 
              className={styles.actionIcon} 
              onClick={() => regenerateResponse(message.id)}
              disabled={isRegenerating}
              title={t('regenerate')}
            >
              <FiRefreshCw className={isRegenerating ? styles.spinning : ''} />
            </button>
          )}
          
          {openFeedbackModal && (
            <button 
              className={styles.actionIcon} 
              onClick={() => openFeedbackModal(message.id)}
              title={t('feedback')}
            >
              <FiMoreHorizontal />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MessageItem;
