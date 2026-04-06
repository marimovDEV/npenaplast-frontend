import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Search, 
  Filter, 
  Activity, 
  ArrowRight, 
  Scissors, 
  Package, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Box,
  Maximize,
  Weight,
  History,
  QrCode,
  ArrowUpRight
} from 'lucide-react';
import api from '../lib/api';
import { User, BlockProduction } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';

export default function Sklad2({ user }: { user: User }) {
  const { locale } = useI18n();
  const assignedWarehouses = (user.assignedWarehouses || user.assigned_warehouses || []).map(String);
  const [blocks, setBlocks] = useState<BlockProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'READY' | 'DRYING' | 'RESERVED'>('READY');
  const [selectedBlock, setSelectedBlock] = useState<BlockProduction | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('production/blocks/');
      setBlocks(res.data);
    } catch (err) {
      console.error("Failed to fetch blocks", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFinishDrying = async (id: number) => {
    try {
      // Find the drying process associated with this block production
      const dryRes = await api.get(`production/drying/?block_production=${id}`);
      const drying = dryRes.data.find((d: any) => !d.end_time);
      
      if (drying) {
        await api.post(`production/drying/${drying.id}/finish/`);
        uiStore.showNotification("Quritish yakunlandi", "success");
        fetchData();
      }
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  const handleTransferToCNC = async (id: number) => {
    try {
      await api.post(`production/blocks/${id}/transfer_to_cnc/`);
      uiStore.showNotification("Blok CNC uchun rezerv qilindi", "success");
      fetchData();
      setIsTransferModalOpen(false);
    } catch (err) {
      uiStore.showNotification("Xatolik: " + (err as any).response?.data?.error || "Transfer amalga oshmadi", "error");
    }
  };

  const filteredBlocks = blocks.filter(b => {
    const matchesSearch = b.zames_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.form_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = b.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const kpis = {
    totalReady: blocks.filter(b => b.status === 'READY').reduce((sum, b) => sum + b.block_count, 0),
    totalVolume: blocks.filter(b => b.status === 'READY').reduce((sum, b) => sum + b.volume, 0),
    inDrying: blocks.filter(b => b.status === 'DRYING').reduce((sum, b) => sum + b.block_count, 0),
    defects: blocks.filter(b => b.status === 'DEFECT').length
  };

  if (!assignedWarehouses.includes('*') && !assignedWarehouses.includes('sklad2') && !assignedWarehouses.includes('2')) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-1">Ruxsat yo'q</h3>
        <p className="text-slate-400 text-sm font-medium">Sizga ushbu skladni boshqarish ruxsati berilmagan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & KPIs */}
      <div className="flex flex-col xl:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Layers className="w-6 h-6 text-white" />
            </div>
            Sklad №2 (Bloklar)
          </h1>
          <p className="text-slate-500 font-medium ml-12">Tayyor va quritilayotgan bloklar nazorati</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-4xl">
          {[
            { label: 'Tayyor', value: kpis.totalReady, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', unit: 'dona' },
            { label: 'Hajm', value: kpis.totalVolume.toFixed(1), icon: Maximize, color: 'text-blue-600', bg: 'bg-blue-50', unit: 'm³' },
            { label: 'Quritilmoqda', value: kpis.inDrying, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', unit: 'dona' },
            { label: 'Brak', value: kpis.defects, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', unit: 'partiya' },
          ].map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
            >
              <div className={`p-3 ${kpi.bg} rounded-2xl transition-transform group-hover:scale-110 duration-500`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900">{kpi.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{kpi.unit}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="flex p-1.5 bg-slate-100 rounded-[22px] w-full lg:w-auto">
          {(['READY', 'DRYING', 'RESERVED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'READY' ? 'Tayyor' : tab === 'DRYING' ? 'Quritishda' : 'Rezerv'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Zames № yoki Form № bo'yicha qidirish..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-700 shadow-sm"
          />
        </div>

        <button className="p-4 bg-white border border-slate-200 rounded-[22px] text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
          <QrCode className="w-6 h-6" />
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredBlocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Partiya / Zames</th>
                  <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">O'lcham & Zichlik</th>
                  <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hajm & Miqdor</th>
                  <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Sana</th>
                  <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBlocks.map((block) => (
                  <motion.tr 
                    key={block.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${
                          block.status === 'READY' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'
                        }`}>
                          <Box className={`w-6 h-6 ${block.status === 'READY' ? 'text-emerald-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Zames: {block.zames_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Forma: {block.form_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Maximize className="w-3 h-3 text-slate-400" />
                          {block.length}x{block.width}x{block.height} mm
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Weight className="w-3 h-3 text-slate-400" />
                          {block.density} kg/m³
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-900">{block.block_count} dona</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{block.volume.toFixed(2)} m³</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5 opacity-50" />
                        {new Date(block.date).toLocaleDateString(locale)}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        block.status === 'READY' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : block.status === 'DRYING'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {block.status === 'READY' ? 'Tayyor' : block.status === 'DRYING' ? 'Quritishda' : 'Rezerv'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {block.status === 'READY' ? (
                        <button 
                          onClick={() => {
                            setSelectedBlock(block);
                            setIsTransferModalOpen(true);
                          }}
                          className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all group/btn"
                        >
                          <div className="flex items-center gap-2 px-2">
                             <Scissors className="w-4 h-4" />
                             <span className="text-[11px] font-black uppercase tracking-widest">CNC ga</span>
                          </div>
                        </button>
                      ) : block.status === 'DRYING' ? (
                        <button 
                          onClick={() => handleFinishDrying(block.id)}
                          className="px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 ml-auto"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Tugallash
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                           <History className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center shadow-inner">
              <Layers className="w-10 h-10 text-slate-200" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900">Bloklar topilmadi</h3>
              <p className="text-slate-400 font-medium italic">Siz tanlagan kategoriyada hozircha ma'lumot yo'q</p>
            </div>
          </div>
        )}
      </div>

      {/* Transfer to CNC Modal */}
      <AnimatePresence>
        {isTransferModalOpen && selectedBlock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTransferModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-200">
                     <Scissors className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">CNC ga O'tkazish</h3>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Blokni kesish bo'limiga yuborish</p>
                   </div>
                </div>
                <button onClick={() => setIsTransferModalOpen(false)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm border border-slate-100 hover:border-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200/50 space-y-4">
                   <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partiya</span>
                      <span className="text-sm font-black text-slate-900">{selectedBlock.zames_number}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Miqdor</p>
                        <p className="text-lg font-black text-blue-600">{selectedBlock.block_count} dona</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hajm</p>
                        <p className="text-lg font-black text-indigo-600">{selectedBlock.volume.toFixed(2)} m³</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-[24px] border border-amber-100">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        Diqqat! Blok CNC ga o'tkazilganda, u boshqa sotuvlar yoki transferlar uchun 
                        <span className="font-black underline mx-1">RESERV</span> holatiga o'tadi.
                      </p>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsTransferModalOpen(false)}
                    className="flex-1 px-8 py-5 border-2 border-slate-100 text-slate-500 rounded-[28px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-xs"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={() => handleTransferToCNC(selectedBlock.id)}
                    className="flex-[1.5] px-8 py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span>Tasdiqlash</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
