import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface UserType {
  email: string;
  name?: string;
  id?: string;
}

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onWishlistClick: () => void;
  onAuthClick: () => void;
  onLogout: () => void;
  user: UserType | null;
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Route checks
  const isAdminDashboard = location.pathname.includes('/admin');
  const isOrdersPage = location.pathname === '/my-orders';
  const isSustainabilityPage = location.pathname === '/sustainability';
  const isWishlistPage = location.pathname === '/wishlist';
  const isProfilePage = location.pathname === '/profile';

  // 1.5 inch = 144px (assuming 96 DPI)
  const SCROLL_THRESHOLD = 144;

  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past 1.5 inches
      const scrolledPastThreshold = window.scrollY >= SCROLL_THRESHOLD;
      setIsScrolled(scrolledPastThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isUserMenuOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchValue('');
      onSearch('');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);

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
        const footer = document.querySelector('footer');
        footer?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      showToast(`${label} page is coming soon!`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());

      setTimeout(() => {
        const productsSection =
          document.querySelector('[data-products]') ||
          document.querySelector('.products-grid') ||
          document.querySelector('.product-grid') ||
          document.querySelector('section:nth-of-type(2)');

        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Check if navbar should use dark text (black color) - SCROLL IS THE MAIN FACTOR
  const useDarkText = isScrolled || isAdminDashboard || isOrdersPage || isSustainabilityPage || isWishlistPage || isProfilePage;

  const getTextColor = () => {
    if (useDarkText) {
      return 'text-gray-900'; // Black color when scrolled
    }
    return 'text-white'; // White color when at top
  };

  const getLogoColor = () => {
    if (useDarkText) {
      return 'text-gray-900';
    }
    return 'text-white';
  };

  const getButtonHoverColor = () => {
    if (useDarkText) return 'hover:bg-gray-100';
    return 'hover:bg-white/20';
  };

  const textColor = getTextColor();
  const logoColor = getLogoColor();
  const hoverColor = useDarkText ? 'hover:text-gray-600' : 'hover:text-white/80';
  const buttonBgHover = getButtonHoverColor();

  const getToggleButtonColor = () => {
    if (isMobileMenuOpen || useDarkText) return 'text-gray-900';
    return 'text-white';
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      const emailParts = user.email.split('@')[0];
      return emailParts.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserGradient = () => {
    if (!user?.email) return 'from-brand-600 to-brand-800';
    const emailHash = user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-purple-600 to-pink-600',
      'from-blue-600 to-cyan-600',
      'from-green-600 to-emerald-600',
      'from-orange-600 to-red-600',
      'from-indigo-600 to-purple-600',
      'from-rose-600 to-orange-600',
      'from-teal-600 to-green-600',
      'from-violet-600 to-fuchsia-600',
    ];
    return gradients[emailHash % gradients.length];
  };

  const LetteredAvatar = ({ initials, gradient }: { initials: string; gradient: string }) => {
    return (
      <div className="relative group">
        <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br shadow-lg ring-2 ring-white/50 flex items-center justify-center transition-all duration-300', gradient, 'hover:scale-105 hover:shadow-xl cursor-pointer')}>
          <span className="text-white font-bold text-sm sm:text-base tracking-wide">{initials}</span>
        </div>
      </div>
    );
  };

  return (
    <nav
      ref={navbarRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 transition-all duration-300',
        'h-16 sm:h-20 flex items-center',
        isScrolled || isAdminDashboard || isOrdersPage || isSustainabilityPage || isWishlistPage || isProfilePage ? 'bg-white shadow-md' : 'bg-transparent',
        'overflow-visible shrink-0'
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">
        {/* Mobile Menu Toggle */}
        <button
          className={cn('lg:hidden p-2 rounded-full transition-colors', buttonBgHover, getToggleButtonColor())}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Website Logo */}
        <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
          <Link to="/" className="group flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl tracking-tighter">C</span>
            </div>
            <span className={cn('text-xl sm:text-2xl font-black tracking-tighter', logoColor)}>
              CARTIFY
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
          <button 
            onClick={(e) => handleLinkClick(e, 'Shop')} 
            className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}
          >
            Shop
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </button>
          <Link 
            to="/new-arrivals" 
            className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            New Arrivals
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </Link>
          <Link 
            to="/sustainability" 
            className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sustainability
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </Link>
          <button 
            onClick={(e) => handleLinkClick(e, 'About')} 
            className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}
          >
            About
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Search Button */}
          <button 
            onClick={handleSearchToggle}
            className={cn('p-2 rounded-full transition-colors', buttonBgHover, textColor)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Wishlist Button */}
          <button 
            onClick={onWishlistClick}
            className={cn('p-2 rounded-full transition-colors relative hidden sm:block', buttonBgHover, textColor)}
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button 
            onClick={onCartClick} 
            className={cn('p-2 rounded-full transition-colors relative', buttonBgHover, textColor)}
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white">
                {cartCount}
              </span>
            )}
          </button>
          
          {/* User Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <LetteredAvatar initials={getUserInitials()} gradient={getUserGradient()} />
              </button>
              
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link 
                      to="/my-orders" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Orders
                    </Link>
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }} 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={onAuthClick} 
              className={cn('p-2 rounded-full transition-colors', buttonBgHover, textColor)}
              aria-label="Sign in"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white shadow-lg py-4 px-4 sm:px-6 z-40"
          >
            <div className="max-w-7xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-600"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 bg-white z-[101] overflow-y-auto lg:hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold text-gray-900">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>
              
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={(e) => handleLinkClick(e, 'Shop')}
                  className="text-lg font-medium text-gray-900 hover:text-brand-600 transition-colors text-left py-2"
                >
                  Shop
                </button>
                <Link 
                  to="/new-arrivals" 
                  className="text-lg font-medium text-gray-900 hover:text-brand-600 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  New Arrivals
                </Link>
                <Link 
                  to="/sustainability" 
                  className="text-lg font-medium text-gray-900 hover:text-brand-600 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sustainability
                </Link>
                <button 
                  onClick={(e) => handleLinkClick(e, 'About')}
                  className="text-lg font-medium text-gray-900 hover:text-brand-600 transition-colors text-left py-2"
                >
                  About
                </button>
                
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      onWishlistClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-gray-700 hover:text-brand-600 transition-colors w-full py-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => {
                      onCartClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-gray-700 hover:text-brand-600 transition-colors w-full py-2 mt-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
