import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, Download, 
  Filter, Activity, PieChart, ArrowUpRight, FileText, 
  Plus, RefreshCcw, Search, ChevronRight, DownloadCloud,
  FileSpreadsheet, FileJson, Clock, CheckCircle2, AlertCircle,
  X
} from 'lucide-react';
import { User, Notification } from '../types';
import { uiStore } from '../lib/store';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, 
  Pie, Cell 
} from 'recharts';
import { useI18n } from '../i18n';

interface Report {
  id: number;
  name: string;
  report_type: string;
  period: string;
  file_format: string;
  file_size: string;
  status: 'PENDING' | 'READY' | 'ERROR';
  created_at: string;
  created_by_name: string;
}

export default function Reports({ user }: { user: User }) {
  const { locale, t } = useI18n();
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Generation form
  const [genForm, setGenForm] = useState({
    type: 'SALES',
    period: 'This Month',
    format: 'PDF'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sequential fetching to avoid race conditions in token refresh if they both fail with 401
      const anaRes = await api.get('reports/analytics/');
      setAnalytics(anaRes.data);

      const histRes = await api.get('reports/history/');
      setHistory(histRes.data);
    } catch (err: any) {
      console.error("Failed to fetch reports data:", err.response?.status, err.message);
      if (err.response?.status === 401) {
        setError(t("Sessiya muddati tugagan yoki ruxsat yo'q. Iltimos qayta kiring."));
      } else {
        setError(t("Hisobot ma'lumotlarini yuklashda xatolik yuz berdi"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const name = `${genForm.type} Hisoboti - ${new Date().toLocaleDateString(locale)}`;
      const response = await api.post('reports/history/', {
        name,
        report_type: genForm.type,
        period: genForm.period,
        file_format: genForm.format,
      });
      uiStore.showNotification(t("Hisobot muvaffaqiyatli yaratildi"), "success");
      const reportId = response.data.id;
      if (reportId) {
        await handleDownload(reportId, name, genForm.format);
      }
      fetchData();
      setIsGenerating(false);
    } catch (err) {
      uiStore.showNotification(t("Hisobot yaratishda xatolik"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, name: string, format: string) => {
    try {
      const response = await api.get(`reports/history/${id}/download/`, { responseType: 'blob' });
      const extension = format === 'PDF' ? 'pdf' : 'csv';
      const blob = new Blob([response.data], {
        type: format === 'PDF' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      uiStore.showNotification(t("Faylni yuklashda xatolik"), "error");
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">{t('Ma\'lumotlar yuklanmoqda')}...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-2">{error}</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">{t('Tizimga ulanishda xatolik yuz berdi. Iltimos qayta urunib ko\'ring.')}</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          {t('Qayta urunish')}
        </button>
      </div>
    );
  }

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('Analitika & Hisobotlar')}</h1>
          <p className="text-slate-500 text-sm font-medium">{t('Korxona faoliyatining chuqur tahlili va natijalari')}</p>
        </div>
        
        <button 
          onClick={() => setIsGenerating(true)}
          className="flex w-full md:w-auto items-center justify-center gap-2 bg-blue-600 text-white px-6 md:px-8 py-4 rounded-[24px] md:rounded-[28px] font-black text-[11px] md:text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Yangi Hisobot Yaratish')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: t('Umumiy Savdo'), value: `${(analytics?.kpis?.total_sales || 0).toLocaleString(locale)} UZS`, trend: '+12%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { name: t('Ishlab Chiqarish'), value: `${(analytics?.kpis?.total_production || 0).toLocaleString(locale)} dona`, trend: '+8%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { name: t('Chiqindi Miqdori'), value: `${(analytics?.kpis?.waste_percent || 0).toLocaleString(locale)}%`, trend: '-2%', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
          { name: t('Ombor Qiymati'), value: `${(analytics?.kpis?.stock_value || 0).toLocaleString(locale)} UZS`, trend: '0%', icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-7 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <span className={`text-[10px] font-black ${kpi.color} ${kpi.bg} px-3 py-1.5 rounded-full uppercase tracking-widest`}>{kpi.trend}</span>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{kpi.name}</h4>
            <p className="text-xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('Sotuvlar Dinamikasi')}</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('Oxirgi 30 kunlik trend')}</p>
              </div>
              <div className="flex gap-2">
                 {['Kunlik', 'Haftalik', 'Oylik'].map(period => (
                    <button key={period} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === 'Kunlik' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{t(period)}</button>
                 ))}
              </div>
           </div>
           
           <div className="w-full">
              <ResponsiveContainer width="99%" height={300} debounce={50}>
                 <AreaChart data={analytics?.charts?.sales_trend || []}>
                    <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '15px' }}
                       labelStyle={{ fontWeight: 900, marginBottom: '5px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Chart Distribution */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{t('Chiqindi Manbalari')}</h3>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">{t('Bo\'limlar kesimida')}</p>
           
           <div className="w-full">
              <ResponsiveContainer width="99%" height={250} debounce={50}>
                 <RePieChart>
                    <Pie
                       data={analytics?.charts?.waste_distribution || []}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={8}
                       dataKey="value"
                    >
                       {(analytics?.charts?.waste_distribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <Tooltip />
                 </RePieChart>
              </ResponsiveContainer>
           </div>

           <div className="space-y-3 mt-4">
              {(analytics?.charts?.waste_distribution || []).map((entry: any, index: number) => (
                 <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{entry.value}%</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Reports History */}
      <div className="bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <FileText className="w-6 h-6 text-blue-500" />
                 {t('Hisobotlar Jurnali')}
              </h3>
              <p className="text-slate-500 text-sm font-medium">{t('Ilgari yaratilgan barcha hisobotlar ro\'yxati')}</p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                    type="text" 
                    placeholder={t("Hisobot nomi") + "..."} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent rounded-[20px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-xs font-bold text-slate-900 w-full md:w-64"
                 />
              </div>
           </div>
        </div>

        {!isMobile && (
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Hisobot Nomi')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Turi')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Davr')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Format')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Yaratilgan')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Holat')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50`}>
                           <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black text-slate-900 italic">{report.name}</span>
                     </div>
                  </td>
                  <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{report.report_type}</td>
                  <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{report.period}</td>
                  <td className="px-8 py-5">
                     <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${report.file_format === 'PDF' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {report.file_format}
                     </span>
                  </td>
                  <td className="px-8 py-5">
                     <p className="text-xs font-bold text-slate-900">{new Date(report.created_at).toLocaleDateString(locale)}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.created_by_name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       {report.status === 'READY' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                             <CheckCircle2 className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('Tayyor')}</span>
                          </div>
                       ) : report.status === 'ERROR' ? (
                          <div className="flex items-center gap-1.5 text-rose-600">
                             <AlertCircle className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('Xato')}</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5 text-blue-600">
                             <RefreshCcw className="w-4 h-4 animate-spin" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t('Tayyorlanmoqda')}</span>
                          </div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => handleDownload(report.id, report.name, report.file_format)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 shadow-sm transition-all" title="Yuklash">
                          <DownloadCloud className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                 <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <BarChart3 className="w-10 h-10" />
                       </div>
                       <p className="text-slate-400 font-black text-xs uppercase tracking-widest italic">{t('Hozircha hisobotlar yaratilmagan')}</p>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        {isMobile && (
          <div className="p-4 space-y-3">
            {history.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map((report) => (
              <div key={report.id} className="rounded-[24px] border border-slate-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{report.name}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{report.report_type} • {report.period}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${report.file_format === 'PDF' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{report.file_format}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>{new Date(report.created_at).toLocaleDateString(locale)}</span>
                  <span>{report.created_by_name}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleDownload(report.id, report.name, report.file_format)} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Yuklash</button>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Hozircha hisobotlar yaratilmagan')}</div>
            )}
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      <AnimatePresence>
         {isGenerating && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGenerating(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
               <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden p-5 md:p-10">
                  <div className="flex items-center justify-between mb-10">
                     <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Yangi Hisobot')}</h2>
                        <p className="text-slate-500 text-sm font-medium">{t('Hisobot turini va davrini tanlang')}</p>
                     </div>
                     <button onClick={() => setIsGenerating(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <form onSubmit={handleGenerate} className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Hisobot Turi')}</label>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                              { id: 'SALES', name: t('Sotuvlar'), icon: TrendingUp },
                              { id: 'INVENTORY', name: t('Ombor'), icon: PieChart },
                              { id: 'PRODUCTION', name: t('Ishlab chiqarish'), icon: Activity },
                              { id: 'WASTE', name: t('Chiqindilar'), icon: TrendingDown },
                           ].map(type => (
                              <button 
                                 key={type.id} 
                                 type="button" 
                                 onClick={() => setGenForm({...genForm, type: type.id})}
                                 className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${genForm.type === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'}`}
                              >
                                 <type.icon className="w-4 h-4" />
                                 <span className="text-[11px] font-black uppercase tracking-tight">{type.name}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Davr')}</label>
                           <select 
                              value={genForm.period} 
                              onChange={(e) => setGenForm({...genForm, period: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                           >
                              <option value="Today">{t('Bugun')}</option>
                              <option value="Last 7 Days">{t('Oxirgi 7 kun')}</option>
                              <option value="This Month">{t('Shu oy')}</option>
                              <option value="Custom">{t('Boshqa davr...')}</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Format')}</label>
                           <div className="flex bg-slate-50 p-1 rounded-2xl gap-1">
                              <button type="button" onClick={() => setGenForm({...genForm, format: 'PDF'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${genForm.format === 'PDF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>PDF</button>
                              <button type="button" onClick={() => setGenForm({...genForm, format: 'EXCEL'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${genForm.format === 'EXCEL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Excel</button>
                           </div>
                        </div>
                     </div>

                     <button type="submit" className="w-full py-5 md:py-6 bg-blue-600 text-white rounded-[24px] md:rounded-[32px] font-black text-[11px] md:text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4">
                        <Plus className="w-5 h-5" />
                        {t('Hisobotni Yaratish')}
                     </button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
