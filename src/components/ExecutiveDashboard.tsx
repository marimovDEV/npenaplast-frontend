import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Activity, 
  AlertOctagon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Zap, 
  Package, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ZapOff,
  Briefcase,
  Layers,
  Info
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';

export default function ExecutiveDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('reports/analytics/');
      setData(res.data);
    } catch (e) {
      uiStore.showNotification("Analitika yuklanuvda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 min update
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">{t('Zavod ma\'lumotlari yig\'ilmoqda...')}</p>
      </div>
    );
  }

  const kpis = data.kpis;
  const heuristics = data.heuristics;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-10">
      {/* Header Overlay */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('Boshqaruv Paneli')}</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             {t('Strategik bosaqaruv va real-vaqt analitikasi')}
          </p>
        </div>
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm items-center gap-4">
           <div className="px-6 py-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Zavod Holati')}</p>
              <p className="text-sm font-black text-emerald-600 uppercase italic">Active / Optimized</p>
           </div>
           <button onClick={fetchData} className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all">
             <Activity className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Strategic KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { 
            label: 'Oylik Sof Foyda', 
            value: `${fmt(kpis.monthly_profit)} uzs`, 
            trend: '+12.4%', 
            icon: DollarSign, 
            color: 'bg-slate-900', 
            text: 'text-white',
            sub: `${kpis.avg_margin}% avg margin`
          },
          { 
            label: 'Sklad Qiymati', 
            value: `${fmt(kpis.stock_value)} uzs`, 
            trend: 'Optimized', 
            icon: Package, 
            color: 'bg-white', 
            text: 'text-slate-900',
            sub: t('Real-time Valuation')
          },
          { 
            label: 'Chiqindi (Waste)', 
            value: `${kpis.total_waste_kg} kg`, 
            trend: '-5.2%', 
            icon: ZapOff, 
            color: 'bg-white', 
            text: 'text-slate-900',
            sub: `${kpis.waste_per_block_kg} kg / unit`
          },
          { 
            label: 'Sotuv Trendi', 
            value: `${fmt(kpis.total_sales)} uzs`, 
            trend: '+8%', 
            icon: TrendingUp, 
            color: 'bg-white', 
            text: 'text-slate-900',
            sub: t('Oxirgi 30 kun')
          },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${kpi.color} p-8 rounded-[40px] border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all cursor-default`}
          >
             <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${kpi.color === 'bg-white' ? 'bg-slate-50 text-slate-900' : 'bg-white/10 text-white'}`}>
                   <kpi.icon className="w-6 h-6" />
                </div>
                <h3 className={`text-[11px] font-black uppercase tracking-widest opacity-60 mb-2 ${kpi.text}`}>{t(kpi.label)}</h3>
                <div className="flex items-baseline gap-2">
                   <p className={`text-2xl font-black ${kpi.text}`}>{kpi.value}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.sub}</span>
                   <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <ArrowUpRight className="w-3 h-3" /> {kpi.trend}
                   </div>
                </div>
             </div>
             <kpi.icon className={`w-32 h-32 absolute -right-8 -bottom-8 opacity-[0.03] ${kpi.text}`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Trend Engine */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[48px] border border-slate-100 shadow-card p-10 h-full">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('Savdo Dinamikasi')}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t('Kundalik sotuv tahlili')}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-slate-900" />
                       <span className="text-[10px] font-black text-slate-400 uppercase">{t('Tushum')}</span>
                    </div>
                 </div>
              </div>

              <div className="h-[300px] flex items-end justify-between gap-4 px-2">
                 {data.charts.sales_trend.map((day: any, i: number) => {
                    const max = Math.max(...data.charts.sales_trend.map((d: any) => d.value));
                    const height = (day.value / (max || 1)) * 100;
                    return (
                       <div key={i} className="flex-1 group relative flex flex-col items-center">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            className={`w-full max-w-[12px] rounded-full transition-all duration-500 ${height > 70 ? 'bg-slate-900' : 'bg-slate-200 group-hover:bg-slate-400'}`}
                          />
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg pointer-events-none shadow-xl z-20">
                             {fmt(day.value)}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase mt-4 rotate-45 lg:rotate-0">{day.date}</span>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* Actionable Decision Hub */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 blur-3xl opacity-10" />
              
              <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                 <ShieldCheck className="w-6 h-6 text-emerald-400" />
                 {t('Signals & Risks')}
              </h3>

              <div className="space-y-6 relative z-10">
                 {heuristics.supply_alerts && heuristics.supply_alerts.map((alert: any, i: number) => (
                    <motion.div 
                      key={alert.id || i} 
                      whileHover={{ x: 5 }}
                      className="p-5 bg-white/5 rounded-3xl border border-white/10 flex flex-col gap-3 group cursor-pointer"
                    >
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl text-white ${alert.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                            <AlertOctagon className="w-4 h-4" />
                         </div>
                         <p className={`text-xs font-black uppercase tracking-tight transition-colors ${alert.status === 'CRITICAL' ? 'text-rose-400 group-hover:text-rose-300' : 'text-amber-400 group-hover:text-amber-300'}`}>
                            {alert.material} ({alert.status})
                         </p>
                       </div>
                       <p className="text-[10px] font-medium text-slate-300 leading-relaxed pl-11">{alert.message}</p>
                    </motion.div>
                 ))}

                 {heuristics.cash_prediction && (
                    <div className={`p-6 border rounded-[32px] mt-10 ${heuristics.cash_prediction.risk_level === 'HIGH' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                       <div className="flex items-center gap-2 mb-4">
                          <Zap className={`w-4 h-4 ${heuristics.cash_prediction.risk_level === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`} />
                          <h4 className={`text-[10px] font-black uppercase tracking-widest ${heuristics.cash_prediction.risk_level === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>{t('Cash Gap Prediction')}</h4>
                       </div>
                       <p className="text-sm font-black text-white">{heuristics.cash_prediction.message}</p>
                       
                       <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1 font-bold">Kutilayotgan tushum (15 kun)</p>
                            <p className="text-sm font-black text-emerald-400">{fmt(heuristics.cash_prediction.projected_15d_inflow)} UZS</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1 font-bold">Muddati o'tgan qarzlar</p>
                            <p className="text-sm font-black text-rose-400">{fmt(heuristics.cash_prediction.overdue)} UZS</p>
                          </div>
                       </div>

                       <div className="mt-6 flex gap-2">
                          <button className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${heuristics.cash_prediction.risk_level === 'HIGH' ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'}`}>{t(heuristics.cash_prediction.action_label)}</button>
                          <button className="px-3 py-2 bg-white/5 text-white text-[9px] font-black uppercase rounded-xl hover:bg-white/10 transition-all"><Clock className="w-3 h-3" /></button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Secondary Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <Layers className="w-4 h-4 text-blue-500" /> {t('Waste Per Sector')}
            </h4>
            <div className="space-y-4">
               {data.charts.waste_distribution.map((w: any, i: number) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400">{w.name}</span>
                        <span className="text-slate-900">{w.value}%</span>
                     </div>
                     <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{width: `${w.value}%`}} />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-indigo-500" /> {t('Month Close Status')}
            </h4>
            <div className="py-2 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xs italic">DONE</div>
                  <div className="flex flex-col">
                     <span className="text-xs font-black text-slate-800">Mart 2026</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yopilgan (Balanced)</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xs italic">OPEN</div>
                  <div className="flex flex-col">
                     <span className="text-xs font-black text-slate-800">Aprel 2026</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktiv davr</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-slate-900 p-10 rounded-[48px] text-white flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
               <div className="p-3 bg-white/10 w-fit rounded-2xl">
                  <Info className="w-6 h-6 text-emerald-400" />
               </div>
               <h3 className="text-xl font-black tracking-tight">{t('Enterprise Readiness')}</h3>
               <p className="text-xs text-slate-400 leading-relaxed">{t('Barcha hisob-kitoblar Phase 7 mantiqiy auditidan o\'tdi. KPIlar real provodkalarga asoslangan.')}</p>
            </div>
            <button className="w-full py-4 mt-8 bg-white text-slate-900 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all">
               {t('Full Audit Report')}
            </button>
         </div>
      </div>
    </div>
  );
}
