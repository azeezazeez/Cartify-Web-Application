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
}

// Simple device detection that actually works
const useDeviceType = () => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDevice('mobile');
      } else if (width >= 640 && width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return device;
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  const device = useDeviceType();

  // Different styles for each device type
  const getContainerStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          wrapper: 'fixed inset-x-0 bottom-0 p-4 flex justify-center',
          inner: 'w-full max-w-[320px]',
          message: 'w-full p-4 rounded-2xl shadow-2xl',
          iconSize: 20,
          textSize: 'text-sm',
          spacing: 'gap-3',
        };
      case 'tablet':
        return {
          wrapper: 'fixed inset-x-0 bottom-6 p-0 flex justify-center',
          inner: 'w-full max-w-[400px]',
          message: 'w-full p-4 rounded-xl shadow-xl',
          iconSize: 18,
          textSize: 'text-sm',
          spacing: 'gap-2.5',
        };
      case 'desktop':
        return {
          wrapper: 'fixed top-4 right-4 flex justify-end',
          inner: 'w-[380px]',
          message: 'w-full p-3 rounded-lg shadow-lg',
          iconSize: 16,
          textSize: 'text-xs',
          spacing: 'gap-2',
        };
    }
  };

  const styles = getContainerStyles();

  // Different animations for each device
  const getAnimationProps = () => {
    switch (device) {
      case 'mobile':
        return {
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 50 },
          transition: { type: 'spring', damping: 25, stiffness: 300 }
        };
      case 'tablet':
        return {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 30 },
          transition: { duration: 0.2 }
        };
      case 'desktop':
        return {
          initial: { opacity: 0, x: 50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 50 },
          transition: { duration: 0.15 }
        };
    }
  };

  const animationProps = getAnimationProps();

  // Don't render if no messages
  if (messages.length === 0) return null;

  return (
    // Extremely high z-index to appear above everything
    <div className={styles.wrapper} style={{ zIndex: 999999 }}>
      <div className={styles.inner}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              {...animationProps}
              className={`
                ${styles.message}
                ${styles.spacing}
                flex items-center
                ${msg.type === 'success' 
                  ? 'bg-green-600 dark:bg-green-700' 
                  : 'bg-blue-600 dark:bg-blue-700'
                }
                text-white
                shadow-2xl
                mb-2
                cursor-pointer
                active:scale-95 transition-transform
              `}
              onClick={() => onRemove(msg.id)}
              // Ensure each toast also has high z-index
              style={{ position: 'relative', zIndex: 999999 }}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 
                  size={styles.iconSize} 
                  className="text-white flex-shrink-0" 
                />
              ) : (
                <Info 
                  size={styles.iconSize} 
                  className="text-white flex-shrink-0" 
                />
              )}
              
              <span className={`flex-1 ${styles.textSize} font-medium`}>
                {msg.text}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(msg.id);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
                style={{
                  minWidth: device === 'mobile' ? '44px' : '32px',
                  minHeight: device === 'mobile' ? '44px' : '32px',
                }}
                aria-label="Close"
              >
                <X size={device === 'mobile' ? 20 : 16} className="text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
