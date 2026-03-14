import { Product, CartItem } from '../types';

const BASE_URL = 'http://localhost:8080/api';


// Admin types
export interface AdminOrder {
  orderId: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  recentOrders: AdminOrder[];
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
}

// Helper to get current user from localStorage
const getCurrentUser = (): any | null => {
  const user = localStorage.getItem('cartify_currentUser');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// Helper to get current user ID from localStorage
const getUserId = (): number | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

// Helper to check if current user is admin
const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

// Standard response handler
async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'API request failed');
  }
  return result.data;
}

export const api = {
  // Auth
  // In api.ts - Update the login method
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user data (the response format you showed)
      if (data.data) {
        localStorage.setItem('cartify_currentUser', JSON.stringify(data.data));
        console.log('User stored:', data.data); // Debug log
      }

      return { user: data.data };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData: any) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(response);
  },

  logout() {
    localStorage.removeItem('cartify_currentUser');
  },

  async updateProfile(userId: number, profileData: any) {
    const response = await fetch(`${BASE_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await handleResponse<any>(response);
    localStorage.setItem('cartify_currentUser', JSON.stringify(data));
    return data;
  },

  async generateOtp(email: string) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<any>(response);
  },

  async resetPassword(resetData: any) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });
    return handleResponse<any>(response);
  },

  // Products
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let url = `${BASE_URL}/products`;
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url);
    return handleResponse<Product[]>(response);
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    return handleResponse<Product>(response);
  },

  // Cart
  async getCart(): Promise<CartItem[]> {
    const userId = getUserId();
    if (!userId) return [];
    const response = await fetch(`${BASE_URL}/cart/${userId}`);
    return handleResponse<CartItem[]>(response);
  },

  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');
    const response = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async updateCartQuantity(productId: string, quantity: number): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');
    const response = await fetch(`${BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async removeFromCart(productId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');
    const response = await fetch(`${BASE_URL}/cart/remove/${userId}/${productId}`, {
      method: 'DELETE',
    });
    await handleResponse<any>(response);
  },

  async clearCart(): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');
    const response = await fetch(`${BASE_URL}/cart/clear/${userId}`, {
      method: 'DELETE',
    });
    await handleResponse<any>(response);
  },




  // Wishlist - FIXED VERSION
  async getWishlist(): Promise<Product[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/wishlist/${userId}`);

      if (!response.ok) {
        console.error('Wishlist fetch failed:', response.status);
        return [];
      }

      const result = await response.json();

      // Handle different response formats
      if (result && typeof result === 'object') {
        if ('success' in result && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        if (Array.isArray(result)) {
          return result;
        }
        if (result.items && Array.isArray(result.items)) {
          return result.items;
        }
      }

      return [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<{ isWishlisted: boolean }> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    try {
      console.log('========== API TOGGLE WISHLIST ==========');
      console.log('User ID:', userId);
      console.log('Product ID:', productId);

      // Try to add to wishlist first (simpler approach)
      // If it fails with "already exists", then remove it

      // First attempt: Try to add
      console.log('ACTION: Attempting to add to wishlist');
      const addResponse = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      });

      const addResult = await addResponse.json();
      console.log('Add response:', addResult);

      // If add was successful, item was added
      if (addResponse.ok && addResult.success) {
        console.log('Successfully added to wishlist');
        return { isWishlisted: true };
      }

      // If add failed because item already exists, then remove it
      if (addResult.message?.toLowerCase().includes('already') ||
        addResult.message?.toLowerCase().includes('exists')) {

        console.log('Item already exists, removing from wishlist');
        const removeResponse = await fetch(`${BASE_URL}/wishlist/remove/${userId}/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        const removeResult = await removeResponse.json();
        console.log('Remove response:', removeResult);

        if (removeResponse.ok) {
          console.log('Successfully removed from wishlist');
          return { isWishlisted: false };
        }
      }

      // If we get here, something went wrong
      throw new Error(addResult.message || 'Failed to toggle wishlist');

    } catch (error) {
      console.error('Toggle wishlist error:', error);
      throw error;
    }
  },
  // Orders
  // In api.ts - Update the createOrder method
  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    try {
      const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // You might want to send additional data like shipping address, payment method etc.
        // body: JSON.stringify({ 
        //   shippingAddress: shippingAddress,
        //   paymentMethod: paymentMethod 
        // }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data.data; // Return the created order data
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // In your api.ts file, update the getOrderHistory function:

  async getOrderHistory(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) return [];

    const response = await fetch(`${BASE_URL}/orders/user/${userId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await handleResponse<any>(response);

    // Your API returns { success, message, data }
    // Extract the data array from the response
    if (result && result.success && result.data) {
      return result.data;
    }

    // If it's already an array, return it
    if (Array.isArray(result)) {
      return result;
    }

    return [];
  },

  // Admin Methods - Modified to not use JWT
  async adminGetAllOrders(): Promise<AdminOrder[]> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/orders`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }
    return data.data;
  },

  async adminGetOrderById(orderId: string): Promise<AdminOrder> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch order');
    }
    return data.data;
  },

  async adminUpdateOrderStatus(orderId: string, status: string): Promise<AdminOrder> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update order status');
    }
    return data.data;
  },

  async adminGetOrdersByStatus(status: string): Promise<AdminOrder[]> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/orders/status/${status}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }
    return data.data;
  },

  async adminGetOrderStats(): Promise<OrderStats> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/orders/stats`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch stats');
    }
    return data.data;
  },

  async adminGetAllCustomers(): Promise<AdminCustomer[]> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/customers`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch customers');
    }
    return data.data;
  },

  async adminGetCustomerById(customerId: number): Promise<AdminCustomer> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/customers/${customerId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch customer');
    }
    return data.data;
  },

  async adminGetCustomerOrders(customerId: number): Promise<AdminOrder[]> {
    // Check if user is admin
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const response = await fetch(`${BASE_URL}/admin/customers/${customerId}/orders`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch customer orders');
    }
    return data.data;
  },

  // Helper method to check if user is admin
  isAdmin(): boolean {
    return isAdmin();
  },

  // Helper method to get current user
  getCurrentUser(): any | null {
    return getCurrentUser();
  }
};