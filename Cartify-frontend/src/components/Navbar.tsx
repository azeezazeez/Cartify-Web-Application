import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, Heart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Navbar = ({
  cartCount,
  wishlistCount,
  onCartClick,
  onWishlistClick,
  onAuthClick,
  onLogout,
  user,
  showToast,
  onSearch,
  onShopClick
}: any) => {

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navbarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ SCROLL LOGIC (UPDATED)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100); // ~1 inch
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // ✅ COLOR LOGIC
  const textColor = isScrolled ? 'text-gray-900' : 'text-white';
  const iconColor = textColor;

  return (
    <nav
      ref={navbarRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6',
        'h-16 sm:h-20 flex items-center',
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">

        {/* Mobile Menu */}
        <button
          className={cn("lg:hidden p-2 rounded-full", textColor)}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/" className={cn("text-xl font-bold", textColor)}>
          CARTIFY
        </Link>

        {/* Desktop Nav */}
        <div className={cn("hidden lg:flex space-x-6 font-medium", textColor)}>
          <button onClick={onShopClick}>Shop</button>
          <Link to="/new-arrivals">New Arrivals</Link>
          <Link to="/sustainability">Sustainability</Link>
          <button>About</button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={textColor}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" className="relative">
            <Heart className={cn("w-5 h-5", iconColor)} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-black text-white rounded-full px-1">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User */}
          <button onClick={onAuthClick}>
            <User className={cn("w-5 h-5", iconColor)} />
          </button>

          {/* Cart */}
          <button onClick={onCartClick} className="relative">
            <ShoppingBag className={cn("w-5 h-5", iconColor)} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-black text-white rounded-full px-1">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 h-full w-64 bg-white p-6 z-50"
            >
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X />
              </button>

              <div className="mt-6 space-y-4">
                <button onClick={onShopClick}>Shop</button>
                <Link to="/new-arrivals">New Arrivals</Link>
                <Link to="/sustainability">Sustainability</Link>
                <Link to="/wishlist">Wishlist</Link>
                <Link to="/my-orders">Orders</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
