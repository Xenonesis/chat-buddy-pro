import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import styles from '../styles/CookieConsent.module.css';

const CookieConsent: React.FC = () => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookiesAccepted');
    if (!hasConsented) {
      // Wait a moment before showing the banner
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.content}>
        <p className={styles.message}>
          {t('cookieMessage')}
        </p>
        <div className={styles.actions}>
          <button 
            className={styles.declineButton}
            onClick={handleDecline}
          >
            {t('decline')}
          </button>
          <button 
            className={styles.acceptButton}
            onClick={handleAccept}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CookieConsent;
