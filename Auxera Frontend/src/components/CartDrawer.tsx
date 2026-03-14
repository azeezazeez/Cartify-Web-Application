import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  isSyncing?: boolean; // Add this prop
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isSyncing = false, // Default to false
}) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.productPrice || item.price || 0;
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0);

  // Track which items are being updated
  const [updatingItems, setUpdatingItems] = React.useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (productId: string, delta: number) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await onUpdateQuantity(productId, delta);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemove = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await onRemove(productId);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-brand-900 z-[110] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-brand-100 dark:border-brand-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 dark:text-white" />
                <h2 className="text-xl font-serif font-bold dark:text-white">
                  Your Cart ({items.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSyncing}
                className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-16 h-16 text-brand-300 mb-4" />
                  <p className="text-brand-500">Your cart is empty</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    // Get the product ID - handle both naming conventions
                    const productId = item.productId || item.id;
                    const productName = item.productName || item.name || 'Product';
                    const productPrice = item.productPrice || item.price || 0;
                    const productImage = item.productImage || item.image || '';
                    const quantity = item.quantity || 1;
                    const isUpdating = updatingItems.has(productId);

                    return (
                      <div
                        key={productId}
                        className={`flex space-x-4 border-b border-brand-100 pb-4 transition-opacity ${isUpdating ? 'opacity-50' : ''
                          }`}
                      >
                        <div className="w-20 h-20 bg-brand-100 rounded-lg overflow-hidden">
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium dark:text-white">{productName}</h4>
                          <p className="text-brand-600 dark:text-brand-400">₹{productPrice}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => handleUpdateQuantity(productId, -1)}
                              disabled={isSyncing || isUpdating}
                              className="p-1 border rounded hover:bg-brand-100 dark:hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="dark:text-white min-w-[20px] text-center">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin inline" />
                              ) : (
                                quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(productId, 1)}
                              disabled={isSyncing || isUpdating}
                              className="p-1 border rounded hover:bg-brand-100 dark:hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(productId)}
                              disabled={isSyncing || isUpdating}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="font-bold dark:text-white">
                          ₹{(productPrice * quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-brand-100 dark:border-brand-800">
                <div className="flex justify-between mb-4 dark:text-white">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={onCheckout}
                  disabled={isSyncing}
                  className="w-full py-3 bg-brand-950 dark:bg-white dark:text-brand-950 text-white rounded-lg font-medium hover:bg-brand-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Checkout</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};