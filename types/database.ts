export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  category: string;
  region: string;
  lat: number | null;
  lng: number | null;
  owner_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  tags: string[];
  description: string | null;
  is_approved: boolean;
  created_at: string;
  store?: Store;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  buyer_id: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  user?: Pick<User, "display_name">;
}

export interface GiftSet {
  title: string;
  story: string;
  total_price: number;
  product_ids: string[];
  products?: Product[];
}
