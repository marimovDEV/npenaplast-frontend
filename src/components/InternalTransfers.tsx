import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Database,
  Box,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function InternalTransfers() {
  const { t } = useI18n();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Transfer Form State
  const [newTransfer, setNewTransfer] = useState({
    from_warehouse: '',
    to_warehouse: '',
    material: '',
    quantity: 0,
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, whRes, matRes] = await Promise.all([
        api.get('transfers/'),
        api.get('warehouses/'),
        api.get('materials/')
      ]);
      setTransfers(transRes.data);
      setWarehouses(whRes.data);
      setMaterials(matRes.data);
    } catch (err) {
      console.error(err);
      uiStore.showNotification("Ma'lumot yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.from_warehouse || !newTransfer.to_warehouse || !newTransfer.material || !newTransfer.quantity) {
      uiStore.showNotification("Barcha maydonlarni to'ldiring", "warning");
      return;
    }

    if (newTransfer.from_warehouse === newTransfer.to_warehouse) {
      uiStore.showNotification("Bir xil omborlar orasida o'tkazma qilib bo'lmaydi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post('transfers/', newTransfer);
      uiStore.showNotification("O'tkazma muvaffaqiyatli amalga oshirildi", "success");
      setIsModalOpen(false);
      fetchData();
      setNewTransfer({
        from_warehouse: '',
        to_warehouse: '',
        material: '',
        quantity: 0,
        notes: ''
      });
    } catch (err) {
      uiStore.showNotification("O'tkazma amalga oshmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-100">
               <ArrowRightLeft className="w-8 h-8" />
            </div>
            {t('Ichki O\'tkazmalar')}
          </h1>
          <p className="text-slate-500 font-medium">{t('Omborlararo material va mahsulot harakati nazorati')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-10 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-2xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span>{t('Yangi O\'tkazma')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Jami O\'tkazmalar')}</p>
            <h3 className="text-3xl font-black text-slate-900">{transfers.length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Muvaffaqiyatli')}</p>
            <h3 className="text-3xl font-black text-emerald-600">{transfers.filter(t => t.status === 'COMPLETED').length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Kutilmoqda')}</p>
            <h3 className="text-3xl font-black text-amber-600">{transfers.filter(t => t.status === 'PENDING').length}</h3>
         </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-card overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
           <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('Harakatlar Tarixi')}</h3>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder={t('Qidiruv...')} className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-bold w-64 focus:border-amber-500 transition-all" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Material')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Yo\'nalish')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Miqdor')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Holat')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Sana')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transfers.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">{t('O\'tkazmalar topilmadi')}</td>
                </tr>
              ) : (
                transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-amber-600 font-black text-xs">
                          {tr.material_name?.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900">{tr.material_name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Zapchast')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-slate-600">{tr.from_warehouse_name}</span>
                         <ArrowRight className="w-4 h-4 text-slate-300" />
                         <span className="text-xs font-black text-blue-600">{tr.to_warehouse_name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                       <span className="text-sm font-black text-slate-700">{tr.quantity} {t('dona')}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         tr.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                         tr.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                         {t(tr.status)}
                       </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <p className="text-xs font-bold text-slate-400">{new Date(tr.date).toLocaleDateString()}</p>
                       <p className="text-[9px] font-black text-slate-300 uppercase">{new Date(tr.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl border border-slate-100"
            >
               <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('Yangi O\'tkazma')}</h3>
                     <p className="text-slate-500 font-medium">{t('Materiallarni omborlararo harakatlantirish')}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm border border-slate-100">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <form onSubmit={handleCreateTransfer} className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('Qaysi ombordan')}</label>
                        <select 
                           required
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm appearance-none"
                           value={newTransfer.from_warehouse}
                           onChange={e => setNewTransfer({...newTransfer, from_warehouse: e.target.value})}
                        >
                           <option value="">{t('Tanlang...')}</option>
                           {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('Qaysi omborga')}</label>
                        <select 
                           required
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm appearance-none"
                           value={newTransfer.to_warehouse}
                           onChange={e => setNewTransfer({...newTransfer, to_warehouse: e.target.value})}
                        >
                           <option value="">{t('Tanlang...')}</option>
                           {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('Material')}</label>
                        <select 
                           required
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm appearance-none"
                           value={newTransfer.material}
                           onChange={e => setNewTransfer({...newTransfer, material: e.target.value})}
                        >
                           <option value="">{t('Tanlang...')}</option>
                           {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('Miqdor')}</label>
                        <input 
                           type="number"
                           required
                           min="0.01"
                           step="0.01"
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm"
                           value={newTransfer.quantity || ''}
                           onChange={e => setNewTransfer({...newTransfer, quantity: parseFloat(e.target.value)})}
                           placeholder="0.00"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('Izoh')}</label>
                     <textarea 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm min-h-[120px]"
                        value={newTransfer.notes}
                        onChange={e => setNewTransfer({...newTransfer, notes: e.target.value})}
                        placeholder={t('O\'tkazma sababi yoki qo\'shimcha ma\'lumotlar...')}
                     />
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-5 border border-slate-200 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                     >
                        {t('Bekor qilish')}
                     </button>
                     <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-5 bg-amber-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                        {loading ? t('Yuborilmoqda...') : t('O\'tkazmani tasdiqlash')}
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
