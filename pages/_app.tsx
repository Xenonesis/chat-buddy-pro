import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { ThemeProvider } from '../context/ThemeContext';
import { MessageProvider } from '../context/MessageContext';
import { STORAGE_KEYS } from '../utils/storage';
import '../styles/globals.css';
import { patchNextHMR, fixMetaTags } from '../utils/nextPatches';
import '../styles/responsive.css';

// Enhanced startup checks to fix corrupted data
function performDataCleanup() {
  try {
    // Handle username special case
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
    
    // If the username looks like an attempted JSON string but isn't valid,
    // it likely was meant to be a plain string
    if (username && 
        ((username.startsWith('"') && !username.endsWith('"')) ||
         username.startsWith('{') || 
         username.startsWith('['))) {
      try {
        // Try to parse it - if it fails, it's corrupted
        JSON.parse(username);
      } catch (e) {
        // It's not valid JSON, extract and save as plain string
        console.log('Fixing corrupted username data');
        const plainUsername = username
          .replace(/^["'{[]|['"}\]]$/g, '') // Strip quotes, braces, brackets
          .trim();
        
        if (plainUsername) {
          localStorage.setItem(STORAGE_KEYS.USERNAME, plainUsername);
          console.log('Username fixed:', plainUsername);
        } else {
          localStorage.removeItem(STORAGE_KEYS.USERNAME);
        }
      }
    }

    // Check other storage items
    const keysToCheck = [
      STORAGE_KEYS.MESSAGES,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.API_KEYS,
      STORAGE_KEYS.QUESTION_HISTORY,
      STORAGE_KEYS.SUGGESTIONS
    ];
    
    keysToCheck.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          // Simple check - if it's supposed to be JSON, verify it can be parsed
          if (key !== STORAGE_KEYS.USERNAME) {
            JSON.parse(item);
          }
        } catch (e) {
          console.warn(`Removing corrupted localStorage item: ${key}`);
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.error('Error during data cleanup:', e);
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  // Apply the Next.js HMR patch on client side only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Apply patch with slight delay to ensure Next.js is initialized
      setTimeout(() => {
        patchNextHMR();
      }, 500);
    }
    // Run data cleanup on app startup
    performDataCleanup();
    // Fix mobile meta tags
    fixMetaTags();
  }, []);

  return (
    <ThemeProvider>
      <MessageProvider>
        <Component {...pageProps} />
      </MessageProvider>
    </ThemeProvider>
  );
}

export default appWithTranslation(MyApp);
