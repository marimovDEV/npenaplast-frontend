import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Landmark, TrendingDown, Target, Building2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import type { Budget, CostCenter, FiscalPeriod } from '../types';

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<number | ''>('');
  const [selectedCostCenter, setSelectedCostCenter] = useState<number | ''>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (periods.length > 0) {
      fetchBudgets();
    }
  }, [selectedPeriod, selectedCostCenter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ccRes, fpRes] = await Promise.all([
        api.get('budgets/cost-centers/'),
        api.get('accounting/fiscal-periods/')
      ]);
      setCostCenters(ccRes.data.results || ccRes.data);
      const fetchedPeriods = fpRes.data.results || fpRes.data;
      setPeriods(fetchedPeriods);
      
      if (fetchedPeriods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(fetchedPeriods[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      let url = 'budgets/budgets/';
      const params = new URLSearchParams();
      if (selectedPeriod) params.append('fiscal_period', selectedPeriod.toString());
      if (selectedCostCenter) params.append('cost_center', selectedCostCenter.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await api.get(url);
      setBudgets(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" /> Byudjet Nazorati
        </h2>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">
          <Plus className="w-4 h-4" /> Yangi Byudjet
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hisobot Davri</label>
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm w-48 font-semibold">
            <option value="">Barchasi</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Xarajat Markazi</label>
          <select value={selectedCostCenter} onChange={e => setSelectedCostCenter(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm w-48 font-semibold">
            <option value="">Barchasi</option>
            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={fetchBudgets} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(budget => {
          const usedPct = budget.used_percentage || 0;
          const isOver = usedPct > 100;
          const isWarning = usedPct > 80 && !isOver;
          
          let color = 'emerald';
          if (isOver) color = 'rose';
          else if (isWarning) color = 'amber';

          return (
            <motion.div key={budget.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-2xl border relative overflow-hidden ${isOver ? 'border-rose-200 shadow-rose-100' : 'border-slate-100 shadow-sm'}`}>
              
              {/* Progress bar background */}
              <div 
                className={`absolute bottom-0 left-0 h-1 bg-${color}-500 transition-all duration-1000`}
                style={{ width: `${Math.min(usedPct, 100)}%` }} 
              />
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{budget.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {budget.cost_center_name || 'Barchasi'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${color}-50 text-${color}-700`}>
                    {usedPct.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-slate-500">Rejalashtirilgan:</span>
                    <span className="text-sm font-bold text-slate-900">{fmt(budget.planned_amount)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-slate-500">Sarflangan haqiqatda:</span>
                    <span className={`text-sm font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>{fmt(budget.actual_amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50 flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qoldiq / Farq</span>
                    <span className={`text-lg font-black ${(budget.variance || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {(budget.variance || 0) >= 0 ? '+' : ''}{fmt(budget.variance || 0)}
                    </span>
                  </div>
                </div>

                {isOver && (
                  <div className="mt-4 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">
                    <AlertCircle className="w-4 h-4" /> Byudjetdan oshib ketdi!
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {budgets.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-2xl border-dashed">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Byudjetlar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
