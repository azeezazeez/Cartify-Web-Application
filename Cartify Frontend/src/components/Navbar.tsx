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

  const handleMobileSearchClick = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(true);
  };

  // FIX 1: Proper search submission with scrolling
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      return;
    }

    setIsSearching(true);
    
    // Call the onSearch prop to filter products
    onSearch(searchValue.trim());

    // Close mobile menu if open
    setIsMobileMenuOpen(false);
    
    // Close search input
    setIsSearchOpen(false);

    // Navigate to home page if not already there
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // FIX: Improved function to find and scroll to products
    const scrollToProducts = () => {
      console.log('Searching for products section...');
      
      // Try multiple selectors to find products section
      const selectors = [
        // Common grid classes
        '.products-grid',
        '.product-grid',
        '.product-list',
        '.products-section',
        '.featured-products',
        '.product-collection',
        
        // Data attributes
        '[data-testid="products-grid"]',
        '[data-products]',
        '[data-section="products"]',
        
        // ID based
        '#products',
        '#products-section',
        '#product-list',
        
        // Section based
        'section.products',
        'section.product-section',
        'section.featured-products',
        
        // Grid based
        '.grid.grid-cols-1',
        '.grid.grid-cols-2',
        '.grid.grid-cols-3',
        '.grid.grid-cols-4',
        
        // Common e-commerce patterns
        '.shop-products',
        '.collection-products',
        '.catalog-products',
        
        // Generic fallbacks
        'main > section',
        '.container > section',
        '.max-w-7xl > section'
      ];

      let productsSection = null;
      
      // Try each selector
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Check if this element likely contains products
          if (
            element.children.length > 0 &&
            (element.querySelector('img') || 
             element.innerHTML.includes('product') ||
             element.className.includes('product'))
          ) {
            productsSection = element;
            console.log('Found products section with selector:', selector);
            break;
          }
        }
        if (productsSection) break;
      }

      // If still not found, look for any element containing product cards
      if (!productsSection) {
        console.log('Trying fallback search...');
        const allElements = document.querySelectorAll('section, div, main');
        
        for (const element of allElements) {
          const html = element.innerHTML.toLowerCase();
          if (
            (html.includes('product-card') ||
             html.includes('product-item') ||
             html.includes('product-') ||
             (element.children.length >= 2 && 
              element.querySelectorAll('img').length >= 2)) &&
            element.children.length > 0
          ) {
            productsSection = element;
            console.log('Found products section via content analysis');
            break;
          }
        }
      }

      if (productsSection) {
        // Get the exact position
        const rect = productsSection.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset;
        
        // Smooth scroll to products section with offset for navbar
        window.scrollTo({
          top: absoluteTop - 80, // Offset for navbar
          behavior: 'smooth'
        });
        
        // Highlight the section briefly
        productsSection.classList.add('search-highlight');
        setTimeout(() => {
          productsSection?.classList.remove('search-highlight');
        }, 1500);
        
        showToast(`Showing results for "${searchValue}"`, 'success');
      } else {
        console.log('No products section found');
        showToast(`No products found for "${searchValue}"`, 'info');
      }
    };

    // Wait for products to render and DOM to update
    setTimeout(scrollToProducts, 800);
    
    setIsSearching(false);
  };

  // FIX 2: Navbar with fixed height and no compression
  const navbarClasses = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    'h-16 sm:h-20', // Fixed height - 64px on mobile, 80px on desktop
    'flex items-center',
    'px-4 sm:px-6 lg:px-8',
    isScrolled 
      ? 'bg-black/80 backdrop-blur-md shadow-lg' 
      : 'bg-transparent',
    // Ensure no overflow or compression
    'overflow-visible shrink-0'
  );

  // Always white text
  const textColor = 'text-white';
  const logoColor = 'text-white';
  const hoverColor = 'hover:text-white/80';
  const buttonBgHover = 'hover:bg-white/20';
  const searchBgColor = 'bg-white/20';
  const searchTextColor = 'text-white';
  const searchPlaceholderColor = 'placeholder-white/70';
  const iconColor = 'text-white';

  return (
    <>
      <nav
        ref={navbarRef}
        className={navbarClasses}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-full">
          {/* Left section - Mobile Menu Toggle */}
          <div className="flex items-center lg:w-1/4">
            <button
              className={cn(
                "lg:hidden p-2 rounded-full transition-colors",
                buttonBgHover,
                textColor
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Center section - Logo */}
          <div className="flex items-center justify-center lg:w-1/2">
            <Link
              to="/"
              className={cn(
                "text-xl sm:text-2xl lg:text-3xl font-serif font-bold tracking-tighter transition-colors duration-300",
                logoColor
              )}
            >
              CARTIFY
            </Link>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-2 lg:w-1/4">
            {/* Search input */}
            <form 
              onSubmit={handleSearchSubmit}
              className={cn(
                "flex items-center rounded-full px-2 sm:px-3 py-1 transition-all duration-300",
                searchBgColor,
                isSearchOpen ? "w-24 sm:w-32 md:w-40 lg:w-48 opacity-100" : "w-0 opacity-0 overflow-hidden px-0"
              )}
            >
              <Search className={cn("w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0", iconColor)} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={handleSearchChange}
                disabled={isSearching}
                className={cn(
                  "bg-transparent border-none outline-none text-xs sm:text-sm w-full",
                  searchTextColor,
                  searchPlaceholderColor,
                  isSearching && "opacity-50 cursor-wait"
                )}
              />
              {searchValue && !isSearching && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="ml-1 p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                  aria-label="Clear search"
                >
                  <X className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </button>
              )}
              {isSearching && (
                <div className="ml-1 w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
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
              className={cn("p-1.5 sm:p-2 rounded-full transition-colors relative hidden md:block", buttonBgHover, textColor)}
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
            <div className="relative hidden md:block">
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-brand-100 py-2 z-[70]"
                  >
                    <div className="px-4 py-2 border-b border-brand-100">
                      <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Signed in as</p>
                      <p className="text-sm font-medium truncate text-gray-900">{user.email}</p>
                    </div>
                    <Link
                      to="/my-orders"
                      className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="w-4 h-4 mr-2 text-brand-400" />
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        showToast('Profile settings coming soon!');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-brand-50 transition-colors"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
      </nav>

      {/* Desktop Navigation Links - Separate line below navbar when scrolled */}
      {isScrolled && (
        <div className="fixed top-16 sm:top-20 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 z-40 hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
              <a
                href="#"
                onClick={(e) => handleLinkClick(e, 'Shop')}
                className="text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                Shop
              </a>
              <Link
                to="/new-arrivals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                New Arrivals
              </Link>
              <Link
                to="/sustainability"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                Sustainability
              </Link>
              <a
                href="#"
                onClick={(e) => handleLinkClick(e, 'About')}
                className="text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                About
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <span className="text-xl font-serif font-bold tracking-tighter text-gray-900">
                  CARTIFY
                </span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-6">
                <div className="flex flex-col space-y-1">
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Shop All')}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    Shop All
                  </a>
                  <Link
                    to="/new-arrivals"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    New Arrivals
                  </Link>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Best Sellers')}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    Best Sellers
                  </a>
                  <Link
                    to="/sustainability"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    Sustainability
                  </Link>
                  <Link
                    to="/my-orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium flex items-center justify-between"
                  >
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, 'Our Story')}
                    className="py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                  >
                    Our Story
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6">
                <div className="flex flex-col space-y-3">
                  {!user ? (
                    <div
                      onClick={() => {
                        onAuthClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors cursor-pointer"
                    >
                      <User className="w-5 h-5 text-gray-700" />
                      <span className="text-base font-medium">Sign In / Register</span>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center space-x-3 py-3 text-red-600 hover:bg-red-50 px-4 -mx-4 rounded-lg transition-colors text-base font-medium"
                      >
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                  
                  <div
                    onClick={handleMobileSearchClick}
                    className="flex items-center space-x-3 py-3 text-gray-900 hover:text-brand-600 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <Search className="w-5 h-5 text-gray-700" />
                    <span className="text-base font-medium">Search</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
