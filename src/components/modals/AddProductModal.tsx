import React from 'react';
import { X } from 'lucide-react';
import type { Product } from '../../lib/types';

interface Props {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingProduct: Product | null;
}

const AddProductModal: React.FC<Props> = ({ onClose, onSubmit, editingProduct }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{editingProduct ? 'Edytuj Produkt' : 'Dodaj Nową Płytkę'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Nazwa Produktu</label>
            <input required name="name" defaultValue={editingProduct?.name} placeholder="np. Gres Szkliwiony Carrara" className="w-full border p-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">SKU (Unikalny)</label>
              <input required name="sku" defaultValue={editingProduct?.sku} readOnly={!!editingProduct} placeholder="np. GRES-001" className={`w-full border p-2 rounded ${editingProduct ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Kod EAN</label>
              <input required name="ean" defaultValue={editingProduct?.ean} placeholder="np. 590..." className="w-full border p-2 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Wymiar</label>
              <input required name="dimension" defaultValue={editingProduct?.dimension} placeholder="np. 60x60" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Wykończenie</label>
              <select name="finish" defaultValue={editingProduct?.finish || "Poler"} className="w-full border p-2 rounded">
                <option value="Poler">Poler</option>
                <option value="Mat">Mat</option>
                <option value="Carving">Carving</option>
                <option value="Lappato">Lappato</option>
                <option value="Inne">Inne</option>
              </select>
            </div>
          </div>
          <div className="border-t pt-2 mt-2">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Parametry Logistyczne</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sprzedaż 6-msc (m²)</label>
                <input required name="sales6Months" type="number" step="0.01" defaultValue={editingProduct?.sales6Months} placeholder="np. 3600" className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Lead Time (Dni)</label>
                  {/* ZMIANA: Domyślnie 134 dni (45+14+75) */}
                  <input required name="leadTimeDays" type="number" defaultValue={editingProduct?.leadTimeDays || 134} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Zapas Bezp. (Dni)</label>
                  {/* ZMIANA: Domyślnie 20 dni */}
                  <input required name="safetyStockDays" type="number" defaultValue={editingProduct?.safetyStockDays || 20} className="w-full border p-2 rounded" />
                </div>
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-medium hover:bg-slate-900 mt-2">
            {editingProduct ? 'Zapisz Zmiany' : 'Utwórz Produkt'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;