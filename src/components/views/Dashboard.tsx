import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { Product, Batch } from '../../lib/types';
import { calculateProductMetrics } from '../../lib/utils';

interface Props {
  products: Product[];
  batches: Batch[];
  onUpdateProductNote?: (sku: string, note: string) => void;
}

const Dashboard: React.FC<Props> = ({ products, batches, onUpdateProductNote }) => {
  const reportData = products.map(p => ({ product: p, metrics: calculateProductMetrics(p, batches) }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
        <h2 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} /> Raport Analityczny</h2>
        <div className="text-xs text-slate-500">Pełny przegląd łańcucha dostaw</div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 border-b border-r border-slate-200 min-w-[200px]">1. Produkt</th>
              <th className="p-3 border-b text-right bg-emerald-50 text-emerald-800 border-r border-slate-200">2. Stan</th>
              <th className="p-3 border-b text-right bg-blue-50 text-blue-800 border-r border-slate-200">3. W Transporcie</th>
              <th className="p-3 border-b text-right border-r border-slate-200">4. Sprzedaż</th>
              <th className="p-3 border-b text-right border-r border-slate-200">5. Zapas (Dni)</th>
              <th className="p-3 border-b text-center bg-red-50 text-red-800 border-r border-slate-200">6. Przewidywany Brak</th>
              <th className="p-3 border-b text-center border-r border-slate-200">7. Koniec Produkcji</th>
              <th className="p-3 border-b text-center border-r border-slate-200">8. Najstarsze Zam.</th>
              <th className="p-3 border-b text-center border-r border-slate-200">9. Następna Dostawa</th>
              <th className="p-3 border-b min-w-[200px] border-r border-slate-200">10. Notatka</th>
              <th className="p-3 border-b text-center sticky right-0 bg-slate-100 z-10">11. Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map(({ product, metrics }) => (
              <tr key={product.sku} className="hover:bg-slate-50 transition-colors">
                
                {/* 1. Produkt */}
                <td className="p-3 border-r border-slate-200">
                    <div className="font-medium text-slate-800 truncate max-w-[250px]" title={product.name}>{product.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                </td>

                {/* 2. Stan */}
                <td className="p-3 text-right font-bold bg-emerald-50/30 text-emerald-700 border-r border-slate-200">
                    {metrics.totalStock.toFixed(0)} <span className="text-[10px] font-normal">m²</span>
                </td>

                {/* 3. W Transporcie */}
                <td className="p-3 text-right font-bold bg-blue-50/30 text-blue-700 border-r border-slate-200">
                    {metrics.totalInTransit.toFixed(0)} <span className="text-[10px] font-normal">m²</span>
                </td>

                {/* 4. Sprzedaż dzienna */}
                <td className="p-3 text-right text-slate-600 border-r border-slate-200">
                    {metrics.dailySales.toFixed(1)} /d
                </td>

                {/* 5. Zapas (dni) */}
                <td className={`p-3 text-right font-bold border-r border-slate-200 ${metrics.daysInventoryOnHand < 30 ? 'text-red-600' : 'text-slate-600'}`}>
                    {metrics.daysInventoryOnHand > 900 ? '∞' : metrics.daysInventoryOnHand.toFixed(0)}
                </td>

                {/* 6. Przewidywany brak (Data) */}
                <td className="p-3 text-center bg-red-50/30 border-r border-slate-200">
                    {metrics.predictedStockoutDate ? (
                        <div className="text-red-600 font-bold text-xs flex items-center justify-center gap-1">
                            <AlertTriangle size={12}/> {metrics.predictedStockoutDate}
                        </div>
                    ) : (
                        <span className="text-emerald-500 text-xs">-</span>
                    )}
                </td>

                {/* 7. Koniec Produkcji */}
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.predictedProductionEnd ? (
                        <span className="text-orange-700 font-medium text-xs">{metrics.predictedProductionEnd}</span>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* 8. Najstarsze Zamówienie */}
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.oldestOrderDate ? (
                        <span className="text-indigo-700 font-medium text-xs">{metrics.oldestOrderDate}</span>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* 9. Następna Dostawa */}
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.nextArrivalDate ? (
                        <div>
                            <div className="text-blue-700 font-medium text-xs">{metrics.nextArrivalDate}</div>
                            <div className="text-[10px] text-slate-400">za {metrics.daysToNextArrival} dni</div>
                        </div>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* 10. Notatka (Edytowalna) */}
                <td className="p-2 border-r border-slate-200">
                    <input 
                        type="text" 
                        defaultValue={product.dashboardNote || ''}
                        placeholder="Wpisz notatkę..."
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-xs text-slate-600 focus:bg-white px-1 py-1 transition-colors"
                        onBlur={(e) => {
                            if (onUpdateProductNote && e.target.value !== product.dashboardNote) {
                                onUpdateProductNote(product.sku, e.target.value);
                            }
                        }}
                    />
                </td>

                {/* 11. Status */}
                <td className="p-3 text-center sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${metrics.decision === 'ORDER NOW' ? 'bg-red-100 text-red-700 border-red-200' : metrics.decision === 'URGENT GAP' ? 'bg-orange-100 text-orange-700 border-orange-200' : metrics.decision === 'WAIT' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                        {metrics.decision === 'ORDER NOW' && 'ZAMAWIAJ'}
                        {metrics.decision === 'URGENT GAP' && 'LUKA CZASOWA'}
                        {metrics.decision === 'WAIT' && 'CZEKAJ'}
                        {metrics.decision === 'OK' && 'OK'}
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;