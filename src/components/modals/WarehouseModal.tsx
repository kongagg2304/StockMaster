import React from 'react';
import { X, MapPin } from 'lucide-react';
import { WAREHOUSES, type WarehouseName } from '../../lib/constants';

interface Props {
  onClose: () => void;
  onConfirm: (warehouse: WarehouseName) => void;
}

const WarehouseModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Przyjęcie do Magazynu</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4 text-center">Gdzie fizycznie znajduje się ten towar?</p>
          <div className="space-y-2">
            {WAREHOUSES.map(wh => (
              <button 
                key={wh}
                onClick={() => onConfirm(wh)}
                className="w-full p-3 text-left border rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center group"
              >
                <div className="bg-slate-100 p-2 rounded-full mr-3 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  <MapPin size={18} />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-emerald-800">{wh}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseModal;