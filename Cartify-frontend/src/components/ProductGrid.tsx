import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from './ProductCard';
import { Filter, ChevronDown } from 'lucide-react';

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

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
  searchQuery: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  showOnlyWishlist?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onProductClick,
  showToast,
  searchQuery,
  sortBy,
  onSortChange,
  wishlist,
  onToggleWishlist,
  showOnlyWishlist = false,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Rating'];

  useEffect(() => {
    let result = [...products];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by wishlist if needed
    if (showOnlyWishlist) {
      result = result.filter(product => wishlist.some(w => w.id === product.id));
    }

    // Sort products
    switch (sortBy) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'Newest':
        result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default:
        // Featured - keep original order
        break;
    }

    setFilteredProducts(result);
  }, [products, searchQuery, sortBy, showOnlyWishlist, wishlist]);

  // Wrapper functions with validation
  const handleAddToCart = (product: Product) => {
    if (onAddToCart && typeof onAddToCart === 'function') {
      onAddToCart(product);
    } else {
      console.error('onAddToCart is not a function', onAddToCart);
    }
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick && typeof onProductClick === 'function') {
      onProductClick(product);
    } else {
      console.error('onProductClick is not a function', onProductClick);
    }
  };

  const handleToggleWishlist = (product: Product) => {
    if (onToggleWishlist && typeof onToggleWishlist === 'function') {
      onToggleWishlist(product);
    } else {
      console.error('onToggleWishlist is not a function', onToggleWishlist);
    }
  };

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-xl font-serif mb-2 text-gray-900 dark:text-white">No products found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
       {/* 🔥 TITLE */}
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
        Our Products
      </h2>
    </div>
      {/* Sort Bar */}
      <div className="flex justify-end mb-6">
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-brand-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Sort by: {sortBy}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-900 rounded-lg shadow-lg border border-gray-200 dark:border-brand-700 z-10"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onSortChange(option);
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-brand-800 transition-colors ${
                      sortBy === option
                        ? 'text-brand-600 dark:text-brand-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
            isWishlisted={wishlist.some(w => w.id === product.id)}
            onToggleWishlist={() => handleToggleWishlist(product)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
