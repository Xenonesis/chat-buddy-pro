import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { MessageProvider } from '../context/MessageContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AnimatedBackground from './AnimatedBackground';
import OnboardingModal from './OnboardingModal';
import ThemeToggle from './ThemeToggle';
import { checkStorageAvailability } from '../utils/storageHelpers';

interface AppWrapperProps {
  children: React.ReactNode;
  title?: string;
}

// Inner component that uses the theme context
const AppContent: React.FC<AppWrapperProps> = ({ children, title = 'Buddy Chat' }) => {
  const { t } = useTranslation('common');
  const { theme, storageAvailable } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  
  useEffect(() => {
    if (storageAvailable) {
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem('buddychat_hasSeenOnboarding');
      setShowOnboarding(!hasSeenOnboarding);
    }
  }, [storageAvailable]);
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (storageAvailable) {
      localStorage.setItem('buddychat_hasSeenOnboarding', 'true');
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Chat with multiple AI models" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AnimatedBackground theme={theme} />
      
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      
      {!storageAvailable && (
        <div className="storageWarning">
          {t('storageUnavailable')}
        </div>
      )}
      
      <div className="app-container">
        <div className="app-header">
          <ThemeToggle />
        </div>
        <main className="app-main">
          {children}
        </main>
      </div>
    </>
  );
};

// Main wrapper component that provides contexts
const AppWrapper: React.FC<AppWrapperProps> = (props) => {
  return (
    <ThemeProvider>
      <MessageProvider>
        <AppContent {...props} />
      </MessageProvider>
    </ThemeProvider>
  );
};

export default AppWrapper;
