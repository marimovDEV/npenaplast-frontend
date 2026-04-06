import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Settings, 
  MoreVertical,
  Factory,
  Package,
  ArrowRight,
  TrendingUp,
  Box,
  User as UserIcon,
  X,
  Target,
  ShoppingCart,
  Layers,
  Activity as ActivityIcon,
  Users,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductionOrder, ProductionStage, User } from '../types';
import { uiStore, authStore } from '../lib/store';
import api from '../lib/api';
import { useI18n } from '../i18n';

export default function ProductionOrders() {
  const { locale, t } = useI18n();
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [kpiSummary, setKpiSummary] = useState<any>(null);
  const [operators, setOperators] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed' | 'all'>('active');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaster, setIsMaster] = useState(false);

  // Manual Form State
  const [manualTask, setManualTask] = useState({
    product: '',
    quantity: 100,
    priority: 'MEDIUM',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [products, setProducts] = useState<any[]>([]);

  const fetchKPIs = async () => {
    try {
      const res = await api.get('production/orders/kpi_summary/');
      setKpiSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch KPIs", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, operatorsRes, productsRes] = await Promise.all([
        api.get('production/orders/'),
        api.get('users/?role=Ishlab chiqarish operatori'),
        api.get('materials/')
      ]);
      setProductionOrders(ordersRes.data);
      setOperators(operatorsRes.data);
      setProducts(productsRes.data);
      fetchKPIs();
    } catch (err) {
      console.error("Failed to fetch production data", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const user = authStore.user;
    setIsMaster(['Bosh Admin', 'Admin', 'Ishlab chiqarish ustasi'].includes(user?.role || ''));
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('production/orders/', {
        product: manualTask.product,
        quantity: manualTask.quantity,
        priority: manualTask.priority,
        deadline: manualTask.deadline
      });
      uiStore.showNotification("Yangi naryad yaratildi", "success");
      fetchData();
      setIsManualModalOpen(false);
    } catch (err) {
      uiStore.showNotification("Naryad yaratishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOperator = async (userId: number) => {
    if (!selectedOrder || !selectedStage) return;
    try {
      await api.post(`production/orders/${selectedOrder.id}/assign_operator/`, {
        stage_id: selectedStage.id,
        user_id: userId
      });
      uiStore.showNotification("Operator biriktirildi", "success");
      fetchData();
      setIsAssignModalOpen(false);
    } catch (err) {
      uiStore.showNotification("Biriktirishda xatolik", "error");
    }
  };

  const handleAdvanceStage = async (order: ProductionOrder, stageId: number) => {
    const stage = order.stages.find(s => s.id === stageId);
    if (!stage) return;

    // Optional: Prompt for metrics if it's a significant stage
    let actual_quantity = order.quantity;
    let waste_amount = 0;

    if (stage.stage_type === 'ZAMES') {
      const qty = prompt(t("Ishlatilgan xom ashyo miqdori (kg):"), order.quantity.toString());
      const waste = prompt(t("Brak (chiqindi) miqdori (kg):"), "0");
      if (qty === null) return;
      actual_quantity = parseFloat(qty);
      waste_amount = parseFloat(waste || "0");
    }

    try {
      await api.post(`production/orders/${order.id}/transition/`, {
        stage_id: stageId,
        actual_quantity,
        waste_amount
      });
      uiStore.showNotification("Bosqich yangilandi", "success");
      fetchData();
    } catch (err) {
      uiStore.showNotification("O'tishda xatolik", "error");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-500 text-white shadow-rose-200';
      case 'HIGH': return 'bg-orange-500 text-white shadow-orange-200';
      case 'MEDIUM': return 'bg-blue-500 text-white shadow-blue-200';
      case 'LOW': return 'bg-slate-500 text-white shadow-slate-200';
      default: return 'bg-slate-500 text-white shadow-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ishlab Chiqarish Naryadlari</h1>
          <p className="text-slate-500 font-medium">Barcha aktiv va kutilayotgan ish topshiriqlari nazorati</p>
        </div>
        {isMaster && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-[22px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Naryad</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Jami Naryadlar', value: kpiSummary?.total_orders || 0, icon: ClipboardList, color: 'blue' },
          { label: 'Yakunlangan', value: kpiSummary?.completed_orders || 0, icon: CheckCircle2, color: 'emerald' },
          { label: 'Ishlab chiqarildi (kg)', value: kpiSummary?.waste_metrics?.total_produced?.toFixed(0) || 0, icon: TrendingUp, color: 'amber' },
          { label: 'Umumiy Brak (kg)', value: kpiSummary?.waste_metrics?.total_waste?.toFixed(1) || 0, icon: AlertCircle, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-all shadow-lg shadow-${stat.color}-100`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <BarChart3 className="w-4 h-4 text-slate-200" />
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
        {/* Tabs */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
            {[
              { id: 'active', name: 'Aktiv', icon: ActivityIcon },
              { id: 'pending', name: 'Kutilmoqda', icon: Clock },
              { id: 'completed', name: 'Yakunlangan', icon: CheckCircle2 },
              { id: 'all', name: 'Barchasi', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                  ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-lg shadow-blue-100 ring-1 ring-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-all" />
            <input 
              type="text" 
              placeholder="Naryad raqami bo'yicha qidiruv..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold transition-all"
            />
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {productionOrders
                .filter(po => {
                  if (activeTab === 'active') return po.status === 'IN_PROGRESS';
                  if (activeTab === 'pending') return po.status === 'PENDING';
                  if (activeTab === 'completed') return po.status === 'COMPLETED';
                  return true;
                })
                .map(po => (
                  <div key={po.id} className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-8 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                      {/* Info Section */}
                      <div className="flex items-start gap-6 min-w-[300px]">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${po.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-white text-slate-400 group-hover:bg-blue-600 group-hover:text-white shadow-slate-100'}`}>
                          <Package className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-xl font-black text-slate-900">{po.product_name}</h4>
                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase shadow-sm ${getPriorityColor(po.priority)}`}>
                              {po.priority === 'URGENT' ? 'Shoshilinch' : po.priority === 'HIGH' ? 'Yuqori' : po.priority === 'MEDIUM' ? 'O\'rtacha' : 'Past'}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Target className="w-3 h-3 text-blue-500" />
                              Naryad: {po.order_number}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <UserIcon className="w-3 h-3 text-amber-500" />
                              Mas'ul: {po.responsible_name || 'Tayinlanmagan'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="flex-1 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Ish jarayoni</span>
                          <span className="text-blue-600">{Math.round(po.progress)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-6 relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${po.progress}%` }}
                            className={`h-full absolute left-0 top-0 transition-all duration-1000 ${po.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          />
                        </div>

                        {/* Stages Pipeline */}
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {po.stages.map((stage) => (
                            <div 
                              key={stage.id} 
                              className={`
                                relative flex flex-col items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer group/stage
                                ${stage.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 opacity-60' : 
                                  stage.status === 'ACTIVE' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-slate-100'}
                              `}
                              onClick={() => {
                                if (isMaster) {
                                  setSelectedOrder(po);
                                  setSelectedStage(stage);
                                  setIsAssignModalOpen(true);
                                }
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${stage.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : stage.status === 'ACTIVE' ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                <Settings className={`w-4 h-4 ${stage.status === 'ACTIVE' ? 'animate-spin-slow' : ''}`} />
                              </div>
                              <span className="text-[8px] font-black uppercase text-center leading-tight">{stage.stage_type}</span>
                              
                              {/* Stage Responsible Icon */}
                              {stage.responsible && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                  <UserIcon className="w-2.5 h-2.5" />
                                </div>
                              )}
                              
                              {/* Tooltip for assignment */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover/stage:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10">
                                {stage.responsible_name ? `Mas'ul: ${stage.responsible_name}` : (isMaster ? "Mas'ul biriktirish" : "Tayinlanmagan")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="flex flex-col md:flex-row lg:flex-col items-center gap-4">
                        <div className="text-center md:text-left px-6 py-2 border-l border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Muddat</div>
                          <div className="text-xs font-black text-slate-700 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-rose-500" />
                            {po.deadline ? new Date(po.deadline).toLocaleDateString(locale) : 'Belgilanmagan'}
                          </div>
                        </div>

                        {po.stages.find(s => s.status === 'ACTIVE') && (
                          <button 
                            onClick={() => handleAdvanceStage(po, po.stages.find(s => s.status === 'ACTIVE')!.id)}
                            className="w-full lg:w-48 group/btn relative px-6 py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                          >
                            <span className="flex items-center justify-center gap-2">
                              Keyingi Bosqich
                              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-all" />
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Naryad Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsManualModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Factory className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Yangi Ishlab Chiqarish Naryadi</h3>
                    <p className="text-xs text-slate-500 font-medium">Barcha xom ashyo va bosqichlar avtomatik rejalashtiriladi</p>
                  </div>
                </div>
                <button onClick={() => setIsManualModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mahsulot nomi</label>
                   <select 
                     required
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                     value={manualTask.product}
                     onChange={e => setManualTask({...manualTask, product: e.target.value})}
                   >
                     <option value="">Tanlang...</option>
                     {products.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Miqdor</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                      value={manualTask.quantity}
                      onChange={e => setManualTask({...manualTask, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Muddat (Deadline)</label>
                    <input 
                      type="date"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                      value={manualTask.deadline}
                      onChange={e => setManualTask({...manualTask, deadline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Muhimlik Darajasi</label>
                   <div className="flex gap-2">
                      {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setManualTask({...manualTask, priority: p})}
                          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            manualTask.priority === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p === 'URGENT' ? 'Shoshilinch' : p === 'HIGH' ? 'Yuqori' : p === 'MEDIUM' ? 'O\'rtacha' : 'Past'}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsManualModalOpen(false)} className="flex-1 px-8 py-4 border border-slate-200 text-slate-600 rounded-[22px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50">Bekor qilish</button>
                  <button type="submit" disabled={loading} className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-[22px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 disabled:opacity-50">Naryadni ochish</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Operator Assignment Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedStage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Mas'ul Biriktirish</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedStage.stage_type_display} bosqichi uchun</p>
                  </div>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-8 max-h-[400px] overflow-y-auto space-y-3">
                {operators.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sklad yoki ishlab chiqarish operatorlari topilmadi</div>
                ) : (
                  operators.map(op => (
                    <button
                      key={op.id}
                      onClick={() => handleAssignOperator(op.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                          <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-black text-slate-900">{op.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{op.role}</div>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all" />
                    </button>
                  ))
                )}
              </div>
              <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                <button onClick={() => setIsAssignModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all">Yopish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
