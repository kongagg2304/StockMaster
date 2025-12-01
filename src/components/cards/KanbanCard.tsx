import React, { useState } from 'react';
import { Palette, Pencil, Scissors, X, MapPin, Calendar, Ship } from 'lucide-react';
import type { Batch, Product } from '../../lib/types';
import { COLOR_PALETTE } from '../../lib/constants';
import ColorPickerPopup from './ColorPickerPopup';

interface Props {
  batch: Batch;
  product: Product | undefined;
  onDelete: (id: string) => void;
  onSplit: (batch: Batch) => void;
  onEdit: (batch: Batch) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

const KanbanCard: React.FC<Props> = ({ 
  batch, product, onDelete, onSplit, onEdit, onUpdate, onDragStart 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!product) return null;

  const styles = batch.color 
    ? { border: COLOR_PALETTE[batch.color].border, bg: COLOR_PALETTE[batch.color].bg }
    : { border: 'border-l-transparent', bg: 'bg-white' };

  return (
    <div 
      draggable
      onDragStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) {
          e.preventDefault();
          return;
        }
        onDragStart(e, batch.id);
      }}
      className={`p-2 rounded shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-2 group relative text-xs ${styles.bg} ${styles.border} ${batch.color ? 'border-l-4' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-slate-700 truncate pr-20 block">{product.name}</span>
        
        <div 
          className="flex items-center gap-1 absolute top-1 right-1 z-50 bg-white/80 rounded px-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => e.stopPropagation()} 
        >
          {/* Paleta */}
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              className="text-slate-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50"
              title="Oznacz kolorem"
            >
              <Palette size={12} />
            </button>
            {showColorPicker && (
              <ColorPickerPopup 
                onSelect={(c) => onUpdate(batch.id, 'color', c)} 
                onClose={() => setShowColorPicker(false)} 
              />
            )}
          </div>

          <button 
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               e.nativeEvent.stopImmediatePropagation();
               onEdit(batch);
            }}
            className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
            title="Edytuj dane partii"
          >
            <Pencil size={12} />
          </button>

          {(batch.status === 'transit' || batch.status === 'stock') && (
            <button 
              type="button"
              onClick={(e) => {
                 e.stopPropagation();
                 e.nativeEvent.stopImmediatePropagation();
                 onSplit(batch);
              }}
              className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
              title="Rozdziel"
            >
              <Scissors size={12} className="transform -scale-x-100"/>
            </button>
          )}
          
          <button 
             type="button"
             onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation(); 
                setTimeout(() => {
                    if(window.confirm("Usunąć tę partię towaru?")) {
                        onDelete(batch.id);
                    }
                }, 10);
             }}
             className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
          >
            <X size={12}/>
          </button>
        </div>
      </div>
      
      {batch.status === 'stock' && batch.warehouse && (
        <div className="text-[10px] text-emerald-600 font-medium mb-1 flex items-center gap-1">
          <MapPin size={10} /> {batch.warehouse}
        </div>
      )}

      {batch.status === 'transit' && (
        <div className="mb-1 space-y-0.5 text-[10px] text-slate-500">
           {batch.eta && <div className="flex items-center gap-1"><Calendar size={10}/> ETA: {batch.eta}</div>}
           {batch.vesselName && <div className="flex items-center gap-1"><Ship size={10}/> {batch.vesselName}</div>}
        </div>
      )}

      {batch.status === 'ordered' && batch.orderDate && (
         <div className="text-[10px] text-indigo-500 mb-1 flex items-center gap-1">
           <Calendar size={10}/> Zamówiono: {batch.orderDate}
         </div>
      )}
      
      <div className="flex justify-between items-end mt-2">
        <span className="bg-white/50 px-1.5 py-0.5 rounded text-[9px] text-slate-500 border border-slate-100">{product.dimension}</span>
        <span className="font-bold text-blue-600">{batch.quantity.toFixed(2)} m²</span>
      </div>
    </div>
  );
};

export default KanbanCard;