import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, ChevronDown } from 'lucide-react';
import { Product, Category } from '../types';
import { CATEGORIES } from '../constants';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  showToast: (text: string) => void;
  searchQuery: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  showOnlyWishlist: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  onAddToCart, 
  onProductClick, 
  showToast,
  searchQuery,
  sortBy,
  onSortChange,
  wishlist,
  onToggleWishlist,
  showOnlyWishlist
}) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await api.getProducts(activeCategory, searchQuery);
      setProducts(data);
    };
    fetchProducts();
  }, [activeCategory, searchQuery]);

  const filteredProducts = products.filter((p) => {
    const matchesWishlist = !showOnlyWishlist || wishlist.some(wp => wp.id === p.id);
    return matchesWishlist;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    if (sortBy === 'Newest') return b.id.localeCompare(a.id);
    return 0; // Featured
  });

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-6 md:space-y-0">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-4 dark:text-white">Our Products</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as Category)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-brand-950 dark:bg-white text-white dark:text-brand-950 shadow-lg'
                    : 'bg-brand-50 dark:bg-brand-800 text-brand-500 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest px-4 py-2 border border-brand-100 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors dark:text-white"
            >
              <Filter className="w-3 h-3" />
              <span>Sort: {sortBy}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 rounded-xl shadow-xl z-30 overflow-hidden"
                >
                  {['Featured', 'Newest', 'Price: Low to High', 'Price: High to Low'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onSortChange(option);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors ${
                        sortBy === option ? 'text-brand-950 dark:text-white bg-brand-50 dark:bg-brand-800' : 'text-brand-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
      >
        <AnimatePresence mode="popLayout">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onClick={onProductClick}
              isWishlisted={wishlist.some(p => p.id === product.id)}
              onToggleWishlist={() => onToggleWishlist(product)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {sortedProducts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-brand-500">No products found.</p>
        </div>
      )}
    </section>
  );
};
