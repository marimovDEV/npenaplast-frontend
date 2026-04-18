import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Database, 
  Layers, 
  ShoppingCart, 
  Trash2, 
  Truck, 
  Factory, 
  Package, 
  BarChart3, 
  Zap, 
  Box, 
  Plus, 
  DollarSign, 
  User as UserIcon, 
  Activity, 
  AlertTriangle, 
  ArrowRight, 
  History, 
  FileText, 
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowUpRight,
  ShieldAlert,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { User } from '../types';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';

const AreaTrendChart = lazy(() => import('./charts/AreaTrendChart'));

const IconMap: Record<string, any> = {
  Database, Layers, Box, Trash2, ShoppingCart, Package, UserIcon, DollarSign
};

interface DashboardProps {
  user: User;
  onAction?: (tabId: string) => void;
}

export default function Dashboard({ user, onAction }: DashboardProps) {
  const { locale, t } = useI18n();
  const [stats, setStats] = useState<any[]>([]);
  const [strategicKpis, setStrategicKpis] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<any>({ intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [heuristics, setHeuristics] = useState<any>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const currentRole = user.effective_role || user.role_display || user.role;
  const isAdmin = currentRole === 'Bosh Admin' || currentRole === 'Admin';

  const fetchData = async (currentPeriod = period) => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('dashboard/summary/', { params: { period: currentPeriod } }),
        isAdmin ? api.get('audit-logs/') : Promise.resolve({ data: { results: [] } })
      ]);

      if (statsRes.data.stats) {
        setStats(statsRes.data.stats.map((s: any) => ({
           ...s,
           icon: IconMap[s.icon] || Database
        })));
      }
      
      setStrategicKpis(statsRes.data.strategicKpis || []);
      setTodayStats(statsRes.data.todayStats || { intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
      setDynamicChartData(statsRes.data.chartData || []);
      setHeuristics(statsRes.data.heuristics || null);

      const auditData = logsRes.data.results || logsRes.data || [];
      setRecentActions(Array.isArray(auditData) ? auditData.slice(0, 5) : []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
    const interval = setInterval(() => fetchData(period), 30000);
    return () => clearInterval(interval);
  }, [period]);

  const chartData = dynamicChartData.length > 0 ? dynamicChartData : [];
  const chartFallback = <div className="h-[300px] animate-pulse rounded-[40px] bg-slate-100" />;

  if (loading) return chartFallback;

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      
      {/* SECTION 1: Strategic Decisions (Top management specific) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {strategicKpis.map((kpi, i) => (
          <div key={kpi.name} className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-card hover:shadow-premium transition-all duration-500 group relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 flex items-center justify-center text-${kpi.color}-600`}>
                  {kpi.name === 'Sof Foyda' ? <DollarSign className="w-6 h-6" /> : kpi.name === 'Tushum' ? <TrendingUp className="w-6 h-6" /> : kpi.name === 'Xarajatlar' ? <BarChart3 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} bg-slate-50 px-2 py-1 rounded-lg`}>
                   {kpi.trend}
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t(kpi.name)}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">{kpi.value}</h4>
             </div>
          </div>
        ))}
      </div>

      {/* SECTION 2: THE DECISION CENTER (Alerts + Predictive) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ALERT CENTER 2.0 */}
        <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                {t('Decision Center')}
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full pulse-slow">
                  {heuristics?.supply_alerts?.length || 0}
                </span>
              </h3>
              <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors underline underline-offset-4">{t('History')}</button>
            </div>

            <div className="space-y-4">
               {heuristics?.supply_alerts?.map((alert: any) => (
                 <div key={alert.id} className={`p-6 rounded-[32px] border ${alert.status === 'CRITICAL' ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50 border-slate-100'} flex flex-col md:flex-row md:items-center justify-between gap-6 hover:translate-x-1 transition-transform group`}>
                    <div className="flex items-center gap-5">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${alert.status === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-400 shadow-sm border border-slate-100'}`}>
                          <AlertTriangle className="w-7 h-7" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 mb-1">{alert.message}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{alert.warehouse}</span>
                             <span className="w-1 h-1 bg-slate-300 rounded-full" />
                             <span className={`text-[10px] font-black uppercase ${alert.status === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>{alert.days_left} kun qoldi</span>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => onAction?.('sklad1')}
                      className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 ${alert.status === 'CRITICAL' ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-white text-slate-900 border border-slate-200'}`}
                    >
                      {t(alert.action_label)}
                    </button>
                 </div>
               ))}
               {(!heuristics?.supply_alerts || heuristics.supply_alerts.length === 0) && (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">{t('Hozircha xavfli holatlar mavjud emas')}</p>
                  </div>
               )}
            </div>
        </div>

        {/* PREDICTIVE INSIGHT CARDS */}
        <div className="space-y-8">
           {heuristics?.strategic_metrics?.map((metric: any, i: number) => (
             <div key={metric.title} className={`p-8 rounded-[48px] border overflow-hidden relative group transition-all duration-700 ${metric.type === 'RISK' ? 'bg-slate-900 text-white border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-card'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 ${metric.type === 'RISK' ? 'bg-rose-500' : 'bg-primary-accent'}`} />
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-6">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metric.type === 'RISK' ? 'bg-rose-500/20 text-rose-400' : 'bg-primary-accent/10 text-primary-accent'}`}>
                        {metric.type === 'RISK' ? <ShieldAlert className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t(metric.title)}</span>
                   </div>
                   <h4 className="text-xl font-black mb-1 leading-tight">{metric.content}</h4>
                   <p className={`text-2xl font-black mb-4 ${metric.type === 'RISK' ? 'text-rose-400' : 'text-emerald-500'}`}>{metric.value}</p>
                   <p className={`text-xs font-medium mb-8 leading-relaxed ${metric.type === 'RISK' ? 'text-slate-400' : 'text-slate-500'}`}>{metric.description}</p>
                   <button 
                     onClick={() => onAction?.(metric.tab_id)}
                     className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${metric.type === 'RISK' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-900 text-white'}`}
                   >
                     {t(metric.action_label)}
                     <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* SECTION 3: ANALYTICS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[56px] border border-slate-100 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  {t('Ishlab chiqarish & Sotuv')}
                </h3>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <span className="w-2 h-2 bg-blue-500 rounded-full" />
                   <span className="text-[10px] font-black text-slate-500 uppercase">{t('Bloklar')}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                   <span className="text-[10px] font-black text-slate-500 uppercase">{t('Sotuv')}</span>
                 </div>
              </div>
            </div>
            
            <div className="mb-10">
              <Suspense fallback={chartFallback}>
                <AreaTrendChart
                  data={chartData}
                  height={320}
                  gradientId="colorDecision"
                  gradientColor="#2563eb"
                  areas={[
                    { dataKey: 'prod', stroke: '#2563eb', fill: 'url(#colorDecision)', name: t('Bloklar') },
                    { dataKey: 'sales', stroke: '#10b981', fill: 'none', strokeDasharray: '4 4', name: t('Sotuv') },
                  ]}
                />
              </Suspense>
            </div>

            {/* Narrative Insight Box */}
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-5">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary flex-none">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Decision Insight')}</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {t("Oxirgi 7 kunda ishlab chiqarish barqaror. Sotuvlar va ishlab chiqarish o'rtasidagi muvozanat saqlanmoqda. Tannarx nazorati ijobiy natija bermoqda.")}
                </p>
              </div>
            </div>
         </div>

         {/* TODAY HIGHLIGHTS */}
         <div className="space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-card">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                {t('Bugungi natijalar')}
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Kirim', val: todayStats.intake, color: 'blue' },
                  { label: 'Tayyor', val: todayStats.production, color: 'indigo' },
                  { label: 'Sotuv', val: todayStats.sales_count, color: 'emerald' },
                  { label: 'Chiqindi', val: todayStats.waste, color: 'rose' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-premium transition-all">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t(item.label)}</span>
                    <span className={`text-lg font-black text-${item.color}-600`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[48px] text-white overflow-hidden relative group">
               <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
               <div className="relative z-10">
                 <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                   <History className="w-5 h-5 text-emerald-400" />
                   {t('Recents')}
                 </h3>
                 <div className="space-y-6">
                   {recentActions.map((action, i) => (
                     <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 pr-2">
                           <p className="text-xs font-bold text-slate-100 truncate">@{action.user_name || 'tizim'}</p>
                           <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{action.description}"</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
         </div>
      </div>
      
    </div>
  );
}
