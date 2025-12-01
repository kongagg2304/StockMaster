import { useState } from 'react';
import { Boxes, Undo2 } from 'lucide-react';
import { useInventory } from './hooks/useInventory';

// Widoki
import KanbanBoard from './components/views/KanbanBoard';
import Dashboard from './components/views/Dashboard';

// Modale
import AddProductModal from './components/modals/AddProductModal';
import EditBatchModal from './components/modals/EditBatchModal';
import AddOrderModal from './components/modals/AddOrderModal';
import SplitBatchModal from './components/modals/SplitBatchModal';
import WarehouseModal from './components/modals/WarehouseModal';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'kanban'>('kanban');

  // Pobieramy "mózg" aplikacji
  const inventory = useInventory();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><Boxes size={20} /></div>
          <div><h1 className="font-bold text-lg leading-tight text-slate-800">SupplyChain Manager</h1><p className="text-xs text-slate-500">System Kanban + Analityka Zapasów</p></div>
        </div>
        <div className="flex items-center gap-4">
           {inventory.history.length > 0 && (<button onClick={inventory.handleUndo} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors" title="Cofnij ostatnią zmianę"><Undo2 size={16} /> Cofnij</button>)}
           <div className="h-8 w-px bg-slate-200 mx-2"></div>
           <button onClick={() => setView('kanban')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Tablica (Kanban)</button>
           <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Dashboard (Raport)</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 overflow-hidden">
        {view === 'kanban' ? (
          <KanbanBoard 
            products={inventory.products}
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
          <Dashboard products={inventory.products} batches={inventory.batches} />
        )}
      </div>

      {/* MODALS SECTION */}
      {inventory.isAddProductOpen && (
        <AddProductModal 
          onClose={() => inventory.setIsAddProductOpen(false)} 
          onSubmit={inventory.handleProductFormSubmit} 
          editingProduct={inventory.editingProduct} 
        />
      )}
      
      {inventory.editingBatch && (
        <EditBatchModal 
           batch={inventory.editingBatch}
           onClose={() => inventory.setEditingBatch(null)}
           onSubmit={inventory.handleBatchEditSubmit}
        />
      )}

      {inventory.isAddOrderOpen && (
        <AddOrderModal 
          onClose={() => inventory.setIsAddOrderOpen(false)}
          onSubmit={inventory.handleAddOrderSubmit}
        />
      )}

      {inventory.splitModal && (
        <SplitBatchModal 
          targetStatus={inventory.splitModal.targetStatus}
          maxQty={inventory.splitModal.maxQty}
          splitQty={inventory.splitQty}
          setSplitQty={inventory.setSplitQty}
          splitWarehouse={inventory.splitWarehouse}
          setSplitWarehouse={inventory.setSplitWarehouse}
          onClose={() => inventory.setSplitModal(null)}
          onConfirm={inventory.confirmSplit}
        />
      )}

      {inventory.warehouseModal && (
        <WarehouseModal 
          onClose={() => inventory.setWarehouseModal(null)}
          onConfirm={inventory.confirmWarehouseSelection}
        />
      )}

    </div>
  );
}