import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, Calculator, Filter, ArrowRight } from 'lucide-react';
import api from '../lib/api';

interface ProfitData {
  invoice: string;
  product: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  margin: number;
  date: string;
  is_legacy: boolean;
}

export default function ProfitabilityDashboard() {
  const [data, setData] = useState<ProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetMargin, setTargetMargin] = useState(20);
  const [sampleCost, setSampleCost] = useState(10000);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('reports/profitability/');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  const getMarginColor = (margin: number) => {
    if (margin < 0) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (margin < 5) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (margin < 15) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getMarginLabel = (margin: number) => {
    if (margin < 0) return 'LOSS';
    if (margin < 5) return 'CRITICAL';
    if (margin < 15) return 'WARNING';
    return 'HEALTHY';
  };

  const recommendedPrice = sampleCost / (1 - targetMargin / 100);

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Analitika yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profitability & Pricing Engine</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Real-time margin analysis & Smart pricing tool</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Pricing Tool */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Smart Pricing Tool</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit Cost (Tannarx)</label>
              <input 
                type="number" 
                value={sampleCost} 
                onChange={(e) => setSampleCost(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Margin: {targetMargin}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={targetMargin} 
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <span className="block text-xs font-bold text-indigo-600 uppercase mb-1">Recommended Selling Price</span>
              <span className="text-2xl font-black text-indigo-900">{fmt(recommendedPrice)} <span className="text-sm">uzs</span></span>
            </div>
          </div>
        </div>

        {/* Profitability Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-emerald-500" /> Recent Sales Profit Analysis
             </h2>
             <button onClick={fetchData} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
               <Filter className="w-3 h-3" /> Refresh
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-3">Order / Date</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Cost vs Price</th>
                  <th className="px-6 py-3">Profit</th>
                  <th className="px-6 py-3">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 Transition-colors cursor-default">
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-800">{item.invoice}</div>
                      <div className="text-[10px] font-semibold text-slate-400">{item.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-800">{item.product}</div>
                      <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        {item.is_legacy ? (
                          <span className="text-amber-600 flex items-center gap-0.5"><Info className="w-3 h-3" /> Legacy Cost (AVG)</span>
                        ) : (
                          <span className="text-indigo-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Batch Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="text-slate-400">{fmt(item.cost)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-800">{fmt(item.price)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-xs font-black ${item.profit < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {item.profit < 0 ? '-' : '+'}{fmt(Math.abs(item.profit))} uzs
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[9px] font-black rounded-lg border ${getMarginColor(item.margin)}`}>
                        {item.margin}% {getMarginLabel(item.margin)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Logic Card */}
      <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <TrendingUp className="w-64 h-64 text-white/5 absolute -right-16 -top-16 rotate-12" />
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-lg font-black flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Strategic Intelligence Update
          </h3>
          <p className="text-indigo-100 text-sm font-medium leading-relaxed">
            Phase 5 Profitability Engine is now active. Tizim avtomatik ravishda **SHIPPED** statusidagi mahsulotlar uchun 
            tannarxni batch orqali qulflaydi. Agar margin **5%** dan past bo'lsa, Director's Dashboard'da CRITICAL ogohlantirish ko'rsatiladi. 
            Legacy ma'lumotlar avtomatik ravishda AVG cost flag bilan belgilanmoqda.
          </p>
        </div>
      </div>
    </div>
  );
}
