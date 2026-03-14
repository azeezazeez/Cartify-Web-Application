// types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  inStock: boolean;
}

export interface CartItem {
  cartItemId: number;        // From backend
  userId: number;            // From backend
  productId: string;         // From backend
  productName: string;       // From backend
  productPrice: number;      // From backend
  productImage: string;      // From backend
  quantity: number;          // From backend
  subtotal: number;          // From backend (price * quantity)
  
  // Optional fields for backward compatibility
  id?: string;               // Maps to productId for compatibility
  name?: string;             // Maps to productName for compatibility
  price?: number;            // Maps to productPrice for compatibility
  image?: string;            // Maps to productImage for compatibility
  category?: string;         // May need to fetch separately if needed
}

export interface WishlistItem {
  wishlistItemId: number;
  userId: number;
  productId: string;
  productName: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  addedAt: string;
}

export interface CartResponse {
  userId: number;
  totalItems: number;
  totalAmount: number;
  items: CartItem[];
}

export interface WishlistResponse {
  userId: number;
  totalItems: number;
  items: WishlistItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
}

export type Category = 'All' | 'electronics' | 'clothing' | 'books' | 'home' | 'accessories';

// Helper function to convert backend CartItem to frontend CartItem (with compatibility fields)
export function toCartItem(backendItem: any): CartItem {
  return {
    ...backendItem,
    // Add compatibility fields
    id: backendItem.productId,
    name: backendItem.productName,
    price: backendItem.productPrice,
    image: backendItem.productImage,
  };
}

// Helper function to convert frontend CartItem to backend format for API calls
export function toBackendCartItem(item: CartItem): any {
  return {
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
  };
}