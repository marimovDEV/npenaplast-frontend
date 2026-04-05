import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Package, 
  Calendar, 
  Navigation, 
  MoreVertical, 
  Trash2, 
  Clock,
  Layers
} from 'lucide-react';
import api from '../lib/api';
import { User, Transfer, BlockProduction } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function Sklad3({ user }: { user: User }) {
  const assignedWarehouses = (user.assignedWarehouses || user.assigned_warehouses || []).map(String);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmReceive, setConfirmReceive] = useState<Transfer | null>(null);

  // Form state
  const [availableBlocks, setAvailableBlocks] = useState<BlockProduction[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Permission check
  const hasAccess = assignedWarehouses.includes('*') || 
                  assignedWarehouses.includes('sklad3') || 
                  assignedWarehouses.includes('3');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, blocksRes, whRes] = await Promise.all([
        api.get('documents/?type=OTKAZMA_BUYRUGI'),
        api.get('production/blocks/?status=READY&warehouse=2'), // Sklad 2 is ID 2 usually
        api.get('warehouses/')
      ]);

      setWarehouses(whRes.data);
      setAvailableBlocks(blocksRes.data);
      
      const mappedTransfers = docsRes.data.map((d: any) => ({
        id: d.id,
        batchNumber: d.number || `TR-${d.id}`,
        fromLocation: d.from_warehouse_name || 'Noma\'lum',
        toLocation: d.to_warehouse_name || '3-Ombor',
        quantity: d.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
        date: d.created_at,
        status: d.status,
        productName: d.items[0]?.product_name || 'Mahsulot',
        unit: 'dona'
      }));
      
      setTransfers(mappedTransfers);
    } catch (err) {
      console.error("Sklad 3 fetch error", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId || !targetWarehouseId || !transferQuantity) return;

    setLoading(true);
    try {
      const selectedBlock = availableBlocks.find(b => b.id === Number(selectedBlockId));
      if (!selectedBlock) throw new Error("Blok topilmadi");

      await api.post('documents/', {
        type: 'OTKAZMA_BUYRUGI',
        from_warehouse: 2, // Sklad 2
        to_warehouse: Number(targetWarehouseId),
        items: [{ 
          product: selectedBlock.zames, // Use zames/product ID
          quantity: Number(transferQuantity),
          batch_number: selectedBlock.form_number // Or use batch_number if available
        }]
      });

      uiStore.showNotification("Transfer muvaffaqiyatli yaratildi va yo'lga chiqdi", "success");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransfer = async () => {
    if (!confirmReceive) return;
    
    setLoading(true);
    try {
      await api.post(`documents/${confirmReceive.id}/receive/`);
      uiStore.showNotification("Mahsulotlar omborga qabul qilindi", "success");
      setConfirmReceive(null);
      fetchData();
    } catch (err) {
      uiStore.showNotification("Qabul qilishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBlockId('');
    setTargetWarehouseId('');
    setTransferQuantity('');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Noma'lum";
      return d.toLocaleString('uz-UZ', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Noma'lum";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_TRANSIT': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'Qabul qilindi';
      case 'IN_TRANSIT': return "Yo'lda";
      case 'CANCELLED': return 'Bekor qilindi';
      case 'CREATED': return 'Yaratildi';
      default: return status;
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mb-6 shadow-inner ring-4 ring-rose-50/50">
          <X className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Ruxsat yo'q</h3>
        <p className="text-slate-400 text-center max-w-xs font-medium">Sizga ushbu bo'limni boshqarish ruxsati berilmagan. Iltimos, administratorga murojaat qiling.</p>
      </div>
    );
  }

  const filteredTransfers = transfers.filter(t => 
    t.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalInTransit: transfers.filter(t => t.status === 'IN_TRANSIT').length,
    totalVolume: filteredTransfers.reduce((acc, t) => acc + (t.status === 'DONE' ? t.quantity : 0), 0)
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Ichki Ombor <span className="text-blue-600">№3</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Navigation className="w-3 h-3 text-blue-500" />
            Sexlararo harakatlar va zaxira logistikasi
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="px-6 py-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
               <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Yo'lda</p>
              <p className="text-lg font-black text-slate-900 leading-none">{stats.totalInTransit} ta</p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all"
          >
            <Truck className="w-5 h-5 group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform" />
            <span>Yangi Harakat</span>
          </button>
        </div>
      </div>

      {/* Main Journal Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Harakatlar Jurnali</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Barcha ichki o'tkazmalar tarixi</p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Partiya yoki mahsulot bo'yicha qidirish..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hujjat / Partiya</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Mahsulot</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Yo'nalish</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Miqdor</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Holat</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-sm group-hover:scale-110 transition-transform">
                        <Package className="w-full h-full text-slate-400" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 block leading-tight mb-1">{transfer.batchNumber}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                           <Calendar className="w-3 h-3" />
                           {formatDate(transfer.date)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-sm font-black text-slate-900">{transfer.productName}</span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200/50">{transfer.fromLocation}</span>
                      <div className="relative">
                        <ArrowRight className="w-3 h-3 text-blue-500 relative z-10" />
                        <motion.div animate={{ x: [0, 10, 0], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-blue-400 blur-sm rounded-full" />
                      </div>
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">{transfer.toLocation}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className="px-4 py-2 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg shadow-slate-200">
                      {transfer.quantity} <span className="text-[10px] opacity-40 ml-1 uppercase">{transfer.unit}</span>
                    </span>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm inline-flex items-center gap-2 ${getStatusStyle(transfer.status)}`}>
                      {transfer.status === 'DONE' && <CheckCircle2 className="w-3 h-3" />}
                      {transfer.status === 'IN_TRANSIT' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />}
                      {getStatusLabel(transfer.status)}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    {transfer.status === 'IN_TRANSIT' ? (
                      <button 
                        onClick={() => setConfirmReceive(transfer)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-blue-100 hover:shadow-emerald-100 active:scale-90"
                      >
                        Qabul qilish
                      </button>
                    ) : transfer.status === 'DONE' ? (
                      <div className="flex items-center justify-end gap-2 text-emerald-500">
                         <span className="text-[10px] font-black uppercase tracking-widest">Bajarildi</span>
                         <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Amal yo'q</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {loading && filteredTransfers.length === 0 && (
                 <tr>
                    <td colSpan={6} className="py-20 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
                       </div>
                    </td>
                 </tr>
              )}

              {!loading && filteredTransfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-300 italic font-black text-lg">
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    Harakatlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmReceive && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmReceive(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                   <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 text-center mb-3">Haqiqatan ham qabul qilasizmi?</h3>
                <p className="text-slate-500 text-center text-sm font-medium mb-10">
                  {confirmReceive.batchNumber} partiyadagi {confirmReceive.quantity} {confirmReceive.unit} mahsulotni omborga qirishni tasdiqlaysizmi?
                </p>
                <div className="flex gap-4">
                   <button onClick={() => setConfirmReceive(null)} className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Yo'q, bekor qilish</button>
                   <button onClick={handleReceiveTransfer} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95 transition-all">Tasdiqlash</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Transfer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden border border-white"
            >
              <div className="p-12">
                <div className="flex justify-between items-center mb-12">
                  <div>
                     <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Yangi Transfer</h2>
                     <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Sklad 2 dan mahsulotlarni o'tkazish</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTransfer} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mahsulotni tanlang (Sklad 2 - Tayyor)</label>
                    <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-3 scrollbar-vibrant">
                      {availableBlocks.map(b => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => {
                            setSelectedBlockId(String(b.id));
                            setTransferQuantity(String(b.block_count));
                          }}
                          className={`p-6 rounded-[32px] border-2 transition-all text-left flex items-center justify-between group ${selectedBlockId === String(b.id) ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-slate-50 bg-slate-50/30 hover:border-blue-200'}`}
                        >
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-2xl transition-colors ${selectedBlockId === String(b.id) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                                <Box className="w-5 h-5" />
                             </div>
                             <div>
                                <span className="text-sm font-black text-slate-900 block leading-tight mb-0.5">Partiya №{b.form_number}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vajm: {b.volume.toFixed(2)} m³ | {b.density} kg/m³</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-lg font-black text-slate-900 block leading-tight">{b.block_count}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">dona tayyor</span>
                          </div>
                        </button>
                      ))}
                      {availableBlocks.length === 0 && (
                        <div className="text-center py-16 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                          <Layers className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sklad 2 da tayyor bloklar mavjud emas</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Qayerga yuborilsin?</label>
                      <select 
                        required
                        value={targetWarehouseId}
                        onChange={(e) => setTargetWarehouseId(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-none rounded-[24px] px-6 font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Tanlang...</option>
                        {warehouses.filter(w => w.name !== 'Sklad №2').map(w => (
                           <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Miqdor (dona)</label>
                      <div className="relative">
                        <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="number" 
                          value={transferQuantity}
                          onChange={(e) => setTransferQuantity(e.target.value)}
                          placeholder="0"
                          className="w-full h-16 bg-slate-50 border-none rounded-[24px] pl-16 pr-6 font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-200" 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !selectedBlockId || !targetWarehouseId}
                    className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? 'Yuborilmoqda...' : 'Harakatni Tasdiqlash'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Box = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l-8 4" />
  </svg>
);
