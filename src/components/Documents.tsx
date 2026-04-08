import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search, 
  ChevronRight, 
  QrCode,
  Download,
  Printer,
  Calendar,
  X,
  ArrowRight,
  Package,
  Layers,
  Truck,
  User as UserIcon,
  RefreshCcw,
  Eye
} from 'lucide-react';
import { ERPDocument } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { useI18n } from '../i18n';

export default function Documents({ user }: { user: User }) {
  const { locale, t } = useI18n();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [docs, setDocs] = useState<ERPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | 'PRODUCTION' | 'INVENTORY' | 'SALES'>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<ERPDocument | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    type: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const currentRole = user.effective_role || user.role_display || user.role;
  const canCreateDocument = ['Bosh Admin', 'Admin', 'Omborchi', 'Ishlab chiqarish ustasi', 'Sotuv menejeri'].includes(currentRole);
  const canExportDocuments = ['Bosh Admin', 'Admin', 'Sotuv menejeri'].includes(currentRole);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await api.get('documents/', {
        params: {
          search: searchTerm,
          type: filters.type,
          status: filters.status,
          created_at__gte: filters.dateFrom,
          created_at__lte: filters.dateTo,
        }
      });
      setDocs(response.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      uiStore.showNotification("Hujjatlarni yuklab bo'lmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [searchTerm, filters]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DONE': return { label: t('Yakunlandi'), color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 };
      case 'IN_PROGRESS': return { label: t('Jarayonda'), color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock };
      case 'IN_TRANSIT': return { label: t('Yo\'lda'), color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Truck };
      case 'CREATED': return { label: t('Yaratildi'), color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Plus };
      case 'PENDING': return { label: t('Kutilmoqda'), color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock };
      case 'APPROVED': return { label: t('Tasdiqlandi'), color: 'bg-blue-50 text-blue-600 border-blue-100', icon: CheckCircle2 };
      case 'CANCELLED': return { label: t('Bekor qilindi'), color: 'bg-rose-50 text-rose-600 border-rose-100', icon: X };
      default: return { label: status, color: 'bg-slate-50 text-slate-500 border-slate-100', icon: FileText };
    }
  };

  const filteredDocs = docs.filter(doc => {
    if (activeTypeTab === 'ALL') return true;
    if (activeTypeTab === 'PRODUCTION') return ['PRODUCTION_ORDER', 'BUYURTMA_NARYAD', 'ZAMES_LOG', 'FORMOVKA_LOG'].includes(doc.type);
    if (activeTypeTab === 'INVENTORY') return ['ICHKI_YUK_XATI', 'OTKAZMA_BUYRUGI', 'ISSUE_ORDER', 'BUNKER_ENTRY'].includes(doc.type);
    if (activeTypeTab === 'SALES') return ['HISOB_FAKTURA_CHIQIM', 'HISOB_FAKTURA_KIRIM'].includes(doc.type);
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Hujjatlar Jurnali')}</h1>
          <p className="text-slate-500 text-sm font-medium">{t('Operatsion harakatlar va rasmiy hujjatlar arxivi')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {canExportDocuments && (
            <button className="flex items-center justify-center gap-2 bg-white text-slate-600 px-5 py-3 rounded-2xl font-black text-[10px] border border-slate-200 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <Download className="w-4 h-4" />
              {t('Eksport')}
            </button>
          )}
          {canCreateDocument && (
            <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
              <Plus className="w-5 h-5" />
              {t('Yangi Hujjat')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('Jami Hujjatlar'), count: docs.length, icon: FileText, color: 'blue' },
          { label: t('Kutilayotgan'), count: docs.filter(d => ['PENDING', 'IN_TRANSIT'].includes(d.status)).length, icon: Clock, color: 'amber' },
          { label: t('Tasdiqlangan'), count: docs.filter(d => d.status === 'DONE').length, icon: CheckCircle2, color: 'emerald' },
          { label: t('Bekor qilingan'), count: docs.filter(d => d.status === 'CANCELLED').length, icon: AlertCircle, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-400/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-125`} />
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-[22px] gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: t('Barchasi') },
              { id: 'PRODUCTION', label: t('Ishlab Chiqarish') },
              { id: 'INVENTORY', label: t('Ombor & Logistika') },
              { id: 'SALES', label: t('Savdo & Moliya') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTypeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-1 lg:max-w-xl justify-end">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("Hujjat raqami yoki xodim...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-xs font-bold text-slate-900 shadow-inner"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4" />
              <span>{t('Filtr')}</span>
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 border-b border-slate-50 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Sana oralig\'i (dan)')}</label>
                  <input 
                    type="date" 
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Sana oralig\'i (gacha)')}</label>
                  <input 
                    type="date" 
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Hujjat turi')}</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="">{t('Barchasi')}</option>
                    <option value="HISOB_FAKTURA_KIRIM">{t('Hisob-faktura (Kirim)')}</option>
                    <option value="HISOB_FAKTURA_CHIQIM">{t('Hisob-faktura (Chiqim)')}</option>
                    <option value="ICHKI_YUK_XATI">{t('Ichki yuk xati')}</option>
                    <option value="OTKAZMA_BUYRUGI">{t('O‘tkazma buyrug‘i')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Status')}</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="">{t('Barchasi')}</option>
                    <option value="DONE">{t('Yakunlandi')}</option>
                    <option value="IN_TRANSIT">{t('Yo\'lda')}</option>
                    <option value="PENDING">{t('Kutilmoqda')}</option>
                    <option value="CANCELLED">{t('Bekor qilingan')}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('Ma\'lumotlar yuklanmoqda')}...</p>
            </div>
          ) : isMobile ? (
            <div className="p-4 space-y-3">
              {filteredDocs.map((doc) => {
                const status = getStatusConfig(doc.status);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="w-full rounded-[28px] border border-slate-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{doc.number}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.type_label || doc.type}</p>
                      </div>
                      <div className={`shrink-0 rounded-2xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                        {status.label}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('Kimdan')}</p>
                        <p className="mt-1 text-xs font-black text-slate-900 break-words">{doc.from_entity_name || '—'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('Kimga')}</p>
                        <p className="mt-1 text-xs font-black text-slate-900 break-words">{doc.to_entity_name || '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{doc.created_by_name || t('Noma’lum')}</span>
                      <span>{new Date(doc.created_at || '').toLocaleDateString(locale)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Identifikator')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Hujjat Turi')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Tomonlar')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Xodim')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Status')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const status = getStatusConfig(doc.status);
                  return (
                    <tr 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(doc)}
                      className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block text-xs">{doc.number}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(doc.created_at || '').toLocaleDateString(locale)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          {doc.type_label || doc.type}
                        </span>
                                         <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col items-end min-w-[100px]">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{t('Yubordim')}</span>
                            <span className="text-[11px] text-slate-900 font-black truncate max-w-[140px] italic">{doc.from_entity_name || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="h-px w-6 bg-slate-200" />
                             <ChevronRight className="w-3 h-3 text-slate-400" />
                             <div className="h-px w-6 bg-slate-200" />
                          </div>
                          <div className="flex flex-col min-w-[100px]">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{t('Qabul qildi')}</span>
                            <span className="text-[11px] text-slate-900 font-black truncate max-w-[140px] italic">{doc.to_entity_name || '—'}</span>
                          </div>
                        </div>
                      </td>
        </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-[10px] shadow-inner border border-blue-100">
                              {(doc.created_by_name || 'U').split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-[11px] text-slate-700 font-black uppercase tracking-tight truncate max-w-[120px]">{doc.created_by_name}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm w-fit ${status.color}`}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-3 bg-white text-slate-300 rounded-2xl border border-slate-100 group-hover:text-blue-600 group-hover:border-blue-200 transition-all hover:scale-110">
                           <Eye className="w-5 h-5" />
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filteredDocs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
               <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200">
                  <Search className="w-12 h-12" />
               </div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">{t('Hujjatlar topilmadi')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Slide-over Panel */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[101] border-l border-slate-100 overflow-y-auto"
            >
              <div className="p-5 md:p-10 space-y-6 md:space-y-10">
                {/* Panel Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-[22px] flex items-center justify-center shadow-xl shadow-blue-100">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDoc.number}</h2>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedDoc.type_label}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDoc(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Status and Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 p-5 md:p-8 bg-slate-50 rounded-[28px] md:rounded-[40px] border border-slate-100">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Joriy Holat')}</p>
                      <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${getStatusConfig(selectedDoc.status).color.split(' ')[1]}`}>
                         {getStatusConfig(selectedDoc.status).label}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Yaratilgan Sana')}</p>
                      <p className="text-xs font-black text-slate-900">{new Date(selectedDoc.created_at || '').toLocaleString(locale)}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Mas\'ul Xodim')}</p>
                      <p className="text-xs font-black text-slate-900">{selectedDoc.created_by_name}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('QR Identifikator')}</p>
                      <p className="text-[10px] font-black text-blue-600 font-mono">{(selectedDoc.qr_code || selectedDoc.id).toString().slice(0, 8)}</p>
                   </div>
                </div>

                {/* Route Section */}
                <div className="space-y-5">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('Hujjat Marshruti')}</h3>
                   <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-5 md:p-8 bg-white border border-slate-100 rounded-[28px] md:rounded-[40px] shadow-sm">
                      <div className="flex-1 space-y-2">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <Package className="w-5 h-5" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Kimdan')}</p>
                         <p className="text-sm font-black text-slate-900">{selectedDoc.from_entity_name || '—'}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                            <ArrowRight className="w-4 h-4" />
                         </div>
                         <div className="h-10 w-px bg-slate-100 dashed" />
                      </div>
                      <div className="flex-1 space-y-2 text-right">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 ml-auto">
                            <UserIcon className="w-5 h-5" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Kimga')}</p>
                         <p className="text-sm font-black text-slate-900">{selectedDoc.to_entity_name || '—'}</p>
                      </div>
                   </div>
                </div>

                {/* Items Section */}
                <div className="space-y-5">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('Hujjat Ma\'lumotlari')}</h3>
                   <div className="bg-slate-900 rounded-[28px] md:rounded-[40px] overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                               <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('Mahsulot')}</th>
                               <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">{t('Miqdor')}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {selectedDoc.items?.map((item, i) => (
                               <tr key={i} className="hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-5">
                                     <span className="text-xs font-black text-white">{item.product_name}</span>
                                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.batch_number || t('Batch yo\'q')}</p>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                     <span className="text-xs font-black text-emerald-400">{item.quantity.toLocaleString(locale)} {item.unit || t('dona')}</span>
                                  </td>
                                </tr>
                            ))}
                         </tbody>
                      </table>
                      {(!selectedDoc.items || selectedDoc.items.length === 0) && (
                        <div className="p-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                           {t('Bandlar ro\'yxati bo\'sh')}
                        </div>
                      )}
                   </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-4 md:pb-10">
                   <button className="flex items-center justify-center gap-3 py-5 bg-white border border-slate-200 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                      <Printer className="w-5 h-5" />
                      {t('Yopish / Print')}
                   </button>
                   <button className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl">
                      <Download className="w-5 h-5 text-blue-400" />
                      {t('PDF Yuklash')}
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
