import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import type { Batch } from '../../lib/types';
import { WAREHOUSES } from '../../lib/constants';

interface Props {
  batch: Batch;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EditBatchModal: React.FC<Props> = ({ batch, onClose, onSubmit }) => {
  // Stan lokalny do synchronizacji Dni <-> Data
  const [eta, setEta] = useState(batch.eta || '');
  const [daysRemaining, setDaysRemaining] = useState<number | ''>('');

  // Przy starcie oblicz dni na podstawie ETA (jeśli jest)
  useEffect(() => {
    if (batch.eta) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const etaDate = new Date(batch.eta);
      const diff = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff);
    }
  }, [batch.eta]);

  // Gdy zmieniasz liczbę dni -> Aktualizuj datę ETA
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDaysRemaining(val === '' ? '' : parseInt(val));
    
    if (val !== '') {
      const days = parseInt(val);
      const date = new Date();
      date.setDate(date.getDate() + days);
      setEta(date.toISOString().split('T')[0]);
    }
  };

  // Gdy zmieniasz datę ETA -> Aktualizuj liczbę dni
  const handleEtaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEta(val);
    
    if (val) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(val);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edycja Partii</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600 transition-colors"/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ilość (m²)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              name="quantity" 
              defaultValue={batch.quantity} 
              className="w-full border p-2 rounded font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          {/* STATUS: MAGAZYN */}
          {batch.status === 'stock' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Magazyn</label>
              <select name="warehouse" defaultValue={batch.warehouse} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}

          {/* STATUS: ZAPLANOWANA PRODUKCJA */}
          {batch.status === 'planned' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Planowana Data Rozpoczęcia</label>
              <input type="date" name="plannedProductionDate" defaultValue={batch.plannedProductionDate} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          {/* STATUS: W TRAKCIE PRODUKCJI */}
          {batch.status === 'in_production' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Przewidywany Koniec Produkcji</label>
              <input type="date" name="productionEndDate" defaultValue={batch.productionEndDate} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          {/* STATUS: TRANSPORT (Z LICZNIKIEM) */}
          {batch.status === 'transit' && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase mb-1">
                <Calculator size={14}/> Kalkulator Dostawy
              </div>
              
              {/* Licznik Dni */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-bold">Pozostało dni</label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={daysRemaining}
                    onChange={handleDaysChange}
                    className="w-full border p-2 rounded font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                    placeholder="np. 75"
                  />
                  <span className="ml-2 text-xs text-slate-500 w-10">dni</span>
                </div>
              </div>

              {/* Data ETA */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data ETA (Przypłynięcie)</label>
                <input 
                  type="date" 
                  name="eta" 
                  value={eta} 
                  onChange={handleEtaChange}
                  className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nr Kontenera</label>
                  <input name="containerNo" defaultValue={batch.containerNo} placeholder="MSCU..." className="w-full border p-2 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Statek</label>
                  <input name="vesselName" defaultValue={batch.vesselName} placeholder="MSC Oscar" className="w-full border p-2 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* STATUS: ZAMÓWIONE */}
          {batch.status === 'ordered' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Data Zamówienia</label>
              <input type="date" name="orderDate" defaultValue={batch.orderDate} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-medium hover:bg-slate-900 transition-colors mt-2">
            Zapisz Zmiany
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditBatchModal;