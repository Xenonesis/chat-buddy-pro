import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/MessageSkeleton.module.css';

interface MessageSkeletonProps {
  theme: 'light' | 'dark';
}

const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ theme }) => {
  return (
    <motion.div 
      className={`${styles.skeletonContainer} ${styles[theme]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonAvatar}></div>
        <div className={styles.skeletonName}></div>
      </div>
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: '85%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '92%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '65%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '78%' }}></div>
        <div className={styles.skeletonCodeBlock}>
          <div className={styles.skeletonCodeHeader}></div>
          <div className={styles.skeletonCodeContent}>
            <div className={styles.skeletonCodeLine} style={{ width: '70%' }}></div>
            <div className={styles.skeletonCodeLine} style={{ width: '90%' }}></div>
            <div className={styles.skeletonCodeLine} style={{ width: '65%' }}></div>
            <div className={styles.skeletonCodeLine} style={{ width: '80%' }}></div>
          </div>
        </div>
        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '70%' }}></div>
      </div>
      <div className={styles.pulseEffect}></div>
    </motion.div>
  );
};

export default MessageSkeleton;
