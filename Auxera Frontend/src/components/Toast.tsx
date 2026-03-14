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
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                flex items-center gap-3 p-4 rounded-lg shadow-lg
                ${msg.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                }
              `}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <Info className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              )}
              <span className="flex-1 text-sm font-medium">{msg.text}</span>
              <button
                onClick={() => onRemove(msg.id)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
