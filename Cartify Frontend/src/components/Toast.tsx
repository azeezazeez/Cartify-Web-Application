// App.tsx or wherever you want to use it
import React, { useState, useCallback } from 'react';
import { ToastContainer, ToastMessage } from './ToastContainer';

function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'info') => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      text,
      type,
    };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="space-x-2">
        <button
          onClick={() => addToast('Operation completed successfully!', 'success')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={() => addToast('New information available', 'info')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Show Info Toast
        </button>
      </div>

      <ToastContainer 
        messages={toasts} 
        onRemove={removeToast}
      />
    </div>
  );
}

export default App;
