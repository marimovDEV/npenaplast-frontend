import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  User as UserIcon,
  X,
  PlusCircle,
  MoreVertical,
  Activity
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function Suppliers() {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_info: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('suppliers/');
      setSuppliers(res.data);
    } catch (err) {
      uiStore.showNotification("Ta'minotchilarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    setLoading(true);
    try {
      await api.post('suppliers/', newSupplier);
      uiStore.showNotification("Ta'minotchi muvaffaqiyatli qo'shildi", "success");
      setIsModalOpen(false);
      setNewSupplier({ name: '', contact_info: '' });
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
               <Building2 className="w-8 h-8" />
            </div>
            {t('Ta\'minotchilar')}
          </h1>
          <p className="text-slate-500 font-medium">{t('Xom ashyo va xizmat ko\'rsatuvchi korxonalar bazasi')}</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-blue-600 text-white px-10 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all group"
        >
          <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>{t('Yangi Ta\'minotchi')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
               {suppliers.length}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Jami')}</p>
               <p className="text-sm font-black text-slate-900">{t('Kontragentlar')}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
           <div className="relative group w-full max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-all" />
              <input 
                type="text" 
                placeholder={t('Ta\'minotchi nomi bo\'yicha qidiruv...')} 
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Kompaniya Nomi')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Kontakt Ma\'lumotlari')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Status')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {s.name.charAt(0)}
                       </div>
                       <span className="text-sm font-black text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-500 truncate max-w-xs block">{s.contact_info || '—'}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-100">
                        Active
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && !loading && (
                 <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">{t('Ta\'minotchilar topilmadi')}</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 30 }}
               className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl"
            >
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl">
                       <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{t('Yangi Ta\'minotchi')}</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleCreate} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Kompaniya Nomi')}</label>
                     <input 
                       required
                       type="text" 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-blue-500 transition-all font-bold text-sm"
                       value={newSupplier.name}
                       onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                       placeholder="M-Faktura LLC"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Kontakt Ma\'lumotlari')}</label>
                     <textarea 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-blue-500 transition-all font-bold text-sm min-h-[120px]"
                       value={newSupplier.contact_info}
                       onChange={e => setNewSupplier({...newSupplier, contact_info: e.target.value})}
                       placeholder="+998 90 123 45 67, info@example.com"
                     />
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">{t('Bekor qilish')}</button>
                     <button type="submit" disabled={loading} className="flex-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50">
                        {loading ? t('Yaratilmoqda...') : t('Ta\'minotchini Qo\'shish')}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
