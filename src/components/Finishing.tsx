import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Brush, Sun, CheckCircle2, Package, Box, 
  ArrowRight, Search, Trash2, RefreshCw, AlertTriangle,
  Play, Pause, Clock, User as UserIcon, Plus, QrCode, ClipboardList
} from 'lucide-react';
import api from '../lib/api';
import { User, FinishingJob, Material } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const STAGES = [
  { id: 'ARMIRLASH', label: 'Armirlash', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'SHPAKLYOVKA', label: 'Shpaklyovka', icon: Brush, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'DRYING', label: 'Quritish', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'READY', label: 'Tayyor', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function Finishing({ user }: { user: User }) {
  const [jobs, setJobs] = useState<FinishingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FinishingJob | null>(null);
  
  // Finish Form
  const [finishData, setFinishData] = useState({
    finished_qty: '',
    waste_qty: '0'
  });

  // New Job Form
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newJob, setNewJob] = useState({
    product: '',
    quantity: '',
    notes: ''
  });

  const [activeTimer, setActiveTimer] = useState<number>(0);

  const fetchData = async () => {
    try {
      const [jobsRes, matRes] = await Promise.all([
        api.get('finishing/jobs/'),
        api.get('materials/')
      ]);
      setJobs(jobsRes.data);
      setMaterials(matRes.data);
    } catch (err) {
      console.error("Finishing fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const activeJob = jobs.find(j => j.status === 'RUNNING');

  // Live timer effect
  useEffect(() => {
    let timer: any;
    if (activeJob && activeJob.last_started_at) {
      const baseSeconds = activeJob.total_duration_seconds || 0;
      const startTime = new Date(activeJob.last_started_at).getTime();
      
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setActiveTimer(baseSeconds + elapsed);
      }, 1000);
    } else {
      setActiveTimer(0);
    }
    return () => clearInterval(timer);
  }, [activeJob]);

  const handleAction = async (id: number, action: string, data?: any) => {
    try {
      await api.post(`finishing/jobs/${id}/${action}/`, data);
      uiStore.showNotification(`Muvaffaqiyatli: ${action}`, "success");
      fetchData();
      if (action === 'finish') setIsFinishModalOpen(false);
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  const handleFinishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    handleAction(selectedJob.id, 'finish', {
      finished_qty: Number(finishData.finished_qty),
      waste_qty: Number(finishData.waste_qty)
    });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredQueue = jobs.filter(j => 
    j.status !== 'COMPLETED' && 
    j.status !== 'RUNNING' &&
    (j.job_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
     j.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').slice(0, 10);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pardozlash Nazorati</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            REAL VAQTDA ISHLAB CHIQARISH MONITORINGI
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Qidiruv..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all w-full md:w-80 font-bold text-sm"
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
        {/* Left Column: Active Job & Queue */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Job Focus */}
          <AnimatePresence mode="wait">
            {activeJob ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative border-4 border-blue-500/20"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <RefreshCw className="w-64 h-64 animate-spin-slow rotate-12" />
                </div>

                <div className="p-10 md:p-16 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-blue-500 rounded-[32px] flex items-center justify-center shadow-lg shadow-blue-500/40">
                        <Brush className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                            FAOL VAZIFA
                          </span>
                          <span className="text-blue-500/50 font-black text-[10px] tracking-widest uppercase">
                            ID: {activeJob.job_number}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">{activeJob.product_name}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">SARFLANGAN VAQT</p>
                      <p className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter tabular-nums">
                        {formatDuration(activeTimer)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">MIQDOR</p>
                      <p className="text-2xl font-black text-white">{activeJob.quantity} <span className="text-xs opacity-40 uppercase">to'plam</span></p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">BOSQUICH</p>
                      <p className="text-sm font-black text-blue-400 uppercase tracking-widest">{activeJob.stage_display}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">OPERATOR</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {activeJob.operator_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase">{activeJob.operator_name}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/5">
                      <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-2">PROGRESS</p>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-black text-white">{activeJob.progress}%</p>
                        <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${activeJob.progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleAction(activeJob.id, 'pause')}
                      className="flex-1 min-w-[200px] py-6 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/5 flex items-center justify-center gap-3"
                    >
                      <Pause className="w-5 h-5 fill-white" />
                      VAQTINCHA TO'XTATISH
                    </button>
                    {activeJob.current_stage !== 'READY' && (
                       <button 
                        onClick={() => handleAction(activeJob.id, 'advance')}
                        className="flex-1 min-w-[200px] py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                      >
                        <ArrowRight className="w-5 h-5" />
                        KEYINGI BOSQICHGA O'TISH
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedJob(activeJob);
                        setIsFinishModalOpen(true);
                      }}
                      className="flex-1 min-w-[200px] py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      ISHNI YAKUNLASH
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border-4 border-dashed border-slate-100 rounded-[48px] p-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 opacity-50">
                   <Clock className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Hozirda faol vazifa yo'q</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pastdan yangi vazifa tanlang yoki yarating</p>
              </div>
            )}
          </AnimatePresence>

          {/* Queue Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Layers className="w-6 h-6 text-blue-500" />
                NAVBATDAGI ISHLAR
              </h3>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredQueue.length} TA ISH
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQueue.map((job) => (
                <div 
                  key={job.id}
                  className="bg-white rounded-[32px] p-8 border-2 border-slate-50 hover:border-blue-100 transition-all shadow-sm flex flex-col group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Box className="w-7 h-7 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-tight">{job.product_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">ID: {job.job_number}</p>
                      </div>
                    </div>
                    {job.status === 'PAUSED' && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                        TO'XTATILGAN
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">MIQDOR</p>
                        <p className="text-sm font-black text-slate-900">{job.quantity} <span className="text-[10px] opacity-40 uppercase">to'plam</span></p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">BOSQUICH</p>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">{job.stage_display}</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => handleAction(job.id, job.status === 'PAUSED' ? 'resume' : 'start')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group-hover:translate-y-[-2px] shadow-lg shadow-slate-100"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ISHNI {job.status === 'PAUSED' ? 'DAVOM ETTIRISH' : 'BOSHLASH'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[40px] p-8 border-2 border-slate-50 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500" />
              YAKUNLANGAN ISHLAR
            </h3>
            
            <div className="space-y-6">
              {completedJobs.map(job => (
                <div key={job.id} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[13px] font-black text-slate-900 truncate uppercase">{job.product_name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-black text-slate-400">{job.finished_quantity} ta</span>
                       <span className="text-[10px] font-bold text-slate-300">•</span>
                       <span className="text-[10px] font-black text-rose-400">{job.waste_quantity} brak</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-slate-900">{formatDuration(job.total_duration_seconds)}</p>
                    <p className="text-[9px] font-bold text-slate-400">{job.completed_at ? format(new Date(job.completed_at), 'HH:mm') : ''}</p>
                  </div>
                </div>
              ))}
              {completedJobs.length === 0 && (
                <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-[10px]">Bugun hali ish bitmadi</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-10 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Package className="w-32 h-32 rotate-12" />
            </div>
            <h3 className="text-base font-black tracking-widest uppercase mb-8 relative z-10">Kuningiz qanday?</h3>
            <div className="space-y-8 relative z-10">
              <div>
                 <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-1">Bitkazilgan ishlar</p>
                 <p className="text-4xl font-black">{completedJobs.length}</p>
              </div>
              <div>
                 <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-1">Umumiy miqdor</p>
                 <p className="text-4xl font-black">{completedJobs.reduce((acc, j) => acc + (j.finished_quantity || 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Result Modal */}
      <AnimatePresence>
        {isFinishModalOpen && selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl shadow-black/20"
            >
              <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Ishni yakunlash</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Natijalarni kiriting</p>
                </div>
                <button onClick={() => setIsFinishModalOpen(false)} className="bg-white p-4 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFinishSubmit} className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tayyor mahsulot (to'plam)*</label>
                    <div className="relative">
                       <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                       <input 
                         type="number" 
                         required
                         autoFocus
                         placeholder={`Plan: ${selectedJob.quantity}`}
                         value={finishData.finished_qty}
                         onChange={(e) => setFinishData({...finishData, finished_qty: e.target.value})}
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] py-6 pl-16 pr-8 outline-none focus:border-blue-500 transition-all font-black text-2xl text-slate-900" 
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Brak (nuqsonli) soni</label>
                    <div className="relative">
                       <AlertTriangle className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                       <input 
                         type="number" 
                         value={finishData.waste_qty}
                         onChange={(e) => setFinishData({...finishData, waste_qty: e.target.value})}
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] py-6 pl-16 pr-8 outline-none focus:border-rose-500 transition-all font-black text-2xl text-rose-600" 
                       />
                    </div>
                 </div>

                 <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[3px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                 >
                   TASDIQLASH VA TOPSHIRISH
                   <ArrowRight className="w-5 h-5" />
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Task Modal (Simplified for Operators) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-blue-50/20">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vazifa qo'shish</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-rose-600 shadow-sm transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await api.post('finishing/jobs/', {
                  product: Number(newJob.product),
                  quantity: Number(newJob.quantity),
                  notes: newJob.notes
                });
                setIsModalOpen(false);
                fetchData();
              }} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mahsulotni tanlang</label>
                  <select 
                    required
                    value={newJob.product}
                    onChange={(e) => setNewJob({...newJob, product: e.target.value})}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-blue-500 font-bold text-slate-900"
                  >
                    <option value="">Tanlang...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Miqdor</label>
                  <input 
                    type="number"
                    required
                    placeholder="0"
                    value={newJob.quantity}
                    onChange={(e) => setNewJob({...newJob, quantity: e.target.value})}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:border-blue-500 font-bold text-slate-900"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs hover:bg-slate-800 transition-all"
                >
                  TASDIQLASH
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
