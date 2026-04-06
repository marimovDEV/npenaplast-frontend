import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  Activity, 
  User as UserIcon,
  Search,
  ArrowUpRight,
  History,
  ShieldCheck,
  Filter,
  Download,
  Calendar,
  Globe,
  Monitor,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RefreshCcw,
  Zap,
  MoreVertical
} from 'lucide-react';
import { User, UserAction } from '../types';
import api from '../lib/api';
import { useI18n } from '../i18n';

const translateModule = (m: string) => {
  const mapping: Record<string, string> = {
    'Warehouse': 'Omborxona',
    'Production': 'Ishlab chiqarish',
    'CNC': 'CNC Kesuv',
    'Finishing': 'Pardozlash',
    'Sales': 'Sotuvlar',
    'Finance': 'Moliya & Kassa',
    'Accounts': 'Xodimlar',
    'Common': 'Tizim',
    'Inventory': 'Invertarizatsiya',
    'Documents': 'Hujjatlar'
  };
  return mapping[m] || m;
};

const translateAction = (a: string) => {
  const mapping: Record<string, string> = {
    'CREATE': 'Yaratildi',
    'UPDATE': 'Tahrirlandi',
    'DELETE': 'O\'chirildi',
    'LOGIN': 'Tizimga kirdi',
    'LOGOUT': 'Tizimdan chiqdi',
    'TRANSFER': 'O\'tkazma',
    'ERROR': 'Xatolik'
  };
  return mapping[a] || a;
};

export default function AdminActivity() {
  const { locale } = useI18n();
  const [actions, setActions] = useState<UserAction[]>([]);
  const [stats, setStats] = useState({ active_count: 0, total_users: 0, status: 'Barqaror' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('audit-logs/active_users/');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('audit-logs/', {
        params: {
          search: searchTerm,
          module: filterModule === 'all' ? undefined : filterModule,
          action: filterType === 'all' ? undefined : filterType,
        }
      });
      
      const mappedActions: UserAction[] = res.data.results ? res.data.results.map((log: any) => ({
        id: log.id,
        userId: log.user,
        userName: log.user_name || 'Tizim',
        action: log.action,
        module: log.module,
        description: log.description,
        timestamp: log.timestamp,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        status: log.status
      })) : [];
      setActions(mappedActions);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filterModule, filterType]);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats, fetchLogs]);

  const handleExport = () => {
    const headers = ['Vaqt', 'Foydalanuvchi', 'Modul', 'Harakat', 'Tavsif', 'IP'];
    const csvData = actions.map(a => [
      new Date(a.timestamp).toLocaleString(locale),
      a.userName,
      translateModule(a.module || ''),
      translateAction(a.action),
      a.description,
      a.ipAddress || '-'
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-blue-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faollik Jurnali</h1>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em]">Tizim auditi va monitoringi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => fetchLogs(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${refreshing ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:scale-105'}`}
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            {refreshing ? 'Yuklanmoqda' : 'Yangilash'}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-100"
          >
            <Download className="w-4 h-4" />
            Eksport (CSV)
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:rotate-12 transition-all duration-500">
              <Users className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Faol Xodimlar</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.active_count}</p>
                <p className="text-lg font-bold text-slate-300">/ {stats.total_users}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-emerald-500">Hozir online</span>
                <span className="text-slate-400">{Math.round((stats.active_count / stats.total_users) * 100) || 0}%</span>
             </div>
             <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.active_count / stats.total_users) * 100 || 0}%` }}
                    transition={{ duration: 1, type: "spring" }}
                    className="bg-emerald-500 h-full shadow-lg shadow-emerald-200"
                />
             </div>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:-rotate-12 transition-all duration-500">
              <Activity className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Bugungi Harakatlar</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{actions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50/50 py-3 px-4 rounded-2xl">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tizim barqaror ishlamoqda</p>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center shadow-inner group-hover:bg-amber-500 transition-all duration-500">
              <Globe className="w-8 h-8 text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Tizim Holati</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50/50 py-3 px-4 rounded-2xl">
             <Zap className="w-4 h-4 text-amber-500" />
             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Kechikish: 24ms &bull; SSL Faol</p>
          </div>
        </div>
      </div>

      {/* Main Content: Logs Table & Filters */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="relative flex-1 max-w-md group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none transition-transform group-focus-within:translate-x-1">
                 <Search className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                 <div className="w-[1px] h-4 bg-slate-200" />
              </div>
              <input 
                type="text" 
                placeholder="Xodim yoki modul bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[28px] text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-3 px-6 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-widest transition-all ${showFilters ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                Filtrlar
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${showFilters ? 'rotate-180 text-white' : ''}`} />
              </button>
           </div>
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50/50 border-b border-slate-100 overflow-hidden"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-blue-500" />
                    Modul bo'yicha
                  </label>
                  <select 
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="w-full p-5 bg-white border border-slate-100 rounded-3xl text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="all">Barcha modullar</option>
                    <option value="Warehouse">Omborxona</option>
                    <option value="Production">Ishlab chiqarish</option>
                    <option value="CNC">CNC Kesuv</option>
                    <option value="Sales">Sotuvlar</option>
                    <option value="Finance">Moliya</option>
                    <option value="Accounts">Foydalanuvchilar</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <History className="w-3 h-3 text-purple-500" />
                    Harakat turi
                  </label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-5 bg-white border border-slate-100 rounded-3xl text-[13px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="all">Barcha amallar</option>
                    <option value="CREATE">Yaratish</option>
                    <option value="UPDATE">Tahrirlash</option>
                    <option value="DELETE">O'chirish</option>
                    <option value="LOGIN">Trafik (In/Out)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    Sana diapazoni
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="date" className="flex-1 p-5 bg-white border border-slate-100 rounded-3xl text-[13px] font-bold" />
                    <span className="text-slate-300">&mdash;</span>
                    <input type="date" className="flex-1 p-5 bg-white border border-slate-100 rounded-3xl text-[13px] font-bold" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Container */}
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sana & Vaqt</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Foydalanuvchi</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Harakat</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Modul</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Manzil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {actions.length > 0 ? actions.map((action, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    key={action.id} 
                    className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all border border-transparent group-hover:border-slate-100 shadow-sm">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 leading-none mb-1">{formatTime(action.timestamp)}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(action.timestamp)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 rounded-[14px] flex items-center justify-center font-black text-blue-600 text-[10px]">
                            {action.userName?.split(' ').map(n => n[0]).join('') || '?'}
                         </div>
                         <div>
                            <p className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{action.userName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">ID: #{action.userId || 'SYS'}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${action.status === 'ERROR' ? 'bg-rose-500 animate-pulse' : action.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <p className={`text-[11px] font-black uppercase tracking-widest ${action.status === 'ERROR' ? 'text-rose-600' : action.status === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'}`}>
                             {translateAction(action.action)}
                          </p>
                        </div>
                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed max-w-xs">{action.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {translateModule(action.module || '')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="inline-flex flex-col items-end gap-1.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-all shadow-sm">
                          <div className="flex items-center gap-2 text-slate-500">
                             <Globe className="w-3 h-3" />
                             <p className="text-[11px] font-black font-mono">{action.ipAddress || '0.0.0.0'}</p>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                             <Monitor className="w-3 h-3" />
                             <p className="text-[9px] font-bold truncate max-w-[100px]">{action.userAgent || 'Zamonaviy Brauzer'}</p>
                          </div>
                       </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                       <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center">
                             <History className="w-12 h-12 text-slate-200" />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-slate-900 mb-1">Ma'lumotlar topilmadi</h3>
                             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Qidiruv yoki filtr parametrlarini o'zgartiring</p>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Improved Pagination Footer */}
        <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Jami: <span className="text-slate-900">{actions.length}</span> ta harakat ko'rsatilmoqda
           </p>
           <div className="flex items-center gap-2">
              <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50" disabled>Oldingi</button>
              <div className="flex items-center px-4">
                 <span className="text-[11px] font-black text-blue-600">1</span>
              </div>
              <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50" disabled>Keyingi</button>
           </div>
        </div>
      </div>
    </div>
  );
}
