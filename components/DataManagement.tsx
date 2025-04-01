import React, { useState, useEffect } from 'react';
import { FiTrash2, FiDownload, FiUpload, FiRefreshCw, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import styles from '../styles/DataManagement.module.css';
import { STORAGE_KEYS, loadFromStorage } from '../utils/storage';
import jsPDF from 'jspdf';

interface DataManagementProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearChat: () => void;
  onClearAllData: () => void;
  currentMessages?: any[]; // Accept current messages as a prop
  onClose?: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({
  onExport,
  onImport,
  onClearChat,
  onClearAllData,
  currentMessages = [], // Default to empty array
  onClose
}) => {
  const { t } = useTranslation('common');
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [messageSource, setMessageSource] = useState<string>('');
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Check message availability on mount for debugging
  useEffect(() => {
    const storedMessages = loadFromStorage(STORAGE_KEYS.MESSAGES, []);
    const propsCount = currentMessages?.length || 0;
    const storageCount = storedMessages?.length || 0;
    
    // Update debug info without relying on context
    setDebugInfo(`Messages - Props: ${propsCount}, Storage: ${storageCount}`);
  }, [currentMessages]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPdf();
    } else {
      onExport();
    }
  };

  const exportToPdf = async () => {
    try {
      setIsExporting(true);
      setExportProgress(5);
      setMessageSource('');
      
      // Step 1: Get messages with better error handling
      let messages;
      let source;
      
      try {
        const result = await fetchMessages();
        messages = result.messages;
        source = result.source;
        setExportProgress(15);
      } catch (error) {
        console.error("Error fetching messages:", error);
        showNotification('error', t('noMessagesToExport'));
        setIsExporting(false);
        return;
      }
      
      if (!messages || messages.length === 0) {
        showNotification('error', t('noMessagesToExport'));
        setIsExporting(false);
        return;
      }

      setMessageSource(source);
      
      // Step 2: Create PDF document with better styling
      setExportProgress(25);
      const doc = createPdfDocument();
      
      // Step 3: Add header and metadata
      setExportProgress(35);
      let yPos = addPdfHeader(doc, messages.length, source);
      
      // Step 4: Process messages with batching for performance
      await processPdfMessages(doc, messages, yPos);
      
      // Step 5: Save the PDF
      setExportProgress(95);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`chat-export-${timestamp}.pdf`);
      
      // Step 6: Complete and notify
      setExportProgress(100);
      showNotification('success', t('exportSuccess'));
      console.log(`✅ Successfully exported ${messages.length} messages to PDF`);
      
    } catch (error) {
      console.error('❌ Error exporting to PDF:', error);
      showNotification('error', t('exportError'));
    } finally {
      setIsExporting(false);
      // Reset progress after a delay so user can see it completed
      setTimeout(() => setExportProgress(0), 500);
    }
  };

  const fetchMessages = async () => {
    let messages: any[] = [];
    let source = '';
    
    return new Promise<{ messages: any[], source: string }>((resolve, reject) => {
      // Try currentMessages prop first
      if (Array.isArray(currentMessages) && currentMessages.length > 0) {
        messages = currentMessages;
        source = 'props';
        console.log(`✅ Using ${messages.length} messages from props`);
        resolve({ messages, source });
        return;
      }
      
      // Fall back to storage
      try {
        const storedMessages = loadFromStorage(STORAGE_KEYS.MESSAGES, []);
        if (Array.isArray(storedMessages) && storedMessages.length > 0) {
          messages = storedMessages;
          source = 'storage';
          console.log(`✅ Using ${messages.length} messages from local storage`);
          resolve({ messages, source });
          return;
        }
      } catch (storageError) {
        console.error("❌ Error loading from storage:", storageError);
      }
      
      // If we reach here, try to create a fallback message
      console.log("⚠️ No messages found, creating fallback message");
      const fallbackMessage = [{
        id: 'fallback-message',
        role: 'assistant',
        model: 'system',
        content: t('noMessagesToExport'),
        timestamp: Date.now()
      }];
      
      // Resolve with the fallback but set a flag to indicate it's not real data
      resolve({ 
        messages: [], // Return empty array to trigger the noMessagesToExport notification
        source: 'none' 
      });
    });
  };

  const createPdfDocument = () => {
    return new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
  };

  const addPdfHeader = (doc: jsPDF, messageCount: number, source: string) => {
    let yPos = 20; // Starting y position
    const margin = 20;
    
    // Add title with styling
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 112, 243);
    doc.text('Chat Export', margin, yPos);
    yPos += 12;
    
    // Add horizontal line
    doc.setDrawColor(0, 112, 243);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
    yPos += 10;
    
    // Add export date and metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleString();
    doc.text(`Exported on: ${dateStr}`, margin, yPos);
    yPos += 5;
    doc.text(`Source: ${source}`, margin, yPos);
    yPos += 5;
    doc.text(`Total messages: ${messageCount}`, margin, yPos);
    yPos += 10;
    
    // Reset text color for message content
    doc.setTextColor(0, 0, 0);
    
    return yPos;
  };

  const processPdfMessages = async (doc: jsPDF, messages: any[], startYPos: number) => {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - (margin * 2);
    let yPos = startYPos;
    
    // Process messages in batches for better performance
    const BATCH_SIZE = 10;
    const totalBatches = Math.ceil(messages.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Update progress for each batch
      setExportProgress(35 + Math.floor((batchIndex / totalBatches) * 60));
      
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, messages.length);
      const messageBatch = messages.slice(startIdx, endIdx);
      
      // Process current batch
      for (let i = 0; i < messageBatch.length; i++) {
        const msg = messageBatch[i];
        const globalIndex = startIdx + i;
        
        // Skip invalid messages
        if (!msg) continue;
        
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
          
          // Add subtle page number at bottom
          const pageNumber = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${pageNumber}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
        
        // Format and add the sender info
        const role = msg.role || 'unknown';
        const senderName = role === 'user' ? 'You' : (msg.model || 'Assistant');
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
        
        // Style based on role
        if (role === 'user') {
          doc.setFillColor(240, 249, 255); // Light blue for user
        } else {
          doc.setFillColor(255, 255, 255); // White for assistant
        }
        
        // Draw message bubble background
        doc.roundedRect(margin - 5, yPos - 5, textWidth + 10, 20, 3, 3, 'F');
        
        // Add role/sender with formatting
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        if (role === 'user') {
          doc.setTextColor(0, 112, 243); // Blue for user
        } else {
          doc.setTextColor(52, 73, 94); // Dark slate for assistant
        }
        
        doc.text(`${senderName}${timestamp ? ` (${timestamp})` : ''}:`, margin, yPos + 5);
        yPos += 15;
        
        // Handle message content with proper word wrapping
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Process content safely
        const content = formatMessageContent(msg);
        
        if (content) {
          // Split text to fit the available width
          const splitText = doc.splitTextToSize(content, textWidth);
          
          // We'll use a content box for better visual separation
          const contentHeight = splitText.length * 5 + 10;
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(margin, yPos, textWidth, contentHeight, 2, 2, 'F');
          
          // Add text with a small offset
          doc.text(splitText, margin + 3, yPos + 6);
          yPos += contentHeight + 5;
        } else {
          doc.text("Empty message", margin + 3, yPos + 6);
          yPos += 15;
        }
        
        // Add separator between messages
        if (globalIndex < messages.length - 1) {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 10;
        }
      }
      
      // Small delay to prevent UI freezing and allow progress updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  };

  const formatMessageContent = (msg: any): string => {
    try {
      if (typeof msg.content === 'string') {
        return msg.content.trim();
      } else if (msg.content && typeof msg.content === 'object') {
        return JSON.stringify(msg.content, null, 2);
      }
    } catch (e) {
      console.error("Error formatting message content:", e);
    }
    
    return "No content";
  };

  const handleClearAllData = () => {
    if (window.confirm(t('clearAllDataConfirmation'))) {
      onClearAllData();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{t('dataManagement')}</h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}><FiX /></button>
        )}
      </div>
      
      <div className={styles.tabs}>
        <button className={`${styles.tabButton} ${styles.activeTab}`}>
          {t('exportImport')}
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {isExporting && (
          <div className={styles.exportProgress}>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
            <div className={styles.progressText}>
              {t('exportingProgress', { progress: exportProgress })}
            </div>
          </div>
        )}
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiDownload /></div>
            <div className={styles.statLabel}>{t('exportOptions')}</div>
            <div className={styles.statValue}>2</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M4 21v-4a3 3 0 0 1 3 -3h5"></path>
                <path d="M9 17l3 -3l-3 -3"></path>
                <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                <path d="M5 7l4 0"></path>
                <path d="M5 11l4 0"></path>
              </svg>
            </div>
            <div className={styles.statLabel}>{t('messages')}</div>
            <div className={styles.statValue}>
              {currentMessages?.length || loadFromStorage(STORAGE_KEYS.MESSAGES, []).length || 0}
            </div>
          </div>
        </div>
        
        <div className={styles.dataControlsGrid}>
          <div className={styles.exportSection}>
            <select 
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'pdf')}
              className={styles.formatSelect}
              disabled={isExporting}
            >
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
            <button 
              onClick={handleExport} 
              className={`${styles.exportButton} ${isExporting ? styles.exporting : ''}`}
              disabled={isExporting}
            >
              <FiDownload /> {isExporting ? t('exporting') : t('export')}
            </button>
          </div>
          
          <label className={`${styles.importButton} ${isExporting ? styles.disabled : ''}`}>
            <FiUpload /> {t('import')}
            <input type="file" onChange={onImport} accept=".json" hidden disabled={isExporting} />
          </label>
          
          <button 
            onClick={onClearChat} 
            className={styles.clearButton}
            disabled={isExporting}
          >
            <FiRefreshCw /> {t('clear')}
          </button>
          
          <button 
            onClick={handleClearAllData} 
            className={styles.dangerButton}
            disabled={isExporting}
          >
            <FiTrash2 /> {t('clearAllData')}
          </button>
        </div>
      </div>
      
      {notification.show && (
        <div className={`${styles.notification} ${styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]}`}>
          <div className={styles.notificationIcon}>
            {notification.type === 'success' && <FiCheckCircle />}
            {notification.type === 'error' && <FiAlertCircle />}
            {notification.type === 'info' && <FiDownload />}
          </div>
          <div className={styles.notificationContent}>
            <div className={styles.notificationMessage}>
              {notification.message}
            </div>
          </div>
          <button 
            className={styles.notificationClose} 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          >
            <FiX />
          </button>
        </div>
      )}
      
      {process.env.NODE_ENV !== 'production' && (
        <div className={styles.debugInfo}>
          <details>
            <summary>Debug Info</summary>
            <div>
              {debugInfo}
              {messageSource && <div><br/>Last export source: {messageSource}</div>}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
