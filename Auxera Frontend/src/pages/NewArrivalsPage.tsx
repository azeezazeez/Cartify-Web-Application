import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Sparkles } from 'lucide-react';

interface NewArrivalsPageProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
}

export const NewArrivalsPage: React.FC<NewArrivalsPageProps> = ({ 
  products, 
  onAddToCart, 
  onProductClick,
  wishlist,
  onToggleWishlist
}) => {
  const newArrivals = products.filter(p => p.isNew);

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-50 dark:bg-brand-800 text-brand-950 dark:text-white rounded-full text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3 h-3" />
          <span>Fresh Drop</span>
        </div>
        <h1 className="text-5xl font-serif font-bold mb-4 dark:text-white">New Arrivals</h1>
        <p className="text-brand-500">Discover our latest additions to the collection.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {newArrivals.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onClick={onProductClick}
            isWishlisted={wishlist.some(p => p.id === product.id)}
            onToggleWishlist={() => onToggleWishlist(product)}
          />
        ))}
      </div>
    </div>
  );
};
