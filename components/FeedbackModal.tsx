import React, { useState } from 'react';
import { FiX, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import styles from '../styles/Home.module.css';

interface FeedbackModalProps {
  messageId: string;
  onClose: () => void;
  onSubmit: (messageId: string, feedback: string, comment: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  messageId,
  onClose,
  onSubmit 
}) => {
  const { t } = useTranslation('common');
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (selectedFeedback) {
      onSubmit(messageId, selectedFeedback, comment);
      onClose();
    }
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.feedbackModal} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>{t('provideFeedback')}</h3>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        
        <div className={styles.feedbackOptions}>
          <button
            className={`${styles.feedbackOption} ${selectedFeedback === 'helpful' ? styles.selected : ''}`}
            onClick={() => setSelectedFeedback('helpful')}
          >
            <FiThumbsUp />
            {t('helpful')}
          </button>
          
          <button
            className={`${styles.feedbackOption} ${selectedFeedback === 'unhelpful' ? styles.selected : ''}`}
            onClick={() => setSelectedFeedback('unhelpful')}
          >
            <FiThumbsDown />
            {t('unhelpful')}
          </button>
        </div>
        
        <textarea
          className={styles.feedbackTextarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('feedbackPlaceholder')}
          rows={4}
        />
        
        <div className={styles.modalButtons}>
          <button 
            onClick={onClose}
            className={styles.cancelButton}
          >
            {t('cancel')}
          </button>
          
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={!selectedFeedback}
          >
            {t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
