import React, { useState } from 'react';
import { Palette, Pencil, Scissors, X, MapPin, Calendar, Ship, Factory, CalendarClock, Container } from 'lucide-react';
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
      <div className="flex justify-between items-start mb-1.5">
        <span className="font-bold text-slate-700 truncate pr-16 block text-[11px] leading-tight">{product.name}</span>
        
        {/* Akcje (widoczne po najechaniu) */}
        <div 
          className="flex items-center gap-0.5 absolute top-1 right-1 z-50 bg-white/90 rounded px-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"
          onMouseDown={(e) => e.stopPropagation()} 
        >
          {/* Przycisk Koloru */}
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              className="text-slate-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50"
              title="Kolor"
            >
              <Palette size={10} />
            </button>
            {showColorPicker && (
              <ColorPickerPopup 
                onSelect={(c) => onUpdate(batch.id, 'color', c)} 
                onClose={() => setShowColorPicker(false)} 
              />
            )}
          </div>

          {/* Przycisk Edycji */}
          <button 
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               e.nativeEvent.stopImmediatePropagation();
               onEdit(batch);
            }}
            className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
            title="Edytuj"
          >
            <Pencil size={10} />
          </button>

          {/* Przycisk Rozdzielania (Dostępny dla większości statusów) */}
          {(batch.status === 'transit' || batch.status === 'stock' || batch.status === 'ready' || batch.status === 'ordered') && (
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
              <Scissors size={10} className="transform -scale-x-100"/>
            </button>
          )}
          
          {/* Przycisk Usuwania */}
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
             title="Usuń"
          >
            <X size={10} />
          </button>
        </div>
      </div>
      
      {/* --- SEKCJA INFORMACYJNA (ZALEŻNA OD STATUSU) --- */}
      <div className="space-y-1 mb-2 text-[10px] text-slate-600">
        
        {/* 1. MAGAZYN */}
        {batch.status === 'stock' && batch.warehouse && (
          <div className="text-emerald-700 bg-emerald-50/50 px-1 py-0.5 rounded flex items-center gap-1 w-fit">
            <MapPin size={10} /> {batch.warehouse}
          </div>
        )}

        {/* 2. TRANSPORT */}
        {batch.status === 'transit' && (
          <>
             {batch.eta && (
               <div className="flex items-center gap-1 font-medium text-blue-700">
                 <Calendar size={10}/> ETA: {batch.eta}
               </div>
             )}
             {batch.vesselName && (
               <div className="flex items-center gap-1" title="Statek">
                 <Ship size={10}/> {batch.vesselName}
               </div>
             )}
             {batch.containerNo && (
               <div className="flex items-center gap-1 text-slate-400" title="Kontener">
                 <Container size={10}/> {batch.containerNo}
               </div>
             )}
          </>
        )}

        {/* 3. ZAPLANOWANA PRODUKCJA (Nowe) */}
        {batch.status === 'planned' && (
           <div className="flex items-center gap-1 text-purple-700 font-medium bg-purple-50/50 px-1 py-0.5 rounded w-fit">
             <CalendarClock size={10}/> 
             {batch.plannedProductionDate ? `Start: ${batch.plannedProductionDate}` : "Brak daty"}
           </div>
        )}

        {/* 4. W TRAKCIE PRODUKCJI (Nowe) */}
        {batch.status === 'in_production' && (
           <div className="flex items-center gap-1 text-orange-700 font-medium bg-orange-50/50 px-1 py-0.5 rounded w-fit">
             <Factory size={10}/> 
             {batch.productionEndDate ? `Koniec: ${batch.productionEndDate}` : "Brak daty"}
           </div>
        )}

        {/* 5. ZAMÓWIONE */}
        {batch.status === 'ordered' && batch.orderDate && (
           <div className="flex items-center gap-1 text-indigo-600">
             <Calendar size={10}/> Zam: {batch.orderDate}
           </div>
        )}
      </div>
      
      {/* STOPKA KARTY (Wymiar i ilość) */}
      <div className="flex justify-between items-end border-t border-slate-100 pt-1.5">
        <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px] text-slate-500 border border-slate-100">{product.dimension}</span>
        <span className="font-bold text-blue-600 text-sm">{batch.quantity.toFixed(0)} <span className="text-[9px] font-normal text-slate-400">m²</span></span>
      </div>
    </div>
  );
};

export default KanbanCard;