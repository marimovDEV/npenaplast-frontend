import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Calculator, 
  Filter, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Package,
  Zap,
  Users,
  Settings,
  Scale,
  RefreshCcw,
  Target,
  X 
} from 'lucide-react';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { useI18n } from '../i18n';

interface ProfitData {
  invoice: string;
  product: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  margin: number;
  date: string;
  is_legacy: boolean;
  production_batch?: number;
}

export default function ProfitabilityDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<ProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProfitData | null>(null);
  const [batchDetail, setBatchDetail] = useState<any>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  
  // Pricing Tool State
  const [targetMargin, setTargetMargin] = useState(20);
  const [sampleCost, setSampleCost] = useState(12500);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('reports/profitability/');
      setData(res.data);
    } catch (e) {
      uiStore.showNotification("Foyda analitikasini yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetail = async (batchId: number) => {
    setBatchLoading(true);
    try {
      const res = await api.get(`production/batches/${batchId}/`);
      setBatchDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  const getMarginColor = (margin: number) => {
    if (margin < 0) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (margin < 5) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (margin < 15) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const recommendedPrice = sampleCost / (1 - targetMargin / 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
               <TrendingUp className="w-8 h-8" />
             </div>
             {t('Foyda va Tannarx Markazi')}
          </h1>
          <p className="text-slate-500 font-medium">{t('Real-vaqt rejimida margin tahlili va tannarx strukturasi')}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <button 
             onClick={fetchData}
             className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-emerald-600"
           >
             <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <div className="h-6 w-px bg-slate-100" />
           <div className="px-4 py-1 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('O\'rtacha Margin')}</p>
              <p className="text-lg font-black text-emerald-600">{fmt(data.reduce((acc, i) => acc + i.margin, 0) / (data.length || 1))}%</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Sales Table */}
        <div className={`transition-all duration-500 ${selectedItem ? 'lg:col-span-12 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="bg-white rounded-[48px] border border-slate-100 shadow-card overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('Sotuvlar Foydasi')}</h3>
               <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">Batch Verified</span>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50/50">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Order / Sana')}</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Mahsulot')}</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Tannarx vs Sotuv')}</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Foyda')}</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Status')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {data.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedItem(item);
                          if (item.production_batch) fetchBatchDetail(item.production_batch);
                          else setBatchDetail(null);
                        }}
                        className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${selectedItem?.invoice === item.invoice ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-900">{item.invoice}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{item.date}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                                {item.product.charAt(0)}
                              </div>
                              <span className="text-xs font-black text-slate-700">{item.product}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">{fmt(item.cost)}</span>
                              <ChevronRight className="w-3 h-3 text-slate-200" />
                              <span className="text-xs font-black text-slate-900">{fmt(item.price)}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`text-sm font-black ${item.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                             {item.profit < 0 ? '-' : '+'}{fmt(Math.abs(item.profit))} uzs
                           </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getMarginColor(item.margin)}`}>
                             {item.margin}%
                           </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-12 xl:col-span-5 space-y-8"
            >
              <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -mr-32 -mt-32 blur-3xl opacity-20" />
                
                <div className="relative z-10 space-y-8">
                   <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{selectedItem.invoice}</h3>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">{t('Tannarx Analizi')}</p>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <X className="w-5 h-5" />
                      </button>
                   </div>

                   {batchLoading ? (
                      <div className="py-20 text-center space-y-4">
                         <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ma'lumotlar yig'ilmoqda...</p>
                      </div>
                   ) : batchDetail ? (
                      <div className="space-y-10">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Batch Nomer')}</p>
                               <p className="text-lg font-black text-white">#{batchDetail.batch_number}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Status')}</p>
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/20">
                                 {batchDetail.status}
                               </span>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                               <Settings className="w-4 h-4" /> {t('Xarajatlar Strukturasi')}
                            </h4>
                            
                            <div className="space-y-5">
                               {[
                                 { label: 'Xom-ashyo', value: batchDetail.material_cost, icon: Package, color: 'bg-blue-500' },
                                 { label: 'Energiya', value: batchDetail.energy_cost, icon: Zap, color: 'bg-amber-500' },
                                 { label: 'Ishchi kuchi', value: batchDetail.labor_cost, icon: Users, color: 'bg-emerald-500' },
                                 { label: 'Overhead', value: batchDetail.overhead_cost, icon: Scale, color: 'bg-slate-500' },
                               ].map((cost, idx) => (
                                 <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                       <div className="flex items-center gap-3">
                                          <cost.icon className="w-4 h-4 text-slate-400" />
                                          <span className="text-xs font-black text-slate-300">{t(cost.label)}</span>
                                       </div>
                                       <span className="text-xs font-black text-white">{fmt(cost.value)} uzs</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                       <motion.div 
                                         initial={{ width: 0 }}
                                         animate={{ width: `${(cost.value / batchDetail.total_cost) * 100}%` }}
                                         transition={{ duration: 1, delay: idx * 0.1 }}
                                         className={`h-full ${cost.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                                       />
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="p-8 bg-emerald-500 rounded-[32px] text-emerald-950 flex justify-between items-center shadow-2xl shadow-emerald-500/20">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('Muvaffaqiyatli foyda')}</p>
                               <p className="text-3xl font-black leading-none">{fmt(selectedItem.profit)} <span className="text-sm">uzs</span></p>
                            </div>
                            <TrendingUp className="w-12 h-12 opacity-40" />
                         </div>
                      </div>
                   ) : (
                      <div className="py-20 text-center space-y-6">
                         <Info className="w-16 h-16 text-slate-700 mx-auto" />
                         <div>
                            <p className="text-lg font-black text-white">{t('Batch ma\'lumotlari yo\'q')}</p>
                            <p className="text-xs font-bold text-slate-500 mt-2">{t('Ushbu mahsulot eski usulda (Average Cost) hisoblangan')}</p>
                         </div>
                      </div>
                   )}
                </div>
              </div>

              {/* Smart Pricing Tool Linked to Selected Item */}
              <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                     <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('Smart Pricing Simulator')}</h3>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Tanlangan Tannarx (Unit Cost)')}</label>
                      <div className="flex gap-4">
                        <input 
                          type="number" 
                          value={batchDetail?.unit_cost || sampleCost}
                          onChange={(e) => setSampleCost(Number(e.target.value))}
                          className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:border-indigo-500 transition-all"
                        />
                        <div className="flex items-center gap-2 px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-indigo-100">
                           {batchDetail ? 'REAL' : 'EST'}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex justify-between items-center px-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Maqsadli Margin')}</label>
                         <span className="text-lg font-black text-indigo-600">{targetMargin}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="80" 
                        step="1"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                      />
                   </div>

                   <div className="p-8 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                      <div className="relative z-10 flex justify-between items-center">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{t('Tavsiya etilgan sotuv narxi')}</p>
                            <p className="text-3xl font-black leading-none">{fmt(recommendedPrice)} <span className="text-sm">uzs</span></p>
                         </div>
                         <Target className="w-10 h-10 opacity-30" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mb-16 blur-3xl opacity-10" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
