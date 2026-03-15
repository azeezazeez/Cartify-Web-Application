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
  const [isSearching, setIsSearching] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
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
    // Clear search when closing
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
        const storySection = document.querySelector('section.py-24');
        storySection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      showToast(`${label} page is coming soon!`);
    }
  };

  // Handle mobile search click
  const handleMobileSearchClick = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(true);
  };

  // Handle search submission with scroll to products
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      return;
    }

    setIsSearching(true);
    
    // Call the onSearch prop to filter products
    onSearch(searchValue.trim());

    // First, navigate to home page if not already there
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Find and scroll to products section
    const findAndScrollToProducts = () => {
      // Look for common product section selectors
      const possibleSelectors = [
        'section.grid',
        '.products-grid',
        '#products-section',
        '[data-testid="products-grid"]',
        '.product-list',
        'main section:has(.product-card)',
        'section:has(> div > .product-card)'
      ];

      let productsSection = null;
      
      // Try each selector
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          productsSection = element;
          break;
        }
      }

      // If still not found, look for any section containing product cards
      if (!productsSection) {
        const allSections = document.querySelectorAll('section');
        for (const section of allSections) {
          if (section.querySelector('.product-card') || 
              section.innerHTML.includes('product') || 
              section.classList.toString().includes('product')) {
            productsSection = section;
            break;
          }
        }
      }

      if (productsSection) {
        // Scroll to the products section
        productsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Highlight the search input or show a success message
        showToast(`Showing results for "${searchValue}"`, 'success');
      } else {
        // If no products section found, show a message
        showToast(`No products found for "${searchValue}"`, 'info');
      }
    };

    // Small delay to ensure products are rendered
    setTimeout(findAndScrollToProducts, 500);
    
    setIsSearching(false);
  };

  // Handle search result click from external source (like search results page)
  const handleSearchResultClick = (productId: string) => {
    // Navigate to product detail or scroll to product
    navigate(`/product/${productId}`);
  };

  // FIX 1: Always keep text white regardless of scroll state
  const getTextColor = () => {
    return 'text-white'; // Always white
  };

  // FIX 1: Logo always white
  const getLogoColor = () => {
    return 'text-white'; // Always white
  };

  // Button hover effects - keep them subtle
  const getButtonHoverColor = () => {
    if (isScrolled) return 'hover:bg-white/20'; // Light hover on scrolled background
    return 'hover:bg-white/20'; // Consistent hover
  };

  const getIconColor = () => {
    return 'text-white'; // Always white icons
  };

  const textColor = getTextColor();
  const logoColor = getLogoColor();
  const hoverColor = 'hover:text-white/80'; // Always fade to white on hover
  const buttonBgHover = getButtonHoverColor();
  
  // FIX 1: Search background adapts but text stays white
  const searchBgColor = isScrolled ? 'bg-white/20' : 'bg-white/20'; // Consistent semi-transparent background
  const searchTextColor = 'text-white'; // Always white text
  const searchPlaceholderColor = 'placeholder-white/70'; // Always white placeholder
  const iconColor = getIconColor();

  // FIX 2: Prevent navbar compression when mobile menu is open
  const getToggleButtonColor = () => {
    return 'text-white'; // Always white
  };

  // FIX 2: Ensure navbar doesn't change when mobile menu opens
  const getNavbarClasses = () => {
    return cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6',
      isScrolled 
        ? 'py-2 sm:py-3 bg-black/80 backdrop-blur-md shadow-md' // Dark background when scrolled
        : 'py-3 sm:py-4 bg-transparent', // Transparent background at top
      // Ensure consistent height regardless of menu state
      'h-[60px] sm:h-[70px] flex items-center'
    );
  };

  return (
    <nav
      ref={navbarRef}
      className={getNavbarClasses()}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          className={cn(
            "lg:hidden p-2 rounded-full transition-colors",
            buttonBgHover,
            getToggleButtonColor()
          )}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Logo */}
        <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
          <Link
            to="/"
            className={cn(
              "text-xl sm:text-2xl font-serif font-bold tracking-tighter transition-colors duration-300",
              logoColor
            )}
          >
            CARTIFY
          </Link>
        </div>

        {/* Desktop Navigation - Always white text */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs xl:text-sm font-medium uppercase tracking-widest">
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
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {/* Search input */}
          <form 
            onSubmit={handleSearchSubmit}
            className={cn(
              "flex items-center rounded-full px-3 sm:px-4 py-1 transition-all duration-300",
              searchBgColor,
              isSearchOpen ? "w-28 sm:w-48 md:w-64 opacity-100 ml-0" : "w-0 opacity-0 overflow-hidden px-0 ml-0"
            )}
          >
            <Search className={cn("w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0", iconColor)} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchValue}
              onChange={handleSearchChange}
              disabled={isSearching}
              className={cn(
                "bg-transparent border-none outline-none text-xs w-full cursor-text",
                searchTextColor,
                searchPlaceholderColor,
                isSearching && "opacity-50 cursor-wait"
              )}
            />
            {searchValue && !isSearching && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-1 sm:ml-2 p-0.5 sm:p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              </button>
            )}
            {isSearching && (
              <div className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </form>

          {/* Search toggle button */}
          <button
            onClick={handleSearchToggle}
            className={cn("p-1.5 sm:p-2 rounded-full transition-colors", buttonBgHover, textColor)}
            aria-label="Toggle search"
            disabled={isSearching}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Wishlist - Desktop only */}
          <Link
            to="/wishlist"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn("p-1.5 sm:p-2 rounded-full transition-colors relative hidden sm:block", buttonBgHover, textColor)}
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded-full bg-brand-600 text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User menu - Desktop only */}
          <div className="relative hidden sm:block">
            <button
              onClick={user ? () => setIsUserMenuOpen(!isUserMenuOpen) : onAuthClick}
              className={cn("p-1.5 sm:p-2 rounded-full transition-colors", buttonBgHover, textColor)}
              aria-label="User menu"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-2xl shadow-xl border border-brand-100 py-2 z-[60]"
                >
                  <div className="px-4 py-2 border-b border-brand-100">
                    <p className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-xs sm:text-sm font-medium truncate text-gray-900">{user.email}</p>
                  </div>
                  <Link
                    to="/my-orders"
                    className="flex items-center px-4 py-2 text-xs sm:text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-brand-400" />
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      showToast('Profile settings coming soon!');
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart button */}
          <button
            onClick={onCartClick}
            className={cn("p-1.5 sm:p-2 rounded-full transition-colors relative", buttonBgHover, textColor)}
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded-full bg-brand-600 text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - FORCED white background with black text */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop - semi-transparent black */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              className="fixed inset-0 backdrop-blur-sm z-[60]"
            />
            
            {/* Menu Panel - FORCED white background with inline style to override any theme */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ backgroundColor: '#ffffff' }}
              className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] z-[70] shadow-2xl flex flex-col"
            >
              {/* Header - White background, dark text */}
              <div style={{ backgroundColor: '#ffffff', borderBottomColor: '#e5e7eb' }} className="flex items-center justify-between p-6 border-b">
                <span style={{ color: '#111827' }} className="text-xl font-serif font-bold tracking-tighter">
                  CARTIFY
                </span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  style={{ color: '#374151' }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Menu Items - Black text on white background */}
              <div style={{ backgroundColor: '#ffffff' }} className="flex-1 overflow-y-auto py-6 px-6">
                <div className="flex flex-col space-y-1">
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Shop All')}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    Shop All
                  </a>
                  <Link
                    to="/new-arrivals"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    New Arrivals
                  </Link>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Best Sellers')}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    Best Sellers
                  </a>
                  <Link
                    to="/sustainability"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    Sustainability
                  </Link>
                  <Link
                    to="/my-orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium flex items-center justify-between"
                  >
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span style={{ backgroundColor: '#059669', color: '#ffffff' }} className="text-xs font-bold px-2 py-1 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Our Story')}
                    style={{ color: '#111827' }}
                    className="py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium block"
                  >
                    Our Story
                  </a>
                </div>
              </div>

              {/* Footer Actions - White background, black text */}
              <div style={{ backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' }} className="border-t p-6">
                <div className="flex flex-col space-y-3">
                  {!user ? (
                    <div
                      onClick={() => {
                        onAuthClick();
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ color: '#111827' }}
                      className="flex items-center space-x-3 py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors cursor-pointer"
                    >
                      <User style={{ color: '#374151' }} className="w-5 h-5" />
                      <span className="text-base font-medium">Sign In / Register</span>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2">
                        <p style={{ color: '#059669' }} className="text-xs font-bold uppercase tracking-widest mb-1">Signed in as</p>
                        <p style={{ color: '#111827' }} className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        style={{ color: '#dc2626' }}
                        className="flex items-center space-x-3 py-3 hover:bg-red-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                      >
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                  
                  <div
                    onClick={handleMobileSearchClick}
                    style={{ color: '#111827' }}
                    className="flex items-center space-x-3 py-3 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <Search style={{ color: '#374151' }} className="w-5 h-5" />
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
