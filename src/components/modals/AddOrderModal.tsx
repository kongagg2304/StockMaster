import React from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddOrderModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Złóż Zamówienie (Kolumna 5)</h3><button onClick={onClose}><X size={20} className="text-slate-400"/></button></div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Wyszukaj (SKU lub EAN)</label>
            <input required name="identifier" placeholder="Wpisz kod..." className="w-full border p-2 rounded" />
            <p className="text-[10px] text-slate-400 mt-1">Produkt musi istnieć w Kolumnie 1.</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ilość (m²)</label>
            <input required type="number" step="0.01" name="quantity" placeholder="0.00" className="w-full border p-2 rounded font-bold" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">Dodaj do Zamówień</button>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;