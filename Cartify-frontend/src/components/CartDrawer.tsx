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
  isSyncing?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isSyncing = false,
}) => {
  // Debug log
  console.log('CartDrawer - isOpen:', isOpen, 'items:', items.length);

  const subtotal = React.useMemo(() => items.reduce((sum, item) => {
    const price = item.productPrice || item.price || 0;
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0), [items]);

  const [updatingItems, setUpdatingItems] = React.useState<Set<string>>(new Set());

  const getProductId = (item: CartItem): string => item.productId || item.id || '';
  const getProductName = (item: CartItem): string => item.productName || item.name || 'Product';
  const getProductPrice = (item: CartItem): number => item.productPrice || item.price || 0;
  const getProductImage = (item: CartItem): string => item.productImage || item.image || '';
  const getQuantity = (item: CartItem): number => item.quantity || 0;

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

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-brand-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand-100 dark:border-brand-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 dark:text-white" />
            <h2 className="text-xl font-serif font-bold dark:text-white">
              Your Cart ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-16 h-16 text-brand-300 dark:text-brand-600 mb-4" />
              <p className="text-brand-500 dark:text-brand-400">Your cart is empty</p>
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
                const productId = getProductId(item);
                const productName = getProductName(item);
                const productPrice = getProductPrice(item);
                const productImage = getProductImage(item);
                const quantity = getQuantity(item);
                const isUpdating = updatingItems.has(productId);

                if (!productId) return null;

                return (
                  <div
                    key={productId}
                    className={`flex space-x-4 border-b border-brand-100 dark:border-brand-800 pb-4 ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    <div className="w-20 h-20 bg-brand-100 dark:bg-brand-800 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={productImage || 'https://via.placeholder.com/80'}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium dark:text-white truncate">{productName}</h4>
                      <p className="text-brand-600 dark:text-brand-400 text-sm mt-1">
                        ₹{productPrice.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleUpdateQuantity(productId, -1)}
                          disabled={isSyncing || isUpdating}
                          className="p-1 border rounded hover:bg-brand-100 dark:hover:bg-brand-800 disabled:opacity-50"
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
                          className="p-1 border rounded hover:bg-brand-100 dark:hover:bg-brand-800 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(productId)}
                          disabled={isSyncing || isUpdating}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded ml-2 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="font-bold dark:text-white whitespace-nowrap">
                      ₹{(productPrice * quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-brand-100 dark:border-brand-800">
            <div className="flex justify-between mb-4 dark:text-white">
              <span>Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isSyncing}
              className="w-full py-3 bg-brand-950 dark:bg-white text-white dark:text-brand-950 rounded-lg font-medium hover:bg-brand-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
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
      </div>
    </div>
  );
};

CartDrawer.displayName = 'CartDrawer';