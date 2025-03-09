import React from 'react';
import { FiTrash2, FiDownload, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import styles from '../styles/DataManagement.module.css';
import { STORAGE_KEYS, removeFromStorage } from '../utils/storage';

interface DataManagementProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearChat: () => void;
  onClearAllData: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({
  onExport,
  onImport,
  onClearChat,
  onClearAllData
}) => {
  const { t } = useTranslation('common');
  
  const handleClearAllData = () => {
    if (window.confirm(t('clearAllDataConfirmation'))) {
      // Clear all application data
      Object.values(STORAGE_KEYS).forEach(key => {
        removeFromStorage(key);
      });
      
      // Call parent handler for state updates
      onClearAllData();
      
      // Show confirmation
      alert(t('dataCleared'));
      
      // Reload page to reset application state
      window.location.reload();
    }
  };
  
  return (
    <div className={styles.container}>
      <h3>{t('dataManagement')}</h3>
      <div className={styles.dataControlsGrid}>
        <button onClick={onExport} className={styles.exportButton}>
          <FiDownload /> {t('export')}
        </button>
        
        <label className={styles.importButton}>
          <FiUpload /> {t('import')}
          <input type="file" onChange={onImport} accept=".json" hidden />
        </label>
        
        <button onClick={onClearChat} className={styles.clearButton}>
          <FiRefreshCw /> {t('clear')}
        </button>
        
        <button onClick={handleClearAllData} className={styles.dangerButton}>
          <FiTrash2 /> {t('clearAllData')}
        </button>
      </div>
    </div>
  );
};

export default DataManagement;
