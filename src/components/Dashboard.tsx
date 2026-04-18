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
  Calendar, 
  Zap, 
  ArrowUpRight, 
  Box, 
  Scissors, 
  Brush, 
  Plus, 
  DollarSign, 
  User as UserIcon, 
  Activity, 
  AlertTriangle, 
  ArrowRight, 
  History, 
  QrCode, 
  FileText, 
  CheckCircle2,
  TrendingUp,
  Settings,
  Target
} from 'lucide-react';
import { User } from '../types';
import api from '../lib/api';
import { useI18n } from '../i18n';

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
  const [todayStats, setTodayStats] = useState<any>({ intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
  const [docStats, setDocStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [heuristics, setHeuristics] = useState<any>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isMobile, setIsMobile] = useState(false);

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
      
      setTodayStats(statsRes.data.todayStats || { intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
      setDocStats(statsRes.data.docStats || []);
      setRecentTransactions((statsRes.data.recentSales || []).slice(0, 5));
      setDynamicChartData(statsRes.data.chartData || []);
      setHeuristics(statsRes.data.heuristics || null);

      const auditData = logsRes.data.results || logsRes.data || [];
      setRecentActions(Array.isArray(auditData) ? auditData.slice(0, 10) : []);
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

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const chartData = dynamicChartData.length > 0 ? dynamicChartData : [];
  const chartFallback = <div className="h-[300px] animate-pulse rounded-[40px] bg-slate-100" />;

  const renderEmptyState = (title: string, action: string, tabId: string) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-slide-up">
      <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-premium border border-slate-100">
        <Plus className="w-12 h-12 text-slate-300" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3">{t(title)}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-10 leading-relaxed font-medium">
        {t("Tizimda hali ma'lumotlar yo'q. Ishni boshlash uchun quyidagi amalni bajaring va jarayonni kuzating.")}
      </p>
      <button 
        onClick={() => onAction?.(tabId)}
        className="bg-primary-accent text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
      >
        {t(action)}
      </button>
    </div>
  );

  if (loading) return chartFallback;

  const isDataEmpty = stats.length === 0 || stats.every(s => s.value === 0 || s.value === '0' || s.value === '0 kg');

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
            {t('Xush kelibsiz')}, {user.name.split(' ')[0]} 👋
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
              {t('Tizim holati')}: <span className="text-emerald-600 ml-1">{t('Faol')}</span>
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[22px] shadow-premium border border-slate-200/60">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-7 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  period === p 
                  ? 'bg-primary text-white shadow-2xl ring-1 ring-white/10' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
              >
                {p === 'day' ? t('Kun') : p === 'week' ? t('Hafta') : t('Oy')}
              </button>
            ))}
          </div>
        )}
      </div>

      {isDataEmpty && isAdmin ? (
        renderEmptyState('Ma’lumotlar mavjud emas', 'Birinchi kirimni qo‘shing', 'sklad1')
      ) : (
        <>
          {/* KPI GRID 2.0 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div 
                key={stat.name} 
                className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-card hover:shadow-premium hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden"
              >
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-[0.04] group-hover:scale-150 transition-transform duration-1000 ${stat.color.replace('bg-', 'bg-')}`} />
                <div className="flex flex-col gap-6 relative z-10">
                  <div className={`${stat.color} w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-inherit/25 group-hover:rotate-6 transition-transform`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t(stat.name)}</p>
                    <div className="flex items-end gap-3">
                      <h4 className="text-3xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg leading-none mb-1 shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        <span>12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MAIN INSIGHTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Charts - Main Block */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-card relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-primary-accent rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      {t('Tizim Dinamikasi')}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{t('Ishlab chiqarish va sotuv ko\'rsatkichlari')}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-blue-500 rounded-full" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Bloklar')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Sotuv')}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <Suspense fallback={chartFallback}>
                    <AreaTrendChart
                      data={chartData}
                      height={350}
                      gradientId="colorDynamicPremium"
                      gradientColor="#2563eb"
                      areas={[
                        { dataKey: 'prod', stroke: '#2563eb', fill: 'url(#colorDynamicPremium)', name: t('Bloklar') },
                        { dataKey: 'sales', stroke: '#10b981', fill: 'none', strokeDasharray: '6 6', name: t('Sotuv') },
                      ]}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Heuristics panel */}
              {heuristics && (
                <div className="bg-primary p-10 rounded-[56px] shadow-3xl relative overflow-hidden group border border-white/5">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-accent/15 rounded-full blur-[120px] -mr-64 -mt-64 transition-all duration-1000 group-hover:bg-primary-accent/25" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-amber-400 border border-white/10 backdrop-blur-xl shadow-inner">
                          <Zap className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white tracking-tight">{t('AI Bashoratlar')}</h3>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">{t('Enterprise Heuristics Engine v2.5')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-900/40 border border-emerald-400/20">{t('Real vaqt')}</span>
                        <span className="text-[9px] font-bold text-slate-500 mt-2">{t('Bugungi yangilanish: 09:41')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3">{t('Kutilayotgan Tanqislik')}</p>
                        <div className="space-y-4">
                          {heuristics.supply_alerts.length > 0 ? heuristics.supply_alerts.map((alert: any) => (
                            <div key={alert.material} className="p-5 bg-white/5 rounded-[28px] border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all cursor-default group/item backdrop-blur-sm">
                              <div>
                                <p className="text-sm font-black text-white mb-1">{alert.material}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{alert.warehouse}</p>
                              </div>
                              <div className={`px-4 py-2 rounded-2xl text-[10px] font-black ${alert.status === 'CRITICAL' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40' : 'bg-amber-500 text-white shadow-lg shadow-amber-900/40'}`}>
                                {alert.days_left} kun
                              </div>
                            </div>
                          )) : (
                            <div className="p-10 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center">
                              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4 opacity-50" />
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Barcha materiallar yetarli')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-6">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3">{t('Likvidlik Bashorati')}</p>
                        <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-md">
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-3 px-1">{t('15-kunlik Sotuv kutilmasi')}</p>
                              <p className="text-4xl font-black text-white leading-none tracking-tight">
                                {heuristics.cash_prediction.projected_15d_inflow.toLocaleString()} 
                                <span className="text-sm ml-2 text-emerald-500 font-bold uppercase">UZS</span>
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 px-1">
                               <span className="text-slate-500">{t('Bashorat aniqligi')}</span>
                               <span className="text-emerald-400">92%</span>
                             </div>
                             <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '92%' }}
                                  transition={{ duration: 1.5, ease: 'easeOut' }}
                                  className="bg-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(52,211,153,0.4)]" 
                                />
                             </div>
                          </div>
                          <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                             <Activity className="w-4 h-4 text-emerald-400" />
                             <p className="text-[10px] font-bold text-emerald-400 leading-snug">{t('Likvidlik holati barqaror. Strategik sotuvlar davom etmoqda.')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Stats & History */}
            <div className="space-y-8">
              {/* Today's KPI circle summary */}
              <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-card">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  {t('Bugun')}
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Kirim', val: todayStats.intake, color: 'blue' },
                    { label: 'Sotuv', val: todayStats.sales_count, color: 'emerald' },
                    { label: 'Tayyor', val: todayStats.production, color: 'indigo' },
                    { label: 'Chiqindi', val: todayStats.waste, color: 'rose' }
                  ].map(kpi => (
                    <div key={kpi.label} className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-premium transition-all duration-300">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t(kpi.label)}</p>
                      <p className={`text-2xl font-black text-slate-900 group-hover:text-${kpi.color}-600 transition-colors tracking-tight`}>{kpi.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="bg-slate-900 p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-accent/20 rounded-full blur-[60px]" />
                <h3 className="text-xl font-black mb-8 relative z-10 flex items-center gap-4 text-white">
                  <Target className="w-6 h-6 text-blue-400" />
                  {t('Quick Access')}
                </h3>
                <div className="space-y-4 relative z-10">
                  {[
                    { id: 'sklad1', name: 'Materiallar nazorati', icon: Database, color: 'text-blue-400' },
                    { id: 'production', name: 'Zavod monitoringi', icon: Factory, color: 'text-amber-400' },
                    { id: 'reports', name: 'Analitika & Reports', icon: FileText, color: 'text-indigo-400' },
                    { id: 'activity', name: 'Tizim audit jurnali', icon: History, color: 'text-emerald-400' }
                  ].map(action => (
                    <button 
                      key={action.id}
                      onClick={() => onAction?.(action.id)}
                      className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-[28px] transition-all border border-white/5 active:scale-95 group/btn"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl bg-white/5 ${action.color} group-hover/btn:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover/btn:text-white transition-colors">{t(action.name)}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/btn:bg-primary-accent transition-all">
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover/btn:text-white transition-all group-hover/btn:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-card">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                      <History className="w-6 h-6 text-slate-300" />
                      {t('Recents')}
                    </h3>
                    <button onClick={() => onAction?.('activity')} className="text-[11px] font-black text-primary-accent uppercase tracking-widest hover:text-blue-700 transition-colors">{t('View All')}</button>
                 </div>
                 <div className="space-y-6">
                    {recentActions.slice(0, 5).map((action, i) => (
                      <div key={i} className="flex gap-4 group cursor-default">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-none border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-300">
                          <Activity className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="min-w-0 pr-2">
                           <div className="flex items-center gap-3 mb-1">
                              <span className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">@{action.user_name || 'tizim'}</span>
                              <span className="text-[9px] font-bold text-slate-400 border-l border-slate-100 pl-3">{new Date(action.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <p className="text-[12px] font-medium text-slate-500 leading-snug line-clamp-2 italic">
                              "{action.description}"
                           </p>
                        </div>
                      </div>
                    ))}
                    {recentActions.length === 0 && (
                      <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest">{t('Harakatlar yo\'q')}</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
