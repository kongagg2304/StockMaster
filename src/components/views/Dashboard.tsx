import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Product, Batch } from '../../lib/types';
import { calculateProductMetrics } from '../../lib/utils';

interface Props {
  products: Product[];
  batches: Batch[];
}

const Dashboard: React.FC<Props> = ({ products, batches }) => {
  const reportData = products.map(p => ({ product: p, metrics: calculateProductMetrics(p, batches) }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
        <h2 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} /> Raport Analityczny</h2>
        <div className="text-xs text-slate-500">Obliczenia wg metodologii: ROP = LeadTime * Sprzedaż + ZapasBezpieczeństwa</div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 border-b">Produkt</th>
              <th className="p-3 border-b text-right bg-emerald-50 text-emerald-800">Stan (Kol 2)</th>
              <th className="p-3 border-b text-right bg-blue-50 text-blue-800">Przychód (3+4+5)</th>
              <th className="p-3 border-b text-right">Sprzedaż/Dzień</th>
              <th className="p-3 border-b text-right">Zapas (Dni)</th>
              <th className="p-3 border-b text-right">Punkt Zam. (ROP)</th>
              <th className="p-3 border-b text-center">Następna Dostawa</th>
              <th className="p-3 border-b text-center">Status (Decyzja)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map(({ product, metrics }) => (
              <tr key={product.sku} className="hover:bg-slate-50 transition-colors">
                <td className="p-3"><div className="font-medium text-slate-800">{product.name}</div><div className="text-xs text-slate-400 font-mono">{product.sku}</div></td>
                <td className="p-3 text-right font-bold bg-emerald-50/30 text-emerald-700">{metrics.totalStock.toFixed(2)} m²</td>
                <td className="p-3 text-right font-bold bg-blue-50/30 text-blue-700">{metrics.totalInTransit.toFixed(2)} m²</td>
                <td className="p-3 text-right text-slate-600">{metrics.dailySales.toFixed(2)}</td>
                <td className={`p-3 text-right font-bold ${metrics.daysInventoryOnHand < 14 ? 'text-red-500' : 'text-slate-600'}`}>{metrics.daysInventoryOnHand > 900 ? '∞' : metrics.daysInventoryOnHand.toFixed(0)}</td>
                <td className="p-3 text-right text-slate-500">{metrics.reorderPoint.toFixed(0)}</td>
                <td className="p-3 text-center">{metrics.nextArrivalDate ? (<div><div className="text-slate-800 font-medium">{metrics.nextArrivalDate}</div>{metrics.stockoutGapDays > 0 && (<div className="text-[10px] text-red-500 font-bold">Luka: {metrics.stockoutGapDays} dni!</div>)}</div>) : (<span className="text-slate-400">-</span>)}</td>
                <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${metrics.decision === 'ORDER NOW' ? 'bg-red-100 text-red-700 border-red-200' : metrics.decision === 'URGENT GAP' ? 'bg-orange-100 text-orange-700 border-orange-200' : metrics.decision === 'WAIT' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>{metrics.decision === 'ORDER NOW' && 'ZAMAWIAJ'}{metrics.decision === 'URGENT GAP' && 'LUKA CZASOWA'}{metrics.decision === 'WAIT' && 'CZEKAJ'}{metrics.decision === 'OK' && 'OK'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;