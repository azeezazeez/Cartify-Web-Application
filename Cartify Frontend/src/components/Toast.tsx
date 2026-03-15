import React from 'react';
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

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  messages, 
  onRemove,
  position = 'bottom' 
}) => {
  // Get position styles based on prop and device
  const getPositionStyles = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // Base position classes
    const positions = {
      'top': 'top-0 sm:top-4',
      'bottom': 'bottom-0 sm:bottom-4',
      'top-left': 'top-0 sm:top-4 left-0 sm:left-4',
      'top-right': 'top-0 sm:top-4 right-0 sm:right-4',
      'bottom-left': 'bottom-0 sm:bottom-4 left-0 sm:left-4',
      'bottom-right': 'bottom-0 sm:bottom-4 right-0 sm:right-4',
    };

    // For mobile, always center horizontally
    if (isMobile) {
      return 'inset-x-0 bottom-0'; // Stack from bottom on mobile
    }

    return positions[position];
  };

  // Get alignment classes
  const getAlignmentClasses = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      return 'items-center'; // Center items on mobile
    }

    // For desktop, align based on position
    if (position.includes('left')) return 'items-start';
    if (position.includes('right')) return 'items-end';
    return 'items-center';
  };

  return (
    <div 
      className={`
        fixed ${getPositionStyles()} 
        pointer-events-none z-[100] 
        flex justify-center
        transition-all duration-300
      `}
    >
      <div className={`
        flex flex-col gap-2 w-full 
        max-w-[90vw] sm:max-w-md 
        mx-2 sm:mx-4 
        mb-2 sm:mb-4
        ${getAlignmentClasses()}
      `}>
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.2,
                layout: { duration: 0.3 }
              }}
              className={`
                pointer-events-auto
                flex items-center gap-2 sm:gap-3 
                w-full p-3 sm:p-4 
                rounded-lg shadow-xl
                backdrop-blur-sm bg-opacity-95
                ${msg.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/95 border border-green-200 dark:border-green-700' 
                  : 'bg-blue-50 dark:bg-blue-900/95 border border-blue-200 dark:border-blue-700'
                }
                ${index > 0 ? 'mt-1 sm:mt-0' : ''}
              `}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
              
              <span className={`
                flex-1 text-xs sm:text-sm font-medium break-words
                ${msg.type === 'success' 
                  ? 'text-green-800 dark:text-green-100' 
                  : 'text-blue-800 dark:text-blue-100'
                }
              `}>
                {msg.text}
              </span>
              
              <button
                onClick={() => onRemove(msg.id)}
                className={`
                  p-1 sm:p-1.5 rounded-lg transition-colors
                  ${msg.type === 'success' 
                    ? 'hover:bg-green-100 dark:hover:bg-green-800 text-green-600 dark:text-green-400' 
                    : 'hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400'
                  }
                  touch-manipulation
                `}
                aria-label="Close notification"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
