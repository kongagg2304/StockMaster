import React from 'react';
import { X } from 'lucide-react';
import type { Batch } from '../../lib/types';
import { WAREHOUSES } from '../../lib/constants';

interface Props {
  batch: Batch;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EditBatchModal: React.FC<Props> = ({ batch, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edycja Partii</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ilość (m²)</label>
            <input required type="number" step="0.01" name="quantity" defaultValue={batch.quantity} className="w-full border p-2 rounded font-bold text-lg" />
          </div>

          {batch.status === 'stock' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Magazyn</label>
              <select name="warehouse" defaultValue={batch.warehouse} className="w-full border p-2 rounded">
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}

          {batch.status === 'transit' && (
            <>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data ETA (Przypłynięcie)</label>
                <input type="date" name="eta" defaultValue={batch.eta} className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nr Kontenera</label>
                  <input name="containerNo" defaultValue={batch.containerNo} placeholder="MSCU..." className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Statek</label>
                  <input name="vesselName" defaultValue={batch.vesselName} placeholder="MSC Oscar" className="w-full border p-2 rounded text-sm" />
                </div>
              </div>
            </>
          )}

          {batch.status === 'ordered' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Data Zamówienia</label>
              <input type="date" name="orderDate" defaultValue={batch.orderDate} className="w-full border p-2 rounded" />
            </div>
          )}

          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-medium hover:bg-slate-900 mt-2">Zapisz Zmiany</button>
        </form>
      </div>
    </div>
  );
};

export default EditBatchModal;