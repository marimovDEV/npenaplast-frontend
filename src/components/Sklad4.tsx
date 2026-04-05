import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Clock, CheckCircle2, Box, ShoppingCart, Package, 
  Search, Filter, ArrowUpRight, TrendingUp, DollarSign,
  AlertCircle, ChevronRight, QrCode, ClipboardList, User as UserIcon
} from 'lucide-react';
import api from '../lib/api';
import { User, Inventory, Client, Material } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'ALL', label: 'Barchasi' },
  { id: 'FINISHED', label: 'Tayyor' },
  { id: 'SEMI', label: 'Yarim tayyor' },
  { id: 'RAW', label: 'Xom-ashyo' },
];

export default function Sklad4({ user }: { user: User }) {
  const assignedWarehouses = (user.assignedWarehouses || user.assigned_warehouses || []).map(String);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [todaySales, setTodaySales] = useState(0);

  // Sales Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [sellQty, setSellQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const currentRole = user.effective_role || user.role_display || user.role;

  const isAdmin = currentRole === 'Bosh Admin' || currentRole === 'Admin';
  const isReadOnly = !isAdmin && currentRole !== 'Sotuv menejeri';

  const fetchData = async () => {
    try {
      const [wRes, cRes, invRes, salesRes] = await Promise.all([
        api.get('warehouses/?name=Sklad №4'),
        api.get('clients/'),
        api.get('inventory/?warehouse=3'), // Sklad 4 ID is 3
        api.get('sales/invoices/') // We'll filter today's sales on frontend
      ]);

      setClients(cRes.data);
      setInventory(invRes.data);
      
      if (wRes.data.length > 0) {
        setWarehouseId(wRes.data[0].id);
      } else {
        setWarehouseId(3); // Fallback
      }

      // Calculate today's sales
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayCount = salesRes.data.filter((s: any) => s.date.startsWith(todayStr)).length;
      setTodaySales(todayCount);

    } catch (err) {
      console.error("Sklad 4 fetch error", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = 
        i.product_details.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.product_details.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'ALL' || i.product_details.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, activeCategory]);

  const stats = useMemo(() => {
    const totalQty = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalValue = inventory.reduce((acc, curr) => acc + (curr.quantity * (curr.product_details.price || 0)), 0);
    return { totalQty, totalValue };
  }, [inventory]);

  const handleOpenSellModal = (item: Inventory) => {
    setSelectedItem(item);
    setSellQty(String(item.quantity));
    setSellPrice(String(item.product_details.price || 0));
    setIsSellModalOpen(true);
  };

  const handleSell = async () => {
    if (!selectedItem || !selectedClient || !warehouseId || !sellQty || !sellPrice) return;
    
    const qty = parseFloat(sellQty);
    const price = parseFloat(sellPrice);

    if (qty <= 0 || qty > selectedItem.quantity) {
      uiStore.showNotification("Miqdor noto'g'ri", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post('sales/invoices/create-invoice/', {
        warehouse_id: warehouseId,
        customer_id: Number(selectedClient),
        items: [{
          product_id: selectedItem.product,
          quantity: qty,
          price: price,
          batch_number: selectedItem.batch_number
        }]
      });

      uiStore.showNotification("Sotuv muvaffaqiyatli yakunlandi", "success");
      setIsSellModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Sotuvni amalga oshirib bo'lmadi";
      uiStore.showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!assignedWarehouses.includes('*') && !assignedWarehouses.includes('sklad4') && !assignedWarehouses.includes('4')) {
     return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h3 className="text-xl font-black text-slate-900 mb-1">Ruxsat yo'q</h3>
          <p className="text-slate-400 text-sm font-medium text-center max-w-xs">Sizga 4-Ombor (Tayyor mahsulot) bo'limiga kirish ruxsati berilmagan.</p>
        </div>
     );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header & KPIs */}
      <div className="flex flex-col xl:flex-row justify-between gap-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tayyor Mahsulot Ombori</h1>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
              4-Ombor
            </div>
          </div>
          <p className="text-slate-500 font-medium">Sotuvga tayyor mahsulotlar va real-time zaxira nazorati</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full xl:w-auto">
          {/* KPI Card 1 */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami Zaxira</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalQty.toLocaleString()} <span className="text-xs opacity-40">dona</span></p>
            </div>
          </div>

          {/* KPI Card 2 */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sklad Qiymati</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalValue.toLocaleString()} <span className="text-xs opacity-40 text-emerald-600 font-bold">UZS</span></p>
            </div>
          </div>

          {/* KPI Card 3 */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bugungi Sotuv</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{todaySales} <span className="text-xs opacity-40">faktura</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[24px] w-fit border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat.id 
                  ? 'bg-white text-blue-600 shadow-lg shadow-blue-100/50' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="SKU, Partiya yoki nom..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-[28px] outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredInventory.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id}
              className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-50/50 transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-inner">
                    <Box className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Omborda
                    </div>
                    {item.product_details.category === 'FINISHED' && (
                      <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest">
                        Tayyor
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{item.product_details.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <QrCode className="w-3 h-3" />
                    <span>SKU: {item.product_details.sku || 'N/A'}</span>
                    <span className="opacity-20">•</span>
                    <span>{item.batch_number}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Miqdor</p>
                    <p className="text-lg font-black text-slate-900">{item.quantity} <span className="text-[10px] opacity-40">{item.product_details.unit}</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Narxi</p>
                    <p className="text-lg font-black text-slate-900">{item.product_details.price?.toLocaleString()} <span className="text-[10px] opacity-40">UZS</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy HH:mm') : '01.01.1970'}
                  </span>
                </div>
              </div>

              <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-50 flex gap-2 group-hover:bg-white transition-colors">
                 {!isReadOnly ? (
                    <button 
                      onClick={() => handleOpenSellModal(item)}
                      className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[2px] hover:bg-blue-600 shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>SOTUVGA CHIQARISH</span>
                      <ArrowUpRight className="w-4 h-4 opacity-40" />
                    </button>
                 ) : (
                    <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-[24px] font-black text-[11px] uppercase tracking-widest text-center italic border border-slate-200/50">
                       Faqat ko'rish rejimi
                    </div>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredInventory.length === 0 && (
          <div className="col-span-full py-40 bg-white/50 rounded-[60px] border-4 border-dashed border-slate-100/50 flex flex-col items-center justify-center text-slate-300">
            <Package className="w-24 h-24 mb-6 opacity-10" />
            <p className="text-[12px] font-black uppercase tracking-[0.4em] italic">Mahsulotlar topilmadi</p>
          </div>
        )}
      </div>

      {/* Sell Modal */}
      <AnimatePresence>
        {isSellModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsSellModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
            >
              {/* Modal Left - Product Detail */}
              <div className="lg:w-1/3 bg-slate-50 p-10 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-slate-100">
                <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center text-blue-600 mb-8 mt-4">
                  <Box className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{selectedItem.product_details.name}</h3>
                <div className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-200">
                  {selectedItem.batch_number}
                </div>
                <div className="space-y-4 w-full">
                  <div className="flex justify-between text-xs font-bold px-2">
                    <span className="text-slate-400">MAVJUD</span>
                    <span className="text-slate-900">{selectedItem.quantity} {selectedItem.product_details.unit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-full" />
                  </div>
                </div>
              </div>

              {/* Modal Right - Form */}
              <div className="lg:w-2/3 p-10 lg:p-14 space-y-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sotuvni Rasmiylashtirish</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Mijozni tanlang va ma'lumotlarni kiriting</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mijozlar</label>
                    <div className="relative">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select 
                        required
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 font-bold appearance-none"
                      >
                        <option value="">Tanlang...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sotuv Miqdori</label>
                    <div className="relative">
                      <ClipboardList className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="number"
                        placeholder="0"
                        value={sellQty}
                        max={selectedItem.quantity}
                        onChange={(e) => setSellQty(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narxi (UZS)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="number"
                        placeholder="0"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 font-bold"
                      />
                    </div>
                  </div>

                <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Jami To'lov</p>
                    <p className="text-2xl font-black text-blue-700">
                      {(Number(sellQty) * Number(sellPrice)).toLocaleString()} <span className="text-xs">UZS</span>
                    </p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-blue-300" />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsSellModalOpen(false)}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={handleSell}
                    disabled={!selectedClient || !sellQty || loading}
                    className="flex-[2] py-5 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[3px] hover:bg-blue-600 shadow-2xl shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Filter className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    <span>SOTUVNI TASDIQLASH</span>
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
