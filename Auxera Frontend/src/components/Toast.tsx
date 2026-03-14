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
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col space-y-4">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex items-center space-x-3 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 p-4 rounded-2xl shadow-2xl min-w-[300px]"
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Info className="w-5 h-5 text-brand-500" />
            )}
            <p className="flex-1 text-sm font-medium dark:text-white">{msg.text}</p>
            <button
              onClick={() => onRemove(msg.id)}
              className="p-1 hover:bg-brand-50 dark:hover:bg-brand-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-brand-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
