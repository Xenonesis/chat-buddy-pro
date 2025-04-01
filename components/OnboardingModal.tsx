import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiLayers, FiSettings, FiX } from 'react-icons/fi';
import styles from '../styles/Home.module.css';

interface OnboardingModalProps {
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { t } = useTranslation('common');
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getStepIcon = (currentStep: number) => {
    switch (currentStep) {
      case 1: return <FiMessageCircle className={styles.modalStepIcon} />;
      case 2: return <FiLayers className={styles.modalStepIcon} />;
      case 3: return <FiSettings className={styles.modalStepIcon} />;
      default: return null;
    }
  };

  const getStepContent = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return {
          title: t('welcomeToChat'),
          description: t('onboardingStep1')
        };
      case 2:
        return {
          title: t('modelOptions'),
          description: t('onboardingStep2')
        };
      case 3:
        return {
          title: t('customizeExperience'),
          description: t('onboardingStep3')
        };
      default:
        return { title: '', description: '' };
    }
  };

  const content = getStepContent(step);

  return (
    <div className={styles.onboardingModal}>
      <div className={styles.modalContent}>
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={styles.modalStep}
        >
          <div className={styles.modalStepNumber}>{step}</div>
          
          <div className={styles.modalStepProgress}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index} 
                className={`${styles.modalStepDot} ${index + 1 <= step ? styles.active : ''}`}
              />
            ))}
          </div>
          
          {getStepIcon(step)}
          <h2>{content.title}</h2>
          <p>{content.description}</p>

          <div className={styles.modalButtons}>
            {step > 1 ? (
              <button onClick={handleBack}>{t('back')}</button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            <button 
              onClick={handleNext} 
              className={step === totalSteps ? styles.primaryButton : ''}
            >
              {step === totalSteps ? t('getStarted') : t('next')}
            </button>
          </div>
        </motion.div>
        
        <button 
          className={styles.closeButton}
          onClick={onComplete}
          aria-label="Close"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
