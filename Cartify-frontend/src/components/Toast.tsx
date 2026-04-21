import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[999999]">
      <div className="w-[500px]">
        <AnimatePresence mode="sync">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.15 }}
              className={`
                w-full p-5 rounded-2xl shadow-2xl mb-3
                flex items-center gap-3
                ${msg.type === 'success'
                  ? 'bg-green-600 dark:bg-green-700'
                  : 'bg-blue-600 dark:bg-blue-700'
                }
                text-white cursor-pointer
                border border-white/20
              `}
              onClick={() => onRemove(msg.id)}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 size={24} className="text-white flex-shrink-0" />
              ) : (
                <Info size={24} className="text-white flex-shrink-0" />
              )}

              <span className="flex-1 text-base font-medium leading-relaxed">
                {msg.text}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(msg.id);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};