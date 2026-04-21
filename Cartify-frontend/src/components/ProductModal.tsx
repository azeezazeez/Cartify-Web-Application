import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingBag, Heart, Share2 } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  showToast: (text: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  showToast,
  isWishlisted,
  onToggleWishlist
}) => {
  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose(); // Close the modal immediately after adding to cart
  };

  const handleToggleWishlist = () => {
    onToggleWishlist(product);
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[150]"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:h-auto max-h-[90vh] bg-white dark:bg-brand-900 z-[160] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-brand-800/80 backdrop-blur-md rounded-full z-10 hover:bg-white dark:hover:bg-brand-700 transition-colors dark:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto bg-brand-50 dark:bg-brand-800">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                 {/* Title FULL LEFT (no padding at all) */}
              <div className="px-4 md:px-0 pt-6">
              <p className="text-black font-bold text-sm">
                  Our Products
                      </p>
                      </div>
                  <div className="p-8 md:p-12 space-y-6">
                   <div>
                  <p className="text-xs font-bold text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em] mb-2">
                    {product.category}
                  </p>
                  <h2 className="text-3xl font-serif font-bold mb-2 dark:text-white">{product.name}</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < Math.floor(product.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-brand-500 dark:text-brand-400">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                </div>

                <p className="text-4xl font-bold text-brand-950 dark:text-white">${product.price.toFixed(2)}</p>

                <p className="text-brand-600 dark:text-brand-300 leading-relaxed">{product.description}</p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-4 bg-brand-950 dark:bg-white dark:text-brand-950 text-white rounded-xl font-bold flex items-center justify-center space-x-3 hover:bg-brand-800 dark:hover:bg-brand-100 transition-all shadow-lg"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={handleToggleWishlist}
                      className={cn(
                        "p-4 border rounded-xl transition-all duration-300",
                        isWishlisted
                          ? "bg-brand-950 dark:bg-white text-white dark:text-brand-950 border-brand-950 dark:border-white"
                          : "border-brand-200 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-800 dark:text-white"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                    </button>
                  </div>
                  <button
                    onClick={() => showToast('Sharing is coming soon!')}
                    className="w-full py-3 text-sm font-bold text-brand-500 dark:text-brand-400 flex items-center justify-center space-x-2 hover:text-brand-950 dark:hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share this product</span>
                  </button>
                </div>

                <div className="pt-8 border-t border-brand-100 dark:border-brand-800 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Shipping</p>
                    <p className="text-sm font-medium dark:text-white">Free worldwide shipping</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">Returns</p>
                    <p className="text-sm font-medium dark:text-white">30-day easy returns</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
