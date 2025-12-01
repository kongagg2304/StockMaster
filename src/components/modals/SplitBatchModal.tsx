import React from 'react';
import { Scissors } from 'lucide-react';
import { WAREHOUSES, type WarehouseName } from '../../lib/constants';

interface Props {
  targetStatus: string;
  maxQty: number;
  splitQty: number;
  setSplitQty: (qty: number) => void;
  splitWarehouse: string;
  setSplitWarehouse: (w: WarehouseName) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const SplitBatchModal: React.FC<Props> = ({ 
  targetStatus, maxQty, splitQty, setSplitQty, splitWarehouse, setSplitWarehouse, onClose, onConfirm 
}) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="mb-4 text-center">
          <Scissors size={32} className="text-yellow-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold">
            {targetStatus === 'transit' ? "Podział Kontenerów" : 
             targetStatus === 'stock' ? "Podział Magazynowy" : "Rozdzielanie Partii"}
          </h3>
          <p className="text-sm text-slate-500">
            {targetStatus === 'transit' ? "Wydzielasz część towaru do nowej pozycji w transporcie." : 
             targetStatus === 'stock' ? "Przenosisz część towaru na inną paletę lub do innego magazynu." :
             "Przesuwasz towar do \"Gotowe do załadunku\"."}
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm">
           <div className="flex justify-between mb-1"><span>Dostępna ilość:</span><span className="font-bold">{maxQty.toFixed(2)} m²</span></div>
           <div className="flex justify-between text-blue-600"><span>{targetStatus === 'transit' ? "Nowy kontener:" : "Ilość do przeniesienia:"}</span><span className="font-bold">{splitQty.toFixed(2)} m²</span></div>
           <div className="flex justify-between text-slate-400 border-t border-slate-200 mt-2 pt-1">
             <span>
               {targetStatus === 'transit' ? "Pozostanie w pierwotnym:" : 
                targetStatus === 'stock' ? "Zostanie w obecnym miejscu:" : "Pozostanie w \"Zamówione\":"}
             </span>
             <span>{(maxQty - splitQty).toFixed(2)} m²</span>
           </div>
        </div>

        {targetStatus === 'stock' && (
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1 block">Magazyn docelowy dla wydzielonej części:</label>
            <select 
              className="w-full border p-2 rounded"
              value={splitWarehouse} 
              onChange={(e) => setSplitWarehouse(e.target.value as WarehouseName)}
            >
              <option value="" disabled>Wybierz magazyn</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        )}

        <input type="range" min="0" max={maxQty} step="0.01" value={splitQty} onChange={(e) => setSplitQty(Number(e.target.value))} className="w-full mb-4 accent-blue-600" />
        <input type="number" min="0" max={maxQty} step="0.01" value={splitQty} onChange={(e) => setSplitQty(Number(e.target.value))} className="w-full border p-2 rounded text-center font-bold text-lg mb-4" />
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded hover:bg-slate-200">Anuluj</button><button onClick={onConfirm} className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 font-medium">Potwierdź</button></div>
      </div>
    </div>
  );
};

export default SplitBatchModal;