import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Heart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
  isWishlisted,
  onToggleWishlist
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Adding to cart:', product);
    onAddToCart(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Toggling wishlist:', product);
    onToggleWishlist();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-50 dark:bg-brand-800 mb-4">
       <img
  src={product.image}
  alt={product.name}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
  onError={(e) => {
    (e.target as HTMLImageElement).src = '';
  }}
/>
        
        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-lg transition-colors ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 left-4 right-4 py-3 bg-white/90 backdrop-blur-md text-brand-950 rounded-xl font-medium flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-950 hover:text-white"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-brand-900 dark:text-brand-100">
            {product.name}
          </h3>
          <span className="font-bold text-brand-950 dark:text-white">
            ₹{product.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-brand-500 dark:text-brand-400 uppercase tracking-wider">
          {product.category}
        </p>
        <div className="flex items-center space-x-1 pt-1">
          <span className="text-xs font-medium dark:text-brand-300">
            ⭐ {product.rating} ({product.reviews})
          </span>
        </div>
      </div>
    </motion.div>
  );
};