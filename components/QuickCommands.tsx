import React from 'react';
import { useTranslation } from 'next-i18next';
import { 
  FiCode, 
  FiSearch, 
  FiBriefcase, 
  FiFileText, 
  FiZap, 
  FiList,
  FiAlertCircle,
  FiBarChart2
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../styles/QuickCommands.module.css';

interface QuickCommandsProps {
  onSelectCommand: (template: string) => void;
}

const QuickCommands: React.FC<QuickCommandsProps> = ({ onSelectCommand }) => {
  const { t } = useTranslation('common');
  
  const commands = [
    {
      id: 'explain',
      name: t('explainCommand'),
      template: t('explainTemplate'),
      icon: <FiSearch />
    },
    {
      id: 'code',
      name: t('codeCommand'),
      template: t('codeTemplate'),
      icon: <FiCode />
    },
    {
      id: 'compare',
      name: t('compareCommand'),
      template: t('compareTemplate'),
      icon: <FiBarChart2 />
    },
    {
      id: 'summarize',
      name: t('summarizeCommand'),
      template: t('summarizeTemplate'),
      icon: <FiFileText />
    },
    {
      id: 'brainstorm',
      name: t('brainstormCommand'),
      template: t('brainstormTemplate'),
      icon: <FiZap />
    },
    {
      id: 'plan',
      name: t('planCommand'),
      template: t('planTemplate'),
      icon: <FiList />
    },
    {
      id: 'debug',
      name: t('debugCommand'),
      template: t('debugTemplate'),
      icon: <FiAlertCircle />
    },
    {
      id: 'analyze',
      name: t('analyzeCommand'),
      template: t('analyzeTemplate'),
      icon: <FiBriefcase />
    }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('quickCommands')}</h3>
      <p className={styles.description}>{t('quickCommandsDescription')}</p>
      
      <div className={styles.commandsGrid}>
        <AnimatePresence mode="sync">
          {commands.map((command) => (
            <motion.button
              key={command.id}
              className={styles.commandCard}
              onClick={() => onSelectCommand(command.template)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.commandIcon}>{command.icon}</div>
              <div className={styles.commandContent}>
                <div className={styles.commandName}>{command.name}</div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuickCommands;
