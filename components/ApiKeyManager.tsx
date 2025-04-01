import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { FiKey, FiEye, FiEyeOff, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from '../styles/ApiKeyManager.module.css';

interface ApiKeyManagerProps {
  apiKeys: {
    gemini: string;
    claude: string;
    mistral: string;
  };
  onUpdateApiKeys: (newKeys: {
    gemini: string;
    claude: string;
    mistral: string;
  }) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, onUpdateApiKeys }) => {
  const { t } = useTranslation('common');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    gemini: false,
    claude: false,
    mistral: false
  });
  
  const [validationStatus, setValidationStatus] = useState<{
    [key: string]: 'idle' | 'validating' | 'valid' | 'invalid'
  }>({
    gemini: 'idle',
    claude: 'idle',
    mistral: 'idle'
  });

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleKeyChange = (key: string, value: string) => {
    onUpdateApiKeys({
      ...apiKeys,
      [key]: value
    });
    setValidationStatus(prev => ({
      ...prev,
      [key]: value ? 'idle' : 'idle'
    }));
  };

  const clearKey = (key: string) => {
    onUpdateApiKeys({
      ...apiKeys,
      [key]: ''
    });
    setValidationStatus(prev => ({
      ...prev,
      [key]: 'idle'
    }));
  };

  const validateKey = async (key: string) => {
    if (!apiKeys[key as keyof typeof apiKeys]) return;

    setValidationStatus(prev => ({
      ...prev,
      [key]: 'validating'
    }));

    try {
      // Mock validation - in a real app, this would call a test endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Random for demo purposes - would be based on API response in real app
      const isValid = Math.random() > 0.3;
      
      setValidationStatus(prev => ({
        ...prev,
        [key]: isValid ? 'valid' : 'invalid'
      }));
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [key]: 'invalid'
      }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoBox}>
        <div className={styles.infoIcon}><FiKey /></div>
        <p>{t('apiKeysDescription')}</p>
      </div>

      <div className={styles.keySection}>
        <h4 className={styles.keyTitle}>
          <span className={styles.modelLogo}>🌟</span> 
          Google Gemini
        </h4>
        <div className={styles.keyInput}>
          <input 
            type={showKeys.gemini ? "text" : "password"} 
            value={apiKeys.gemini}
            onChange={(e) => handleKeyChange('gemini', e.target.value)}
            placeholder={t('enterApiKey')}
          />
          
          <div className={styles.keyControls}>
            {apiKeys.gemini && validationStatus.gemini !== 'validating' && (
              <button 
                onClick={() => validateKey('gemini')}
                className={styles.validateButton}
                title={t('validateKey')}
              >
                {validationStatus.gemini === 'valid' && <FiCheckCircle className={styles.validIcon} />}
                {validationStatus.gemini === 'invalid' && <FiAlertCircle className={styles.invalidIcon} />}
                {validationStatus.gemini === 'idle' && t('verify')}
              </button>
            )}
            
            {validationStatus.gemini === 'validating' && (
              <div className={styles.spinner}></div>
            )}
            
            {apiKeys.gemini && (
              <button 
                className={styles.iconButton} 
                onClick={() => toggleKeyVisibility('gemini')}
                title={showKeys.gemini ? t('hideKey') : t('showKey')}
              >
                {showKeys.gemini ? <FiEyeOff /> : <FiEye />}
              </button>
            )}
            
            {apiKeys.gemini && (
              <button 
                className={styles.iconButton} 
                onClick={() => clearKey('gemini')}
                title={t('clearKey')}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.keyHint}>
          <a 
            href="https://ai.google.dev/tutorials/setup" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.getKeyLink}
          >
            {t('getGeminiKey')}
          </a>
        </div>
      </div>

      <div className={styles.keySection}>
        <h4 className={styles.keyTitle}>
          <span className={styles.modelLogo}>🎭</span> 
          Anthropic Claude
        </h4>
        <div className={styles.keyInput}>
          <input 
            type={showKeys.claude ? "text" : "password"} 
            value={apiKeys.claude}
            onChange={(e) => handleKeyChange('claude', e.target.value)}
            placeholder={t('enterApiKey')}
          />
          
          <div className={styles.keyControls}>
            {apiKeys.claude && validationStatus.claude !== 'validating' && (
              <button 
                onClick={() => validateKey('claude')}
                className={styles.validateButton}
                title={t('validateKey')}
              >
                {validationStatus.claude === 'valid' && <FiCheckCircle className={styles.validIcon} />}
                {validationStatus.claude === 'invalid' && <FiAlertCircle className={styles.invalidIcon} />}
                {validationStatus.claude === 'idle' && t('verify')}
              </button>
            )}
            
            {validationStatus.claude === 'validating' && (
              <div className={styles.spinner}></div>
            )}
            
            {apiKeys.claude && (
              <button 
                className={styles.iconButton} 
                onClick={() => toggleKeyVisibility('claude')}
                title={showKeys.claude ? t('hideKey') : t('showKey')}
              >
                {showKeys.claude ? <FiEyeOff /> : <FiEye />}
              </button>
            )}
            
            {apiKeys.claude && (
              <button 
                className={styles.iconButton} 
                onClick={() => clearKey('claude')}
                title={t('clearKey')}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.keyHint}>
          <a 
            href="https://console.anthropic.com/account/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.getKeyLink}
          >
            {t('getClaudeKey')}
          </a>
        </div>
      </div>

      <div className={styles.keySection}>
        <h4 className={styles.keyTitle}>
          <span className={styles.modelLogo}>🌪️</span> 
          Mistral AI
        </h4>
        <div className={styles.keyInput}>
          <input 
            type={showKeys.mistral ? "text" : "password"} 
            value={apiKeys.mistral}
            onChange={(e) => handleKeyChange('mistral', e.target.value)}
            placeholder={t('enterApiKey')}
          />
          
          <div className={styles.keyControls}>
            {apiKeys.mistral && validationStatus.mistral !== 'validating' && (
              <button 
                onClick={() => validateKey('mistral')}
                className={styles.validateButton}
                title={t('validateKey')}
              >
                {validationStatus.mistral === 'valid' && <FiCheckCircle className={styles.validIcon} />}
                {validationStatus.mistral === 'invalid' && <FiAlertCircle className={styles.invalidIcon} />}
                {validationStatus.mistral === 'idle' && t('verify')}
              </button>
            )}
            
            {validationStatus.mistral === 'validating' && (
              <div className={styles.spinner}></div>
            )}
            
            {apiKeys.mistral && (
              <button 
                className={styles.iconButton} 
                onClick={() => toggleKeyVisibility('mistral')}
                title={showKeys.mistral ? t('hideKey') : t('showKey')}
              >
                {showKeys.mistral ? <FiEyeOff /> : <FiEye />}
              </button>
            )}
            
            {apiKeys.mistral && (
              <button 
                className={styles.iconButton} 
                onClick={() => clearKey('mistral')}
                title={t('clearKey')}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.keyHint}>
          <a 
            href="https://console.mistral.ai/api-keys/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.getKeyLink}
          >
            {t('getMistralKey')}
          </a>
        </div>
      </div>

      <div className={styles.securityNote}>
        <p>{t('apiKeysSecurity')}</p>
      </div>
    </div>
  );
};

export default ApiKeyManager;
