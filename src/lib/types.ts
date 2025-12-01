export type FinishType = 'Poler' | 'Mat' | 'Carving' | 'Lappato' | 'Inne';
export type ColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'cyan' | 'gray' | 'brown';

export interface Product {
  sku: string;
  ean: string;
  name: string;
  dimension: string;
  finish: FinishType;
  supplier: string;
  stockW1: number;
  sales6Months: number;
  sales1Month: number;
  leadTimeDays: number;
  safetyStockDays: number;
  color?: ColorKey;
}

export interface Batch {
  id: string;
  productSku: string;
  quantity: number;
  status: 'stock' | 'transit' | 'ready' | 'ordered';
  orderDate?: string;
  eta?: string;
  containerNo?: string;
  vesselName?: string;
  color?: ColorKey;
  warehouse?: string; 
}

export interface ProductMetrics {
  totalStock: number;
  totalInTransit: number;
  dailySales: number;
  daysInventoryOnHand: number;
  reorderPoint: number;
  nextArrivalDate: string | null;
  daysToNextArrival: number | null;
  stockoutGapDays: number;
  decision: 'ORDER NOW' | 'URGENT GAP' | 'WAIT' | 'OK';
}

export interface HistoryState {
  batches: Batch[];
  products: Product[];
  timestamp: number;
}