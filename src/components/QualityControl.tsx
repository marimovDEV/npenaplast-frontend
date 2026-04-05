import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight, 
  Info,
  Clock,
  User,
  Package,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { ProductionOrder, QualityCheck, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function QualityControl({ user }: { user: UserType }) {
  const [pendingOrders, setPendingOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [notes, setNotes] = useState('');
  const [wasteWeight, setWasteWeight] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('production/orders/?status=QC_PENDING');
      setPendingOrders(res.data);
    } catch (err) {
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQC = async (status: 'PASSED' | 'FAILED') => {
    if (!selectedOrder) return;
    try {
      await api.post(`production/orders/${selectedOrder.id}/perform-qc/`, {
        status,
        notes,
        waste_weight: wasteWeight
      });
      uiStore.showNotification(
        status === 'PASSED' ? "Tasdiqlandi" : "Rad etildi", 
        status === 'PASSED' ? "success" : "info"
      );
      setIsModalOpen(false);
      setSelectedOrder(null);
      setNotes('');
      setWasteWeight(0);
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Sifat Nazorati</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Tayyor mahsulotlarni tekshirish</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
           <Filter className="w-6 h-6" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Yuklanmoqda...</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-50 shadow-sm flex flex-col items-center">
           <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-6 text-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-black text-slate-800 mb-2">Hamma narsa joyida!</h3>
           <p className="text-slate-400 text-sm font-medium">Tekshirilishi kerak bo'lgan buyurtmalar yo'q.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {pendingOrders.map((order) => (
             <motion.div 
               key={order.id}
               whileTap={{ scale: 0.98 }}
               onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
               className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm active:bg-slate-50 transition-all flex items-center justify-between"
             >
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Package className="w-7 h-7" />
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight">#{order.order_number}</h4>
                      <p className="text-xs font-bold text-slate-400 truncate max-w-[150px]">{order.product_name}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right mr-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hajmi</p>
                      <p className="font-black text-slate-900">{order.quantity} m³</p>
                   </div>
                   <ChevronRight className="text-slate-300" />
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* QC Modal - Bottom Sheet Style for Mobile */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="relative w-full sm:max-w-lg bg-white rounded-t-[48px] sm:rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
             >
                <div className="p-8 pb-4 flex items-center justify-between">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">#{selectedOrder.order_number}</h3>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{selectedOrder.product_name}</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                      <ArrowLeft className="w-6 h-6 text-slate-400" />
                   </button>
                </div>

                <div className="p-8 space-y-8">
                   <div className="bg-slate-50 rounded-[32px] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ma'sul shaxs</span>
                         <span className="text-xs font-bold text-slate-900">{selectedOrder.responsible_name || 'Aniqlanmagan'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Topshiriq vaqti</span>
                         <span className="text-xs font-bold text-slate-900">{selectedOrder.start_date || '-'}</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Izoh (ixtiyoriy)</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Holati yaxshi yoki nuqson bor bo'lsa yozing..."
                        className="w-full bg-slate-50 rounded-3xl p-5 text-sm min-h-[100px] border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleQC('PASSED')}
                        className="flex flex-col items-center justify-center gap-3 bg-emerald-500 text-white p-8 rounded-[36px] shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                      >
                         <CheckCircle2 className="w-8 h-8" />
                         <span className="text-xs font-black uppercase tracking-widest">TASDIQLASH</span>
                      </button>
                      <button 
                         onClick={() => handleQC('FAILED')}
                         className="flex flex-col items-center justify-center gap-3 bg-rose-500 text-white p-8 rounded-[36px] shadow-xl shadow-rose-100 active:scale-95 transition-all"
                      >
                         <XCircle className="w-8 h-8" />
                         <span className="text-xs font-black uppercase tracking-widest">RAD ETISH</span>
                      </button>
                   </div>
                   
                   {/* If Failed, show waste weight input */}
                   {notes.toLowerCase().includes('brak') && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] space-y-4"
                     >
                        <div className="flex items-center gap-3 text-rose-500">
                           <AlertTriangle className="w-5 h-5" />
                           <h5 className="font-black text-sm uppercase tracking-widest">Brak miqdori (kg)</h5>
                        </div>
                        <input 
                           type="number"
                           value={wasteWeight}
                           onChange={(e) => setWasteWeight(parseFloat(e.target.value))}
                           className="w-full bg-white border border-rose-200 rounded-2xl p-4 text-center text-lg font-black text-rose-600 outline-none"
                        />
                     </motion.div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
