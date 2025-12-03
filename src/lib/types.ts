export type FinishType = 'Poler' | 'Mat' | 'Carving' | 'Lappato' | 'Inne';

export type ColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'cyan' | 'gray' | 'brown';

export type DecisionStatus = 'ORDER NOW' | 'URGENT GAP' | 'WAIT' | 'OK' | 'CRITICAL LOW';

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
  // NOWE POLE: Ile dni towar był faktycznie na stanie w ciągu ostatnich 6 miesięcy
  daysInStockLast6Months?: number; 
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
  qtyReady: number;
  qtyInProduction: number;
  qtyPlanned: number;
  
  dailySales: number;
  daysInventoryOnHand: number;
  reorderPoint: number;
  leadTimeDemand: number;
  
  nextArrivalDate: string | null;
  daysToNextArrival: number | null;
  
  stockoutGapDays: number;
  predictedStockoutDate: string | null;
  daysToStockout: number | null;
  
  oldestOrderDate: string | null;
  plannedProductionStart: string | null;
  predictedProductionEnd: string | null;
  
  decision: DecisionStatus;
}

export interface HistoryState {
  batches: Batch[];
  products: Product[];
  timestamp: number;
}