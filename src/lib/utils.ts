import type { Product, Batch, ProductMetrics } from './types';

export const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const calculateProductMetrics = (product: Product, allBatches: Batch[]): ProductMetrics => {
  const productBatches = allBatches.filter(b => b.productSku === product.sku);
  
  const totalStock = productBatches.filter(b => b.status === 'stock').reduce((sum, b) => sum + b.quantity, 0);
  const qtyTransit = productBatches.filter(b => b.status === 'transit').reduce((sum, b) => sum + b.quantity, 0);
  const qtyReady = productBatches.filter(b => b.status === 'ready').reduce((sum, b) => sum + b.quantity, 0);
  const qtyOrdered = productBatches.filter(b => b.status === 'ordered').reduce((sum, b) => sum + b.quantity, 0);

  const totalIncoming = qtyTransit + qtyReady + qtyOrdered;

  const daily6m = (product.sales6Months || 0) / 180;
  const daily1m = (product.sales1Month || 0) / 30;
  const dailySales = Math.max(daily6m, daily1m);

  const daysInventoryOnHand = dailySales > 0 ? totalStock / dailySales : 999;

  const leadTimeDemand = dailySales * product.leadTimeDays;
  const safetyStockQty = dailySales * product.safetyStockDays;
  const reorderPoint = leadTimeDemand + safetyStockQty;

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const transitBatches = productBatches.filter(b => b.status === 'transit');
  const futureShipments = transitBatches
    .filter(b => b.eta && new Date(b.eta) >= today)
    .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

  const nextShipment = futureShipments[0];
  let daysToNextArrival: number | null = null;
  let nextArrivalDate: string | null = null;

  if (nextShipment && nextShipment.eta) {
    const arrivalDate = new Date(nextShipment.eta);
    const diffTime = arrivalDate.getTime() - today.getTime();
    daysToNextArrival = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nextArrivalDate = nextShipment.eta;
  }

  let stockoutGapDays = 0;
  if (daysToNextArrival !== null && daysInventoryOnHand < 999) {
    if (daysToNextArrival > daysInventoryOnHand) {
      stockoutGapDays = daysToNextArrival - daysInventoryOnHand;
    }
  }

  let decision: ProductMetrics['decision'] = 'OK';
  const netInventoryPosition = totalStock + totalIncoming;

  if (netInventoryPosition < reorderPoint) {
    decision = 'ORDER NOW';
  } else if (stockoutGapDays > 0) {
    decision = 'URGENT GAP';
  } else if (totalStock < reorderPoint) {
    decision = 'WAIT';
  }

  return {
    totalStock,
    totalInTransit: totalIncoming,
    dailySales,
    daysInventoryOnHand,
    reorderPoint,
    nextArrivalDate,
    daysToNextArrival,
    stockoutGapDays,
    decision
  };
};