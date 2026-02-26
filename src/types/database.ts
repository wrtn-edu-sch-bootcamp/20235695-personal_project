export type SessionStatus = "in_progress" | "completed";
export type ItemStatus = "pending" | "matched" | "mismatched";

export interface InventorySession {
  id: string;
  name: string;
  status: SessionStatus;
  total_items: number;
  checked_items: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  session_id: string;
  barcode: string;
  product_name: string;
  expected_quantity: number;
  actual_quantity: number | null;
  status: ItemStatus;
  checked_at: string | null;
  created_at: string;
}

export interface NewInventoryItem {
  barcode: string;
  product_name: string;
  expected_quantity: number;
}
