import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onProductClick,
  isWishlisted,
  onToggleWishlist
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onAddToCart && typeof onAddToCart === 'function') {
      onAddToCart(product);
    } else {
      console.error('onAddToCart is not a function', onAddToCart);
    }
  };

  const handleCardClick = () => {
    if (onProductClick && typeof onProductClick === 'function') {
      onProductClick(product);
    } else {
      console.error('onProductClick is not a function', onProductClick);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleWishlist && typeof onToggleWishlist === 'function') {
      onToggleWishlist();
    } else {
      console.error('onToggleWishlist is not a function', onToggleWishlist);
    }
  };

  const renderStars = () => {
    const rating = product.rating || 4.5;
    const reviews = product.reviews || Math.floor(Math.random() * 500) + 10;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star key="half" className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-3 h-3 text-gray-300 dark:text-gray-600" />
        ))}
        <span className="ml-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          ({reviews})
        </span>
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-50 dark:bg-brand-800 mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
          }}
        />

        <button
          onClick={handleToggleWishlist}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-lg transition-colors z-10 ${isWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
            }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 left-4 right-4 py-3 bg-white/90 backdrop-blur-md text-brand-950 rounded-xl font-medium flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-950 hover:text-white z-10"
          aria-label="Add to cart"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-brand-900 dark:text-brand-100 line-clamp-1">
            {product.name}
          </h3>
          <span className="font-bold text-brand-950 dark:text-white">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-brand-500 dark:text-brand-400 uppercase tracking-wider">
          {product.category}
        </p>
        <div className="flex items-center justify-between pt-1">
          {renderStars()}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;