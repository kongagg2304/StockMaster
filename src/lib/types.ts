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
  dashboardNote?: string;
}

export interface Batch {
  id: string;
  productSku: string;
  quantity: number;
  status: 'stock' | 'transit' | 'ready' | 'in_production' | 'planned' | 'ordered';
  
  orderDate?: string;
  plannedProductionDate?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  transitStartDate?: string;
  eta?: string;
  containerNo?: string;
  vesselName?: string;
  color?: ColorKey;
  warehouse?: string;
}

export interface ProductMetrics {
  totalStock: number;
  totalInTransit: number;
  qtyReady: number; // NOWE: Do sortowania "Gotowe"
  qtyInProduction: number;
  qtyPlanned: number;
  
  dailySales: number;
  daysInventoryOnHand: number;
  reorderPoint: number;
  
  nextArrivalDate: string | null;
  daysToNextArrival: number | null;
  
  stockoutGapDays: number;
  predictedStockoutDate: string | null;
  
  oldestOrderDate: string | null;
  plannedProductionStart: string | null; // NOWE: Do sortowania "Data rozp. prod."
  predictedProductionEnd: string | null;
  
  decision: 'ORDER NOW' | 'URGENT GAP' | 'WAIT' | 'OK' | 'CRITICAL LOW';
}

export interface HistoryState {
  batches: Batch[];
  products: Product[];
  timestamp: number;
}