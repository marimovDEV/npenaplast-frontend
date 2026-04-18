import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRightLeft, 
  QrCode, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  History, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Package,
  ArrowUpRight,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import QRScanner from './QRScanner';
import { motion, AnimatePresence } from 'motion/react';

interface StockItem {
  id: number;
  material_name: string;
  material_unit: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  min_level: number;
  total_value: number;
  status: 'OK' | 'LOW' | 'CRITICAL';
  updated_at: string;
}

export default function Sklad1() {
  const { t } = useI18n();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchStocks = async () => {
    try {
      const res = await api.get('stocks/', { params: { warehouse_name: 'Sklad №1' } });
      setStocks(res.data);
    } catch (err) {
      console.error("Failed to fetch stocks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = stocks.filter(s => 
    s.material_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInventoryValue = stocks.reduce((acc, s) => acc + s.total_value, 0);
  const criticalItemsCount = stocks.filter(s => s.status === 'CRITICAL').length;
  const lowItemsCount = stocks.filter(s => s.status === 'LOW').length;

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-slide-up bg-white rounded-[48px] border border-slate-100 shadow-card">
      <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative">
        <Package className="w-14 h-14 text-slate-300" />
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
          <Plus className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3">{t('Ombor bo\'sh')}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-10 leading-relaxed font-medium">
        {t('Hozircha Sklad №1 da xom-ashyo ma\'lumotlari mavjud emas. Ishni boshlash uchun birinchi kirimni amalga oshiring.')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('Yangi Kirim')}
        </button>
        <button onClick={() => setIsScannerOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          {t('QR Skaner')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Sklad №1')}</h2>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">{t('Xom-ashyo')}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{t('Real vaqtdagi qoldiqlar va materiallar boshqaruvi')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            <span>{t('Kirim')}</span>
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all active:scale-95">
            <ArrowRightLeft className="w-4 h-4" />
            <span>{t('Berish')}</span>
          </button>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>{t('QR')}</span>
          </button>
        </div>
      </div>

      {stocks.length > 0 && (
        <>
          {/* SMART KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-card flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Ombor Qiymati')}</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{totalInventoryValue.toLocaleString()} UZS</h4>
              </div>
            </div>

            <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-card flex items-center gap-6">
              <div className={`w-16 h-16 ${criticalItemsCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} rounded-3xl flex items-center justify-center`}>
                {criticalItemsCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Holat Monitoringi')}</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  {criticalItemsCount > 0 ? `${criticalItemsCount} ${t('ta tanqislik')}` : t('Hamma produkt OK')}
                </h4>
              </div>
            </div>

            <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-card flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Material Turlari')}</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{stocks.length} {t('tur')}</h4>
              </div>
            </div>
          </div>

          {/* TABLE / CONTENT SECTION */}
          <div className="bg-white rounded-[48px] border border-slate-100 shadow-card overflow-hidden">
             {/* Toolbar */}
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:w-96">
                   <input 
                    type="text" 
                    placeholder={t('Material qidirish...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                   />
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
                        <TableIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                   </div>
                   <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
                      <Filter className="w-5 h-5" />
                   </button>
                </div>
             </div>

             {/* Functional Table */}
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Material')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Jami Qoldiq')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Available')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Reserved')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Qiymati')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Holat')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredStocks.map((stock) => (
                        <tr key={stock.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                                  {stock.material_name.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-900 mb-0.5">{stock.material_name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{stock.material_unit}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-sm font-black text-slate-900">{stock.quantity.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-sm font-black text-emerald-600">{stock.available_quantity.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-sm font-black text-slate-400">{stock.reserved_quantity.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <p className="text-xs font-black text-slate-700">{stock.total_value.toLocaleString()} UZS</p>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className="flex flex-col items-center gap-2">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                  stock.status === 'CRITICAL' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 
                                  stock.status === 'LOW' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 
                                  'bg-emerald-50 text-emerald-500 border border-emerald-100'
                                }`}>
                                  {t(stock.status)}
                                </span>
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className={`h-full ${stock.status === 'CRITICAL' ? 'bg-rose-500' : stock.status === 'LOW' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                        style={{ width: `${Math.min(100, (stock.quantity / (stock.min_level || 100)) * 50)}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <ChevronRight className="w-5 h-5" />
                             </button>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {stocks.length === 0 && !loading && renderEmptyState()}

      {/* QR SCANNER MODAL */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScannerOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-3xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  {t('Sklad QR Skaner')}
                </h3>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <div className="mb-10 aspect-square rounded-[40px] bg-slate-900 overflow-hidden relative border-8 border-slate-100">
                <QRScanner onScan={(data) => {
                  console.log("Scanned:", data);
                  setIsScannerOpen(false);
                }} />
                {/* Visual Scanner Overlay */}
                <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-500/50 rounded-3xl pointer-events-none animate-pulse" />
              </div>

              <div className="space-y-4">
                 <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-widest">{t('Birkitilgan QR kodni kamera qarshisiga tuting')}</p>
                 <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">{t('Manual Search')}</button>
                    <button onClick={() => setIsScannerOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest">{t('Yopish')}</button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
