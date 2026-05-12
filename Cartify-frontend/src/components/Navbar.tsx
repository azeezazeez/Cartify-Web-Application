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
  const [isPastProductsSection, setIsPastProductsSection] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Route checks ────────────────────────────────────────────────────────────
  // NOTE: Adjust these path strings to exactly match your <Route path="..."> definitions
  const isAdminDashboard = location.pathname.includes('/admin');
  const isOrdersPage =
    location.pathname === '/my-orders' || location.pathname === '/orders';
  const isSustainabilityPage = location.pathname === '/sustainability';
  const isWishlistPage = location.pathname === '/wishlist';
  const isProfilePage = location.pathname === '/profile';

  // Pages that always force white background + dark text regardless of scroll
  const isLightForcedPage =
    isAdminDashboard ||
    isOrdersPage ||
    isSustainabilityPage ||
    isWishlistPage ||
    isProfilePage;

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
      setIsPastProductsSection(scrolled);
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

  // ─── Colour helpers ───────────────────────────────────────────────────────────

  /**
   * Whether we need dark-coloured text/icons.
   * True on pages that always have a white/light navbar background,
   * and also once the user has scrolled past the hero on the home page.
   */
  const useDarkText =
    isLightForcedPage || isPastProductsSection;

  /**
   * Nav-link text colour.
   * Admin & Orders always get solid black/white regardless of scroll.
   */
  const getTextColor = () => {
    if (isLightForcedPage) {
      // White bg page → always readable text
      return isDark ? 'text-white' : 'text-gray-900';
    }
    // Home page: white text on hero, dark text after scrolling
    return isScrolled ? 'text-gray-900' : 'text-white';
  };

  const getLogoColor = () => {
    if (isLightForcedPage) {
      return isDark ? 'text-white' : 'text-gray-900';
    }
    if (isPastProductsSection) {
      return isDark ? 'text-white' : 'text-gray-900';
    }
    return 'text-white';
  };

  const getIconColor = () => {
    if (isLightForcedPage) {
      return isDark ? 'text-white' : 'text-gray-900';
    }
    if (isPastProductsSection) {
      return isDark ? 'text-white' : 'text-gray-900';
    }
    return 'text-white';
  };

  const getButtonHoverColor = () => {
    if (useDarkText) return isDark ? 'hover:bg-brand-800' : 'hover:bg-gray-100';
    return 'hover:bg-white/20';
  };

  const getSearchBgColor = () => {
    if (useDarkText) return isDark ? 'bg-brand-800' : 'bg-gray-100';
    return 'bg-white/20';
  };

  const getSearchTextColor = () => {
    if (useDarkText) return isDark ? 'text-white' : 'text-gray-900';
    return 'text-white';
  };

  const getSearchPlaceholderColor = () => {
    if (useDarkText) return isDark ? 'placeholder-brand-400' : 'placeholder-gray-500';
    return 'placeholder-white/70';
  };

  const textColor = getTextColor();
  const logoColor = getLogoColor();
  const iconColor = getIconColor();
  const buttonBgHover = getButtonHoverColor();
  const searchBgColor = getSearchBgColor();
  const searchTextColor = getSearchTextColor();
  const searchPlaceholderColor = getSearchPlaceholderColor();

  const hoverColor = useDarkText
    ? (isDark ? 'hover:text-brand-400' : 'hover:text-gray-600')
    : 'hover:text-white/80';

  const getToggleButtonColor = () => {
    if (isMobileMenuOpen) return isDark ? 'text-white' : 'text-gray-900';
    if (useDarkText) return isDark ? 'text-white' : 'text-gray-900';
    return 'text-white';
  };

  // ─── Navbar background ────────────────────────────────────────────────────────
  /**
   * isLightForcedPage  → always white (light) / brand-950 (dark), with shadow
   * home scrolled      → white (light) / brand-950 (dark), with shadow
   * home hero          → transparent
   */
  const getNavBg = () => {
    if (isLightForcedPage) {
      return isDark ? 'bg-brand-950 shadow-md' : 'bg-white shadow-md';
    }
    if (isScrolled) {
      return isDark ? 'bg-brand-950 shadow-md' : 'bg-white shadow-md';
    }
    return 'bg-transparent';
  };

  // ─── User helpers ─────────────────────────────────────────────────────────────
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
      return user.email.split('@')[0].substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserGradient = () => {
    if (!user?.email) return 'from-brand-600 to-brand-800';
    const emailHash = user.email
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

  // ─── Lettered Avatar ──────────────────────────────────────────────────────────
  const LetteredAvatar = ({
    initials,
    gradient,
  }: {
    initials: string;
    gradient: string;
  }) => (
    <div className="relative group">
      <div
        className={cn(
          'w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br shadow-lg ring-2 ring-white/50 flex items-center justify-center transition-all duration-300',
          gradient,
          'hover:scale-105 hover:shadow-xl cursor-pointer'
        )}
      >
        <span className="text-white font-bold text-sm sm:text-base tracking-wide">
          {initials}
        </span>
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md" />
    </div>
  );

  // ─── Dark-mode-aware mobile menu classes ──────────────────────────────────────
  const mobileBg = 'bg-white dark:bg-brand-950';
  const mobileBorder = 'border-gray-200 dark:border-brand-800';
  const mobileText = 'text-gray-900 dark:text-white';
  const mobileHover =
    'hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-brand-800';
  const mobileUserBg = 'bg-gray-50 dark:bg-brand-800';
  const mobileCloseBtn =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-800';

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <nav
      ref={navbarRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6',
        'h-16 sm:h-20 flex items-center',
        getNavBg(),
        'overflow-visible shrink-0',
        // Smooth colour transitions when scrolling on home page
        'transition-colors duration-300'
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">

        {/* Mobile Menu Toggle */}
        <button
          className={cn(
            'lg:hidden p-2 rounded-full transition-colors',
            buttonBgHover,
            getToggleButtonColor()
          )}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* ── Logo ── */}
        <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
          <Link
            to="/"
            className="group relative flex items-center space-x-3 transition-all duration-300"
          >
            {/* Glossy 3D Logo Container */}
            <div className="relative">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                <span className="text-white font-black text-2xl sm:text-3xl tracking-tighter transform transition-transform group-hover:scale-105 relative z-10 drop-shadow-lg">
                  C
                </span>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full animate-pulse shadow-lg" />
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse delay-150 shadow-lg" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-400 via-amber-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 via-pink-500 to-brand-600 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-md -z-20" />
              <div className="absolute -inset-2 rounded-2xl border-2 border-brand-400/0 group-hover:border-brand-400/30 transition-all duration-500 -z-30" />
            </div>

            {/* Brand Name */}
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-black tracking-tighter transition-all duration-300 relative',
                  logoColor,
                  'group-hover:tracking-tight'
                )}
              >
                CARTIFY
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </span>
              <span className="text-[8px] sm:text-[10px] font-medium tracking-[0.2em] uppercase text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Premium Store
              </span>
            </div>

            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-400 via-amber-400 to-brand-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full shadow-lg" />
          </Link>
        </div>

        {/* ── Desktop Navigation ── */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs xl:text-sm font-medium uppercase tracking-widest">
          {[
            { label: 'Shop', href: '#', isAnchor: true },
            { label: 'New Arrivals', href: '/new-arrivals', isAnchor: false },
            { label: 'Sustainability', href: '/sustainability', isAnchor: false },
            { label: 'About', href: '#', isAnchor: true },
          ].map(({ label, href, isAnchor }) =>
            isAnchor ? (
              <a
                key={label}
                href={href}
                onClick={(e) => handleLinkClick(e, label)}
                className={cn(
                  'transition-colors duration-300 cursor-pointer relative group',
                  textColor,
                  hoverColor
                )}
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full" />
              </a>
            ) : (
              <Link
                key={label}
                to={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'transition-colors duration-300 cursor-pointer relative group',
                  textColor,
                  hoverColor
                )}
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full" />
              </Link>
            )
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">

          {/* Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className={cn(
              'flex items-center rounded-full px-3 sm:px-4 py-1 transition-all duration-300',
              searchBgColor,
              isSearchOpen
                ? 'w-28 sm:w-48 md:w-64 opacity-100 ml-0'
                : 'w-0 opacity-0 overflow-hidden px-0 ml-0'
            )}
          >
            <Search className={cn('w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0', iconColor)} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              className={cn(
                'bg-transparent border-none outline-none text-xs w-full cursor-text',
                searchTextColor,
                searchPlaceholderColor
              )}
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-1 sm:ml-2 p-0.5 sm:p-1 rounded-full bg-brand-100 hover:bg-brand-200 transition-colors flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-2 h-2 sm:w-3 sm:h-3 text-brand-600" />
              </button>
            )}
          </form>

          {/* Search toggle */}
          <button
            onClick={handleSearchToggle}
            className={cn('p-1.5 sm:p-2 rounded-full transition-colors', buttonBgHover, textColor)}
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Wishlist – desktop only */}
          <Link
            to="/wishlist"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              'p-1.5 sm:p-2 rounded-full transition-colors relative hidden sm:block',
              buttonBgHover,
              textColor
            )}
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User Avatar / menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={user ? () => setIsUserMenuOpen(!isUserMenuOpen) : onAuthClick}
              className="transition-all duration-300 focus:outline-none"
              aria-label="User menu"
            >
              {user ? (
                <LetteredAvatar initials={getUserInitials()} gradient={getUserGradient()} />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </button>

            <AnimatePresence>
              {isUserMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-2xl shadow-xl border border-brand-100 py-2 z-[60]"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="px-4 py-3 border-b border-brand-100 flex items-center space-x-3">
                    <LetteredAvatar initials={getUserInitials()} gradient={getUserGradient()} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest">
                        Signed in as
                      </p>
                      <p className="text-xs sm:text-sm font-medium truncate text-gray-900">
                        {user.name || user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/my-orders"
                    className="flex items-center px-4 py-2 text-xs sm:text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-brand-400" />
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-xs sm:text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-brand-400" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <button
            onClick={onCartClick}
            className={cn('p-1.5 sm:p-2 rounded-full transition-colors relative', buttonBgHover, textColor)}
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded-full bg-brand-950 text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              className="fixed inset-0 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed inset-y-0 left-0 w-[280px] sm:w-[320px] z-[101] shadow-2xl flex flex-col min-h-screen',
                mobileBg
              )}
            >
              {/* Drawer Header */}
              <div className={cn('flex items-center justify-between p-6 border-b', mobileBorder, mobileBg)}>
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <span className={cn('text-xl font-serif font-bold tracking-tighter', mobileText)}>
                    CARTIFY
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn('p-2 rounded-full transition-colors', mobileCloseBtn)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <div className={cn('flex-1 overflow-y-auto py-6 px-6', mobileBg)}>
                <div className="flex flex-col space-y-1">
                  {[
                    { label: 'Shop All', href: '#', isAnchor: true },
                    { label: 'New Arrivals', href: '/new-arrivals', isAnchor: false },
                    { label: 'Sustainability', href: '/sustainability', isAnchor: false },
                    { label: 'My Orders', href: '/my-orders', isAnchor: false },
                    { label: 'My Profile', href: '/profile', isAnchor: false },
                    { label: 'Our Story', href: '#', isAnchor: true },
                  ].map(({ label, href, isAnchor }) =>
                    isAnchor ? (
                      <a
                        key={label}
                        href={href}
                        onClick={(e) => handleLinkClick(e, label)}
                        className={cn(
                          'py-3 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block',
                          mobileText,
                          mobileHover
                        )}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        key={label}
                        to={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'py-3 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block',
                          mobileText,
                          mobileHover
                        )}
                      >
                        {label}
                      </Link>
                    )
                  )}

                  {/* Wishlist with badge */}
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'py-3 px-4 -mx-4 rounded-lg transition-colors text-base font-medium flex items-center justify-between',
                      mobileText,
                      mobileHover
                    )}
                  >
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className={cn('border-t p-6', mobileBorder, mobileBg)}>
                <div className="flex flex-col space-y-3">
                  {!user ? (
                    <div
                      onClick={() => {
                        onAuthClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        'flex items-center space-x-3 py-3 px-4 -mx-4 rounded-lg transition-colors cursor-pointer',
                        mobileText,
                        mobileHover
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-base font-medium">Sign In / Register</span>
                    </div>
                  ) : (
                    <>
                      <div className={cn('flex items-center space-x-3 px-4 py-2 rounded-xl', mobileUserBg)}>
                        <LetteredAvatar initials={getUserInitials()} gradient={getUserGradient()} />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            Signed in as
                          </p>
                          <p className={cn('text-sm font-medium truncate', mobileText)}>
                            {user.name || user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center space-x-3 py-3 px-4 -mx-4 rounded-lg transition-colors text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <span>Logout</span>
                      </button>
                    </>
                  )}

                  <div
                    onClick={handleMobileSearchClick}
                    className={cn(
                      'flex items-center space-x-3 py-3 px-4 -mx-4 rounded-lg transition-colors cursor-pointer',
                      mobileText,
                      mobileHover
                    )}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-base font-medium">Search</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
