import { useState, useEffect } from 'react';

// Screen size breakpoints for consistent responsive design
export const breakpoints = {
  xs: 480,   // Extra small screens (smaller phones)
  sm: 640,   // Small screens (larger phones)
  md: 768,   // Medium screens (tablets)
  lg: 1024,  // Large screens (laptops)
  xl: 1280,  // Extra large screens (desktops)
  xxl: 1536  // Very large screens (large desktops)
};

// Hook to detect screen size for responsive rendering
export function useBreakpoint() {
  const [screenSize, setScreenSize] = useState({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    isXxl: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0
  });

  useEffect(() => {
    // Function to update screen dimensions and breakpoint flags
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        isXs: width < breakpoints.xs,
        isSm: width >= breakpoints.xs && width < breakpoints.sm,
        isMd: width >= breakpoints.sm && width < breakpoints.md,
        isLg: width >= breakpoints.md && width < breakpoints.lg,
        isXl: width >= breakpoints.lg && width < breakpoints.xl,
        isXxl: width >= breakpoints.xl,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        width,
        height
      });
    };

    // Set initial values
    updateScreenSize();
    
    // Update values on resize
    window.addEventListener('resize', updateScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}

// Hook to detect touch capability for better mobile interactions
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const detectTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };
    
    detectTouch();
    
    // Also check on resize as some devices can switch modes
    window.addEventListener('resize', detectTouch);
    
    return () => window.removeEventListener('resize', detectTouch);
  }, []);

  return isTouchDevice;
}

// Hook to detect orientation changes
export function useOrientation() {
  const [orientation, setOrientation] = useState({
    isPortrait: true,
    isLandscape: false,
    angle: 0
  });

  useEffect(() => {
    const updateOrientation = () => {
      const angle = window.screen.orientation 
        ? window.screen.orientation.angle 
        : window.orientation || 0;
        
      setOrientation({
        isPortrait: (angle === 0 || angle === 180),
        isLandscape: (angle === 90 || angle === -90),
        angle: angle
      });
    };

    updateOrientation(); // Initial call
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', updateOrientation);
    
    // Also update on resize as fallback
    window.addEventListener('resize', updateOrientation);
    
    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
}

// Detect iOS device for specific iOS fixes
export function useiOSDevice() {
  const [isiOS, setIsiOS] = useState(false);
  
  useEffect(() => {
    const checkiOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
        (userAgent.includes('mac') && 'ontouchend' in document);
      setIsiOS(isIOS);
    };
    
    checkiOS();
  }, []);
  
  return isiOS;
}

// Helper function for conditional class names
export function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Apply iOS-specific viewport fixes
export function fixiOSViewport() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    
  if (isIOS) {
    // Add viewport meta with maximum-scale to prevent zooming
    // but still maintaining accessibility
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    }
    
    // Fix for 100vh issue in iOS
    document.documentElement.style.setProperty(
      '--vh', 
      `${window.innerHeight * 0.01}px`
    );
    
    // Update on resize and orientation change
    window.addEventListener('resize', () => {
      document.documentElement.style.setProperty(
        '--vh', 
        `${window.innerHeight * 0.01}px`
      );
    });
  }
}

// Check if the app is running in a PWA mode
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone || 
    document.referrer.includes('android-app://');
}

// Calculate safe areas for notched devices
export function getSafeAreaInsets() {
  // Default values
  const insets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  try {
    // Try to get CSS environment variables for safe areas
    const computedStyle = getComputedStyle(document.documentElement);
    
    const safeAreaTop = computedStyle.getPropertyValue('--sat') || 
      computedStyle.getPropertyValue('env(safe-area-inset-top)');
    const safeAreaRight = computedStyle.getPropertyValue('--sar') || 
      computedStyle.getPropertyValue('env(safe-area-inset-right)');
    const safeAreaBottom = computedStyle.getPropertyValue('--sab') || 
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)');
    const safeAreaLeft = computedStyle.getPropertyValue('--sal') || 
      computedStyle.getPropertyValue('env(safe-area-inset-left)');
      
    if (safeAreaTop) insets.top = parseInt(safeAreaTop);
    if (safeAreaRight) insets.right = parseInt(safeAreaRight);
    if (safeAreaBottom) insets.bottom = parseInt(safeAreaBottom);
    if (safeAreaLeft) insets.left = parseInt(safeAreaLeft);
  } catch (e) {
    console.warn('Error getting safe area insets:', e);
  }
  
  return insets;
}
