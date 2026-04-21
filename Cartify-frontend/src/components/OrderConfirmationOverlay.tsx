import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderConfirmationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails?: any;
}

export const OrderConfirmationOverlay: React.FC<OrderConfirmationOverlayProps> = ({
  isOpen,
  onClose,
  orderDetails
}) => {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    onClose();
    navigate('/');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/');
    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.querySelector('.products-grid') ||
        document.querySelector('.product-grid') ||
        document.querySelector('[data-testid="products-grid"]') ||
        document.querySelector('section.grid');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light black shadow background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />

          {/* Centered content - NOT a modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] text-center"
          >
            <div className="bg-transparent flex flex-col items-center justify-center space-y-8">
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
                  <CheckCircle className="w-14 h-14 text-white" />
                </div>
              </motion.div>

              {/* Confirmation text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <h2 className="text-4xl font-serif font-bold text-white text-center">
                  Order Confirmed!
                </h2>
                <p className="text-white/80 text-center text-lg">
                  Thank you for your purchase. Your order has been successfully placed.
                </p>
                {orderDetails?.orderId && (
                  <p className="text-white/60 text-sm">
                    Order ID: #{orderDetails.orderId.slice(0, 8)}
                  </p>
                )}
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mt-4"
              >
                <button
                  onClick={handleContinueShopping}
                  className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-medium flex items-center justify-center space-x-2 hover:bg-white/10 transition-all duration-300"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Return to Home</span>
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-medium flex items-center justify-center space-x-2 hover:bg-white/10 transition-all duration-300"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Continue Shopping</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};