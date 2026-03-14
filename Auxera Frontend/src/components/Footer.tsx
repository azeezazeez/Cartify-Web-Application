import React, { useState } from 'react';
import { Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';

interface FooterProps {
  showToast: (text: string, type?: 'success' | 'info') => void;
  onShopClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ showToast, onShopClick }) => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      showToast('Thank you for subscribing!', 'success');
      setEmail('');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    if (label === 'All Products' || label === 'New Arrivals' || label === 'Best Sellers' || label === 'Collections') {
      onShopClick();
    } else {
      showToast(`${label} page is coming soon!`);
    }
  };

  return (
    <footer className="bg-brand-950 text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold tracking-tighter">Cartify</h2>
            <p className="text-brand-400 text-sm leading-relaxed max-w-xs">
              Crafting premium essentials for the modern lifestyle. We believe in quality, sustainability, and timeless design.
            </p>
            <div className="flex space-x-4">
              <a href="#" onClick={(e) => handleLinkClick(e, 'Instagram')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" onClick={(e) => handleLinkClick(e, 'Twitter')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" onClick={(e) => handleLinkClick(e, 'Facebook')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-500">Shop</h4>
            <ul className="space-y-4 text-sm text-brand-300">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'All Products')} className="hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'New Arrivals')} className="hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Best Sellers')} className="hover:text-white transition-colors">Best Sellers</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Collections')} className="hover:text-white transition-colors">Collections</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Gift Cards')} className="hover:text-white transition-colors">Gift Cards</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-500">Support</h4>
            <ul className="space-y-4 text-sm text-brand-300">
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Shipping Policy')} className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Returns & Exchanges')} className="hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Contact Us')} className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'FAQs')} className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Policy')} className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-500">Newsletter</h4>
            <p className="text-sm text-brand-300 mb-6">Join our community for exclusive updates and early access.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors"
                required
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-brand-950 rounded-full hover:bg-brand-100 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-[10px] uppercase tracking-widest text-brand-500 font-bold">
          <p>© 2026 Cartify STUDIO. ALL RIGHTS RESERVED.</p>
          <div className="flex space-x-8">
            <a href="#" onClick={(e) => handleLinkClick(e, 'Terms of Service')} className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Policy')} className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Cookie Settings')} className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
