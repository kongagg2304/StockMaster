import { useState, useEffect } from 'react';
import type { Product, Batch, HistoryState, FinishType, ColorKey } from '../lib/types';
import { generateId } from '../lib/utils';
import { WAREHOUSES, type WarehouseName } from '../lib/constants';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products_v2');
    return saved ? JSON.parse(saved) : [
      { sku: 'GRES-001', ean: '5901234567890', name: 'Gres Szkliwiony Carrara', dimension: '60x60', finish: 'Poler', supplier: 'Ceramica IT', stockW1: 500, sales6Months: 3600, sales1Month: 500, leadTimeDays: 75, safetyStockDays: 14 }
    ];
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem('batches_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'b1', productSku: 'GRES-001', quantity: 1000, status: 'transit', eta: '2024-06-15', containerNo: 'MSCU123456', vesselName: 'MSC Oscar' },
      { id: 'b2', productSku: 'GRES-001', quantity: 500, status: 'ordered', orderDate: '2024-05-01' }
    ];
  });

  const [history, setHistory] = useState<HistoryState[]>([]);
  
  // Stan Modali
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [splitModal, setSplitModal] = useState<{ batchId: string, targetStatus: string, maxQty: number } | null>(null);
  const [warehouseModal, setWarehouseModal] = useState<{ batchId: string } | null>(null);
  const [splitWarehouse, setSplitWarehouse] = useState<WarehouseName | ''>(''); 
  const [splitQty, setSplitQty] = useState<number>(0);
  const [draggedBatchId, setDraggedBatchId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('products_v2', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('batches_v2', JSON.stringify(batches)); }, [batches]);

  const saveToHistory = () => {
    setHistory(prev => {
      const newHistory = [...prev, { 
        batches: JSON.parse(JSON.stringify(batches)), 
        products: JSON.parse(JSON.stringify(products)),
        timestamp: Date.now() 
      }];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setBatches(previousState.batches);
    setProducts(previousState.products);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleDeleteBatch = (id: string) => {
    saveToHistory();
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateBatch = (id: string, field: string, value: any) => {
    if (field === 'color') saveToHistory(); 
    setBatches(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleProductColorChange = (sku: string, color: ColorKey) => {
    saveToHistory();
    setProducts(prev => prev.map(p => p.sku === sku ? { ...p, color } : p));
  };

  // NOWA FUNKCJA: Zapisywanie notatek dashboardu
  const handleUpdateProductNote = (sku: string, note: string) => {
    setProducts(prev => prev.map(p => 
      p.sku === sku ? { ...p, dashboardNote: note } : p
    ));
  };

  const handleSplitClick = (batch: Batch) => {
    setSplitModal({ batchId: batch.id, targetStatus: batch.status, maxQty: batch.quantity });
    if (batch.status === 'stock' && batch.warehouse) {
      setSplitWarehouse(batch.warehouse as WarehouseName);
    } else {
      setSplitWarehouse('');
    }
    setSplitQty(0);
  };

  const handleBatchEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    
    saveToHistory();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const updatedBatch: Batch = {
      ...editingBatch,
      quantity: Number(formData.get('quantity')),
      eta: formData.get('eta') as string || undefined,
      orderDate: formData.get('orderDate') as string || undefined,
      plannedProductionDate: formData.get('plannedProductionDate') as string || undefined,
      productionEndDate: formData.get('productionEndDate') as string || undefined,
      containerNo: formData.get('containerNo') as string || undefined,
      vesselName: formData.get('vesselName') as string || undefined,
      warehouse: formData.get('warehouse') as WarehouseName || undefined,
    };

    setBatches(prev => prev.map(b => b.id === editingBatch.id ? updatedBatch : b));
    setEditingBatch(null);
  };

  const handleDragStart = (e: React.DragEvent, batchId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      e.preventDefault();
      return;
    }
    setDraggedBatchId(batchId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Batch['status']) => {
    e.preventDefault();
    if (!draggedBatchId) return;

    const batch = batches.find(b => b.id === draggedBatchId);
    if (!batch) return;

    if (batch.status === targetStatus) return;

    if (batch.status === 'transit' && targetStatus === 'stock') {
       setWarehouseModal({ batchId: batch.id });
       setDraggedBatchId(null);
       return;
    }

    if (batch.status === 'ordered' && targetStatus === 'ready') {
      setSplitModal({ batchId: batch.id, targetStatus, maxQty: batch.quantity });
      setSplitQty(batch.quantity);
      setDraggedBatchId(null);
      return;
    }

    // Automatyczne daty
    const today = new Date().toISOString().split('T')[0];
    saveToHistory();
    
    setBatches(prev => prev.map(b => {
      if (b.id !== draggedBatchId) return b;
      
      const updates: Partial<Batch> = { status: targetStatus };
      
      if (targetStatus === 'transit') {
        updates.transitStartDate = today;
        if (!b.eta) {
           const date = new Date();
           date.setDate(date.getDate() + 75);
           updates.eta = date.toISOString().split('T')[0];
        }
      }
      if (targetStatus === 'in_production') {
        updates.productionStartDate = today;
      }

      return { ...b, ...updates };
    }));
    setDraggedBatchId(null);
  };

  const confirmWarehouseSelection = (warehouseName: WarehouseName) => {
    if (!warehouseModal) return;
    saveToHistory();
    const targetBatch = batches.find(b => b.id === warehouseModal.batchId);
    if (!targetBatch) return;

    setBatches(prev => {
      const existingBatchIndex = prev.findIndex(b => 
        b.productSku === targetBatch.productSku && 
        b.status === 'stock' && 
        b.warehouse === warehouseName
      );
      const newBatches = [...prev];
      if (existingBatchIndex >= 0) {
        newBatches[existingBatchIndex] = {
          ...newBatches[existingBatchIndex],
          quantity: Number((newBatches[existingBatchIndex].quantity + targetBatch.quantity).toFixed(2))
        };
        return newBatches.filter(b => b.id !== targetBatch.id);
      } else {
        return newBatches.map(b => b.id === targetBatch.id ? { ...b, status: 'stock', warehouse: warehouseName } : b);
      }
    });
    setWarehouseModal(null);
  };

  const confirmSplit = () => {
    if (!splitModal) return;
    saveToHistory();
    const { batchId, targetStatus, maxQty } = splitModal;
    const moveQty = Number(splitQty);
    const remainQty = maxQty - moveQty;

    if (moveQty < 0 || moveQty > maxQty) { alert("Błąd"); return; }

    setBatches(prev => {
      const newBatches = [...prev];
      const originalBatchIndex = newBatches.findIndex(b => b.id === batchId);
      if (originalBatchIndex === -1) return prev;

      newBatches[originalBatchIndex].quantity = Number(remainQty.toFixed(2));

      let newBatch: Batch = {
        ...newBatches[originalBatchIndex],
        id: generateId(),
        quantity: Number(moveQty.toFixed(2)),
        status: targetStatus as any
      };

      if (targetStatus === 'stock' && splitWarehouse) {
        newBatch.warehouse = splitWarehouse as WarehouseName;
        // POPRAWKA: używamy index do porównania
        const mergeTargetIndex = newBatches.findIndex((b, index) => 
          b.productSku === newBatch.productSku && 
          b.status === 'stock' && 
          b.warehouse === splitWarehouse &&
          index !== originalBatchIndex
        );
        if (mergeTargetIndex >= 0) {
           newBatches[mergeTargetIndex].quantity = Number((newBatches[mergeTargetIndex].quantity + newBatch.quantity).toFixed(2));
           if (Math.abs(remainQty) < 0.01) return newBatches.filter((_, idx) => idx !== originalBatchIndex);
           return newBatches;
        }
      }

      if (Math.abs(remainQty) < 0.01) {
        if (targetStatus === 'stock' && splitWarehouse) {
           newBatches[originalBatchIndex].warehouse = splitWarehouse as WarehouseName;
           newBatches[originalBatchIndex].quantity = moveQty;
           return newBatches;
        }
      } 
      
      newBatches.push(newBatch);
      if (Math.abs(remainQty) < 0.01) return newBatches.filter((_, idx) => idx !== originalBatchIndex);
      return newBatches;
    });
    setSplitModal(null);
  };

  const handleProductCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n'); saveToHistory(); let addedCount = 0; let updatedCount = 0; let skippedCount = 0; const newProducts = [...products]; lines.slice(1).forEach(line => { if (!line.trim()) return; const separator = line.includes(';') ? ';' : ','; const cols = line.split(separator).map(s => s.trim()); if (cols.length < 1) return; const sku = cols[0]; if (!sku) { skippedCount++; return; } const name = cols[1] || 'Nowy Produkt'; const ean = cols[2] || ''; const dimension = cols[3] || ''; let finishRaw = cols[4] || 'Inne'; const finishMap: Record<string, FinishType> = { 'poler': 'Poler', 'mat': 'Mat', 'carving': 'Carving', 'lappato': 'Lappato', 'inne': 'Inne' }; let finish: FinishType = finishMap[finishRaw.toLowerCase()] || 'Inne'; const sales6Months = Number(cols[5]) || 0; const existingIndex = newProducts.findIndex(p => p.sku === sku); const productData: Product = { sku, name, ean, dimension, finish, sales6Months, sales1Month: 0, leadTimeDays: 75, safetyStockDays: 14, supplier: 'Import', stockW1: 0, }; if (existingIndex >= 0) { newProducts[existingIndex] = { ...newProducts[existingIndex], name, ean, dimension, finish, sales6Months, leadTimeDays: newProducts[existingIndex].leadTimeDays || 75, safetyStockDays: newProducts[existingIndex].safetyStockDays || 14 }; updatedCount++; } else { newProducts.push(productData); addedCount++; } }); setProducts(newProducts); alert(`Import: Dodano: ${addedCount}, Zaktualizowano: ${updatedCount}`); }; reader.readAsText(file); e.target.value = '';
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n'); saveToHistory(); let updatedCount = 0; let skippedCount = 0; const workingBatches = [...batches]; lines.slice(1).forEach(line => { if (!line.trim()) return; const separator = line.includes(';') ? ';' : ','; const cols = line.split(separator).map(s => s.trim()); if (cols.length < 3) { skippedCount++; return; } const sku = cols[0]; const qty = Number(cols[1]); const warehouseInput = cols[2]; if (!sku || isNaN(qty)) { skippedCount++; return; } if (!products.some(p => p.sku === sku)) { skippedCount++; return; } const matchedWarehouse = WAREHOUSES.find(w => w.toLowerCase() === warehouseInput.toLowerCase()); if (!matchedWarehouse) { skippedCount++; return; } const existingBatchIndex = workingBatches.findIndex(b => b.productSku === sku && b.status === 'stock' && b.warehouse === matchedWarehouse); if (existingBatchIndex >= 0) { workingBatches[existingBatchIndex] = { ...workingBatches[existingBatchIndex], quantity: Number((workingBatches[existingBatchIndex].quantity + qty).toFixed(2)) }; updatedCount++; } else { workingBatches.push({ id: generateId(), productSku: sku, quantity: qty, status: 'stock', warehouse: matchedWarehouse }); updatedCount++; } }); setBatches(workingBatches); alert(`Import stanów: ${updatedCount} zaktualizowanych`); }; reader.readAsText(file); e.target.value = '';
  };

  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const sku = formData.get('sku') as string;
    const productData: Product = {
      sku: sku,
      ean: formData.get('ean') as string,
      name: formData.get('name') as string,
      dimension: formData.get('dimension') as string,
      finish: formData.get('finish') as FinishType,
      supplier: 'Domyślny',
      stockW1: 0,
      sales6Months: Number(formData.get('sales6Months') || 0),
      sales1Month: 0,
      leadTimeDays: Number(formData.get('leadTimeDays') || 75),
      safetyStockDays: Number(formData.get('safetyStockDays') || 14),
      color: editingProduct?.color 
    };
    saveToHistory();
    if (editingProduct) {
       setProducts(prev => prev.map(p => p.sku === editingProduct.sku ? productData : p));
    } else {
       if (products.some(p => p.sku === productData.sku)) { alert("Produkt istnieje!"); return; }
       setProducts([...products, productData]);
    }
    setIsAddProductOpen(false);
    setEditingProduct(null);
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const skuOrEan = formData.get('identifier') as string;
    const quantity = Number(formData.get('quantity'));
    const product = products.find(p => p.sku === skuOrEan || p.ean === skuOrEan);

    if (!product) { alert("Brak produktu"); return; }
    saveToHistory();
    setBatches([...batches, {
      id: generateId(),
      productSku: product.sku,
      quantity: quantity,
      status: 'ordered',
      orderDate: new Date().toISOString().split('T')[0]
    }]);
    setIsAddOrderOpen(false);
  };

  const handleDeleteProduct = (sku: string) => {
    if(confirm("Czy na pewno usunąć produkt?")) {
      saveToHistory();
      setProducts(prev => prev.filter(p => p.sku !== sku));
      setBatches(prev => prev.filter(b => b.productSku !== sku));
    }
  };

  return {
    products, setProducts,
    batches, setBatches,
    history,
    isAddProductOpen, setIsAddProductOpen,
    editingProduct, setEditingProduct,
    isAddOrderOpen, setIsAddOrderOpen,
    editingBatch, setEditingBatch,
    splitModal, setSplitModal,
    warehouseModal, setWarehouseModal,
    splitWarehouse, setSplitWarehouse,
    splitQty, setSplitQty,
    handleUndo,
    handleDeleteBatch,
    handleUpdateBatch,
    handleProductColorChange,
    handleUpdateProductNote, // <--- EKSPORTOWANE DO UŻYCIA W APP.TSX
    handleSplitClick,
    handleBatchEditSubmit,
    handleDragStart,
    handleDragOver,
    handleDrop,
    confirmWarehouseSelection,
    confirmSplit,
    handleProductCSVImport,
    handleCSVImport,
    handleProductFormSubmit,
    handleAddOrderSubmit,
    handleDeleteProduct
  };
};