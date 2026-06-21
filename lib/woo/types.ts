// Minimal shapes of the WooCommerce REST objects we read (PRD §6). We only map
// the fields the CRE system needs; everything else is ignored.

export interface WooApiOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  date_created_gmt?: string;
  customer_id: number;
  billing?: { first_name?: string; last_name?: string; phone?: string; email?: string };
  line_items?: Array<{ id: number; name: string; quantity: number; total: string }>;
}

export interface WooApiCustomer {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  billing?: { phone?: string };
  date_created?: string;
  // Present on the customers endpoint when ?role=all; otherwise we derive.
  orders_count?: number;
  total_spent?: string;
}

export interface WooApiReview {
  id: number;
  product_id: number;
  product_name?: string;
  reviewer: string;
  review: string;
  rating: number;
  date_created: string;
  status?: string;
}
