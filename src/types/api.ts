// Shared DTOs — keep in sync with floreriako/src/types/api.ts

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  image_url: string | null;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
}

export interface ProductWithCategoriesDTO extends ProductDTO {
  categories: CategoryDTO[];
}

export interface CartItemDTO {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  total_cents: number;
  item_count: number;
}

export interface OrderItemDTO {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  product_snapshot: Record<string, unknown>;
}

export interface OrderDTO {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_cents: number;
  currency: string;
  items: OrderItemDTO[];
  created_at: string;
}

export interface CheckoutResponseDTO {
  checkout_url: string;
  session_id: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
