import type { Product, Batch, ProductMetrics } from './types';

export const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ESTIMATED_TIMES = {
  TRANSIT: 75,
  READY: 89,
  IN_PRODUCTION: 134,
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

  const incomingSupply = qtyReady + qtyInProduction + qtyPlanned + qtyOrdered; 
  const anyIncoming = totalInTransit + incomingSupply; 
  const netInventoryPosition = totalStock + anyIncoming; 

  // --- 2. SPRZEDAŻ (Rzeczywista Rotacja) ---
  // Jeśli użytkownik nie podał dni dostępności, zakładamy 180 (pełny okres)
  const daysActive = Math.max(1, Math.min(180, product.daysInStockLast6Months || 180));
  
  const daily6m = (product.sales6Months || 0) / daysActive;
  const dailySales = daily6m;

  // --- 3. WSKAŹNIKI ZAPASU ---
  const daysInventoryOnHand = dailySales > 0.01 ? totalStock / dailySales : 999;
  
  const leadTimeDemand = dailySales * product.leadTimeDays;
  const safetyStockQty = dailySales * product.safetyStockDays;
  const reorderPoint = leadTimeDemand + safetyStockQty;

  // --- 4. SYMULACJA DOSTĘPNOŚCI (FORECASTING) ---
  const arrivalsMap: Record<string, number> = {};

  const scheduleArrival = (batch: Batch, defaultDelay: number, dateField?: string) => {
    let arrivalDate: Date;
    if (dateField && batch[dateField as keyof Batch]) {
      arrivalDate = new Date(batch[dateField as keyof Batch] as string);
      // Specyfika dla produkcji: data końca produkcji + transport (75 dni + 14 dni buforu)
      if (batch.status === 'in_production') arrivalDate = addDays(arrivalDate, 14 + 75);
    } else {
      arrivalDate = addDays(today, defaultDelay);
    }
    if (arrivalDate < today) arrivalDate = today;
    const dateStr = formatDate(arrivalDate);
    arrivalsMap[dateStr] = (arrivalsMap[dateStr] || 0) + batch.quantity;
  };

  // 4a. Harmonogramowanie pewnych statusów
  productBatches.filter(b => b.status === 'transit').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.TRANSIT, 'eta'));
  productBatches.filter(b => b.status === 'ready').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.READY));
  productBatches.filter(b => b.status === 'in_production').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.IN_PRODUCTION, 'productionEndDate'));
  
  // 4b. Harmonogramowanie PLANOWANEJ produkcji (Nowość)
  productBatches.filter(b => b.status === 'planned').forEach(b => scheduleArrival(b, ESTIMATED_TIMES.PLANNED, 'plannedProductionDate'));

  // 4c. Harmonogramowanie ZAMÓWIEŃ (Nowość - obsługa Lead Time)
  productBatches.filter(b => b.status === 'ordered').forEach(b => {
    let arrivalDate: Date;
    if (b.orderDate) {
       // Jeśli jest data zamówienia, dodajemy Lead Time produktu
       arrivalDate = addDays(new Date(b.orderDate), product.leadTimeDays);
    } else {
       // Jeśli brak daty, zakładamy dzisiaj + Lead Time
       arrivalDate = addDays(today, product.leadTimeDays);
    }

    if (arrivalDate < today) arrivalDate = today;
    const dateStr = formatDate(arrivalDate);
    arrivalsMap[dateStr] = (arrivalsMap[dateStr] || 0) + b.quantity;
  });

  // --- 5. SYMULACJA DZIENNA (WYKRYWANIE STOCKOUT) ---
  let simulatedStock = totalStock;
  let predictedStockoutDate: string | null = null;
  let isStockout = false;

  if (dailySales > 0.01) {
    for (let i = 1; i <= 365; i++) {
      const currentDate = addDays(today, i);
      const dateStr = formatDate(currentDate);
      
      // Odejmujemy dzienną sprzedaż
      simulatedStock -= dailySales;
      
      // Dodajemy dostawy, które wchodzą w danym dniu (teraz łącznie z Ordered/Planned)
      if (arrivalsMap[dateStr]) simulatedStock += arrivalsMap[dateStr];
      
      if (simulatedStock < 0 && !isStockout) {
        predictedStockoutDate = dateStr;
        isStockout = true;
        break; // Znaleźliśmy pierwszą datę braku, przerywamy
      }
    }
  }

  // Obliczanie dni do braku
  let daysToStockout: number | null = null;
  if (predictedStockoutDate) {
    const stockoutDateObj = new Date(predictedStockoutDate);
    daysToStockout = Math.ceil((stockoutDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // --- 6. DATY POMOCNICZE (DO RAPORTU) ---
  const arrivalDates = Object.keys(arrivalsMap).sort();
  const nextArrivalStr = arrivalDates.find(d => d >= formatDate(today));
  let nextArrivalDate: string | null = null;
  let daysToNextArrival: number | null = null;

  if (nextArrivalStr) {
    nextArrivalDate = nextArrivalStr;
    daysToNextArrival = Math.ceil((new Date(nextArrivalStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const orderedBatches = productBatches.filter(b => b.status === 'ordered' && b.orderDate);
  let oldestOrderDate: string | null = null;
  if (orderedBatches.length > 0) {
    orderedBatches.sort((a, b) => new Date(a.orderDate!).getTime() - new Date(b.orderDate!).getTime());
    oldestOrderDate = orderedBatches[0].orderDate || null;
  }

  const plannedBatches = productBatches.filter(b => b.status === 'planned' && b.plannedProductionDate);
  let plannedProductionStart: string | null = null;
  if (plannedBatches.length > 0) {
    plannedBatches.sort((a, b) => new Date(a.plannedProductionDate!).getTime() - new Date(b.plannedProductionDate!).getTime());
    plannedProductionStart = plannedBatches[0].plannedProductionDate || null;
  }

  const productionBatches = productBatches.filter(b => b.status === 'in_production' && b.productionEndDate);
  let predictedProductionEnd: string | null = null;
  if (productionBatches.length > 0) {
     productionBatches.sort((a, b) => new Date(a.productionEndDate!).getTime() - new Date(b.productionEndDate!).getTime());
     predictedProductionEnd = productionBatches[0].productionEndDate || null;
  }

  // --- 7. DECYZJA LOGISTYCZNA ---
  let decision: ProductMetrics['decision'] = 'OK';

  if (anyIncoming === 0 && totalStock <= safetyStockQty) {
    // Brak towaru w drodze + niski stan = KRYTYCZNIE
    decision = 'CRITICAL LOW';
  } else if (netInventoryPosition < reorderPoint) {
    // Suma towaru (nawet z zamówionym) nie pokrywa zapotrzebowania w Lead Time
    decision = 'ORDER NOW';
  } else if (predictedStockoutDate) {
    // Ilościowo OK (netInventoryPosition > ROP), ale symulacja wykazała dziurę czasową.
    
    // Teraz URGENT GAP pojawi się tylko, jeśli nawet zamówiony towar nie zdąży na czas.
    // Jeśli zdąży - predictedStockoutDate będzie null (lub odległe), więc decyja będzie OK.
    
    // Logika pomocnicza:
    // Jeśli mamy towar w transporcie (już płynie), to po prostu czekamy -> WAIT
    // Jeśli towar jest tylko "na papierze" (ordered/planned/production) i nie zdąży -> URGENT GAP
    
    if (totalInTransit > 0) {
       decision = 'WAIT';
    } else {
       decision = 'URGENT GAP';
    }
  } else {
    decision = 'OK';
  }

  return {
    totalStock, totalInTransit, qtyReady, qtyInProduction, qtyPlanned,
    dailySales, daysInventoryOnHand, reorderPoint, leadTimeDemand,
    nextArrivalDate, daysToNextArrival, stockoutGapDays: 0,
    oldestOrderDate, plannedProductionStart, predictedProductionEnd, predictedStockoutDate,
    daysToStockout,
    decision
  };
};