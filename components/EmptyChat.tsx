import React from 'react';
import { FiMessageCircle, FiCode, FiFileText, FiImage } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../styles/Home.module.css';

const EmptyChat: React.FC = () => {
  const { t } = useTranslation('common');

  const quickStartOptions = [
    {
      title: t('askAnything'),
      icon: <FiMessageCircle />,
      description: 'Ask questions in natural language to get detailed answers',
      onClick: () => {},
    },
    {
      title: 'Code Assistance',
      icon: <FiCode />,
      description: 'Get help with coding, debugging and technical explanations',
      onClick: () => {},
    },
    {
      title: 'Explanations',
      icon: <FiFileText />,
      description: 'Get clear explanations of complex topics and concepts',
      onClick: () => {},
    },
    {
      title: 'Generate Images',
      icon: <FiImage />,
      description: 'Create images with text descriptions',
      onClick: () => {},
    },
  ];

  return (
    <div className={styles.emptyChat}>
      <div className={styles.welcomeMessage}>
        <h2 className={styles.welcomeTitle}>{t('welcomeTitle')}</h2>
        <p>{t('welcomeMessage')}</p>
        
        <div className={styles.quickStartContainer}>
          <AnimatePresence mode="sync">
            {quickStartOptions.map((option, index) => (
              <motion.div
                key={option.title}
                className={styles.quickStartCard}
                onClick={() => option.onClick()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className={styles.quickStartIcon}>{option.icon}</div>
                <h3 className={styles.quickStartTitle}>{option.title}</h3>
                <p className={styles.quickStartDesc}>{option.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className={styles.modelBadges}>
          <div className={styles.modelBadge}>
            <div className={styles.modelIcon}>🌟</div> Gemini
          </div>
          <div className={styles.modelBadge}>
            <div className={styles.modelIcon}>🎭</div> Claude
          </div>
          <div className={styles.modelBadge}>
            <div className={styles.modelIcon}>🌪️</div> Mistral
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
