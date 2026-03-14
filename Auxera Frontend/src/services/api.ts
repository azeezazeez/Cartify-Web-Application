import { Product, CartItem } from '../types';

const BASE_URL = ' https://backend-38f0.onrender.com/api';

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
  const user = localStorage.getItem('auxera_currentUser');
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

      if (data.data) {
        localStorage.setItem('auxera_currentUser', JSON.stringify(data.data));
        console.log('User stored:', data.data);
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
    localStorage.removeItem('auxera_currentUser');
  },

  async updateProfile(userId: number, profileData: any) {
    const response = await fetch(`${BASE_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await handleResponse<any>(response);
    localStorage.setItem('auxera_currentUser', JSON.stringify(data));
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
    
    try {
      const response = await fetch(`${BASE_URL}/cart/${userId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [];
    }
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

  // Wishlist - UPDATED with defensive checks
  // Wishlist
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
    // First, get current wishlist to check status
    const currentWishlist = await this.getWishlist();
    const isCurrentlyInWishlist = currentWishlist.some(p => p && p.id === productId);
    
    console.log('Current wishlist status:', { productId, isCurrentlyInWishlist });

    let response;
    if (isCurrentlyInWishlist) {
      // Remove from wishlist
      console.log('Removing from wishlist:', productId);
      response = await fetch(`${BASE_URL}/wishlist/remove/${userId}/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Add to wishlist
      console.log('Adding to wishlist:', productId);
      response = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      });
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to toggle wishlist');
    }

    // Return the NEW state (opposite of what it was)
    return { isWishlisted: !isCurrentlyInWishlist };
    
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    throw error;
  }
},

  // Orders
  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    try {
      const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  async getOrderHistory(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/orders/user/${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      // Handle different response formats
      if (result && result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }

      if (Array.isArray(result)) {
        return result;
      }

      return [];
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  },

  // Admin Methods
  async adminGetAllOrders(): Promise<AdminOrder[]> {
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

  // Helper methods
  isAdmin(): boolean {
    return isAdmin();
  },

  getCurrentUser(): any | null {
    return getCurrentUser();
  }
};
