import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Regular imports (non-lazy for critical components)
import Profile from './pages/Profile';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer as OriginalCartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LookbookModal } from './components/LookbookModal';
import { Footer } from './components/Footer';
import { OrderConfirmationOverlay } from './components/OrderConfirmationOverlay';
import { api } from './services/api';
import { Product, CartItem } from './types';

// Lazy load non-critical pages
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SustainabilityPage = lazy(() => import('./pages/SustainabilityPage'));
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserOrdersPage = lazy(() => import('./pages/UserOrdersPage'));

const CartDrawer = React.memo(OriginalCartDrawer);

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-white dark:bg-brand-950 flex items-center justify-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-4xl font-serif font-bold tracking-tighter"
    >
      cartify
    </motion.div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<{ items: CartItem[]; totalItems: number; totalAmount: number }>({
    items: [],
    totalItems: 0,
    totalAmount: 0,
  });
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Featured');

  const productGridRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Memoize cart items
  const memoizedCartItems = useMemo(() => cart.items, [cart.items]);
  const memoizedCartTotal = useMemo(() => cart.totalAmount, [cart.totalAmount]);
  const memoizedCartCount = useMemo(() => cart.totalItems, [cart.totalItems]);

  // Transform functions
  const transformCartItems = useCallback((items: any[]): CartItem[] =>
    items.map((item: any) => ({
      cartItemId: Number(item.cartItemId || 0),
      userId: Number(item.userId || 0),
      productId: String(item.productId || item.id || ''),
      productName: String(item.productName || item.name || ''),
      productPrice: Number(item.productPrice || item.price || 0),
      productImage: String(item.productImage || item.image || ''),
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.subtotal || 0),
      id: String(item.productId || item.id || ''),
      name: String(item.productName || item.name || ''),
      price: Number(item.productPrice || item.price || 0),
      image: String(item.productImage || item.image || ''),
    })), []);

  const transformCartResponse = useCallback((cartData: any) => {
    const items = Array.isArray(cartData.items) ? transformCartItems(cartData.items) : [];
    return {
      items,
      totalItems: typeof cartData.totalItems === 'number'
        ? cartData.totalItems
        : items.reduce((s, i) => s + i.quantity, 0),
      totalAmount: typeof cartData.totalAmount === 'number'
        ? cartData.totalAmount
        : items.reduce((s, i) => s + i.subtotal, 0),
    };
  }, [transformCartItems]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoaded(false);
      const isLoggedIn = !!localStorage.getItem('cartify_currentUser');
      
      // Fetch products from your actual API
      console.log('Fetching products from API...');
      const productsResponse = await api.getProducts();
      
      if (Array.isArray(productsResponse) && productsResponse.length > 0) {
        setProducts(productsResponse);
        console.log(`✅ Loaded ${productsResponse.length} products from API`);
      } else {
        console.warn('⚠️ API returned empty products array');
        setProducts([]);
        showToast('No products found in the database', 'info');
      }

      if (isLoggedIn) {
        try {
          const cartResponse = await api.getCart();
          if (cartResponse && typeof cartResponse === 'object') {
            const transformed = transformCartResponse(cartResponse);
            setCart(transformed);
          }
        } catch (cartError: any) {
          console.error('Cart fetch error:', cartError);
          if (cartError?.message?.includes('401')) {
            localStorage.removeItem('cartify_currentUser');
            setUser(null);
          }
          setCart({ items: [], totalItems: 0, totalAmount: 0 });
        }

        try {
          const wishlistResponse = await api.getWishlist();
          setWishlist(Array.isArray(wishlistResponse) ? wishlistResponse : []);
        } catch (wishlistError) {
          console.error('Wishlist fetch error:', wishlistError);
          setWishlist([]);
        }
      } else {
        setCart({ items: [], totalItems: 0, totalAmount: 0 });
        setWishlist([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      setProducts([]);
      showToast(`Failed to load products: ${error.message || 'API connection error'}`, 'error');
    } finally {
      setIsLoaded(true);
    }
  }, [transformCartResponse, showToast]);

  // Sync user from localStorage
  useEffect(() => {
    const checkUser = () => {
      const userStr = localStorage.getItem('cartify_currentUser');
      if (userStr) {
        try { 
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch { 
          setUser(null); 
        }
      } else {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Admin redirect on initial load
  useEffect(() => {
    const userStr = localStorage.getItem('cartify_currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.role === 'ADMIN' && location.pathname === '/') {
          navigate('/admin');
          showToast('Welcome to Admin Dashboard!', 'success');
        }
      } catch { }
    }
  }, [location.pathname, navigate, showToast]);

  // Scroll to top on route change
  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [location.pathname]);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCart({ items: [], totalItems: 0, totalAmount: 0 });
    setWishlist([]);
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  const addToCart = async (product: Product) => {
    if (!product?.id) return;

    const userStr = localStorage.getItem('cartify_currentUser');
    if (!userStr) {
      setIsAuthOpen(true);
      showToast('Please login to add items to cart', 'info');
      return;
    }

    if (selectedProduct) {
      setSelectedProduct(null);
    }

    setIsCartOpen(true);

    // Optimistic update
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(i => (i.productId || i.id) === product.id);

      if (existingItemIndex !== -1) {
        const updatedItems = [...prevCart.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = (existingItem.quantity || 0) + 1;
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: newQuantity * (existingItem.productPrice || existingItem.price || 0),
        };

        return {
          items: updatedItems,
          totalItems: prevCart.totalItems + 1,
          totalAmount: prevCart.totalAmount + (product.price || 0),
        };
      } else {
        const newItem: CartItem = {
          cartItemId: Date.now(),
          userId: 0,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.image,
          quantity: 1,
          subtotal: product.price,
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        };

        return {
          items: [...prevCart.items, newItem],
          totalItems: prevCart.totalItems + 1,
          totalAmount: prevCart.totalAmount + product.price,
        };
      }
    });

    showToast(`${product.name} added to cart!`, 'success');

    // Background sync with API
    try {
      await api.addToCart(product.id, 1);
      const updatedCart = await api.getCart();
      if (updatedCart && typeof updatedCart === 'object') {
        setCart(transformCartResponse(updatedCart));
      }
    } catch (error: any) {
      console.error('Background sync error:', error);
      showToast('Cart saved locally, will sync when online', 'info');
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    const item = cart.items.find(i => (i.productId || i.id) === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => ({
      items: prevCart.items.map(i =>
        (i.productId || i.id) === productId
          ? { ...i, quantity: newQuantity, subtotal: newQuantity * (i.productPrice || i.price || 0) }
          : i
      ),
      totalItems: prevCart.totalItems + delta,
      totalAmount: prevCart.totalAmount + delta * (item.productPrice || item.price || 0),
    }));

    try {
      await api.updateCartQuantity(productId, newQuantity);
    } catch (error: any) {
      console.error('Update quantity error:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    const item = cart.items.find(i => (i.productId || i.id) === productId);
    if (!item) return;

    setCart(prevCart => ({
      items: prevCart.items.filter(i => (i.productId || i.id) !== productId),
      totalItems: prevCart.totalItems - item.quantity,
      totalAmount: prevCart.totalAmount - (item.productPrice || item.price || 0) * item.quantity,
    }));

    try {
      await api.removeFromCart(productId);
    } catch (error: any) {
      console.error('Remove from cart error:', error);
    }
  };

  const toggleWishlist = async (product: Product) => {
    const userStr = localStorage.getItem('cartify_currentUser');
    if (!userStr) {
      setIsAuthOpen(true);
      showToast('Please login to manage wishlist', 'info');
      return;
    }

    const isCurrentlyWishlisted = wishlist.some(p => p.id === product.id);

    if (isCurrentlyWishlisted) {
      setWishlist(prev => prev.filter(p => p.id !== product.id));
      showToast(`${product.name} removed from wishlist`, 'info');
    } else {
      setWishlist(prev => [...prev, product]);
      showToast(`${product.name} added to wishlist`, 'success');
    }

    try {
      await api.toggleWishlist(product.id);
    } catch (error: any) {
      // Revert on error
      if (isCurrentlyWishlisted) {
        setWishlist(prev => [...prev, product]);
      } else {
        setWishlist(prev => prev.filter(p => p.id !== product.id));
      }
      showToast(error?.message || 'Failed to update wishlist', 'error');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (orderData?: any) => {
    try {
      setLastOrderDetails(orderData);
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
      setIsPaymentOpen(false);
      setIsOrderConfirmationOpen(true);
    } catch (error: any) {
      showToast(error?.message || 'Failed to process order', 'error');
    }
  };

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-brand-950 font-sans">
      <Navbar
        cartCount={memoizedCartCount}
        wishlistCount={wishlist.length}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => navigate('/wishlist')}
        onAuthClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        user={user}
        showToast={showToast}
        onSearch={setSearchQuery}
        onShopClick={() => productGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={
            <>
              <Hero
                showToast={showToast}
                onLookbookClick={() => setIsLookbookOpen(true)}
                onShopClick={() => productGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
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

          <Route path="/profile" element={
            user ? <Profile user={user} onLogout={handleLogout} showToast={showToast} />
              : <Navigate to="/" replace />
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

          <Route path="/admin" element={
            user?.role === 'ADMIN'
              ? <AdminDashboard user={user} onLogout={handleLogout} />
              : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <button onClick={() => navigate('/')}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                    Go Home
                  </button>
                </div>
              </motion.div>
          } />

          <Route path="/admin/orders" element={
            user?.role === 'ADMIN' 
              ? <Suspense fallback={<LoadingSpinner />}><AdminDashboard user={user} onLogout={handleLogout} /></Suspense> 
              : <Navigate to="/" replace />
          } />
          
          <Route path="/admin/products" element={
            user?.role === 'ADMIN' 
              ? <Suspense fallback={<LoadingSpinner />}><AdminDashboard user={user} onLogout={handleLogout} /></Suspense> 
              : <Navigate to="/" replace />
          } />
          
          <Route path="/admin/customers" element={
            user?.role === 'ADMIN' 
              ? <Suspense fallback={<LoadingSpinner />}><AdminDashboard user={user} onLogout={handleLogout} /></Suspense> 
              : <Navigate to="/" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <Footer
        showToast={showToast}
        onShopClick={() => productGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={memoizedCartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        isSyncing={false}
      />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        showToast={showToast}
        isWishlisted={selectedProduct ? wishlist.some(p => p?.id === selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
        onLoginSuccess={(userData) => {
          setUser(userData);
          localStorage.setItem('cartify_currentUser', JSON.stringify(userData));
          fetchData();
          setIsAuthOpen(false);
          const userName = userData.username || userData.email?.split('@')[0] || 'User';
          showToast(`Welcome to Cartify, ${userName}!`, 'success');
          if (userData.role === 'ADMIN') {
            navigate('/admin');
            showToast('Welcome to Admin Dashboard!', 'success');
          }
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={memoizedCartTotal}
        onSuccess={handlePaymentSuccess}
      />

      <LookbookModal
        isOpen={isLookbookOpen}
        onClose={() => setIsLookbookOpen(false)}
      />

      <OrderConfirmationOverlay
        isOpen={isOrderConfirmationOpen}
        onClose={() => { setIsOrderConfirmationOpen(false); setLastOrderDetails(null); }}
        orderDetails={lastOrderDetails}
      />

      <ToastContainer messages={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
