import React from 'react';
import { TrendingUp, AlertTriangle, MapPin } from 'lucide-react';
import type { Product, Batch } from '../../lib/types';
import { calculateProductMetrics } from '../../lib/utils';

interface Props {
  products: Product[];
  batches: Batch[];
  onUpdateProductNote?: (sku: string, note: string) => void;
}

const Dashboard: React.FC<Props> = ({ products, batches, onUpdateProductNote }) => {
  const reportData = products.map(p => ({ product: p, metrics: calculateProductMetrics(p, batches) }));

  const getStockBreakdown = (sku: string) => {
    const stockBatches = batches.filter(b => b.productSku === sku && b.status === 'stock');
    if (stockBatches.length === 0) return null;
    
    const breakdown: Record<string, number> = {};
    stockBatches.forEach(b => {
      const wh = b.warehouse || 'Nieprzypisany';
      breakdown[wh] = (breakdown[wh] || 0) + b.quantity;
    });

    return Object.entries(breakdown).map(([wh, qty]) => ({ wh, qty }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center flex-shrink-0">
        <h2 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} /> Raport Analityczny</h2>
        <div className="text-xs text-slate-500">Pełny przegląd łańcucha dostaw</div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap relative">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-20 font-bold text-xs uppercase tracking-wider shadow-sm">
            <tr>
              <th className="p-3 border-b border-r border-slate-200 min-w-[200px] bg-slate-100">1. Produkt</th>
              <th className="p-3 border-b text-right bg-emerald-50 text-emerald-800 border-r border-slate-200">2. Stan</th>
              <th className="p-3 border-b text-right bg-blue-50 text-blue-800 border-r border-slate-200">3. W Transporcie</th>
              <th className="p-3 border-b text-right border-r border-slate-200 bg-slate-100">4. Sprzedaż</th>
              <th className="p-3 border-b text-right border-r border-slate-200 bg-slate-100">5. Zapas (Dni)</th>
              <th className="p-3 border-b text-center bg-red-50 text-red-800 border-r border-slate-200">6. Przewidywany Brak</th>
              <th className="p-3 border-b text-center border-r border-slate-200 bg-slate-100">7. Koniec Produkcji</th>
              <th className="p-3 border-b text-center border-r border-slate-200 bg-slate-100">8. Najstarsze Zam.</th>
              <th className="p-3 border-b text-center border-r border-slate-200 bg-slate-100">9. Następna Dostawa</th>
              <th className="p-3 border-b min-w-[200px] border-r border-slate-200 bg-slate-100">10. Notatka</th>
              <th className="p-3 border-b text-center sticky right-0 bg-slate-100 z-30 border-l border-slate-200">11. Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map(({ product, metrics }) => {
              const stockBreakdown = getStockBreakdown(product.sku);

              return (
              <tr key={product.sku} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border-r border-slate-200">
                    <div className="font-medium text-slate-800 truncate max-w-[250px]" title={product.name}>{product.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                </td>
                
                {/* 2. Stan - Zmieniono na toFixed(2) */}
                <td className="p-3 text-right font-bold bg-emerald-50/30 text-emerald-700 border-r border-slate-200 relative group cursor-help">
                    {metrics.totalStock.toFixed(2)} <span className="text-[10px] font-normal">m²</span>
                    {stockBreakdown && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                        <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-slate-300">Magazyny:</div>
                        <ul className="space-y-1">
                          {stockBreakdown.map(item => (
                            <li key={item.wh} className="flex justify-between">
                              <span className="flex items-center gap-1 text-slate-400"><MapPin size={10}/> {item.wh}</span>
                              <span className="font-mono">{item.qty.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                      </div>
                    )}
                </td>

                {/* 3. W Transporcie - Zmieniono na toFixed(2) */}
                <td className="p-3 text-right font-bold bg-blue-50/30 text-blue-700 border-r border-slate-200">
                    {metrics.totalInTransit.toFixed(2)} <span className="text-[10px] font-normal">m²</span>
                </td>

                {/* 4. Sprzedaż dzienna - Zmieniono na toFixed(2) */}
                <td className="p-3 text-right text-slate-600 border-r border-slate-200">
                    {metrics.dailySales.toFixed(2)} /d
                </td>

                <td className={`p-3 text-right font-bold border-r border-slate-200 ${metrics.daysInventoryOnHand < 30 ? 'text-red-600' : 'text-slate-600'}`}>
                    {metrics.daysInventoryOnHand > 900 ? '∞' : metrics.daysInventoryOnHand.toFixed(0)}
                </td>
                <td className="p-3 text-center bg-red-50/30 border-r border-slate-200">
                    {metrics.predictedStockoutDate ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-red-600 font-bold text-xs flex items-center gap-1">
                                <AlertTriangle size={12}/> {metrics.predictedStockoutDate}
                            </div>
                            <div className="text-[10px] text-red-400 font-medium">
                                za {metrics.daysToStockout} dni
                            </div>
                        </div>
                    ) : (
                        <span className="text-emerald-500 text-xs">-</span>
                    )}
                </td>
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.predictedProductionEnd ? (<span className="text-orange-700 font-medium text-xs">{metrics.predictedProductionEnd}</span>) : (<span className="text-slate-300">-</span>)}
                </td>
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.oldestOrderDate ? (<span className="text-indigo-700 font-medium text-xs">{metrics.oldestOrderDate}</span>) : (<span className="text-slate-300">-</span>)}
                </td>
                <td className="p-3 text-center border-r border-slate-200">
                    {metrics.nextArrivalDate ? (<div><div className="text-blue-700 font-medium text-xs">{metrics.nextArrivalDate}</div><div className="text-[10px] text-slate-400">za {metrics.daysToNextArrival} dni</div></div>) : (<span className="text-slate-300">-</span>)}
                </td>
                <td className="p-2 border-r border-slate-200">
                    <input type="text" defaultValue={product.dashboardNote || ''} placeholder="..." className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-xs text-slate-600 focus:bg-white px-1 py-1 transition-colors" onBlur={(e) => { if (onUpdateProductNote && e.target.value !== product.dashboardNote) onUpdateProductNote(product.sku, e.target.value); }} />
                </td>
                <td className="p-3 text-center sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap 
                      ${metrics.decision === 'CRITICAL LOW' ? 'bg-red-900 text-white border-red-950' : 
                        metrics.decision === 'ORDER NOW' ? 'bg-red-100 text-red-700 border-red-200' : 
                        metrics.decision === 'URGENT GAP' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                        metrics.decision === 'WAIT' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                        'bg-green-100 text-green-700 border-green-200'}`}>
                        {metrics.decision === 'CRITICAL LOW' && 'STAN KRYTYCZNY'}
                        {metrics.decision === 'ORDER NOW' && 'ZAMAWIAJ'}
                        {metrics.decision === 'URGENT GAP' && 'LUKA CZASOWA'}
                        {metrics.decision === 'WAIT' && 'CZEKAJ NA DOSTAWĘ'}
                        {metrics.decision === 'OK' && 'OK'}
                    </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;