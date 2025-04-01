import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/MessageSkeleton.module.css';

interface MessageSkeletonProps {
  theme: 'light' | 'dark';
}

const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ theme }) => {
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={`${styles.skeleton} ${styles[theme]}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.avatar}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.model}></div>
          <div className={styles.time}></div>
        </div>
        <div className={styles.lines}>
          <div className={styles.line} style={{ width: '90%' }}></div>
          <div className={styles.line} style={{ width: '65%' }}></div>
          <div className={styles.line} style={{ width: '80%' }}></div>
          <div className={styles.typing}>
            {`Thinking${dots}`}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageSkeleton;
