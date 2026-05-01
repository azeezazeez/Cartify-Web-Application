import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, Heart, Package } from 'lucide-react';
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
  const [isPastProductsSection, setIsPastProductsSection] = useState(false);
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
      // Logic for 1.5 inch scroll threshold
      const scrolled = window.scrollY >= SCROLL_THRESHOLD;
      setIsScrolled(scrolled);

      const heroSection =
        document.querySelector('[data-hero]') ||
        document.querySelector('.hero-section') ||
        document.querySelector('section:first-of-type') ||
        document.querySelector('main > div:first-child > section') ||
        document.querySelector('main > section:first-child');

      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const navHeight = window.innerWidth >= 640 ? 80 : 64;
        setIsPastProductsSection(heroBottom <= navHeight);
      } else {
        const approxHeroHeight = window.innerHeight;
        setIsPastProductsSection(window.scrollY >= approxHeroHeight - 80);
      }
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

  const handleMobileSearchClick = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(true);
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

  // Check if navbar should use dark text (black color) - FIXED: Only use isScrolled for text color
  const useDarkText = isScrolled;

  const getTextColor = () => {
    if (useDarkText) {
      return 'text-gray-900'; // Black color when scrolled past 1.5 inches
    }
    return 'text-white';
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

  const getIconColor = () => {
    if (useDarkText) {
      return 'text-gray-900';
    }
    return 'text-white';
  };

  const textColor = getTextColor();
  const logoColor = getLogoColor();
  const hoverColor = useDarkText ? 'hover:text-gray-600' : 'hover:text-white/80';
  const buttonBgHover = getButtonHoverColor();
  const iconColor = getIconColor();

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
        isScrolled || isPastProductsSection || isAdminDashboard || isOrdersPage || isSustainabilityPage || isWishlistPage || isProfilePage ? 'bg-white shadow-md' : 'bg-transparent',
        'overflow-visible shrink-0'
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">
        {/* Mobile Menu Toggle */}
        <button
          className={cn('lg:hidden p-2 rounded-full transition-colors', buttonBgHover, getToggleButtonColor())}
          onClick={() => setIsMobileMenuOpen(true)}
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

        {/* Desktop Navigation - These are the options text the user mentioned */}
        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
          <a href="#" onClick={(e) => handleLinkClick(e, 'Shop')} className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}>
            Shop
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </a>
          <Link to="/new-arrivals" className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}>
            New Arrivals
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </Link>
          <Link to="/sustainability" className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}>
            Sustainability
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </Link>
          <a href="#" onClick={(e) => handleLinkClick(e, 'About')} className={cn('transition-colors duration-300 relative group', textColor, hoverColor)}>
            About
            <span className={cn("absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full", useDarkText ? 'bg-gray-900' : 'bg-white')}></span>
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button onClick={handleSearchToggle} className={cn('p-2 rounded-full transition-colors', buttonBgHover, textColor)}>
            <Search className="w-5 h-5" />
          </button>
          
          <Link to="/wishlist" className={cn('p-2 rounded-full transition-colors relative hidden sm:block', buttonBgHover, textColor)}>
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button onClick={onCartClick} className={cn('p-2 rounded-full transition-colors relative', buttonBgHover, textColor)}>
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {cartCount}
              </span>
            )}
          </button>
          
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <LetteredAvatar initials={getUserInitials()} gradient={getUserGradient()} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                   <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onAuthClick} className={cn('p-2 rounded-full transition-colors', buttonBgHover, textColor)}>
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed inset-0 bg-white z-[101] p-6 lg:hidden"
          >
             <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="flex flex-col space-y-4">
                <a href="#" onClick={(e) => handleLinkClick(e, 'Shop')} className="text-lg font-medium">Shop</a>
                <Link to="/new-arrivals" className="text-lg font-medium">New Arrivals</Link>
                <Link to="/sustainability" className="text-lg font-medium">Sustainability</Link>
                <a href="#" onClick={(e) => handleLinkClick(e, 'About')} className="text-lg font-medium">About</a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
