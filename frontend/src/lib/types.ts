// Hand-written mirrors of backend/models/shop.py — keep in sync.
export type Category = "sweets" | "hot";
export type OrderStatus = "placed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentMethod = "phonepe" | "cod";
export type PaymentStatus = "pending" | "paid";

export interface ItemBase {
  name: string;
  category: Category;
  description: string;
  price: number;
  unit: string;
  image_url: string;
  available: boolean;
}
export interface Item extends ItemBase {
  id: string;
}

export interface DeliverySlab {
  max_km: number;
  fee: number;
}
export interface ShopSettings {
  shop_name: string;
  tagline: string;
  phones: string[];
  whatsapp: string;
  address: string;
  upi_ids: string[];
  slabs: DeliverySlab[];
  far_min_order: number;
  far_fee: number;
}

export interface QuoteRequest {
  distance_km: number;
  subtotal: number;
}
export interface QuoteResponse {
  deliverable: boolean;
  delivery_fee: number;
  message: string;
}

export interface OrderLineIn {
  item_id: string;
  qty: number;
}
export interface OrderCreate {
  customer_name: string;
  phone: string;
  address: string;
  distance_km: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  items: OrderLineIn[];
}
export interface OrderLine {
  item_id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  line_total: number;
}
export interface StatusEvent {
  status: OrderStatus;
  at: string;
}
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  distance_km: number;
  items: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id: string;
  status: OrderStatus;
  status_history: StatusEvent[];
  admin_note: string;
  created_at: string;
}
export interface OrderUpdate {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  admin_note?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
export interface AdminMe {
  username: string;
}
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
export interface OkResponse {
  ok: boolean;
}
