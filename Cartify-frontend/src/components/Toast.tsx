// ToastContainer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[999999]">
      <div className="w-[500px] max-w-[90vw]">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                w-full p-5 rounded-2xl shadow-2xl mb-3 flex items-center gap-3
                border border-white/20 backdrop-blur-sm cursor-pointer
                ${msg.type === 'success' ? 'bg-green-600 dark:bg-green-700' :
                  msg.type === 'error' ? 'bg-red-600 dark:bg-red-700' :
                    'bg-blue-600 dark:bg-blue-700'}
                text-white
              `}
              onClick={() => onRemove(msg.id)}
            >
              {msg.type === 'success' ? <CheckCircle2 size={24} className="flex-shrink-0" /> :
                msg.type === 'error' ? <AlertCircle size={24} className="flex-shrink-0" /> :
                  <Info size={24} className="flex-shrink-0" />}
              <span className="flex-1 text-base font-medium leading-relaxed">{msg.text}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(msg.id); }}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Custom hook for toast management
export const useToast = () => {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((text: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const success = React.useCallback((text: string) => addToast(text, 'success'), [addToast]);
  const error = React.useCallback((text: string) => addToast(text, 'error'), [addToast]);
  const info = React.useCallback((text: string) => addToast(text, 'info'), [addToast]);

  return {
    messages,
    removeToast,
    success,
    error,
    info,
  };
};