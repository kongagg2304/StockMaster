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
  dashboardNote?: string; // 10. Miejsce na notatkę tekstową
}

export interface Batch {
  id: string;
  productSku: string;
  quantity: number;
  // Zaktualizowane statusy o proces produkcji
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
  totalInTransit: number; // 3. Ilość towaru która płynie w dostawie
  dailySales: number;     // 4. Sprzedaż dzienna
  daysInventoryOnHand: number; // 5. Zapas na ile dni
  reorderPoint: number;
  nextArrivalDate: string | null; // 9. Następna dostawa
  daysToNextArrival: number | null;
  stockoutGapDays: number;
  
  // Nowe/Zaktualizowane pola do Dashboardu
  predictedStockoutDate: string | null; // 6. Przewidywany brak towaru (data)
  predictedProductionEnd: string | null; // 7. Przewidywany czas zakończenia produkcji
  oldestOrderDate: string | null;        // 8. Najstarsze zamówienie (data)
  
  decision: 'ORDER NOW' | 'URGENT GAP' | 'WAIT' | 'OK'; // 11. Status
}

export interface HistoryState {
  batches: Batch[];
  products: Product[];
  timestamp: number;
}