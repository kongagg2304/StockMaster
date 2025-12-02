import type { Product, Batch, ProductMetrics } from './types';

export const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Pomocnicza funkcja: Liczy różnicę dni między dwiema datami
const getDaysDiff = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculateProductMetrics = (product: Product, allBatches: Batch[]): ProductMetrics => {
  const productBatches = allBatches.filter(b => b.productSku === product.sku);
  
  // 1. Stan (Magazyn)
  const totalStock = productBatches.filter(b => b.status === 'stock').reduce((sum, b) => sum + b.quantity, 0);

  // 2. W transporcie (tylko to co płynie, czyli status 'transit')
  const totalInTransit = productBatches.filter(b => b.status === 'transit').reduce((sum, b) => sum + b.quantity, 0);
  
  // Inne ilości (potrzebne do logiki zakupowej)
  const qtyReady = productBatches.filter(b => b.status === 'ready').reduce((sum, b) => sum + b.quantity, 0);
  const qtyInProd = productBatches.filter(b => b.status === 'in_production').reduce((sum, b) => sum + b.quantity, 0);
  const qtyPlanned = productBatches.filter(b => b.status === 'planned').reduce((sum, b) => sum + b.quantity, 0);
  const qtyOrdered = productBatches.filter(b => b.status === 'ordered').reduce((sum, b) => sum + b.quantity, 0);

  // Całkowita ilość w drodze (do decyzji o statusie)
  const totalIncomingAll = totalInTransit + qtyReady + qtyInProd + qtyPlanned + qtyOrdered;

  // 4. Sprzedaż dzienna
  const daily6m = (product.sales6Months || 0) / 180;
  const daily1m = (product.sales1Month || 0) / 30;
  const dailySales = Math.max(daily6m, daily1m);

  // 5. Zapas na ile dni
  const daysInventoryOnHand = dailySales > 0 ? totalStock / dailySales : 999;

  // Punkt Zamówienia (ROP)
  const leadTimeDemand = dailySales * product.leadTimeDays;
  const safetyStockQty = dailySales * product.safetyStockDays;
  const reorderPoint = leadTimeDemand + safetyStockQty;

  // 9. Następna dostawa (Najbliższe ETA z transportu)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const transitBatches = productBatches.filter(b => b.status === 'transit' && b.eta);
  const futureShipments = transitBatches
    .filter(b => new Date(b.eta!) >= today)
    .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

  const nextShipment = futureShipments[0];
  let daysToNextArrival: number | null = null;
  let nextArrivalDate: string | null = null;

  if (nextShipment && nextShipment.eta) {
    nextArrivalDate = nextShipment.eta;
    const arrivalDate = new Date(nextArrivalDate);
    daysToNextArrival = Math.ceil((arrivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 8. Najstarsze zamówienie (Data)
  const orderedBatches = productBatches.filter(b => b.status === 'ordered' && b.orderDate);
  let oldestOrderDate: string | null = null;
  if (orderedBatches.length > 0) {
    orderedBatches.sort((a, b) => new Date(a.orderDate!).getTime() - new Date(b.orderDate!).getTime());
    oldestOrderDate = orderedBatches[0].orderDate || null;
  }

  // 7. Przewidywany czas zakończenia produkcji
  const productionBatches = productBatches.filter(b => b.status === 'in_production' && b.productionEndDate);
  let predictedProductionEnd: string | null = null;
  if (productionBatches.length > 0) {
     productionBatches.sort((a, b) => new Date(a.productionEndDate!).getTime() - new Date(b.productionEndDate!).getTime());
     predictedProductionEnd = productionBatches[0].productionEndDate || null;
  }

  // 6. Przewidywany brak towaru (Symulacja na 365 dni)
  let simulatedStock = totalStock;
  let predictedStockoutDate: string | null = null;
  let isStockout = false;

  const arrivalsMap: Record<string, number> = {};
  transitBatches.forEach(b => {
    if (b.eta) arrivalsMap[b.eta] = (arrivalsMap[b.eta] || 0) + b.quantity;
  });

  if (dailySales > 0) {
      for (let i = 1; i <= 365; i++) {
          const simDate = new Date();
          simDate.setDate(today.getDate() + i);
          const dateStr = simDate.toISOString().split('T')[0];
          
          simulatedStock -= dailySales;
          
          if (arrivalsMap[dateStr]) {
              simulatedStock += arrivalsMap[dateStr];
          }

          if (simulatedStock < 0 && !isStockout) {
              predictedStockoutDate = dateStr;
              isStockout = true;
              break; 
          }
      }
  }

  // 11. Status (Decyzja)
  let decision: ProductMetrics['decision'] = 'OK';
  const netInventoryPosition = totalStock + totalIncomingAll;

  if (netInventoryPosition < reorderPoint) {
    decision = 'ORDER NOW';
  } else if (predictedStockoutDate) { 
    decision = 'URGENT GAP';
  } else if (totalStock < reorderPoint) {
    decision = 'WAIT';
  }

  return {
    totalStock,
    totalInTransit,
    dailySales,
    daysInventoryOnHand,
    reorderPoint,
    nextArrivalDate,
    daysToNextArrival,
    stockoutGapDays: 0, 
    oldestOrderDate,
    predictedStockoutDate,
    predictedProductionEnd,
    decision
  };
};