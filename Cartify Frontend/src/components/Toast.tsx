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
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 pointer-events-none z-[100] flex justify-center">
      <div className="flex flex-col gap-2 w-full max-w-md mx-4 mb-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                pointer-events-auto
                flex items-center gap-3 w-full p-4 rounded-lg shadow-xl
                ${msg.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700' 
                  : 'bg-blue-50 dark:bg-blue-900/90 border border-blue-200 dark:border-blue-700'
                }
              `}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
              
              <span className={`
                flex-1 text-sm font-medium
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
                  p-1 rounded-lg transition-colors
                  ${msg.type === 'success' 
                    ? 'hover:bg-green-100 dark:hover:bg-green-800 text-green-600 dark:text-green-400' 
                    : 'hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400'
                  }
                `}
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
