import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  ShoppingBag, 
  Clock, 
  ChevronRight,
  Filter,
  ArrowDownToLine,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function PurchaseOrders() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('batches/');
      setBatches(res.data);
    } catch (err) {
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = batches.filter(b => 
    b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
               <ShoppingBag className="w-8 h-8" />
             </div>
             {t('Xarid Buyurtmalari')}
          </h1>
          <p className="text-slate-500 font-medium">{t('Materiallar va xom ashyo uchun buyurtmalar nazorati')}</p>
        </div>
        <button className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all group">
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>{t('Yangi Xarid')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Jami Buyurtmalar')}</p>
            <h3 className="text-3xl font-black text-slate-900">{batches.length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Muddati yetgan')}</p>
            <h3 className="text-3xl font-black text-rose-500">0</h3>
         </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-card overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
           <div className="relative group w-full max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-all" />
              <input 
                type="text" 
                placeholder={t('Batch yoki Ta\'minotchi bo\'yicha qidiruv...')} 
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[22px] outline-none focus:border-indigo-500 transition-all text-sm font-bold shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
              <Filter className="w-6 h-6" />
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Nomer / Batch')}</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Material')}</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Ta\'minotchi')}</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Miqdor')}</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Holat')}</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Sana')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-black text-slate-900 tracking-wider">#{b.batch_number}</span>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-slate-300" />
                       <span className="text-xs font-black text-slate-600">{b.material_name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                       <Building2 className="w-4 h-4 text-slate-300" />
                       <span className="text-xs font-bold text-slate-500">{b.supplier_name || 'Generic'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center text-sm font-black text-slate-900">
                    {b.quantity} {t('dona')}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-100">
                      {t('Qabul qilingan')}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                       <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{new Date(b.created_at).toLocaleDateString()}</span>
                       <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(b.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest italic">{t('Buyurtmalar topilmadi')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
