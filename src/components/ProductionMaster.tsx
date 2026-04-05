import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Users, 
  Layers, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  MoreVertical,
  Plus,
  ArrowRight,
  Filter,
  Search,
  LayoutDashboard,
  ClipboardList,
  Activity,
  UserPlus,
  XCircle
} from 'lucide-react';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { ProductionOrder, ProductionPlan, User, ProductionOrderStage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductionMaster({ user }: { user: User }) {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [activeOrders, setActiveOrders] = useState<ProductionOrder[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PLANNING' | 'ASSIGNMENT'>('OVERVIEW');
  const [kpi, setKpi] = useState<any>(null);

  // Assignment states
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, ordersRes, usersRes, kpiRes] = await Promise.all([
        api.get('production/plans/'),
        api.get('production/orders/'),
        api.get('users/'),
        api.get('production/orders/kpi_summary/')
      ]);
      setPlans(plansRes.data);
      setActiveOrders(ordersRes.data.filter((o: any) => o.status !== 'COMPLETED'));
      setOperators(usersRes.data.filter((u: any) => {
        const roleName = u.effective_role || u.role_display || u.role;
        return ['Ishlab chiqarish ustasi', 'CNC operatori', 'Pardozlovchi'].includes(roleName);
      }));
      setKpi(kpiRes.data);
    } catch (err) {
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignTask = async (operatorId: number) => {
    if (!selectedStage) return;
    try {
      await api.post(`production/orders/${selectedStage.orderId}/assign-task/`, {
        stage_id: selectedStage.id,
        operator_id: operatorId
      });
      uiStore.showNotification("Topshiriq biriktirildi", "success");
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  const getStageColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-500';
      case 'ACTIVE': return 'bg-blue-500 animate-pulse';
      case 'PAUSED': return 'bg-amber-500';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl shadow-slate-200">
            <Layers className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ishlab Chiqarish Ustasi</h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Boshqaruv va Rejalashtirish Markazi
            </p>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1.5 rounded-[24px] border border-slate-200">
           {[
             { id: 'OVERVIEW', label: 'Monitor', icon: LayoutDashboard },
             { id: 'PLANNING', label: 'Rejalar', icon: ClipboardList },
             { id: 'ASSIGNMENT', label: 'Topshiriqlar', icon: Users },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-3 px-6 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
        </nav>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Zap className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-emerald-500">+12% o'tgan haftaga nisbatan</span>
             </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jarayondagi Buyurtmalar</p>
            <h3 className="text-3xl font-black text-slate-900">{activeOrders.length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600"><AlertTriangle className="w-6 h-6" /></div>
               <span className="text-[10px] font-black text-rose-500">Nazorat kutilmoqda</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Brak Ko'rsatkichi</p>
            <h3 className="text-3xl font-black text-slate-900">{kpi?.waste_metrics?.avg_waste_pct?.toFixed(1) || '0.0'}%</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-emerald-500">Bugun</span>
             </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tayyor Mahsulot</p>
            <h3 className="text-3xl font-black text-slate-900">{kpi?.waste_metrics?.total_produced || 0} m³</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">O'rtacha Vaqt (Stage)</p>
            <h3 className="text-3xl font-black text-slate-900">42m</h3>
         </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-8">Flor Xaritasi (Real-time Flow)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                   {['ZAMES', 'DRYING', 'BUNKER', 'FORMOVKA', 'BLOK', 'CNC', 'DEKOR'].map((stage) => (
                      <div key={stage} className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/10">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">{
                           stage === 'ZAMES' ? 'ZAMES' :
                           stage === 'DRYING' ? 'QURITISH' :
                           stage === 'BUNKER' ? 'BUNKER' :
                           stage === 'FORMOVKA' ? 'FORMOVKA' :
                           stage === 'BLOK' ? 'BLOK' :
                           stage === 'CNC' ? 'CNC' : 'DEKOR'
                         }</p>
                         <div className="space-y-3">
                           {activeOrders.flatMap(o => o.stages?.filter(s => s.stage_type === stage && s.status === 'ACTIVE') || []).map((s, idx) => (
                             <div key={idx} className="bg-white/10 p-3 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/20 transition-all border border-white/5">
                               <span className="text-[10px] font-bold text-white/80">#{activeOrders.find(o => o.stages?.find(x => x.id === s.id))?.order_number.split('-')[1]}</span>
                               <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                             </div>
                           ))}
                           {activeOrders.filter(o => o.stages?.some(s => s.stage_type === stage && s.status === 'ACTIVE')).length === 0 && (
                             <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                                <Clock className="w-4 h-4 text-white/10 mb-2" />
                                <span className="text-[8px] font-black text-white/20 uppercase">Bo'sh</span>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[44px] border border-slate-100 p-10 shadow-sm">
                 <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <Zap className="w-6 h-6 text-amber-500" />
                    Shoshilinch Buyurtmalar
                 </h4>
                 <div className="space-y-4">
                    {activeOrders.filter(o => o.priority === 'URGENT').map((order) => (
                      <div key={order.id} className="flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
                         <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">SHOSHILINCH BUYURTMA</p>
                            <h5 className="font-black text-slate-800">{order.product_name}</h5>
                            <p className="text-xs font-bold text-slate-400">{order.quantity} dona</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Progress</p>
                            <div className="flex items-center gap-4">
                               <div className="w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${order.progress}%` }} />
                               </div>
                               <span className="text-sm font-black text-slate-900">{order.progress.toFixed(0)}%</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-[44px] border border-slate-100 p-10 shadow-sm">
                 <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <Users className="w-6 h-6 text-blue-500" />
                    Operatorlar Holati
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    {operators.map((op) => (
                      <div key={op.id} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <UserIcon className="w-6 h-6 text-slate-400" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800">{op.username}</p>
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{op.role_display}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'ASSIGNMENT' && (
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50/50">
                 <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyurtma</th>
                 <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bosqich</th>
                 <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Holati</th>
                 <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mas'ul</th>
                 <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amal</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {activeOrders.map((order) => (
                 order.stages?.map((stage) => (
                   <tr key={stage.id} className="hover:bg-slate-50/30 transition-all group">
                     <td className="px-10 py-8">
                        <p className="font-black text-slate-900">{order.order_number}</p>
                        <p className="text-[10px] font-bold text-slate-400">{order.product_name}</p>
                     </td>
                     <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 ${getStageColor(stage.status)} rounded-lg flex items-center justify-center text-white`}>
                              {stage.sequence + 1}
                           </div>
                           <span className="font-black text-slate-700 text-sm uppercase tracking-widest">{stage.stage_type_display}</span>
                        </div>
                     </td>
                     <td className="px-10 py-8">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          stage.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          stage.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {stage.status_display}
                        </span>
                     </td>
                     <td className="px-10 py-8">
                        {stage.current_operator_name ? (
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><UserPlus className="w-4 h-4" /></div>
                             <span className="font-bold text-slate-700">{stage.current_operator_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Biriktirilmagan</span>
                        )}
                     </td>
                     <td className="px-10 py-8 text-right">
                        {stage.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => { setSelectedStage({ ...stage, orderId: order.id }); setIsAssignModalOpen(true); }}
                            className="p-4 bg-slate-900 text-white rounded-[20px] shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center gap-3 ml-auto opacity-0 group-hover:opacity-100"
                          >
                             <UserPlus className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Biriktirish</span>
                          </button>
                        )}
                     </td>
                   </tr>
                 ))
               ))}
             </tbody>
           </table>
        </div>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl"
             >
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">Operator Biriktirish</h3>
                      <p className="text-slate-400 font-medium">Stage: {selectedStage?.stage_type_display}</p>
                   </div>
                   <button onClick={() => setIsAssignModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                
                <div className="p-10 grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto">
                   {operators.map((op) => (
                     <button
                        key={op.id}
                        onClick={() => handleAssignTask(op.id as number)}
                        className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:bg-blue-600 hover:text-white group transition-all"
                     >
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-transparent text-slate-400 group-hover:text-blue-600 shadow-sm transition-all">
                              <UserIcon className="w-7 h-7" />
                           </div>
                           <div className="text-left">
                              <p className="font-black group-hover:text-white transition-all">{op.username}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/60 transition-all">{op.role_display}</p>
                           </div>
                        </div>
                        <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
                     </button>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const UserIcon = ({ className }: { className?: string }) => <Users className={className} />;
const X = ({ className }: { className?: string }) => <XCircle className={className} />;
