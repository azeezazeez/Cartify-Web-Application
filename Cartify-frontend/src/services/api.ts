import { Product, CartItem } from '../types';

const BASE_URL = 'http://localhost:8080/api';

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

// Helper to get auth token
const getAuthToken = (): string | null => {
  const user = getCurrentUser();
  return user?.token || null;
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

// Helper to get auth headers for authenticated requests
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Standard response handler with better error handling
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    try {
      const result = JSON.parse(text);
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch (e) {
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }
  }

  const result = await response.json();

  if (result && typeof result === 'object' && 'success' in result && !result.success) {
    throw new Error(result.message || 'API request failed');
  }

  return (result && typeof result === 'object' && 'data' in result) ? result.data : result;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
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
      localStorage.setItem('cartify_currentUser', JSON.stringify(data.data));
    }

    return { user: data.data };
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

  // Products (Public - No Auth)
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

  // Cart (Requires Auth)
  async getCart(): Promise<any> {
    const userId = getUserId();
    if (!userId) return { items: [], totalItems: 0, totalAmount: 0 };

    try {
      const response = await fetch(`${BASE_URL}/cart/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return { items: [], totalItems: 0, totalAmount: 0 };
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], totalItems: 0, totalAmount: 0 };
    }
  },

  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async updateCartQuantity(productId: string, quantity: number): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async removeFromCart(productId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/remove/${userId}/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<any>(response);
  },

  async clearCart(): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/clear/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<any>(response);
  },

  // Wishlist (Requires Auth)
  async getWishlist(): Promise<Product[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/wishlist/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      const result = await response.json();

      if (result && typeof result === 'object') {
        if ('success' in result && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        if (Array.isArray(result)) return result;
        if (result.items && Array.isArray(result.items)) return result.items;
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
      console.log('Toggling wishlist - User ID:', userId, 'Product ID:', productId);

      // First, try to ADD to wishlist
      const addResponse = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, productId }),
      });

      // If add succeeds (200 OK), product was NOT in wishlist - now it is added
      if (addResponse.ok) {
        console.log('Successfully added to wishlist');
        return { isWishlisted: true };
      }

      // If add fails with 409 (Conflict), product IS already in wishlist - so remove it
      if (addResponse.status === 409) {
        console.log('Product already in wishlist, removing...');
        const removeResponse = await fetch(`${BASE_URL}/wishlist/remove/${userId}/${productId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (removeResponse.ok) {
          console.log('Successfully removed from wishlist');
          return { isWishlisted: false };
        } else {
          const errorData = await removeResponse.json();
          console.error('Remove failed:', errorData);
          throw new Error(errorData.message || 'Failed to remove from wishlist');
        }
      }

      // Handle other errors
      const errorData = await addResponse.json();
      throw new Error(errorData.message || 'Failed to toggle wishlist');
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      throw error;
    }
  },

  // Orders (Requires Auth)
  // Orders (Requires Auth)
  // Orders
  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shippingAddress: 'Default Address' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to place order');
    }
    return result.data;
  },

  async getOrderHistory(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch orders: HTTP ${response.status} — ${text}`);
    }

    const result = await response.json();

    if (result?.success && Array.isArray(result.data)) return result.data;
    if (Array.isArray(result)) return result;
    return [];
  },

  async getOrderById(orderId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  async cancelOrder(orderId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },


  async getUserProfile(): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  async updateUserProfile(profileData: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse<any>(response);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/auth/profile/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<void>(response);
  },

  // Admin Methods (Requires Auth + Admin Role)
  async adminGetAllOrders(): Promise<AdminOrder[]> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch orders');
    return data.data;
  },

  async adminGetOrderStats(): Promise<OrderStats> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders/stats`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch stats');
    return data.data;
  },

  async adminUpdateOrderStatus(orderId: string, status: string): Promise<AdminOrder> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update order status');
    return data.data;
  },

  async adminGetAllCustomers(): Promise<AdminCustomer[]> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/customers`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch customers');
    return data.data;
  },

  // Helper Methods
  isAdmin(): boolean {
    return isAdmin();
  },

  getCurrentUser(): any | null {
    return getCurrentUser();
  },

  getUserId(): number | null {
    return getUserId();
  },

  getAuthToken(): string | null {
    return getAuthToken();
  }
};