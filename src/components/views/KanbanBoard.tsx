import React from 'react';
import { Upload, Plus } from 'lucide-react';
import type { Product, Batch, ColorKey } from '../../lib/types';
import ProductCard from '../cards/ProductCard';
import KanbanCard from '../cards/KanbanCard';

interface Props {
  products: Product[];
  batches: Batch[];
  onProductImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBatchImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddProduct: () => void;
  onAddOrder: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (sku: string) => void;
  onColorChangeProduct: (sku: string, color: ColorKey) => void;
  
  onDeleteBatch: (id: string) => void;
  onSplitBatch: (batch: Batch) => void;
  onEditBatch: (batch: Batch) => void;
  onUpdateBatch: (id: string, field: string, value: any) => void;
  
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Batch['status']) => void;
}

const KanbanBoard: React.FC<Props> = ({
  products, batches, 
  onProductImport, onBatchImport, onAddProduct, onAddOrder,
  onEditProduct, onDeleteProduct, onColorChangeProduct,
  onDeleteBatch, onSplitBatch, onEditBatch, onUpdateBatch,
  onDragStart, onDragOver, onDrop
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* NAGŁÓWKI KOLUMN */}
      <div className="grid grid-cols-12 gap-0 border-b border-slate-200 bg-white shadow-sm z-10 text-xs font-bold uppercase text-slate-500">
        <div className="col-span-3 p-3 flex justify-between items-center border-r border-slate-100">
          <span>1. Baza Produktów</span>
          <div className="flex gap-1">
            <label className="hover:bg-slate-100 p-1 rounded cursor-pointer text-slate-600" title="Import Produktów CSV">
                <Upload size={16} />
                <input type="file" accept=".csv,.txt" className="hidden" onChange={onProductImport} />
            </label>
            <button onClick={onAddProduct} className="hover:bg-slate-100 p-1 rounded text-blue-600"><Plus size={16}/></button>
          </div>
        </div>
        <div className="col-span-2 p-3 flex justify-between items-center border-r border-emerald-100 bg-emerald-50/30">
          <span className="text-emerald-700">2. Magazyn</span>
          <label className="hover:bg-emerald-100 p-1 rounded cursor-pointer text-emerald-600"><Upload size={16} /><input type="file" accept=".csv,.txt" className="hidden" onChange={onBatchImport} /></label>
        </div>
        <div className="col-span-3 p-3 border-r border-blue-100 bg-blue-50/30 text-blue-700">3. W Transporcie</div>
        <div className="col-span-2 p-3 border-r border-yellow-100 bg-yellow-50/30 text-yellow-700">4. Gotowe</div>
        <div className="col-span-2 p-3 flex justify-between items-center bg-indigo-50/30 text-indigo-700">
          <span>5. Zamówione</span>
          <button onClick={onAddOrder} className="hover:bg-indigo-100 p-1 rounded text-indigo-600"><Plus size={16}/></button>
        </div>
      </div>

      {/* WIERSZE PRODUKTÓW */}
      <div className="flex-1 overflow-y-auto">
        {products.map(p => (
          <div key={p.sku} className="grid grid-cols-12 gap-0 border-b border-slate-100 min-h-[140px] hover:bg-slate-50/50 transition-colors">
            
            <div className="col-span-3 p-3 border-r border-slate-100">
              <ProductCard 
                product={p} 
                allBatches={batches} 
                onEdit={onEditProduct} 
                onDelete={onDeleteProduct}
                onColorChange={onColorChangeProduct}
              />
            </div>

            <div className="col-span-2 p-2 border-r border-slate-100 bg-slate-50/30 relative" onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'stock')}>
              {batches.filter(b => b.productSku === p.sku && b.status === 'stock').map(b => (
                <KanbanCard key={b.id} batch={b} product={p} onDelete={onDeleteBatch} onSplit={onSplitBatch} onEdit={onEditBatch} onUpdate={onUpdateBatch} onDragStart={onDragStart} />
              ))}
              {batches.filter(b => b.productSku === p.sku && b.status === 'stock').length === 0 && <div className="absolute inset-0 flex items-center justify-center text-slate-200 text-xs pointer-events-none">Pusto</div>}
            </div>

            <div className="col-span-3 p-2 border-r border-slate-100 bg-white relative" onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'transit')}>
              <div className="grid grid-cols-2 gap-2">
                {batches.filter(b => b.productSku === p.sku && b.status === 'transit').map(b => (
                  <KanbanCard key={b.id} batch={b} product={p} onDelete={onDeleteBatch} onSplit={onSplitBatch} onEdit={onEditBatch} onUpdate={onUpdateBatch} onDragStart={onDragStart} />
                ))}
              </div>
            </div>

            <div className="col-span-2 p-2 border-r border-slate-100 bg-slate-50/30 relative" onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'ready')}>
              {batches.filter(b => b.productSku === p.sku && b.status === 'ready').map(b => (
                <KanbanCard key={b.id} batch={b} product={p} onDelete={onDeleteBatch} onSplit={onSplitBatch} onEdit={onEditBatch} onUpdate={onUpdateBatch} onDragStart={onDragStart} />
              ))}
            </div>

            <div className="col-span-2 p-2 relative" onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'ordered')}>
              {batches.filter(b => b.productSku === p.sku && b.status === 'ordered').map(b => (
                <KanbanCard key={b.id} batch={b} product={p} onDelete={onDeleteBatch} onSplit={onSplitBatch} onEdit={onEditBatch} onUpdate={onUpdateBatch} onDragStart={onDragStart} />
              ))}
            </div>

          </div>
        ))}
        {products.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <p className="mb-2">Brak zdefiniowanych produktów.</p>
            <button onClick={onAddProduct} className="text-blue-600 hover:underline">Dodaj pierwszy produkt</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;