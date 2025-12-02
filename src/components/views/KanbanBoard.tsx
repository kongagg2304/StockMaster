import React from 'react';
import { Upload, Plus, CalendarClock, Factory, Truck, CheckCircle, Package } from 'lucide-react';
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

type ColumnConfig = {
  id: Batch['status'];
  title: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  hasUpload?: boolean;
  hasAddBtn?: boolean;
};

const KanbanBoard: React.FC<Props> = ({
  products, batches, 
  onProductImport, onBatchImport, onAddProduct, onAddOrder,
  onEditProduct, onDeleteProduct, onColorChangeProduct,
  onDeleteBatch, onSplitBatch, onEditBatch, onUpdateBatch,
  onDragStart, onDragOver, onDrop
}) => {

  const COLUMNS: ColumnConfig[] = [
    { id: 'stock', title: '2. Magazyn', icon: <Upload size={14}/>, bg: 'bg-emerald-50/40', border: 'border-emerald-100', text: 'text-emerald-700 bg-emerald-50', hasUpload: true },
    { id: 'transit', title: '3. W Transporcie (75 dni)', icon: <Truck size={14}/>, bg: 'bg-blue-50/40', border: 'border-blue-100', text: 'text-blue-700 bg-blue-50' },
    { id: 'ready', title: '4. Gotowe', icon: <CheckCircle size={14}/>, bg: 'bg-yellow-50/40', border: 'border-yellow-100', text: 'text-yellow-700 bg-yellow-50' },
    { id: 'in_production', title: '5. W Trakcie Produkcji', icon: <Factory size={14}/>, bg: 'bg-orange-50/40', border: 'border-orange-100', text: 'text-orange-700 bg-orange-50' },
    { id: 'planned', title: '6. Zaplanowana Produkcja', icon: <CalendarClock size={14}/>, bg: 'bg-purple-50/40', border: 'border-purple-100', text: 'text-purple-700 bg-purple-50' },
    { id: 'ordered', title: '7. Zamówione', icon: <Package size={14}/>, bg: 'bg-indigo-50/40', border: 'border-indigo-100', text: 'text-indigo-700 bg-indigo-50', hasAddBtn: true },
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      
      {/* --- NAGŁÓWEK TABELI (Teraz Zlockowany dzięki h-screen w App.tsx) --- */}
      <div className="overflow-x-auto overflow-y-hidden flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex min-w-max">
          
          {/* Nagłówek 1: Baza Produktów (Sticky Left) */}
          <div className="sticky left-0 w-[320px] p-3 flex justify-between items-center border-r border-slate-200 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            <span className="font-bold text-xs uppercase text-slate-600">1. Baza Produktów</span>
            <div className="flex gap-1">
              <label className="hover:bg-slate-100 p-1 rounded cursor-pointer text-slate-600" title="Import Produktów CSV">
                  <Upload size={16} />
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={onProductImport} />
              </label>
              <button onClick={onAddProduct} className="hover:bg-slate-100 p-1 rounded text-blue-600"><Plus size={16}/></button>
            </div>
          </div>

          {/* Nagłówki reszty kolumn */}
          {COLUMNS.map(col => (
            <div key={col.id} className={`w-[280px] p-3 flex justify-between items-center border-r border-slate-200 ${col.text} font-bold text-xs uppercase`}>
              <div className="flex items-center gap-2">
                {col.icon}
                {col.title}
              </div>
              {col.hasUpload && (
                 <label className="cursor-pointer hover:opacity-80"><input type="file" className="hidden" onChange={onBatchImport} /><Upload size={16}/></label>
              )}
              {col.hasAddBtn && (
                 <button onClick={onAddOrder} className="hover:bg-white/50 p-1 rounded"><Plus size={16}/></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- TREŚĆ TABELI (WIERSZE PRODUKTÓW) - To się teraz przewija wewnątrz --- */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {products.map(p => (
            <div key={p.sku} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors min-h-[140px]">
              
              {/* Kolumna 1: Karta Produktu (Sticky Left) */}
              <div className="sticky left-0 w-[320px] p-3 border-r border-slate-200 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <ProductCard 
                  product={p} 
                  allBatches={batches} 
                  onEdit={onEditProduct} 
                  onDelete={onDeleteProduct}
                  onColorChange={onColorChangeProduct}
                />
              </div>

              {/* Pozostałe Kolumny (Statusy) */}
              {COLUMNS.map(col => (
                <div 
                  key={col.id} 
                  className={`w-[280px] p-2 border-r border-slate-200 flex flex-col gap-2 ${col.bg}`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  {batches
                    .filter(b => b.productSku === p.sku && b.status === col.id)
                    .map(b => (
                      <KanbanCard 
                        key={b.id} 
                        batch={b} 
                        product={p} 
                        onDelete={onDeleteBatch} 
                        onSplit={onSplitBatch} 
                        onEdit={onEditBatch} 
                        onUpdate={onUpdateBatch} 
                        onDragStart={onDragStart} 
                      />
                    ))
                  }
                </div>
              ))}

            </div>
          ))}

          {/* Pusty stan */}
          {products.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <p className="mb-2">Brak zdefiniowanych produktów.</p>
              <button onClick={onAddProduct} className="text-blue-600 hover:underline">Dodaj pierwszy produkt</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default KanbanBoard;