import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiThumbsUp, FiThumbsDown, FiMoreHorizontal, FiRefreshCw, FiEdit, FiSave, FiX, FiClock } from 'react-icons/fi';
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
    edited?: boolean;
  };
  index: number;
  copied: {[key: number]: boolean};
  copyToClipboard: (text: string, index: number) => void;
  addReaction?: (messageId: string, reaction: string) => void;
  openFeedbackModal?: (messageId: string) => void;
  regenerateResponse?: (messageId: string) => void;
  editMessage?: (messageId: string, newContent: string) => void;
  isRegenerating?: boolean;
  codeTheme: 'dark' | 'light';
}

// Improved animation variants for smoother transitions
const messageVariants = {
  initial: { 
    opacity: 0, 
    y: 10, 
    scale: 0.98 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1], // Spring-like easing
      opacity: { duration: 0.15 }
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: { 
    y: -2,
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
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
  editMessage,
  isRegenerating,
  codeTheme
}) => {
  const { t } = useTranslation('common');
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check if device is touch-capable for better mobile interactions
  React.useEffect(() => {
    setIsTouchDevice(
      ('ontouchstart' in window) || 
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0)
    );
  }, []);
  
  // Enhanced timestamp formatting with both numerical and relative time
  const formattedTimestamp = useMemo(() => {
    const date = new Date(message.timestamp);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
    const diffDays = Math.floor(diffMinutes / 1440);
    
    // Format numerical time (HH:MM)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Convert to 12-hour format
    const numericalTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Get relative time string
    let relativeTime;
    if (diffMinutes < 1) {
      relativeTime = t('justNow');
    } else if (diffMinutes < 60) {
      relativeTime = t('minutesAgo', { count: diffMinutes });
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      relativeTime = t('hoursAgo', { count: hours });
    } else if (diffDays < 7) {
      // Show day of week for messages within the last week
      relativeTime = date.toLocaleDateString([], { 
        weekday: 'short',
      });
    } else {
      // Show date for older messages
      relativeTime = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
    
    // For messages more than a day old, also include the date
    let fullDate = '';
    if (diffDays >= 1) {
      fullDate = `${date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })} · `;
    }
    
    return {
      relativeTime,
      numericalTime,
      fullDate
    };
  }, [message.timestamp, t]);
  
  const getModelIcon = (model: string) => {
    switch (model) {
      case 'gemini': return '🌟';
      case 'claude': return '🎭';
      case 'mistral': return '🌪️';
      case 'image-generator': return '🖼️';
      default: return '🤖';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleSave = () => {
    if (editMessage && editedContent.trim() !== '' && editedContent !== message.content) {
      editMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  // Handle tap events for mobile devices
  const handleMessageTap = () => {
    if (isTouchDevice) {
      setShowActions(!showActions);
    }
  };

  return (
    <motion.div 
      className={`${styles.message} ${styles[message.role]}`}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={!isTouchDevice ? "hover" : undefined}
      variants={messageVariants}
      onMouseEnter={() => !isTouchDevice && setShowActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowActions(false)}
      onClick={handleMessageTap}
      layout
    >
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <div className={styles.avatar}>
            {message.role === 'user' ? '👤' : getModelIcon(message.model)}
          </div>
          <div>
            {message.role === 'user' 
              ? 'You' 
              : message.model.charAt(0).toUpperCase() + message.model.slice(1)
            }
            {message.edited && (
              <span className={styles.editedBadge}>
                {t('editedMessage')}
              </span>
            )}
          </div>
          <div className={styles.timestamp}>
            <FiClock className={styles.timestampIcon} />
            <div className={styles.timestampContent}>
              <span className={styles.relativeTime}>{formattedTimestamp.relativeTime}</span>
              <span className={styles.numericalTime}>{formattedTimestamp.fullDate}{formattedTimestamp.numericalTime}</span>
            </div>
          </div>
          
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
          {isEditing ? (
            <div className={styles.editContainer}>
              <textarea
                className={styles.editTextarea}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                autoFocus
              />
              <div className={styles.editButtons}>
                <button onClick={handleSave} className={styles.saveButton}>
                  <FiSave /> {t('save')}
                </button>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  <FiX /> {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
        
        {message.role === 'assistant' && addReaction && !isEditing && (
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
      
      {showActions && !isEditing && (
        <motion.div 
          className={styles.messageActions}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {message.role === 'user' && editMessage && (
            <button 
              className={styles.actionIcon} 
              onClick={handleEdit}
              title={t('edit')}
              aria-label={t('edit')}
            >
              <FiEdit />
            </button>
          )}
          
          {message.role === 'assistant' && regenerateResponse && (
            <button 
              className={`${styles.actionIcon} ${isRegenerating ? styles.spinning : ''}`}
              onClick={() => regenerateResponse(message.id)}
              disabled={isRegenerating}
              title={t('regenerate')}
              aria-label={t('regenerate')}
            >
              <FiRefreshCw />
            </button>
          )}
          
          {message.role === 'assistant' && openFeedbackModal && (
            <button 
              className={styles.actionIcon} 
              onClick={() => openFeedbackModal(message.id)}
              title={t('provideFeedback')}
              aria-label={t('provideFeedback')}
            >
              <FiThumbsUp />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MessageItem;
