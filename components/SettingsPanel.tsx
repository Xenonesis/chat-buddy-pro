import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { FiX, FiMoon, FiSun, FiMonitor, FiKey, FiDownload, FiUpload, FiTrash2, FiAlertTriangle, FiEye, FiEyeOff, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Home.module.css';
import { useBreakpoint, useTouchDevice, useiOSDevice } from '../utils/responsive';
import DataManagement from './DataManagement';

interface SettingsPanelProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    codeTheme: 'dark' | 'light';
    autoScroll: boolean;
    sendWithEnter: boolean;
    apiKeys: {
      gemini: string;
      claude: string;
      mistral: string;
    };
  };
  onSettingChange: (setting: string, value: any) => void;
  onClose: () => void;
  onExportChat: () => void;
  onImportChat: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearChat: () => void;
  onClearAllData: () => void;
  currentMessages?: any[]; // Add this prop
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingChange,
  onClose,
  onExportChat,
  onImportChat,
  onClearChat,
  onClearAllData,
  currentMessages = [] // Default to empty array
}) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<string>('appearance');
  const { isMobile } = useBreakpoint();
  const isTouchDevice = useTouchDevice();
  const isiOS = useiOSDevice();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Handle swipe gestures for tab switching
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    // Detect vertical scrolling
    const touchY = e.targetTouches[0].clientY;
    const target = e.currentTarget;
    if (Math.abs(touchY - target.scrollTop) > 10) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isScrolling) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    const tabs = ['appearance', 'behavior', 'models', 'apikeys', 'data'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
    
    // Reset touch tracking
    setTouchStart(null);
    setTouchEnd(null);
    setIsScrolling(false);
  };

  // Add safe area padding for iOS devices
  useEffect(() => {
    if (isiOS) {
      document.documentElement.style.setProperty(
        '--settings-bottom-padding',
        'env(safe-area-inset-bottom)'
      );
    }
    return () => {
      document.documentElement.style.removeProperty('--settings-bottom-padding');
    };
  }, [isiOS]);

  // Animation variants for mobile transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div 
      className={`${styles.settingsPanel} ${isMobile ? styles.settingsPanelMobile : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div 
        className={styles.settingsHeader}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isMobile && (
          <button 
            className={styles.backButton}
            onClick={onClose}
            aria-label={t('back')}
          >
            <FiChevronLeft />
          </button>
        )}
        <h3>{t('settings')}</h3>
        {!isMobile && (
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('close')}
          >
            <FiX />
          </button>
        )}
      </motion.div>

      <div className={`${styles.settingsTabs} ${isMobile ? styles.settingsTabsMobile : ''}`}>
        <div className={styles.tabsScroller}>
          <button
            className={`${styles.tabButton} ${activeTab === 'appearance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            {t('appearance')}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'behavior' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('behavior')}
          >
            {t('behavior')}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'apikeys' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('apikeys')}
          >
            {t('apiKeys')}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'data' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('data')}
          >
            {t('dataManagement')}
          </button>
        </div>
        {isMobile && (
          <div className={styles.tabIndicators}>
            {['appearance', 'behavior', 'models', 'apikeys', 'data'].map((tab) => (
              <div 
                key={tab}
                className={`${styles.tabIndicator} ${activeTab === tab ? styles.activeIndicator : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" custom={isMobile}>
        <motion.div
          key={activeTab}
          custom={activeTab}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className={`${styles.settingsContent} ${isMobile ? styles.settingsContentMobile : ''}`}
        >
          {activeTab === 'appearance' && (
            <>
              <div className={styles.settingItem}>
                <label>{t('theme')}</label>
                <div>
                  <button 
                    className={`${styles.themeOption} ${settings.theme === 'light' ? styles.activeTheme : ''}`}
                    onClick={() => onSettingChange('theme', 'light')}
                  >
                    <FiSun /> {t('lightMode')}
                  </button>
                  <button 
                    className={`${styles.themeOption} ${settings.theme === 'dark' ? styles.activeTheme : ''}`}
                    onClick={() => onSettingChange('theme', 'dark')}
                  >
                    <FiMoon /> {t('darkMode')}
                  </button>
                  <button 
                    className={`${styles.themeOption} ${settings.theme === 'system' ? styles.activeTheme : ''}`}
                    onClick={() => onSettingChange('theme', 'system')}
                  >
                    <FiMonitor /> {t('systemPreference')}
                  </button>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <label>{t('fontSize')}</label>
                <div className={styles.sliderWithLabels}>
                  <span className={styles.sliderLabel}>Aa</span>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={settings.fontSize}
                    onChange={(e) => onSettingChange('fontSize', parseInt(e.target.value))}
                  />
                  <span className={styles.sliderLabel}>Aa</span>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <label>{t('codeTheme')}</label>
                <select 
                  value={settings.codeTheme} 
                  onChange={(e) => onSettingChange('codeTheme', e.target.value)}
                >
                  <option value="dark">{t('dark')}</option>
                  <option value="light">{t('light')}</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'behavior' && (
            <>
              <div className={styles.settingItem}>
                <label>{t('autoScroll')}</label>
                <label className={styles.toggle}>
                  <input 
                    type="checkbox" 
                    checked={settings.autoScroll}
                    onChange={(e) => onSettingChange('autoScroll', e.target.checked)}
                  />
                  <span className={styles.toggleLabel}></span>
                </label>
              </div>
              
              <div className={styles.settingItem}>
                <label>{t('sendWithEnter')}</label>
                <label className={styles.toggle}>
                  <input 
                    type="checkbox" 
                    checked={settings.sendWithEnter}
                    onChange={(e) => onSettingChange('sendWithEnter', e.target.checked)}
                  />
                  <span className={styles.toggleLabel}></span>
                </label>
              </div>
            </>
          )}

          {activeTab === 'apikeys' && (
            <>
              <div className={styles.apiKeysInfo}>
                <p>{t('apiKeysDescription')}</p>
              </div>

              <div className={styles.settingItem}>
                <label>{t('geminiApiKey')}</label>
                <div className={styles.apiKeyInput}>
                  <input
                    type="password"
                    value={settings.apiKeys.gemini || ''}
                    onChange={(e) => onSettingChange('apiKeys', { 
                      ...settings.apiKeys, 
                      gemini: e.target.value 
                    })}
                    placeholder={t('enterApiKey')}
                  />
                  {settings.apiKeys.gemini && (
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => onSettingChange('apiKeys', { 
                        ...settings.apiKeys, 
                        gemini: '' 
                      })}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.settingItem}>
                <label>{t('claudeApiKey')}</label>
                <div className={styles.apiKeyInput}>
                  <input
                    type="password"
                    value={settings.apiKeys.claude || ''}
                    onChange={(e) => onSettingChange('apiKeys', { 
                      ...settings.apiKeys, 
                      claude: e.target.value 
                    })}
                    placeholder={t('enterApiKey')}
                  />
                  {settings.apiKeys.claude && (
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => onSettingChange('apiKeys', { 
                        ...settings.apiKeys, 
                        claude: '' 
                      })}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.settingItem}>
                <label>{t('mistralApiKey')}</label>
                <div className={styles.apiKeyInput}>
                  <input
                    type="password"
                    value={settings.apiKeys.mistral || ''}
                    onChange={(e) => onSettingChange('apiKeys', { 
                      ...settings.apiKeys, 
                      mistral: e.target.value 
                    })}
                    placeholder={t('enterApiKey')}
                  />
                  {settings.apiKeys.mistral && (
                    <button 
                      className={styles.clearApiKey}
                      onClick={() => onSettingChange('apiKeys', { 
                        ...settings.apiKeys, 
                        mistral: '' 
                      })}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.apiKeysTip}>
                <p>{t('apiKeysSecurity')}</p>
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <DataManagement
              onExport={onExportChat}
              onImport={onImportChat}
              onClearChat={onClearChat}
              onClearAllData={onClearAllData}
              currentMessages={currentMessages} // Pass the messages
            />
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div 
        className={styles.settingsFooter}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Add mobile-specific action buttons */}
        {isMobile ? (
          <div className={styles.mobileActions}>
            <button onClick={onClearChat} className={styles.mobileActionButton}>
              <FiTrash2 />
              <span>{t('clearChat')}</span>
            </button>
            <button onClick={onExportChat} className={styles.mobileActionButton}>
              <FiDownload />
              <span>{t('export')}</span>
            </button>
            <label className={styles.mobileActionButton}>
              <FiUpload />
              <span>{t('import')}</span>
              <input 
                type="file" 
                onChange={onImportChat} 
                accept=".json" 
                hidden 
              />
            </label>
          </div>
        ) : (
          <button 
            className={styles.resetButton}
            onClick={() => {
              if (window.confirm(t('resetConfirmation'))) {
                onClearAllData();
              }
            }}
          >
            {t('resetToDefaults')}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsPanel;
