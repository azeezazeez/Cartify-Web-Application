import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // 1.5 inch ≈ 144px
  const SCROLL_THRESHOLD = 144;

  // Route checks
  const isSpecialPage =
    location.pathname.includes('/admin') ||
    location.pathname === '/my-orders' ||
    location.pathname === '/sustainability' ||
    location.pathname === '/wishlist' ||
    location.pathname === '/profile';

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY >= SCROLL_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close user menu outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // 🔥 FINAL LOGIC
  const isNavbarSolid = isScrolled || isSpecialPage;
  const useDarkText = isNavbarSolid;

  const textColor = useDarkText ? 'text-gray-900' : 'text-white';
  const logoColor = textColor;
  const iconColor = textColor;
  const hoverColor = useDarkText ? 'hover:text-gray-600' : 'hover:text-white/80';
  const buttonBgHover = useDarkText ? 'hover:bg-gray-100' : 'hover:bg-white/20';

  const handleSearchToggle = () => {
    setIsSearchOpen(prev => !prev);
    if (isSearchOpen) {
      setSearchValue('');
      onSearch('');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (label === 'Shop') {
      navigate('/');
      setTimeout(onShopClick, 100);
    } else if (label === 'About') {
      navigate('/');
    } else {
      showToast(`${label} page coming soon`);
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.name) {
      const parts = user.name.split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : user.name.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <nav
      ref={navbarRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 transition-all duration-300',
        'h-16 sm:h-20 flex items-center',
        isNavbarSolid ? 'bg-white shadow-md' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">

        {/* Mobile Menu Button */}
        <button
          className={cn('lg:hidden p-2 rounded-full', buttonBgHover, textColor)}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className={cn('text-xl font-bold', logoColor)}>CARTIFY</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex space-x-8 text-sm uppercase font-medium">
          <a onClick={(e) => handleLinkClick(e, 'Shop')} className={cn(textColor, hoverColor)}>Shop</a>
          <Link to="/new-arrivals" className={cn(textColor, hoverColor)}>New Arrivals</Link>
          <Link to="/sustainability" className={cn(textColor, hoverColor)}>Sustainability</Link>
          <a onClick={(e) => handleLinkClick(e, 'About')} className={cn(textColor, hoverColor)}>About</a>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button onClick={handleSearchToggle} className={cn('p-2', buttonBgHover, iconColor)}>
            <Search className="w-5 h-5" />
          </button>

          <button onClick={onCartClick} className={cn('p-2', buttonBgHover, iconColor)}>
            <ShoppingBag className="w-5 h-5" />
          </button>

          {user ? (
            <div ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(prev => !prev)}>
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  {getUserInitials()}
                </div>
              </button>
            </div>
          ) : (
            <button onClick={onAuthClick} className={cn('p-2', buttonBgHover, iconColor)}>
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
            className="fixed inset-0 bg-white p-6 z-[100]"
          >
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
