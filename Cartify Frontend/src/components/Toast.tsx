import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info';
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

type DeviceInfo = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  hasNotch: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  messages, 
  onRemove,
  position = 'bottom' 
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: false,
    isPortrait: true,
    hasNotch: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Device type detection
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;
      
      // Orientation
      const isLandscape = width > height;
      const isPortrait = height > width;

      // Safe area detection for notched phones
      const hasNotch = CSS.supports('padding: env(safe-area-inset-top)') || 
                      CSS.supports('padding: constant(safe-area-inset-top)');
      
      // Get safe area insets if available
      const safeAreaInsets = {
        top: hasNotch ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') : 0,
        bottom: hasNotch ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0') : 0,
        left: hasNotch ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0') : 0,
        right: hasNotch ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0') : 0,
      };

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
        hasNotch,
        safeAreaInsets
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  const getPositionStyles = () => {
    const baseStyles: React.CSSProperties = {};
    let positionClasses = '';

    // Mobile phones
    if (deviceInfo.isMobile) {
      if (deviceInfo.isPortrait) {
        // Portrait mobile: Stack from bottom with full width
        positionClasses = 'inset-x-0 bottom-0';
      } else {
        // Landscape mobile: Show as small chips at the corner
        positionClasses = position.includes('top') 
          ? 'top-0 right-0' 
          : 'bottom-0 right-0';
      }
    }
    // Tablets
    else if (deviceInfo.isTablet) {
      if (deviceInfo.isPortrait) {
        // Tablet portrait: Center with max width
        positionClasses = 'inset-x-0 bottom-4';
      } else {
        // Tablet landscape: Position based on preference
        positionClasses = positions[position];
      }
    }
    // Desktop
    else {
      positionClasses = positions[position];
    }

    return positionClasses;
  };

  const getSizeStyles = () => {
    if (deviceInfo.isMobile) {
      if (deviceInfo.isPortrait) {
        return {
          maxWidth: '100%',
          width: '100%',
          margin: '0',
          padding: deviceInfo.hasNotch ? '0 0 env(safe-area-inset-bottom, 0)' : '0',
        };
      } else {
        // Mobile landscape - smaller notifications
        return {
          maxWidth: '400px',
          width: 'auto',
          margin: '0 8px',
        };
      }
    } else if (deviceInfo.isTablet) {
      return {
        maxWidth: deviceInfo.isPortrait ? '500px' : '450px',
        width: 'auto',
        margin: '0 16px',
      };
    } else {
      // Desktop
      return {
        maxWidth: '420px',
        width: 'auto',
        margin: '0 24px',
      };
    }
  };

  const getSpacing = () => {
    if (deviceInfo.isMobile) {
      return {
        gap: deviceInfo.isPortrait ? '8px' : '4px',
        padding: deviceInfo.isPortrait ? '16px' : '8px',
        iconSize: deviceInfo.isPortrait ? 20 : 16,
        fontSize: deviceInfo.isPortrait ? '14px' : '12px',
        closeSize: deviceInfo.isPortrait ? 16 : 14,
      };
    } else if (deviceInfo.isTablet) {
      return {
        gap: '12px',
        padding: '16px',
        iconSize: 20,
        fontSize: '14px',
        closeSize: 16,
      };
    } else {
      return {
        gap: '12px',
        padding: '16px',
        iconSize: 20,
        fontSize: '14px',
        closeSize: 16,
      };
    }
  };

  const getAnimationProps = () => {
    if (deviceInfo.isMobile && deviceInfo.isPortrait) {
      // Mobile portrait: Slide from bottom
      return {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
        transition: { type: 'spring', damping: 25, stiffness: 300 }
      };
    } else {
      // Default animation
      return {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.95 },
        transition: { duration: 0.2 }
      };
    }
  };

  const positions = {
    'top': 'top-0 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-0 left-1/2 -translate-x-1/2',
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  const positionClasses = getPositionStyles();
  const sizeStyles = getSizeStyles();
  const spacing = getSpacing();
  const animationProps = getAnimationProps();

  // Get alignment classes
  const getAlignmentClasses = () => {
    if (deviceInfo.isMobile && deviceInfo.isLandscape) {
      return 'items-end';
    }
    if (deviceInfo.isTablet && deviceInfo.isPortrait) {
      return 'items-center';
    }
    return 'items-stretch';
  };

  return (
    <div 
      className={`
        fixed ${positionClasses}
        pointer-events-none z-[100]
        flex justify-center
        transition-all duration-300
      `}
      style={{
        paddingTop: deviceInfo.hasNotch ? 'env(safe-area-inset-top, 0)' : undefined,
        paddingBottom: deviceInfo.hasNotch ? 'env(safe-area-inset-bottom, 0)' : undefined,
      }}
    >
      <div 
        className={`
          flex flex-col ${getAlignmentClasses()}
          transition-all duration-300
        `}
        style={{
          gap: spacing.gap,
          maxWidth: sizeStyles.maxWidth,
          width: sizeStyles.width,
          margin: sizeStyles.margin,
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              layout
              {...animationProps}
              className={`
                pointer-events-auto
                flex items-center gap-2
                w-full rounded-lg shadow-xl
                backdrop-blur-md bg-opacity-98
                ${deviceInfo.isMobile && deviceInfo.isLandscape ? 'rounded-full' : 'rounded-lg'}
                ${msg.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/95 border border-green-200 dark:border-green-700' 
                  : 'bg-blue-50 dark:bg-blue-900/95 border border-blue-200 dark:border-blue-700'
                }
                ${index > 0 ? 'mt-1 sm:mt-0' : ''}
                touch-manipulation
              `}
              style={{
                padding: spacing.padding,
              }}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 
                  className="flex-shrink-0" 
                  style={{ 
                    width: spacing.iconSize, 
                    height: spacing.iconSize,
                    color: msg.type === 'success' ? '#16a34a' : '#2563eb' 
                  }} 
                />
              ) : (
                <Info 
                  className="flex-shrink-0" 
                  style={{ 
                    width: spacing.iconSize, 
                    height: spacing.iconSize,
                    color: msg.type === 'success' ? '#16a34a' : '#2563eb'
                  }} 
                />
              )}
              
              <span 
                className="flex-1 font-medium break-words"
                style={{
                  fontSize: spacing.fontSize,
                  color: msg.type === 'success' ? '#166534' : '#1e40af',
                }}
              >
                {msg.text}
              </span>
              
              <button
                onClick={() => onRemove(msg.id)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Close notification"
                style={{
                  minWidth: deviceInfo.isMobile ? '44px' : '32px',
                  minHeight: deviceInfo.isMobile ? '44px' : '32px',
                }}
              >
                <X 
                  style={{ 
                    width: spacing.closeSize, 
                    height: spacing.closeSize,
                    color: msg.type === 'success' ? '#16a34a' : '#2563eb'
                  }} 
                />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
