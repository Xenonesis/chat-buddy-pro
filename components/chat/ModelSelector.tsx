import React from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import styles from '../../styles/Home.module.css';

const ModelSelector: React.FC = () => {
  const { model, setModel, settings, setSettings } = useChatContext();

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setSettings(prev => ({
      ...prev,
      defaultModel: newModel
    }));
  };

  const getModelIcon = (modelName: string): string => {
    switch (modelName) {
      case 'gemini': return '🌟';
      case 'claude': return '🎭';
      case 'mistral': return '🌪️';
      default: return '🤖';
    }
  };

  return (
    <div className={styles.modelSelector}>
      <button
        className={`${styles.modelButton} ${model === 'gemini' ? styles.activeModel : ''}`}
        onClick={() => handleModelChange('gemini')}
      >
        <span className={styles.modelIcon}>{getModelIcon('gemini')}</span>
        <span>Gemini</span>
      </button>
      <button
        className={`${styles.modelButton} ${model === 'claude' ? styles.activeModel : ''}`}
        onClick={() => handleModelChange('claude')}
      >
        <span className={styles.modelIcon}>{getModelIcon('claude')}</span>
        <span>Claude</span>
      </button>
      <button
        className={`${styles.modelButton} ${model === 'mistral' ? styles.activeModel : ''}`}
        onClick={() => handleModelChange('mistral')}
      >
        <span className={styles.modelIcon}>{getModelIcon('mistral')}</span>
        <span>Mistral</span>
      </button>
    </div>
  );
};

export default ModelSelector;
