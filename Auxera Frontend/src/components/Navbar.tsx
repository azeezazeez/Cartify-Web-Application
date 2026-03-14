import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, Heart, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onWishlistClick: () => void;
  onAuthClick: () => void;
  onLogout: () => void;
  user: any;
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
  onSearch: (query: string) => void;
  onShopClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onCartClick,
  onWishlistClick,
  onAuthClick,
  onLogout,
  user,
  isDark,
  toggleTheme,
  showToast,
  onSearch,
  onShopClick
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
  };

  const handleLinkClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (label === 'Shop' || label === 'Shop All') {
      navigate('/');
      setTimeout(onShopClick, 100);
    } else if (label === 'New Arrivals') {
      navigate('/new-arrivals');
    } else if (label === 'Sustainability') {
      navigate('/sustainability');
    } else if (label === 'About' || label === 'Our Story') {
      navigate('/');
      setTimeout(() => {
        const storySection = document.querySelector('section.py-24');
        storySection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      showToast(`${label} page is coming soon!`);
    }
  };

  // Simplified: Always use black text
  const textColor = 'text-gray-900 dark:text-gray-900';
  const logoColor = 'text-brand-950 dark:text-brand-950';
  const hoverColor = 'hover:text-brand-600';
  const buttonBgHover = 'hover:bg-brand-100';
  const searchBgColor = 'bg-brand-50';
  const searchTextColor = 'text-gray-900';
  const searchPlaceholderColor = 'placeholder-gray-500';
  const iconColor = 'text-brand-400';

  return (
    <nav
      ref={navbarRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'glass py-3 bg-white/80 backdrop-blur-md' : 'bg-white'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          className={cn(
            "lg:hidden p-2 rounded-full transition-colors",
            buttonBgHover,
            textColor
          )}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
          <Link
            to="/"
            className={cn(
              "text-2xl font-serif font-bold tracking-tighter transition-colors duration-300",
              logoColor
            )}
          >
            AUXERA
          </Link>
        </div>

        {/* Desktop Navigation - All options in black */}
        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
          <a
            href="#"
            onClick={(e) => handleLinkClick(e, 'Shop')}
            className={cn("transition-colors duration-300 cursor-pointer", textColor, hoverColor)}
          >
            Shop
          </a>
          <Link
            to="/new-arrivals"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn("transition-colors duration-300 cursor-pointer", textColor, hoverColor)}
          >
            New Arrivals
          </Link>
          <Link
            to="/sustainability"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn("transition-colors duration-300 cursor-pointer", textColor, hoverColor)}
          >
            Sustainability
          </Link>
          <a
            href="#"
            onClick={(e) => handleLinkClick(e, 'About')}
            className={cn("transition-colors duration-300 cursor-pointer", textColor, hoverColor)}
          >
            About
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className={cn(
            "flex items-center rounded-full px-4 py-1 transition-all duration-300",
            searchBgColor,
            isSearchOpen ? "w-48 sm:w-64 opacity-100" : "w-0 opacity-0 overflow-hidden px-0"
          )}>
            <Search className={cn("w-4 h-4 mr-2 flex-shrink-0", iconColor)} />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              className={cn(
                "bg-transparent border-none outline-none text-xs w-full cursor-text",
                searchTextColor,
                searchPlaceholderColor
              )}
            />
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className={cn("ml-2 p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0")}
              >
                <X className={cn("w-3 h-3", iconColor)} />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn("p-2 rounded-full transition-colors", buttonBgHover, textColor)}
          >
            <Search className="w-5 h-5" />
          </button>
          <Link
            to="/wishlist"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn("p-2 rounded-full transition-colors relative", buttonBgHover, textColor)}
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={user ? () => setIsUserMenuOpen(!isUserMenuOpen) : onAuthClick}
              className={cn("p-2 rounded-full transition-colors hidden sm:block", buttonBgHover, textColor)}
            >
              <User className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-900 rounded-2xl shadow-xl border border-brand-100 dark:border-brand-800 py-2 z-[60]"
                >
                  <div className="px-4 py-2 border-b border-brand-100 dark:border-brand-800">
                    <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-medium truncate dark:text-white">{user.email}</p>
                  </div>

                  <Link
                    to="/my-orders"
                    className="flex items-center px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors dark:text-white"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      showToast('Profile settings coming soon!');
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors dark:text-white"
                  >
                    Profile Settings
                  </button>

                  <Link
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors dark:text-white lg:hidden"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Wishlist ({wishlistCount})
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onCartClick}
            className={cn("p-2 rounded-full transition-colors relative", buttonBgHover, textColor)}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-brand-900 z-[70] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-2xl font-serif font-bold tracking-tighter dark:text-white">AUXERA</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="dark:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col space-y-6 text-lg font-medium dark:text-white">
                <a
                  href="#"
                  onClick={(e) => handleLinkClick(e, 'Shop All')}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  Shop All
                </a>
                <Link
                  to="/new-arrivals"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  New Arrivals
                </Link>
                <a
                  href="#"
                  onClick={(e) => handleLinkClick(e, 'Best Sellers')}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  Best Sellers
                </a>
                <Link
                  to="/sustainability"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  Sustainability
                </Link>
                <Link
                  to="/my-orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  My Orders
                </Link>
                <a
                  href="#"
                  onClick={(e) => handleLinkClick(e, 'Our Story')}
                  className="hover:text-brand-500 transition-colors cursor-pointer"
                >
                  Our Story
                </a>
              </div>
              <div className="absolute bottom-8 left-8 right-8 pt-8 border-t border-brand-100 dark:border-brand-800">
                {user ? (
                  <>
                    <div className="mb-4 px-2">
                      <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-sm font-medium truncate dark:text-white">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-4 py-2 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => {
                      onAuthClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-4 mb-6 cursor-pointer dark:text-white"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In / Register</span>
                  </div>
                )}
                <div
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-4 cursor-pointer dark:text-white"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};