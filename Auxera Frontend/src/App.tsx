import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// Import components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LookbookModal } from './components/LookbookModal';
import { Footer } from './components/Footer';

// Import pages
import { WishlistPage } from './pages/WishlistPage';
import { SustainabilityPage } from './pages/SustainabilityPage';
import { NewArrivalsPage } from './pages/NewArrivalsPage';
import AdminDashboard from './pages/AdminDashboard';
import { UserOrdersPage } from './pages/UserOrdersPage';
// Import services and types
import { api } from './services/api';
import { Product, CartItem } from './types';

// Define interface for API response
interface WishlistResponse {
  items?: Product[];
  totalItems?: number;
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<{ items: CartItem[]; totalItems: number; totalAmount: number }>({
    items: [],
    totalItems: 0,
    totalAmount: 0
  });
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('auxera_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [isCartSyncing, setIsCartSyncing] = useState(false);

  const productGridRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Debug logs
  useEffect(() => {
    console.log('Current products:', products);
    console.log('Current cart items:', cart.items);
    console.log('Cart total items:', cart.totalItems);
    console.log('Current wishlist:', wishlist);
    console.log('Current user:', user);
  }, [products, cart, wishlist, user]);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync user state with localStorage
  useEffect(() => {
    const checkUser = () => {
      const userStr = localStorage.getItem('auxera_currentUser');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          console.log('User synced from localStorage:', userData);
        } catch (e) {
          console.error('Failed to parse user data');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  // Handle initial user load and redirect admin if on home page
  useEffect(() => {
    const userStr = localStorage.getItem('auxera_currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Redirect admin to dashboard if they're on home page
        if (userData.role === 'ADMIN' && location.pathname === '/') {
          navigate('/admin');
          showToast('Welcome to Admin Dashboard!', 'success');
        }
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, [location.pathname, navigate, showToast]);

  const fetchData = useCallback(async () => {
    try {
      const [p, c, w] = await Promise.all([
        api.getProducts(),
        api.getCart(),
        api.getWishlist()
      ]);

      console.log('📦 Products:', p);
      console.log('🛒 Cart raw data:', c);
      console.log('❤️ Wishlist raw data:', w);

      // Set products
      setProducts(Array.isArray(p) ? p : []);

      // Set cart - with proper type checking
      if (c && typeof c === 'object') {
        const cartData = c as any;
        // Transform backend cart format to frontend CartItem format
        const transformedItems = Array.isArray(cartData.items) ? cartData.items.map((item: any) => ({
          productId: String(item.productId || item.id || ''),
          productName: String(item.productName || item.name || ''),
          productPrice: Number(item.productPrice || item.price || 0),
          productImage: String(item.productImage || item.image || ''),
          quantity: Number(item.quantity || 1),
          subtotal: Number(item.subtotal || (item.quantity * (item.productPrice || item.price || 0)) || 0),
          id: String(item.productId || item.id || ''),
          name: String(item.productName || item.name || ''),
          price: Number(item.productPrice || item.price || 0),
          image: String(item.productImage || item.image || '')
        })) : [];

        setCart({
          items: transformedItems,
          totalItems: typeof cartData.totalItems === 'number' ? cartData.totalItems : transformedItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
          totalAmount: typeof cartData.totalAmount === 'number' ? cartData.totalAmount : transformedItems.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0)
        });
      } else {
        setCart({ items: [], totalItems: 0, totalAmount: 0 });
      }

      // Set wishlist - properly handle different response formats
      if (w) {
        if (Array.isArray(w)) {
          setWishlist(w);
        } else if (typeof w === 'object' && w !== null) {
          const wishlistData = w as WishlistResponse;
          if (wishlistData.items && Array.isArray(wishlistData.items)) {
            setWishlist(wishlistData.items);
          } else {
            setWishlist([]);
          }
        } else {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCart({ items: [], totalItems: 0, totalAmount: 0 });
    setWishlist([]);
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('auxera_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const addToCart = async (product: Product) => {
    try {
      // Check if product is valid
      if (!product || !product.id) {
        console.error('Invalid product:', product);
        showToast('Invalid product', 'info');
        return;
      }

      // Check if user is logged in
      const userStr = localStorage.getItem('auxera_currentUser');
      console.log('Current user in localStorage:', userStr);

      if (!userStr) {
        setIsAuthOpen(true);
        showToast('Please login to add items to cart', 'info');
        return;
      }

      // Parse user data to verify it's valid
      try {
        const userData = JSON.parse(userStr);
        if (!userData || !userData.id) {
          localStorage.removeItem('auxera_currentUser');
          setIsAuthOpen(true);
          showToast('Session expired. Please login again.', 'info');
          return;
        }
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('auxera_currentUser');
        setIsAuthOpen(true);
        showToast('Session expired. Please login again.', 'info');
        return;
      }

      console.log('Adding to cart:', product);

      // Call backend API to add to cart
      setIsCartSyncing(true);
      await api.addToCart(product.id, 1);

      // Refresh cart from backend to ensure consistency
      const updatedCart = await api.getCart();

      // Transform and set cart
      if (updatedCart && typeof updatedCart === 'object') {
        const cartData = updatedCart as any;
        const transformedItems = Array.isArray(cartData.items) ? cartData.items.map((item: any) => ({
          productId: String(item.productId || item.id || ''),
          productName: String(item.productName || item.name || ''),
          productPrice: Number(item.productPrice || item.price || 0),
          productImage: String(item.productImage || item.image || ''),
          quantity: Number(item.quantity || 1),
          subtotal: Number(item.subtotal || (item.quantity * (item.productPrice || item.price || 0)) || 0),
          id: String(item.productId || item.id || ''),
          name: String(item.productName || item.name || ''),
          price: Number(item.productPrice || item.price || 0),
          image: String(item.productImage || item.image || '')
        })) : [];

        setCart({
          items: transformedItems,
          totalItems: typeof cartData.totalItems === 'number' ? cartData.totalItems : transformedItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
          totalAmount: typeof cartData.totalAmount === 'number' ? cartData.totalAmount : transformedItems.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0)
        });
      }

      showToast(`${product.name} added to cart!`, 'success');
      setIsCartOpen(true);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      showToast(error?.message || 'Failed to add to cart', 'info');
    } finally {
      setIsCartSyncing(false);
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      setIsCartSyncing(true);

      // Call backend API to update quantity
      await api.updateCartQuantity(productId, newQuantity);

      // Update local state optimistically
      setCart(prevCart => {
        const updatedItems = prevCart.items.map(item =>
          item.productId === productId
            ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * (item.productPrice || 0)
            }
            : item
        );

        const priceDiff = delta * (item.productPrice || 0);

        return {
          items: updatedItems,
          totalItems: prevCart.totalItems + delta,
          totalAmount: prevCart.totalAmount + priceDiff
        };
      });

      showToast('Cart updated', 'success');
    } catch (error: any) {
      console.error('Update quantity error:', error);
      showToast(error?.message || 'Failed to update cart', 'info');

      // Refresh cart to revert to server state
      const refreshedCart = await api.getCart();
      if (refreshedCart && typeof refreshedCart === 'object') {
        const cartData = refreshedCart as any;
        const transformedItems = Array.isArray(cartData.items) ? cartData.items.map((item: any) => ({
          productId: String(item.productId || item.id || ''),
          productName: String(item.productName || item.name || ''),
          productPrice: Number(item.productPrice || item.price || 0),
          productImage: String(item.productImage || item.image || ''),
          quantity: Number(item.quantity || 1),
          subtotal: Number(item.subtotal || (item.quantity * (item.productPrice || item.price || 0)) || 0),
          id: String(item.productId || item.id || ''),
          name: String(item.productName || item.name || ''),
          price: Number(item.productPrice || item.price || 0),
          image: String(item.productImage || item.image || '')
        })) : [];

        setCart({
          items: transformedItems,
          totalItems: typeof cartData.totalItems === 'number' ? cartData.totalItems : transformedItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
          totalAmount: typeof cartData.totalAmount === 'number' ? cartData.totalAmount : transformedItems.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0)
        });
      }
    } finally {
      setIsCartSyncing(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return;

    try {
      setIsCartSyncing(true);

      // Call backend API to remove from cart
      await api.removeFromCart(productId);

      // Update local state
      setCart(prevCart => ({
        items: prevCart.items.filter(item => item.productId !== productId),
        totalItems: prevCart.totalItems - item.quantity,
        totalAmount: prevCart.totalAmount - ((item.productPrice || 0) * item.quantity)
      }));

      showToast('Item removed from cart', 'info');
    } catch (error: any) {
      console.error('Remove from cart error:', error);
      showToast(error?.message || 'Failed to remove item', 'info');
    } finally {
      setIsCartSyncing(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsCartSyncing(true);

      // Call backend API to clear cart
      await api.clearCart();

      // Update local state
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
      showToast('Cart cleared', 'info');
    } catch (error: any) {
      console.error('Clear cart error:', error);
      showToast(error?.message || 'Failed to clear cart', 'info');
    } finally {
      setIsCartSyncing(false);
    }
  };

  const toggleWishlist = async (product: Product) => {
    try {
      const userStr = localStorage.getItem('auxera_currentUser');
      if (!userStr) {
        setIsAuthOpen(true);
        showToast('Please login to manage wishlist', 'info');
        return;
      }

      console.log('Toggling wishlist for:', product);

      // Call backend API to toggle wishlist
      const result = await api.toggleWishlist(product.id);

      // Update local state based on backend response
      if (result.isWishlisted) {
        setWishlist(prev => [...prev, product]);
        showToast(`${product.name} added to wishlist`, 'success');
      } else {
        setWishlist(prev => prev.filter(item => item && item.id !== product.id));
        showToast(`${product.name} removed from wishlist`, 'info');
      }
    } catch (error: any) {
      console.error('Toggle wishlist error:', error);
      showToast(error?.message || 'Failed to update wishlist', 'info');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      showToast('Processing your order...', 'info');

      // Call backend API to create order
      const orderResponse = await api.createOrder();

      console.log('Order created:', orderResponse);

      // Clear local cart state
      setCart({ items: [], totalItems: 0, totalAmount: 0 });

      // Close payment modal
      setIsPaymentOpen(false);

      showToast('Order placed successfully!', 'success');

      // Optional: Navigate to order confirmation page
      // navigate('/order-confirmation', { state: { order: orderResponse } });

    } catch (error: any) {
      console.error('Payment error:', error);
      showToast(error?.message || 'Failed to process order', 'info');
    }
  };

  const scrollToShop = () => {
    productGridRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cartCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalAmount || 0;
  const wishlistCount = wishlist.length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // If not loaded yet, show loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-brand-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-serif font-bold tracking-tighter"
        >
          AUXERA
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-brand-950 font-sans">
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => navigate('/wishlist')}
        onAuthClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        user={user}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        showToast={showToast}
        onSearch={setSearchQuery}
        onShopClick={scrollToShop}
      />

      <Routes>
        <Route path="/" element={
          <>
            <Hero
              showToast={showToast}
              onLookbookClick={() => setIsLookbookOpen(true)}
              onShopClick={scrollToShop}
            />

            <div ref={productGridRef}>
              <ProductGrid
                products={products}
                onAddToCart={addToCart}
                onProductClick={(product) => setSelectedProduct(product)}
                showToast={showToast}
                searchQuery={searchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                showOnlyWishlist={false}
              />
            </div>
          </>
        } />

        <Route path="/my-orders" element={<UserOrdersPage />} />


        <Route path="/wishlist" element={
          <WishlistPage
            wishlist={wishlist}
            onAddToCart={addToCart}
            onProductClick={(product) => setSelectedProduct(product)}
            onToggleWishlist={toggleWishlist}
          />
        } />

        <Route path="/sustainability" element={<SustainabilityPage />} />

        <Route path="/new-arrivals" element={
          <NewArrivalsPage
            products={products}
            onAddToCart={addToCart}
            onProductClick={(product) => setSelectedProduct(product)}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
          />
        } />

        {/* Admin Routes - Protected */}
        <Route
          path="/admin"
          element={
            user?.role === 'ADMIN' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Go Home
                  </button>
                </div>
              </motion.div>
            )
          }
        />

        <Route
          path="/admin/orders"
          element={
            user?.role === 'ADMIN' ? (
              <div>Orders Management</div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/products"
          element={
            user?.role === 'ADMIN' ? (
              <div>Products Management</div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/customers"
          element={
            user?.role === 'ADMIN' ? (
              <div>Customers Management</div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      <Footer showToast={showToast} onShopClick={scrollToShop} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart?.items || []}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        isSyncing={isCartSyncing}
      />

  <ProductModal
  product={selectedProduct}
  onClose={() => setSelectedProduct(null)}
  onAddToCart={addToCart}
  showToast={showToast}
  isWishlisted={selectedProduct ? (Array.isArray(wishlist) && wishlist.some(p => p && p.id === selectedProduct.id)) : false}
  onToggleWishlist={toggleWishlist}
  />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
        onLoginSuccess={(userData) => {
          console.log('Login success, user data:', userData);
          setUser(userData);
          localStorage.setItem('auxera_currentUser', JSON.stringify(userData));
          fetchData();
          setIsAuthOpen(false);

          // Redirect admin to dashboard after login
          if (userData.role === 'ADMIN') {
            navigate('/admin');
            showToast('Welcome to Admin Dashboard!', 'success');
          }
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={cartTotal}
        onSuccess={handlePaymentSuccess}
      />

      <LookbookModal
        isOpen={isLookbookOpen}
        onClose={() => setIsLookbookOpen(false)}
      />

      <ToastContainer messages={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
