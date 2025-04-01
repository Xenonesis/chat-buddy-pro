/**
 * Patches for Next.js development mode errors
 */

/**
 * Patches the HMR handler to prevent errors when window.next.router.components is undefined
 */
export function patchNextHMR() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Override the handleStaticIndicator function that's causing errors
    try {
      const originalHandler = window.__NEXT_HMR_CB?.handleStaticIndicator;
      
      if (originalHandler) {
        window.__NEXT_HMR_CB.handleStaticIndicator = function patchedHandler() {
          try {
            // Check if window.next exists and has the required properties
            if (!window.next || !window.next.router || !window.next.router.components) {
              console.log('[HMR] Skipping static indicator check - router not ready');
              return;
            }
            
            // Call original handler if everything is available
            return originalHandler.apply(this, arguments);
          } catch (err) {
            console.log('[HMR] Error in static indicator handler:', err);
          }
        };
        
        console.log('[HMR] Applied patch to prevent router.components errors');
      }
    } catch (err) {
      console.warn('Could not patch Next.js HMR handler', err);
    }
  }
}

/**
 * Fixes mobile meta tags to follow standards
 */
export function fixMetaTags() {
  if (typeof document !== 'undefined') {
    // Check if we need to add the mobile-web-app-capable meta tag
    const appleTag = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (appleTag && !document.querySelector('meta[name="mobile-web-app-capable"]')) {
      const newTag = document.createElement('meta');
      newTag.name = 'mobile-web-app-capable';
      newTag.content = 'yes';
      document.head.appendChild(newTag);
      console.log('[Meta] Added mobile-web-app-capable meta tag');
    }
  }
}
