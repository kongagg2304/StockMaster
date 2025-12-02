import type { Product, Batch, ProductMetrics } from './types';

export const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ESTIMATED_TIMES = {
  TRANSIT: 75,
  READY: 14,
  IN_PRODUCTION: 45,
  PLANNED: 90
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const calculateProductMetrics = (product: Product, allBatches: Batch[]): ProductMetrics => {
  const productBatches = allBatches.filter(b => b.productSku === product.sku);
  const today = new Date();
  today.setHours(0,0,0,0);

  // --- 1. AGREGACJA STANÓW ---
  const totalStock = productBatches.filter(b => b.status === 'stock').reduce((sum, b) => sum + b.quantity, 0);
  const totalInTransit = productBatches.filter(b => b.status === 'transit').reduce((sum, b) => sum + b.quantity, 0);
  const qtyReady = productBatches.filter(b => b.status === 'ready').reduce((sum, b) => sum + b.quantity, 0);
  const qtyInProduction = productBatches.filter(b => b.status === 'in_production').reduce((sum, b) => sum + b.quantity, 0);
  const qtyPlanned = productBatches.filter(b => b.status === 'planned').reduce((sum, b) => sum + b.quantity, 0);
  const qtyOrdered = productBatches.filter(b => b.status === 'ordered').reduce((sum, b) => sum + b.quantity, 0);

  const netInventoryPosition = totalStock + totalInTransit + qtyReady + qtyInProduction + qtyPlanned + qtyOrdered;

  // --- 2. SPRZEDAŻ ---
  const daily6m = (product.sales6Months || 0) / 180;
  const daily1m = product.sales1Month ? product.sales1Month / 30 : daily6m;
  const dailySales = Math.max(daily6m, daily1m);

  // --- 3. WSKAŹNIKI ZAPASU ---
  const daysInventoryOnHand = dailySales > 0.01 ? totalStock / dailySales : 999;
  const leadTimeDemand = dailySales * product.leadTimeDays;
  const safetyStockQty = dailySales * product.safetyStockDays;
  const reorderPoint = leadTimeDemand + safetyStockQty;

  // --- 4. SYMULACJA (Gap Analysis) ---
  const arrivalsMap: Record<string, number> = {};

  const scheduleArrival = (batch: Batch, defaultDelay: number, dateField?: string) => {
    let arrivalDate: Date;
    if (dateField && batch[dateField as keyof Batch]) {
      arrivalDate = new Date(batch[dateField as keyof Batch] as string);
      if (batch.status === 'in_production') arrivalDate = addDays(arrivalDate, 7);
    } else {
      arrivalDate = addDays(today, defaultDelay);
    }
    if (arrivalDate < today) arrivalDate = today;
    const dateStr = formatDate(arrivalDate);
    arrivalsMap[dateStr] = (arrivalsMap[dateStr] || 0) + batch.quantity;
  };

  productBatches.filter(b => b.status === 'transit').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.TRANSIT, 'eta'));
  productBatches.filter(b => b.status === 'ready').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.READY));
  productBatches.filter(b => b.status === 'in_production').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.IN_PRODUCTION, 'productionEndDate'));

  let simulatedStock = totalStock;
  let predictedStockoutDate: string | null = null;
  let isStockout = false;

  if (dailySales > 0.01) {
    for (let i = 1; i <= 365; i++) {
      const currentDate = addDays(today, i);
      const dateStr = formatDate(currentDate);
      simulatedStock -= dailySales;
      if (arrivalsMap[dateStr]) simulatedStock += arrivalsMap[dateStr];
      
      if (simulatedStock < 0 && !isStockout) {
        predictedStockoutDate = dateStr;
        isStockout = true;
        break; 
      }
    }
  }

  // --- 5. DATY SORTOWANIA ---
  const arrivalDates = Object.keys(arrivalsMap).sort();
  const nextArrivalStr = arrivalDates.find(d => d >= formatDate(today));
  let nextArrivalDate: string | null = null;
  let daysToNextArrival: number | null = null;

  if (nextArrivalStr) {
    nextArrivalDate = nextArrivalStr;
    daysToNextArrival = Math.ceil((new Date(nextArrivalStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Najstarsze zamówienie
  const orderedBatches = productBatches.filter(b => b.status === 'ordered' && b.orderDate);
  let oldestOrderDate: string | null = null;
  if (orderedBatches.length > 0) {
    orderedBatches.sort((a, b) => new Date(a.orderDate!).getTime() - new Date(b.orderDate!).getTime());
    oldestOrderDate = orderedBatches[0].orderDate || null;
  }

  // Zaplanowana produkcja (START)
  const plannedBatches = productBatches.filter(b => b.status === 'planned' && b.plannedProductionDate);
  let plannedProductionStart: string | null = null;
  if (plannedBatches.length > 0) {
    plannedBatches.sort((a, b) => new Date(a.plannedProductionDate!).getTime() - new Date(b.plannedProductionDate!).getTime());
    plannedProductionStart = plannedBatches[0].plannedProductionDate || null;
  }

  // Koniec produkcji
  const productionBatches = productBatches.filter(b => b.status === 'in_production' && b.productionEndDate);
  let predictedProductionEnd: string | null = null;
  if (productionBatches.length > 0) {
     productionBatches.sort((a, b) => new Date(a.productionEndDate!).getTime() - new Date(b.productionEndDate!).getTime());
     predictedProductionEnd = productionBatches[0].productionEndDate || null;
  }

  // --- 6. DECYZJA ---
  let decision: ProductMetrics['decision'] = 'OK';

  if (totalStock < safetyStockQty && dailySales > 0) {
    decision = predictedStockoutDate ? 'URGENT GAP' : 'CRITICAL LOW';
  } else if (predictedStockoutDate) {
    decision = 'URGENT GAP';
  } else if (netInventoryPosition < reorderPoint) {
    decision = 'ORDER NOW';
  } else if (totalStock < reorderPoint && netInventoryPosition >= reorderPoint) {
    decision = 'WAIT';
  }

  return {
    totalStock, totalInTransit, qtyReady, qtyInProduction, qtyPlanned,
    dailySales, daysInventoryOnHand, reorderPoint,
    nextArrivalDate, daysToNextArrival, stockoutGapDays: 0,
    oldestOrderDate, plannedProductionStart, predictedProductionEnd, predictedStockoutDate,
    decision
  };
};