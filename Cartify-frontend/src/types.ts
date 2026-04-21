export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  description?: string;
}

export interface CartItem {
  cartItemId: number;
  userId: number;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  subtotal: number;
  id: string;
  name: string;
  price: number;
  image: string;
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
  subtotal: number;
}

export interface Order {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
}

export type Category = 'All' | 'Electronics' | 'Clothing' | 'Home & Kitchen' | 'Books' | 'Beauty & Personal Care' | 'Sports & Outdoors' | 'Toys & Games';