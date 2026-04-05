import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, RefreshCw, AlertTriangle, CheckCircle2, 
  Play, Pause, Clock, Plus, Search, BarChart3,
  Weight, Recycle, ArrowRight, ClipboardList, Info
} from 'lucide-react';
import api from '../lib/api';
import { User, WasteTask, WasteCategory } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const DEPARTMENTS = [
  { id: 'CNC', name: 'CNC Sexi', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'FINISHING', name: 'Pardozlash', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'PRODUCTION', name: 'Ishlab chiqarish', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'WAREHOUSE', name: 'Ombor', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'OTHER', name: 'Boshqa', color: 'text-slate-600', bg: 'bg-slate-50' },
];

export default function Waste({ user }: { user: User }) {
  const [tasks, setTasks] = useState<WasteTask[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WasteTask | null>(null);
  
  // Finish Form
  const [finishData, setFinishData] = useState({
    recycled_weight_kg: '',
    loss_weight_kg: '0',
    notes: ''
  });

  // New Task Form
  const [newTask, setNewTask] = useState({
    source_department: 'CNC',
    category: '',
    weight_kg: '',
    batch_number: '',
  });

  const [activeTimer, setActiveTimer] = useState<number>(0);

  const fetchData = async () => {
    try {
      const [tasksRes, catRes, statsRes] = await Promise.all([
        api.get('waste/tasks/'),
        api.get('waste/categories/'),
        api.get('waste/tasks/stats/')
      ]);
      setTasks(tasksRes.data);
      setCategories(catRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Waste fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeTask = tasks.find(t => t.status === 'PROCESSING');

  // Live timer effect
  useEffect(() => {
    let timer: any;
    if (activeTask && activeTask.last_started_at) {
      const baseSeconds = activeTask.total_duration_seconds || 0;
      const startTime = new Date(activeTask.last_started_at).getTime();
      
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setActiveTimer(baseSeconds + elapsed);
      }, 1000);
    } else {
      setActiveTimer(0);
    }
    return () => clearInterval(timer);
  }, [activeTask]);

  const handleAction = async (id: number, action: string, data?: any) => {
    try {
      await api.post(`waste/tasks/${id}/${action}/`, data);
      uiStore.showNotification(`Muvaffaqiyatli: ${action}`, "success");
      fetchData();
      if (action === 'finish') setIsFinishModalOpen(false);
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  const handleFinishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    handleAction(selectedTask.id, 'finish', {
      recycled_weight_kg: Number(finishData.recycled_weight_kg),
      loss_weight_kg: Number(finishData.loss_weight_kg),
      notes: finishData.notes
    });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredQueue = tasks.filter(t => 
    t.status === 'PENDING' &&
    (t.task_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').slice(0, 10);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chiqindi Nazorati</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            CHIQINDILARNI BOSHQARISH VA QAYTA ISHLASH MARKAZI
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Qidiruv (ID yoki Batch)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 transition-all w-full md:w-80 font-bold text-sm"
              />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-slate-900 text-white p-4 rounded-3xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             <Plus className="w-6 h-6" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active & Queue */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Processing Focus */}
          <AnimatePresence mode="wait">
            {activeTask ? (
              <motion.div 
                key={activeTask.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative border-4 border-rose-500/20"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-rose-500">
                  <Recycle className="w-64 h-64 animate-spin-slow rotate-12" />
                </div>

                <div className="p-10 md:p-16 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-rose-500 rounded-[32px] flex items-center justify-center shadow-lg shadow-rose-500/40">
                        <Recycle className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                            QAYTA ISHLANMOQDA
                          </span>
                          <span className="text-rose-500/50 font-black text-[10px] tracking-widest uppercase">
                            ID: {activeTask.task_number}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">{activeTask.category_name}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">JARAYONDAGI VAQT</p>
                      <p className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter tabular-nums">
                        {formatDuration(activeTimer)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">Vazni</p>
                      <p className="text-2xl font-black text-white">{activeTask.weight_kg} <span className="text-xs opacity-40 uppercase">kg</span></p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">Bo'lim</p>
                      <p className="text-sm font-black text-rose-400 uppercase tracking-widest">{activeTask.dept_display}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">Batch / Partiya</p>
                      <p className="text-sm font-black text-slate-300 truncate">{activeTask.batch_number || 'Nomalum'}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">Operator</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {activeTask.operator_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase truncate">{activeTask.operator_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => {
                        setSelectedTask(activeTask);
                        setIsFinishModalOpen(true);
                      }}
                      className="flex-1 min-w-[300px] py-10 bg-rose-600 hover:bg-rose-500 text-white rounded-[40px] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl shadow-rose-900/40 flex items-center justify-center gap-4 group"
                    >
                      <CheckCircle2 className="w-8 h-8 group-hover:scale-125 transition-transform" />
                      QAYTA ISHLASHNI YAKUNLASH
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border-4 border-dashed border-slate-100 rounded-[48px] p-24 text-center">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 opacity-50">
                   <Recycle className="w-12 h-12 text-rose-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Hozirda jarayondagi chiqindi yo'q</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pastdan yangi vazifani boshlang yoki qabul qiling</p>
              </div>
            )}
          </AnimatePresence>

          {/* Queue Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-rose-500" />
                NAVBATDAGI CHIQUINDILAR
              </h3>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredQueue.length} TA KUTILMOQDA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQueue.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white rounded-[32px] p-8 border-2 border-slate-50 hover:border-rose-100 transition-all shadow-sm flex flex-col group relative overflow-hidden"
                >
                  {task.weight_kg > 5 && (
                    <div className="absolute top-4 right-4 text-rose-500 animate-bounce">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-7 h-7 text-slate-400 group-hover:text-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-tight">{task.category_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">ID: {task.task_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vazni</p>
                        <p className="text-sm font-black text-rose-600">{task.weight_kg} <span className="text-[10px] uppercase">kg</span></p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Manba</p>
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">{task.dept_display}</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => handleAction(task.id, 'start')}
                    disabled={!!activeTask}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center gap-2 group-hover:translate-y-[-2px] shadow-lg shadow-slate-100"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>QAYTA ISHLASHNI BOSHLASH</span>
                  </button>
                </div>
              ))}
              {filteredQueue.length === 0 && (
                 <div className="col-span-full py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Navbatda chiqindi yo'q</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[40px] p-8 border-2 border-slate-50 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              YAKUNLANGAN ISHLAR
            </h3>
            
            <div className="space-y-6">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[13px] font-black text-slate-900 truncate uppercase">{task.category_name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-black text-slate-400">{task.recycled_weight_kg} kg qayta ishlandi</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-rose-500">-{task.loss_weight_kg} kg</p>
                    <p className="text-[9px] font-bold text-slate-400">{task.finished_at ? format(new Date(task.finished_at), 'HH:mm') : ''}</p>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-[10px]">Hali ish yakunlanmadi</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-[40px] p-10 text-white shadow-xl shadow-rose-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BarChart3 className="w-32 h-32 rotate-12" />
            </div>
            <h3 className="text-base font-black tracking-widest uppercase mb-8 relative z-10">Bugungi Natija</h3>
            <div className="space-y-8 relative z-10">
              <div>
                 <p className="text-xs font-black text-rose-100 uppercase tracking-widest mb-1">Umumiy Chiqindi</p>
                 <p className="text-4xl font-black">{stats?.today_total || 0} kg</p>
              </div>
              <div>
                 <p className="text-xs font-black text-rose-100 uppercase tracking-widest mb-1">Kutilayotgan ishlar</p>
                 <p className="text-4xl font-black">{stats?.pending_tasks || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Result Modal */}
      <AnimatePresence>
        {isFinishModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl shadow-black/20"
            >
              <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Yakunlash</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedTask.task_number} natijalari</p>
                </div>
                <button onClick={() => setIsFinishModalOpen(false)} className="bg-white p-4 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFinishSubmit} className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Qayta ishlab olindi (kg)*</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          autoFocus
                          value={finishData.recycled_weight_kg}
                          onChange={(e) => setFinishData({...finishData, recycled_weight_kg: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] py-4 px-6 outline-none focus:border-emerald-500 transition-all font-black text-xl text-emerald-600" 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Yo'qotish / Loss (kg)*</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          value={finishData.loss_weight_kg}
                          onChange={(e) => setFinishData({...finishData, loss_weight_kg: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] py-4 px-6 outline-none focus:border-rose-500 transition-all font-black text-xl text-rose-500" 
                        />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Izohlar</label>
                    <textarea 
                      placeholder="Qayta ishlash jarayoni haqida..."
                      value={finishData.notes}
                      onChange={(e) => setFinishData({...finishData, notes: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] py-4 px-6 outline-none focus:border-slate-300 transition-all font-medium text-slate-700 resize-none" 
                      rows={3}
                    />
                 </div>

                 <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[3px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                 >
                   NATIJANI SAQLASH
                   <ArrowRight className="w-5 h-5" />
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-rose-50/20">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Chiqindi Qabul Qilish</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-rose-600 shadow-sm transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await api.post('waste/tasks/', {
                    source_department: newTask.source_department,
                    weight_kg: Number(newTask.weight_kg),
                    category: Number(newTask.category),
                    batch_number: newTask.batch_number
                });
                setIsModalOpen(false);
                fetchData();
              }} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Manba</label>
                        <select 
                            required
                            value={newTask.source_department}
                            onChange={(e) => setNewTask({...newTask, source_department: e.target.value})}
                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-rose-500 font-bold text-slate-900 text-sm"
                        >
                            {DEPARTMENTS.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tur</label>
                        <select 
                            required
                            value={newTask.category}
                            onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-rose-500 font-bold text-slate-900 text-sm"
                        >
                            <option value="">Tanlang...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vazni (kg)</label>
                        <input 
                            type="number"
                            required
                            step="0.01"
                            placeholder="0.00"
                            value={newTask.weight_kg}
                            onChange={(e) => setNewTask({...newTask, weight_kg: e.target.value})}
                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-rose-500 font-black text-slate-900 text-xl"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Batch / Partiya</label>
                        <input 
                            type="text"
                            placeholder="Ixtiyoriy"
                            value={newTask.batch_number}
                            onChange={(e) => setNewTask({...newTask, batch_number: e.target.value})}
                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-rose-500 font-bold text-slate-900"
                        />
                    </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs hover:bg-slate-800 transition-all"
                >
                  TASDIQLASH VA QABUL QILISH
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
