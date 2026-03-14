import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Heart } from 'lucide-react';

interface WishlistPageProps {
  wishlist: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ 
  wishlist, 
  onAddToCart, 
  onProductClick,
  onToggleWishlist
}) => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center space-x-4 mb-12">
        <Heart className="w-8 h-8 text-brand-950 dark:text-white fill-current" />
        <h1 className="text-4xl font-serif font-bold dark:text-white">My Wishlist</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center bg-brand-50 dark:bg-brand-900 rounded-3xl">
          <p className="text-brand-500 mb-6">Your wishlist is empty.</p>
          <a 
            href="/" 
            className="px-8 py-3 bg-brand-950 dark:bg-white text-white dark:text-brand-950 rounded-full font-bold"
          >
            Go Shopping
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {wishlist.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onClick={onProductClick}
              isWishlisted={true}
              onToggleWishlist={() => onToggleWishlist(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
