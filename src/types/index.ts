export type ProductCategory =
  | "remeras"
  | "pantalones"
  | "buzos"
  | "accesorios"
  | "calzado";

export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "astropay" | "transfer" | "efectivo" | "otro";

export type SaleChannel = "online" | "offline";

export type StockMap = Record<string, number>;

export interface ColorVariant {
  name: string;
  images: string[];
  stock: Record<string, number>;
}

export interface ProductPublic {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  images: string[];
  tags: string[];
  price_sale: number;
  stock: StockMap;
  color_variants: ColorVariant[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAdmin extends ProductPublic {
  price_cost: number;
  instagram_posted: boolean;
  weight_kg:  number | null;
  length_cm:  number | null;
  width_cm:   number | null;
  height_cm:  number | null;
}

export interface OrderItem {
  product_id: string;
  slug: string;
  name: string;
  size: string;
  color?: string | null;
  qty: number;
  price: number;
}

export interface CustomerAddress {
  street: string;
  city: string;
  province: string;
  zip: string;
}

export interface OrderPublic {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: CustomerAddress;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof_url: string | null;
  astropay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleRecord {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  color: string | null;
  quantity: number;
  sale_price: number;
  cost_price: number;
  channel: SaleChannel;
  payment_method: PaymentMethod;
  order_id: string | null;
  customer_note: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  period: "today" | "week" | "month" | "all";
  revenue: number;
  cogs: number;
  profit: number;
  margin_avg: number;
  sales_count: number;
  stock_value_cost: number;
  stock_value_sale: number;
  top_products: Array<{
    name: string;
    units_sold: number;
    profit_total: number;
    margin: number;
  }>;
  low_stock: Array<{
    name: string;
    stock: StockMap;
    total_units: number;
  }>;
  sales_by_day: Array<{
    date: string;
    revenue: number;
    profit: number;
  }>;
}

export interface CouponPublic {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number | null;
  stock: number;
  used_count: number;
  min_purchase: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponValidated {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number | null;
  discount_amount: number;
}

export interface TransferInfo {
  cbu: string;
  alias: string;
  titular: string;
  amount: number;
}

export interface CreateOrderResponse {
  order_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_url?: string;
  transfer_info?: TransferInfo;
}

export interface ShippingOption {
  type:       string;
  label:      string;
  days_label: string;
  cost:       number;
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string | null;
  price: number;
  quantity: number;
}
