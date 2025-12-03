import { useState, useMemo } from 'react';
import { Boxes, Undo2, Search, Filter, ArrowUp, ArrowDown, X } from 'lucide-react'; // Dodano ikonę X
import { useInventory } from './hooks/useInventory';
import { calculateProductMetrics } from './lib/utils';

// Widoki
import KanbanBoard from './components/views/KanbanBoard';
import Dashboard from './components/views/Dashboard';

// Modale
import AddProductModal from './components/modals/AddProductModal';
import EditBatchModal from './components/modals/EditBatchModal';
import AddOrderModal from './components/modals/AddOrderModal';
import SplitBatchModal from './components/modals/SplitBatchModal';
import WarehouseModal from './components/modals/WarehouseModal';

import type { FinishType, DecisionStatus } from './lib/types';

// Mapa priorytetów statusów (im mniejsza liczba, tym wyżej na liście przy sortowaniu rosnącym)
const STATUS_PRIORITY: Record<DecisionStatus, number> = {
  'CRITICAL LOW': 1,  // Najważniejszy
  'URGENT GAP': 2,
  'ORDER NOW': 3,
  'WAIT': 4,
  'OK': 5             // Najmniej ważny
};

// Klucze sortowania
type SortKey = 
  | 'name' | 'totalStock' | 'totalInTransit' | 'qtyReady' 
  | 'oldestOrderDate' | 'plannedProductionStart' | 'predictedProductionEnd' 
  | 'dailySales' | 'daysInventoryOnHand' | 'predictedStockoutDate' | 'nextArrivalDate' | 'decision';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'kanban'>('kanban');
  
  // Filtry - Stan
  const [searchTerm, setSearchTerm] = useState('');
  const [finishFilter, setFinishFilter] = useState<FinishType | 'All'>('All');
  const [dimensionFilter, setDimensionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All'); 

  // Sortowanie - Stan
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const inventory = useInventory();

  // Pobranie unikalnych wymiarów do filtra
  const availableDimensions = useMemo(() => {
    const dims = new Set(inventory.products.map(p => p.dimension).filter(Boolean));
    return Array.from(dims).sort();
  }, [inventory.products]);

  // Funkcja czyszcząca wszystkie filtry
  const clearFilters = () => {
    setSearchTerm('');
    setFinishFilter('All');
    setDimensionFilter('All');
    setStatusFilter('All');
    setSortKey('name');
    setSortDir('asc');
  };

  // --- LOGIKA GŁÓWNA ---
  const processedProducts = useMemo(() => {
    // 1. Oblicz metryki dla wszystkich (potrzebne do sortowania/filtrowania)
    const productsWithMetrics = inventory.products.map(p => ({
      ...p,
      metrics: calculateProductMetrics(p, inventory.batches)
    }));

    // 2. Filtrowanie
    const filtered = productsWithMetrics.filter(p => {
      const matchesSearch = !searchTerm || (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ean.includes(searchTerm) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesFinish = finishFilter === 'All' || p.finish === finishFilter;
      const matchesDimension = dimensionFilter === 'All' || p.dimension === dimensionFilter;
      const matchesStatus = statusFilter === 'All' || p.metrics.decision === statusFilter;

      return matchesSearch && matchesFinish && matchesDimension && matchesStatus;
    });

    // 3. Sortowanie
    return filtered.sort((a, b) => {
      let valA: any, valB: any;

      // Wybór wartości do porównania
      switch (sortKey) {
        case 'name': valA = a.name; valB = b.name; break;
        // Metryki liczbowe
        case 'totalStock': valA = a.metrics.totalStock; valB = b.metrics.totalStock; break;
        case 'totalInTransit': valA = a.metrics.totalInTransit; valB = b.metrics.totalInTransit; break;
        case 'qtyReady': valA = a.metrics.qtyReady; valB = b.metrics.qtyReady; break;
        case 'dailySales': valA = a.metrics.dailySales; valB = b.metrics.dailySales; break;
        case 'daysInventoryOnHand': valA = a.metrics.daysInventoryOnHand; valB = b.metrics.daysInventoryOnHand; break;
        // Metryki dat (null traktujemy jako koniec/początek zależnie od kontekstu)
        case 'oldestOrderDate': valA = a.metrics.oldestOrderDate || '9999-99-99'; valB = b.metrics.oldestOrderDate || '9999-99-99'; break;
        case 'plannedProductionStart': valA = a.metrics.plannedProductionStart || '9999-99-99'; valB = b.metrics.plannedProductionStart || '9999-99-99'; break;
        case 'predictedProductionEnd': valA = a.metrics.predictedProductionEnd || '9999-99-99'; valB = b.metrics.predictedProductionEnd || '9999-99-99'; break;
        case 'predictedStockoutDate': valA = a.metrics.predictedStockoutDate || '9999-99-99'; valB = b.metrics.predictedStockoutDate || '9999-99-99'; break;
        case 'nextArrivalDate': valA = a.metrics.nextArrivalDate || '9999-99-99'; valB = b.metrics.nextArrivalDate || '9999-99-99'; break;
        
        // NOWA LOGIKA SORTOWANIA STATUSU (PRIORYTETY)
        case 'decision': 
          valA = STATUS_PRIORITY[a.metrics.decision]; 
          valB = STATUS_PRIORITY[b.metrics.decision]; 
          break;
          
        default: return 0;
      }

      // Porównanie
      if (valA === valB) return 0;
      
      const compareResult = valA > valB ? 1 : -1;
      return sortDir === 'asc' ? compareResult : -compareResult;
    });

  }, [inventory.products, inventory.batches, searchTerm, finishFilter, dimensionFilter, statusFilter, sortKey, sortDir]);

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* --- PASEK NARZĘDZI (HEADER) --- */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-50 flex flex-col gap-3 flex-shrink-0">
        
        {/* Górny rząd: Logo + Search + Widok */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 min-w-fit">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Boxes size={18} /></div>
            <div><h1 className="font-bold text-sm leading-tight text-slate-800">SupplyChain</h1></div>
          </div>

          <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Szukaj (SKU, Nazwa, EAN, Dostawca)..." 
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 border rounded text-sm transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          <div className="flex items-center gap-2">
             {inventory.history.length > 0 && (<button onClick={inventory.handleUndo} className="flex items-center gap-1 text-xs text-slate-600 hover:bg-slate-100 px-2 py-1.5 rounded" title="Cofnij"><Undo2 size={14} /> Cofnij</button>)}
             <div className="flex bg-slate-100 p-1 rounded-lg">
               <button onClick={() => setView('kanban')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Kanban</button>
               <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${view === 'dashboard' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Raport</button>
             </div>
          </div>
        </div>

        {/* Dolny rząd: Filtry i Sortowanie */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 justify-between">
            <div className="flex items-center gap-2">
               <Filter size={14} className="text-slate-400" />
               
               {/* 1. Filtr Wykończenia */}
               <select 
                  className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-400 cursor-pointer hover:bg-white"
                  value={finishFilter}
                  onChange={(e) => setFinishFilter(e.target.value as any)}
               >
                  <option value="All">Wykończenie: Wszystkie</option>
                  <option value="Poler">Poler</option>
                  <option value="Mat">Mat</option>
                  <option value="Carving">Carving</option>
                  <option value="Lappato">Lappato</option>
                  <option value="Inne">Inne</option>
               </select>

               {/* 2. Filtr Wymiaru (Dynamiczny) */}
               <select 
                  className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-400 cursor-pointer hover:bg-white"
                  value={dimensionFilter}
                  onChange={(e) => setDimensionFilter(e.target.value)}
               >
                  <option value="All">Wymiar: Wszystkie</option>
                  {availableDimensions.map(d => <option key={d} value={d}>{d}</option>)}
               </select>

               {/* 3. Filtr Statusu (Decyzji) */}
               <select 
                  className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-400 cursor-pointer hover:bg-white font-medium text-blue-900"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                  <option value="All">Status: Wszystkie</option>
                  <option value="CRITICAL LOW">🛑 Stan Krytyczny</option>
                  <option value="URGENT GAP">⚠️ Luka Czasowa</option>
                  <option value="ORDER NOW">🔥 Zamawiaj</option>
                  <option value="WAIT">⏳ Czekaj na dostawę</option>
                  <option value="OK">✅ Ok</option>
               </select>

                {/* NOWY: Przycisk Wyczyść Filtry */}
               {(searchTerm || finishFilter !== 'All' || dimensionFilter !== 'All' || statusFilter !== 'All') && (
                 <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-300 transition-colors"
                    title="Resetuj wszystkie filtry"
                 >
                    <X size={12} /> Wyczyść
                 </button>
               )}
            </div>

            {/* SEKJCA SORTOWANIA */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
               <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Sortuj:</span>
               <select 
                  className="bg-white border border-slate-300 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer font-medium min-w-[140px]"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
               >
                  <option value="decision">Priorytet (Status)</option>
                  <option value="name">Alfabetycznie</option>
                  <option value="totalStock">Stan Magazynowy</option>
                  <option value="totalInTransit">W Transporcie</option>
                  <option value="qtyReady">Gotowe</option>
                  <option value="dailySales">Sprzedaż Dzienna</option>
                  <option value="daysInventoryOnHand">Zapas (Dni)</option>
                  <option value="predictedStockoutDate">Data Braku Towaru</option>
                  <option value="oldestOrderDate">Data Zamówienia</option>
                  <option value="plannedProductionStart">Data Rozp. Produkcji</option>
                  <option value="predictedProductionEnd">Data Zak. Produkcji</option>
                  <option value="nextArrivalDate">Następna Dostawa</option>
               </select>

               {/* Przycisk Kierunku */}
               <button 
                 onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                 className="p-1 border border-slate-300 rounded hover:bg-slate-50 bg-white text-slate-600"
                 title={sortDir === 'asc' ? "Rosnąco (Od najważniejszych)" : "Malejąco"}
               >
                 {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
               </button>
            </div>
        </div>
      </div>

      {/* TREŚĆ GŁÓWNA */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
        {view === 'kanban' ? (
          <KanbanBoard 
            products={processedProducts} // Używamy posortowanej i przefiltrowanej listy
            batches={inventory.batches}
            onProductImport={inventory.handleProductCSVImport}
            onBatchImport={inventory.handleCSVImport}
            onAddProduct={() => { inventory.setEditingProduct(null); inventory.setIsAddProductOpen(true); }}
            onAddOrder={() => inventory.setIsAddOrderOpen(true)}
            onEditProduct={(p) => { inventory.setEditingProduct(p); inventory.setIsAddProductOpen(true); }}
            onDeleteProduct={inventory.handleDeleteProduct}
            onColorChangeProduct={inventory.handleProductColorChange}
            onDeleteBatch={inventory.handleDeleteBatch}
            onSplitBatch={inventory.handleSplitClick}
            onEditBatch={inventory.setEditingBatch}
            onUpdateBatch={inventory.handleUpdateBatch}
            onDragStart={inventory.handleDragStart}
            onDragOver={inventory.handleDragOver}
            onDrop={inventory.handleDrop}
          />
        ) : (
          <Dashboard 
            products={processedProducts} // Tutaj też
            batches={inventory.batches} 
            onUpdateProductNote={inventory.handleUpdateProductNote} 
          /> 
        )}
      </div>

      {/* MODALE (Bez zmian) */}
      {inventory.isAddProductOpen && <AddProductModal onClose={() => inventory.setIsAddProductOpen(false)} onSubmit={inventory.handleProductFormSubmit} editingProduct={inventory.editingProduct} />}
      {inventory.editingBatch && <EditBatchModal batch={inventory.editingBatch} onClose={() => inventory.setEditingBatch(null)} onSubmit={inventory.handleBatchEditSubmit} />}
      {inventory.isAddOrderOpen && <AddOrderModal onClose={() => inventory.setIsAddOrderOpen(false)} onSubmit={inventory.handleAddOrderSubmit} />}
      {inventory.splitModal && <SplitBatchModal targetStatus={inventory.splitModal.targetStatus} maxQty={inventory.splitModal.maxQty} splitQty={inventory.splitQty} setSplitQty={inventory.setSplitQty} splitWarehouse={inventory.splitWarehouse} setSplitWarehouse={inventory.setSplitWarehouse} onClose={() => inventory.setSplitModal(null)} onConfirm={inventory.confirmSplit} />}
      {inventory.warehouseModal && <WarehouseModal onClose={() => inventory.setWarehouseModal(null)} onConfirm={inventory.confirmWarehouseSelection} />}

    </div>
  );
}