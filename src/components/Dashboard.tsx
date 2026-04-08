import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Database, Layers, ShoppingCart, Trash2, Truck, Factory, Package, BarChart3, Calendar, Zap, ArrowUpRight, Box, Scissors, Brush, Plus, DollarSign, User as UserIcon, Activity, AlertTriangle, ArrowRight, History, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
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
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<any>({ zames: 0, bunkers: [], cnc: 0, finishing: 0 });
  const [todayStats, setTodayStats] = useState<any>({ intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
  const [docStats, setDocStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentKirim, setRecentKirim] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const currentRole = user.effective_role || user.role_display || user.role;

  const isAdmin = currentRole === 'Bosh Admin' || currentRole === 'Admin';

  const fetchData = async (currentPeriod = period) => {
    try {
      const fetchLogs = isAdmin;
      const [statsRes, logsRes] = await Promise.all([
        api.get('dashboard/summary/', { params: { period: currentPeriod } }),
        fetchLogs ? api.get('audit-logs/') : Promise.resolve({ data: { results: [] } })
      ]);

      if (statsRes.data.stats) {
        setStats(statsRes.data.stats.map((s: any) => ({
           ...s,
           icon: IconMap[s.icon] || Database
        })));
      }
      
      setPipelineData(statsRes.data.pipeline || { zames: 0, bunkers: [], cnc: 0, finishing: 0 });
      setTodayStats(statsRes.data.todayStats || { intake: '0 kg', production: '0 dona', waste: '0 kg', sales_count: 0 });
      setDocStats(statsRes.data.docStats || []);
      
      setRecentKirim(statsRes.data.recentKirim || []);
      setRecentTransactions((statsRes.data.recentSales || []).slice(0, 5));
      setDynamicChartData(statsRes.data.chartData || []);
      setOverdueCount(statsRes.data.overdueCount || 0);

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

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const chartData = dynamicChartData.length > 0 ? dynamicChartData : [];
  const chartFallback = <div className="h-[250px] animate-pulse rounded-3xl bg-slate-50" />;

  const isSuper = currentRole === 'Bosh Admin' || (user.assigned_warehouses as any[])?.includes('*');
  const isSales = currentRole === 'Sotuv menejeri';
  const assigned = user.assigned_warehouses || [];

  if (isSales) {
    return (
      <div className="responsive-py space-y-6 md:space-y-8 pb-20 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{t('Xayrli kun')}, {user.name.split(' ')[0]}!</h2>
            <p className="text-slate-500 text-sm font-medium">{t('Sotuvlar paneli va mijozlar nazorati')}</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => onAction?.('sales')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                <span>{t('Yangi Buyurtma')}</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="card-responsive p-5 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4 md:gap-5 relative z-10">
              <div className="bg-blue-600 w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-100">
                <ShoppingCart className="text-white w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-xs-bold text-slate-400 mb-1">{t('Bugungi Sotuv')}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{todayStats.sales_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-emerald-600 w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg shadow-emerald-100">
                <Package className="text-white w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('Aktiv Buyurtmalar')}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">0</p>
              </div>
            </div>
          </div>
          {docStats.slice(0, 2).map((stat) => (
            <div key={stat.name} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className="flex items-center gap-5 relative z-10">
                <div className="bg-slate-600 w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg shadow-slate-100">
                  <FileText className="text-white w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t(stat.name)}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
               <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                {t('Kechikayotgan Ishlar')}
              </h3>
              <div className="space-y-3">
                {overdueCount > 0 ? (
                  <div className="animate-pulse flex items-center gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-black text-xs">
                      {overdueCount}
                    </div>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{t('Kechikayotgan buyurtmalar mavjud!')}</p>
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic px-2">{t("Barcha ishlar o'z vaqtida")}</p>
                )}
              </div>
           </div>
           <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                {t('Haftalik Sotuv Dinamikasi')}
              </h3>
              <div className="w-full">
                <Suspense fallback={chartFallback}>
                  <AreaTrendChart
                    data={chartData}
                    height={250}
                    gradientId="colorSales"
                    gradientColor="#3b82f6"
                    areas={[
                      { dataKey: 'sales', stroke: '#3b82f6', fill: 'url(#colorSales)' },
                    ]}
                  />
                </Suspense>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                <Zap className="w-6 h-6 text-amber-400" />
                {t('Tezkor Linklar')}
              </h3>
              <div className="space-y-4 relative z-10">
                  {[t('Mijozlar Ro\'yxati'), t('Yangi Shartnoma'), t('Qarzdorlar'), t('Sotuv Hisoboti')].map((link) => (
                    <button key={link} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-300">{link}</span>
                      <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    </button>
                  ))}
               </div>
            </div>
        </div>
      </div>
    );
  }

  // ── WORKER DASHBOARDS ──────────────────────────────
  const isOmborchi = currentRole === 'Omborchi';
  const isUsta = currentRole === 'Ishlab chiqarish ustasi';
  const isCNC = currentRole === 'CNC operatori';
  const isPardoz = currentRole === 'Pardozlovchi';
  const isChiqindi = currentRole === 'Chiqindi operatori';
  const isWorker = isOmborchi || isUsta || isCNC || isPardoz || isChiqindi;

  if (isWorker) {
    // Worker-specific greeting and subtitle
    const workerConfig: Record<string, { subtitle: string; kpiLabels: string[]; quickLinks: { name: string; id: string; icon: any; color: string; bg: string }[] }> = {
      'Omborchi': {
        subtitle: t('Ombor boshqaruvi va materiallar nazorati'),
        kpiLabels: [t('Xom ashyo kirimi'), t('Tayyor bloklar'), t('Chiqindi'), t('Sotuvlar soni')],
        quickLinks: [
          { name: t('Kirim'), id: 'sklad1', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { name: t('Chiqim'), id: 'sklad1', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50' },
          { name: t('Ko\'chirish'), id: 'documents', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { name: t('Bloklar'), id: 'sklad2', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { name: t('CNC Sklad'), id: 'sklad3', icon: Box, color: 'text-purple-600', bg: 'bg-purple-50' },
          { name: t('Tayyor mahsulot'), id: 'sklad4', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
        ],
      },
      'Ishlab chiqarish ustasi': {
        subtitle: t('Ishlab chiqarish jarayoni va nazorat'),
        kpiLabels: [t('Xom ashyo kirimi'), t('Ishlab chiqarilgan'), t('Chiqindi'), t('Sotuvlar soni')],
        quickLinks: [
          { name: t('Zames boshlash'), id: 'production', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { name: t('Buyurtmalar'), id: 'production-orders', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          { name: t('Nazorat paneli'), id: 'production-master', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { name: t('Bloklar'), id: 'sklad2', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ],
      },
      'CNC operatori': {
        subtitle: 'CNC kesish va shakl berish',
        kpiLabels: ['Xom ashyo kirimi', 'Ishlab chiqarilgan', 'Chiqindi', 'Sotuvlar soni'],
        quickLinks: [
          { name: 'Kesishni boshlash', id: 'cnc', icon: Scissors, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { name: 'Tugatish', id: 'cnc', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { name: 'CNC Sklad', id: 'sklad3', icon: Box, color: 'text-purple-600', bg: 'bg-purple-50' },
        ],
      },
      'Pardozlovchi': {
        subtitle: 'Pardozlash va dekoratsiya',
        kpiLabels: ['Xom ashyo kirimi', 'Ishlab chiqarilgan', 'Chiqindi', 'Sotuvlar soni'],
        quickLinks: [
          { name: 'Yangi ish', id: 'finishing', icon: Brush, color: 'text-rose-600', bg: 'bg-rose-50' },
          { name: 'Tayyor mahsulot', id: 'sklad4', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ],
      },
      'Chiqindi operatori': {
        subtitle: 'Chiqindi boshqaruvi va qayta ishlash',
        kpiLabels: ['Xom ashyo kirimi', 'Ishlab chiqarilgan', 'Chiqindi', 'Sotuvlar soni'],
        quickLinks: [
          { name: 'Chiqindi kiritish', id: 'waste', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50' },
          { name: 'Statistika', id: 'waste', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        ],
      },
    };

    const config = workerConfig[currentRole] || workerConfig['Omborchi'];

    return (
      <div className="space-y-4 md:space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{t('Xayrli kun')}, {user.name.split(' ')[0]}! 👋</h2>
            <p className="text-slate-500 text-sm font-medium">{config.subtitle}</p>
          </div>
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{currentRole}</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.length > 0 ? stats.map((stat) => (
            <div key={stat.name} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700 opacity-50" />
              <div className="flex items-center gap-5 relative z-10">
                <div className={`${stat.color} w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500`}>
                  <stat.icon className="text-white w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.name}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          )) : (
            // Placeholder KPI cards while loading
            config.kpiLabels.map((label) => (
              <div key={label} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm animate-pulse">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[22px] bg-slate-100" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t(label)}</p>
                    <p className="text-2xl font-black text-slate-300 tracking-tight">—</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions + Today KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Quick Actions */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              {t('Tezkor Amallar')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {config.quickLinks.map(link => (
                <button 
                  key={link.name}
                  onClick={() => onAction?.(link.id)}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className={`${link.bg} ${link.color} p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-all`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-normal text-center leading-tight">{link.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Today KPI */}
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              {t('Bugungi Natijalar')}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Xom ashyo</p>
                <p className="text-xl font-black text-slate-900">{todayStats.intake}</p>
              </div>
              <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ishlab chiqarilgan</p>
                <p className="text-xl font-black text-slate-900">{todayStats.production}</p>
              </div>
              <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chiqindi</p>
                <p className="text-xl font-black text-rose-600">{todayStats.waste}</p>
              </div>
              <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sotuvlar</p>
                <p className="text-xl font-black text-emerald-600">{todayStats.sales_count} ta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Production Pipeline (for production-related roles) */}
        {(isUsta || isCNC || isPardoz) && (
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Factory className="w-5 h-5 text-indigo-600" />
              </div>
              Ishlab Chiqarish Zanjiri
            </h3>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4 overflow-x-auto">
              {[
                { name: 'Zames', val: pipelineData.zames, icon: Zap, color: 'blue' },
                { name: 'Quritish', val: pipelineData.bunkers?.filter?.((b:any) => b.status === 'Drying')?.length || 0, icon: Activity, color: 'amber' },
                { name: 'Bunker', val: pipelineData.bunkers?.filter?.((b:any) => b.status === 'Ready')?.length || 0, icon: Database, color: 'emerald' },
                { name: 'Bloklar', val: todayStats.production, icon: Box, color: 'blue' },
                { name: 'CNC', val: pipelineData.cnc, icon: Scissors, color: 'purple' },
                { name: 'Pardoz', val: pipelineData.finishing, icon: Brush, color: 'rose' }
              ].map((step, i, arr) => (
                <React.Fragment key={step.name}>
                  <div className="flex flex-col items-center gap-3 flex-none w-24">
                    <div className={`w-12 h-12 rounded-[18px] bg-${step.color}-500 flex items-center justify-center text-white shadow-lg`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">{t(step.name)}</p>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-black text-slate-500">{step.val}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden lg:block flex-1 h-px bg-slate-100 relative min-w-[20px]">
                      <ArrowRight className="w-3 h-3 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Chart for workers */}
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            {t('Haftalik Dinamika')}
          </h3>
          <div className="w-full">
            <Suspense fallback={chartFallback}>
              <AreaTrendChart
                data={chartData}
                height={250}
                gradientId="colorWorkerProd"
                gradientColor="#3b82f6"
                areas={[
                  { dataKey: 'prod', stroke: '#3b82f6', fill: 'url(#colorWorkerProd)', name: t('Bloklar') },
                  { dataKey: 'sales', stroke: '#10b981', fill: 'none', name: t('Sotuv') },
                ]}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }


  const overdueOrders: any[] = []; // TODO: fetch from backend

  const quickActions = [
    // Omborchi
    { name: t('Kirim'), id: 'sklad1', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50', roles: ['Bosh Admin', 'Admin', 'Omborchi'] },
    { name: t('Chiqim'), id: 'sklad1', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50', roles: ['Bosh Admin', 'Admin', 'Omborchi'] },
    { name: t('Ko\'chirish'), id: 'documents', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', roles: ['Bosh Admin', 'Admin', 'Omborchi'] },
    
    // Usta
    { name: t('Start'), id: 'production', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', roles: ['Bosh Admin', 'Admin', 'Ishlab chiqarish ustasi'] },
    { name: t('Stop'), id: 'production', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', roles: ['Bosh Admin', 'Admin', 'Ishlab chiqarish ustasi'] },
    { name: t('Natija'), id: 'production-orders', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', roles: ['Bosh Admin', 'Admin', 'Ishlab chiqarish ustasi'] },
    
    // CNC
    { name: t('Kesishni boshlash'), id: 'cnc', icon: Scissors, color: 'text-indigo-600', bg: 'bg-indigo-50', roles: ['Bosh Admin', 'Admin', 'CNC operatori'] },
    { name: t('Tugatish'), id: 'cnc', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', roles: ['Bosh Admin', 'Admin', 'CNC operatori'] },
    
    // Sotuv
    { name: t('Yangi sotuv'), id: 'sales', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', roles: ['Bosh Admin', 'Admin', 'Sotuv menejeri'] },
    { name: t('Mijoz'), id: 'clients', icon: UserIcon, roles: ['Bosh Admin', 'Admin', 'Sotuv menejeri'], color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: t('To\'lov'), id: 'finance', icon: DollarSign, roles: ['Bosh Admin', 'Admin', 'Sotuv menejeri'], color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ].filter(action => isAdmin || user.is_superuser || action.roles?.includes(currentRole || ''));

  return (
    <div className="space-y-4 md:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{t('Xayrli kun')}, {user.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 text-sm font-medium">
            {t('Tizim holati va bugungi natijalar')}
          </p>
        </div>
        {(isAdmin) && (
          <div className="flex bg-slate-100 p-1.5 rounded-[18px] gap-1 shadow-inner border border-slate-200">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p 
                  ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-50' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p === 'day' ? t('Kun') : p === 'week' ? t('Hafta') : t('Oy')}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card-responsive p-5 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700 opacity-50" />
            <div className="flex items-center gap-4 md:gap-5 relative z-10">
              <div className={`${stat.color} w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-all duration-500`}>
                <stat.icon className="text-white w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs-bold text-slate-400 mb-1">{t(stat.name)}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            {t('Bugungi Natijalar (KPI)')}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Xom ashyo kirimi')}</p>
              <p className="text-xl font-black text-slate-900">{todayStats.intake}</p>
            </div>
            <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Ishlab chiqarilgan')}</p>
              <p className="text-xl font-black text-slate-900">{todayStats.production}</p>
            </div>
            <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Chiqindi')}</p>
              <p className="text-xl font-black text-rose-600">{todayStats.waste}</p>
            </div>
            <div className="p-3 md:p-6 bg-slate-50 rounded-2xl md:rounded-[32px] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Sotuvlar soni')}</p>
              <p className="text-xl font-black text-emerald-600">{todayStats.sales_count} {t('ta')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            {t('Hujjatlar Statistikasi')}
          </h3>
          <div className="space-y-4">
            {docStats.map(doc => (
              <div key={doc.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 uppercase tracking-widest">
                <span className="text-[10px] font-black text-slate-500">{t(doc.name)}</span>
                <span className="text-sm font-black text-slate-900">{doc.value} {t('ta')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-responsive p-6 md:p-8 overflow-hidden">
        <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-10 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Factory className="w-6 h-6 text-indigo-600" />
          </div>
          {t('Ishlab Chiqarish Zanjiri (Pipeline)')}
        </h3>
        <div className="flex flex-row snap-x-mandatory pb-4 gap-4 overflow-x-auto no-scrollbar">
          {[
            { name: 'Zames', val: pipelineData.zames, icon: Zap, color: 'blue' },
            { name: 'Quritish', val: pipelineData.bunkers.filter((b:any) => b.status === 'Drying').length, icon: Activity, color: 'amber' },
            { name: 'Bunker', val: pipelineData.bunkers.filter((b:any) => b.status === 'Ready').length, icon: Database, color: 'emerald' },
            { name: 'Formovka', val: pipelineData.zames > 0 ? 1 : 0, icon: Layers, color: 'indigo' },
            { name: 'Bloklar', val: todayStats.production, icon: Box, color: 'blue' },
            { name: 'CNC', val: pipelineData.cnc, icon: Scissors, color: 'purple' },
            { name: 'Dekor', val: pipelineData.finishing, icon: Brush, color: 'rose' }
          ].map((step, i, arr) => (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center gap-3 flex-none w-32 snap-center rounded-3xl border border-slate-100 bg-slate-50 px-4 py-6 hover:bg-white hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 rounded-[20px] bg-${step.color}-500 flex items-center justify-center text-white shadow-lg shadow-${step.color}-100 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">{t(step.name)}</p>
                <span className="bg-white px-2 py-0.5 rounded-full text-[8px] font-black text-slate-500 shadow-sm">{step.val}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[28px] md:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              {t('Ishlab Chiqarish Dinamikasi')}
            </h3>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>{t('Bloklar')}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>{t('Sotuv')}</span>
              </div>
            </div>
          </div>
          <div className="w-full">
            <Suspense fallback={<div className="h-[220px] md:h-[300px] animate-pulse rounded-3xl bg-slate-50" />}>
              <AreaTrendChart
                data={chartData}
                height={isMobile ? 220 : 300}
                gradientId="colorProd"
                gradientColor="#3b82f6"
                areas={[
                  { dataKey: 'prod', stroke: '#3b82f6', fill: 'url(#colorProd)', name: t('Bloklar') },
                  { dataKey: 'sales', stroke: '#10b981', fill: 'none', name: t('Sotuv') },
                ]}
              />
            </Suspense>
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-[28px] md:rounded-[40px] border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">{t('Tezkor Amallar')}</h4>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
             {quickActions.map(action => (
               <button 
                 key={action.name} 
                 onClick={() => onAction?.(action.id)}
                 className="flex flex-col items-center justify-center p-3 md:p-4 bg-white border border-slate-100 rounded-2xl md:rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all group"
               >
                  <div className={`${action.bg} ${action.color} p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-all`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-normal text-center leading-tight">{action.name}</span>
               </button>
             ))}
          </div>
          
          <div className="mt-8 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('Kechikayotgan Ishlar')}</h4>
            <div className="space-y-3">
              {overdueOrders.map(order => (
                <div key={order.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-none mb-1">{order.orderNumber}</p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight">{order.clientName}</p>
                    </div>
                  </div>
                  <span className="self-start md:self-auto text-[9px] font-black px-2 py-1 bg-white text-rose-500 rounded-lg shadow-sm">{t('Kechikkan')}</span>
                </div>
              ))}
              {overdueOrders.length === 0 && (
                <div className="p-5 text-center text-[10px] font-bold text-slate-400 italic">{t("Barcha ishlar o'z vaqtida")}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[28px] md:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                  {t("So'nggi Harakatlar (Jurnal)")}
                </h3>
             </div>
             
             <div className="space-y-4 relative z-10">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="p-4 md:p-5 bg-slate-50/50 rounded-[24px] md:rounded-[28px] border border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:bg-white hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-blue-600 transition-all">
                        <QrCode className="w-5 h-5 text-slate-400 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-900">{tx.invoice_number}</p>
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded uppercase">{t('Tasdiqlandi')}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.customer__name}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                       <p className="text-xs font-black text-slate-900 mb-1">{tx.total_amount?.toLocaleString()} UZS</p>
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t('Ko\'rish')} &rarr;</p>
                    </div>
                  </div>
                ))}
             </div>
        </div>

        <div className="bg-slate-900 p-4 md:p-8 rounded-[28px] md:rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mb-32 group-hover:scale-125 transition-all duration-1000" />
          <h3 className="text-base md:text-lg font-black mb-5 md:mb-6 flex items-center gap-3 relative z-10">
            <Activity className="w-5 h-5 text-blue-400" />
            {t('Faollik Tarixi')}
          </h3>
          <div className="space-y-6 relative z-10">
            {recentActions.map((action, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center flex-none border border-white/10 group-hover:bg-blue-600 transition-all shadow-inner">
                  <Activity className="w-5 h-5 text-blue-400 group-hover:text-white" />
                </div>
                <div className="min-w-0 pr-2">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t(action.module)}</span>
                      <span className="text-[9px] font-bold text-slate-500">{new Date(action.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                     <span className="text-blue-400">@{action.user_name || 'tizim'}:</span> {action.description}
                   </p>
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div className="py-10 text-center opacity-30">
                <History className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">{t('Harakatlar yo\'q')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
