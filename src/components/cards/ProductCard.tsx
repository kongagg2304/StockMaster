import React, { useMemo, useState } from 'react';
import { Palette, Pencil, Trash2 } from 'lucide-react';
import type { Product, Batch, ColorKey } from '../../lib/types';
import { COLOR_PALETTE } from '../../lib/constants';
import { calculateProductMetrics } from '../../lib/utils';
import ColorPickerPopup from './ColorPickerPopup';

interface Props {
  product: Product;
  allBatches: Batch[];
  onEdit: (p: Product) => void;
  onDelete: (sku: string) => void;
  onColorChange: (sku: string, color: ColorKey) => void;
}

const ProductCard: React.FC<Props> = ({ product, allBatches, onEdit, onDelete, onColorChange }) => {
  const metrics = useMemo(() => calculateProductMetrics(product, allBatches), [product, allBatches]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const styles = product.color 
    ? { border: COLOR_PALETTE[product.color].border, bg: COLOR_PALETTE[product.color].bg }
    : { border: 'border-l-slate-200', bg: 'bg-white' };

  let statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let statusText = 'OK';

  if (metrics.decision === 'CRITICAL LOW') {
    if (!product.color) { styles.border = 'border-l-red-900'; styles.bg = 'bg-red-50'; }
    statusBadgeColor = 'bg-red-900 text-white border-red-950';
    statusText = 'STAN KRYTYCZNY';
  } else if (metrics.decision === 'ORDER NOW') {
    if (!product.color) { styles.border = 'border-l-red-500'; styles.bg = 'bg-red-50'; }
    statusBadgeColor = 'bg-red-100 text-red-700 border-red-200';
    statusText = 'ZAMAWIAJ';
  } else if (metrics.decision === 'URGENT GAP') {
    if (!product.color) { styles.border = 'border-l-orange-500'; styles.bg = 'bg-orange-50'; }
    statusBadgeColor = 'bg-orange-100 text-orange-700 border-orange-200';
    statusText = 'LUKA CZASOWA';
  } else if (metrics.decision === 'WAIT') {
    if (!product.color) { styles.border = 'border-l-yellow-400'; styles.bg = 'bg-yellow-50'; }
    statusBadgeColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    statusText = 'CZEKAJ NA DOSTAWĘ';
  } else {
    statusBadgeColor = 'bg-green-100 text-green-700 border-green-200';
  }

  return (
      <div className={`p-3 rounded-lg shadow-sm border border-slate-200 h-full relative group ${styles.bg} ${styles.border} border-l-4 flex flex-col justify-between transition-colors`}>
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-sm text-slate-800">{product.name}</div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white/90 p-1 rounded shadow-sm border z-10">
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
                  className="text-slate-400 hover:text-purple-600 p-1 rounded"
                  title="Oznacz kolorem"
                >
                  <Palette size={14} />
                </button>
                {showColorPicker && (
                  <ColorPickerPopup 
                    onSelect={(c) => onColorChange(product.sku, c)} 
                    onClose={() => setShowColorPicker(false)} 
                  />
                )}
              </div>

              <button 
                 onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                 className="text-slate-400 hover:text-blue-600 p-1 rounded"
              >
                 <Pencil size={14} />
              </button>
              <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(product.sku); }}
                 className="text-slate-400 hover:text-red-600 p-1 rounded"
              >
                 <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 mb-1">{product.sku}</div>
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2 border ${statusBadgeColor}`}>
              {statusText}
          </div>
        </div>
        
        <div className="text-[10px] text-slate-400 border-t pt-2 mt-auto space-y-0.5">
           <div className="flex justify-between"><span>Stan mag.:</span> <span className="font-bold text-slate-600">{metrics.totalStock.toFixed(0)} m²</span></div>
           <div className="flex justify-between"><span>Sprzedaż:</span> <span>{metrics.dailySales.toFixed(2)}/dzień</span></div>
           <div className="flex justify-between" title="Reorder Point / Lead Time Demand">
             <span>ROP / LTD:</span> 
             <span>{metrics.reorderPoint.toFixed(0)} / {metrics.leadTimeDemand.toFixed(0)}</span>
           </div>
        </div>
      </div>
  );
};

export default ProductCard;