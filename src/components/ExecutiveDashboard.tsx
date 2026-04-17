import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, TrendingDown, DollarSign, Activity, AlertOctagon, BarChart3, Users } from 'lucide-react';
import api from '../lib/api';
import type { AccountingSummary } from '../types';

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Pseudo-data for anomalies/smart alerts visualization
  const anomalyScore = 8.5; // Out of 100
  const efficiency = 94.2; // %

  useEffect(() => {
    fetchData();
    // Simulate real-time data stream
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetching from report analytics for enterprise KPIs
      const sumRes = await api.get('reports/analytics/');
      setSummary(sumRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  if (loading && !summary) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent flex rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
            Real-time Factory Data Engine
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <DollarSign className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oylik Foyda (Phase 5)</h3>
            <p className="text-3xl font-black text-white mt-2">{fmt(summary.kpis?.monthly_profit || 0)} <span className="text-sm font-semibold text-emerald-400">uzs</span></p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-white/10 text-emerald-400 text-[10px] font-bold rounded">{summary.kpis?.avg_margin || 0}% Margin</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <Activity className="w-24 h-24 text-indigo-50 absolute -right-4 -bottom-4" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ishlab Chiqarish Effektivligi</h3>
            <p className="text-3xl font-black text-indigo-600 mt-2">{efficiency}%</p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">+2.4% o'sish</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <AlertOctagon className="w-24 h-24 text-rose-50 absolute -right-4 -bottom-4" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zavod Anomaliyasi (Risk)</h3>
            <p className="text-3xl font-black text-slate-800 mt-2">{anomalyScore} <span className="text-sm text-slate-400 font-semibold">/ 100</span></p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">Normal</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <Activity className="w-24 h-24 text-indigo-50 absolute -right-4 -bottom-4" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sklad Qiymati (Valuation)</h3>
            <p className="text-3xl font-black text-indigo-600 mt-2">{fmt(summary.kpis?.stock_value || 0)} <span className="text-sm font-semibold text-slate-400">uzs</span></p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">Real-time Batch Cost</span>
            </div>
          </div>
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Real-time signals placeholder */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> Pul oqimi yopilishi (Closing Status)
          </h3>
          <div className="space-y-4">
            {/* Visualizer for month close */}
            <div className="flex items-center gap-4">
               <div className="w-16 text-xs font-bold text-slate-500">Aprel 2026</div>
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 w-[60%]"></div>
               </div>
               <div className="w-16 text-xs font-bold text-indigo-600 text-right">Ochiq</div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-16 text-xs font-bold text-slate-500">Mart 2026</div>
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[100%]"></div>
               </div>
               <div className="w-16 text-xs font-bold text-emerald-600 text-right">Yopilgan</div>
            </div>
          </div>
        </div>

        {/* Product Costing Analysis */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
           <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Tannarx Analitikasi (Product Costing)
          </h3>
           <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-500 font-medium">Styrofoam Block standard</span>
                 <span className="font-bold text-slate-800">12,500 uzs / m3</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[85%]"></div>
              </div>
              
              <div className="flex justify-between items-center text-xs mt-4">
                 <span className="text-slate-500 font-medium">CNC Decorative Panel</span>
                 <span className="font-bold text-rose-500">45,000 uzs / stk (High Cost!)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500 w-[95%]"></div>
              </div>
           </div>
        </div>

        {/* Action required mapping */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" /> Boshqaruv qarori kutilmoqda
          </h3>
          <div className="space-y-3">
             <div className="p-3 bg-amber-50 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                   <span className="text-xs font-semibold text-amber-800">Batch #902 uchun tannarx chegaradan o'tdi (+15% material loss)</span>
                </div>
                <button className="px-3 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700">Audit</button>
             </div>
             <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-800">Mart oyi moliyaviy davri yopishga tayyor (Balanced: 100%)</span>
                <button className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700">Yopish</button>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
