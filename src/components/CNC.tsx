import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Scissors, 
  Package, 
  ArrowRight, 
  Search, 
  FileText, 
  User as UserIcon, 
  Play, 
  Box,
  Cpu,
  Trash2,
  Clock,
  CheckCircle2,
  Pause,
  AlertCircle,
  QrCode,
  Layers,
  Activity
} from 'lucide-react';
import api from '../lib/api';
import { User, Material } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface CNCJob {
  id: number;
  job_number: string;
  input_block: number;
  input_block_number: string;
  output_product: number;
  output_product_name: string;
  quantity_planned: number;
  quantity_finished: number;
  machine_id: string;
  status: string;
  operator_name: string;
  priority: number;
  start_time: string;
  last_started_at: string;
  total_duration_seconds: number;
  end_time: string;
  created_at: string;
  waste_m3: number;
}

export default function CNC({ user }: { user: User }) {
  const [jobs, setJobs] = useState<CNCJob[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [products, setProducts] = useState<Material[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CNCJob | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newJob, setNewJob] = useState({
    input_block: '',
    output_product: '',
    quantity_planned: 1,
    machine_id: 'CNC-1',
    priority: 1
  });

  const [finishData, setFinishData] = useState({
    finished_qty: 0,
    waste_m3: 0.05
  });

  const [activeTimer, setActiveTimer] = useState<number>(0);

  const activeJob = jobs.find(j => j.status === 'RUNNING');
  const queuedJobs = jobs.filter(j => j.status === 'CREATED' || j.status === 'PAUSED' || j.status === 'Yaratildi' || j.status === 'To‘xtatilgan');
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'Tugallangan');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, blocksRes, prodRes] = await Promise.all([
        api.get('cnc/jobs/'),
        api.get('production/blocks/?status=READY'),
        api.get('materials/') // Filter for finished products if needed
      ]);
      setJobs(jobsRes.data);
      setBlocks(blocksRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("CNC fetch error", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (activeJob) {
      interval = setInterval(() => {
        const lastStart = new Date(activeJob.last_started_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - lastStart) / 1000);
        setActiveTimer((activeJob.total_duration_seconds || 0) + elapsed);
      }, 1000);
    } else {
      setActiveTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeJob]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateJob = async () => {
    if (!newJob.input_block || !newJob.output_product || newJob.quantity_planned <= 0) {
      uiStore.showNotification("Barcha maydonlarni to'ldiring", "error");
      return;
    }
    try {
      await api.post('cnc/jobs/', newJob);
      uiStore.showNotification("Yangi ish yaratildi", "success");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik yuz berdi", "error");
    }
  };

  const handleAction = async (id: number, action: 'start' | 'pause' | 'finish') => {
    try {
      if (action === 'finish') {
        const job = jobs.find(j => j.id === id);
        if (job) {
          setSelectedJob(job);
          setFinishData({ finished_qty: job.quantity_planned, waste_m3: 0.05 });
          setIsFinishModalOpen(true);
        }
        return;
      }
      await api.post(`cnc/jobs/${id}/${action}/`);
      uiStore.showNotification(`Amal muvaffaqiyatli: ${action}`, "success");
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik", "error");
    }
  };

  const handleFinishConfirm = async () => {
    if (!selectedJob) return;
    try {
      await api.post(`cnc/jobs/${selectedJob.id}/finish/`, finishData);
      uiStore.showNotification("Ish yakunlandi va Sklad 3 ga o'tkazildi", "success");
      setIsFinishModalOpen(false);
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'Yaratildi':
        return <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">Kutilmoqda</span>;
      case 'RUNNING':
      case 'Jarayonda':
        return <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 animate-pulse flex items-center gap-1.5"><Play className="w-3 h-3" /> Ishlamoqda</span>;
      case 'PAUSED':
      case 'To‘xtatilgan':
        return <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5"><Pause className="w-3 h-3" /> To'xtatilgan</span>;
      case 'COMPLETED':
      case 'Tugallangan':
        return <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Tugatildi</span>;
      default:
        return <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Scissors className="text-white w-7 h-7" />
            </div>
            CNC Operatori Ish Joyi
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Vazifalarni boshqarish va natijalarni qayd etish paneli</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-[24px] font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Vazifa</span>
          </button>
        </div>
      </div>

      {/* Active Job Section */}
      <AnimatePresence mode="wait">
        {activeJob ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute -top-1/2 -right-1/4 w-full h-full border-[60px] border-blue-500 rounded-full"
                />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">Hozirgi Ish</span>
                   <span className="text-slate-500 font-bold text-xs">Vazifa №: {activeJob.job_number}</span>
                </div>
                <div>
                   <h2 className="text-4xl font-black tracking-tight mb-2">{activeJob.output_product_name}</h2>
                   <div className="flex items-center gap-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-400" />
                        <span className="font-bold">{activeJob.input_block_number}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-30" />
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold">{activeJob.quantity_planned} dona</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                   <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                      <Cpu className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase">Uskuna ID</p>
                      <p className="text-sm font-bold">{activeJob.machine_id}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                 <Clock className="w-8 h-8 text-blue-400 mb-4 animate-pulse" />
                 <div className="text-6xl font-black tracking-tighter tabular-nums mb-2">
                    {formatDuration(activeTimer)}
                 </div>
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Ish vaqti</p>
              </div>

              <div className="flex flex-col justify-center gap-4">
                 <button 
                   onClick={() => handleAction(activeJob.id, 'pause')}
                   className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-900/20"
                 >
                    <Pause className="w-5 h-5" /> To'xtatish
                 </button>
                 <button 
                   onClick={() => handleAction(activeJob.id, 'finish')}
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40 transform active:scale-95"
                 >
                    <CheckCircle2 className="w-6 h-6" /> Yakunlash
                 </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white border-4 border-dashed border-slate-100 rounded-[40px] p-20 text-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                <Play className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">Faol vazifa yo'q</h3>
             <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">Vazifani boshlash uchun quyidagi navbatdan birini tanlang yoki yangisini yarating</p>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Queue Section */}
         <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Navbatdagi Ishlar</h3>
                  <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-widest mt-1">Kutilayotgan vazifalar</p>
               </div>
               <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black">{queuedJobs.length} ta vazifa</span>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
               {queuedJobs.map(job => (
                 <div key={job.id} className="p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-100 rounded-[32px] transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${job.status === 'PAUSED' || job.status === 'To‘xtatilgan' ? 'bg-amber-100/50 text-amber-600' : 'bg-white text-blue-500'}`}>
                          {job.status === 'PAUSED' || job.status === 'To‘xtatilgan' ? <Pause className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-lg leading-tight">{job.output_product_name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Box className="w-3 h-3" /> {job.input_block_number}
                             </p>
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                {job.machine_id}
                             </p>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="text-right mr-4 hidden md:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reja</p>
                          <p className="font-black text-slate-900">{job.quantity_planned} dona</p>
                       </div>
                       <button 
                         onClick={() => handleAction(job.id, 'start')}
                         className="p-4 bg-white border border-slate-200 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-90"
                         title="Vazifani boshlash"
                       >
                          <Play className="w-5 h-5 fill-current" />
                       </button>
                    </div>
                 </div>
               ))}
               {queuedJobs.length === 0 && (
                 <div className="py-20 text-center opacity-40">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Hozircha navbat bo'sh</p>
                 </div>
               )}
            </div>
         </div>

         {/* History Section */}
         <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Yakunlangan Ishlar</h3>
                  <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-widest mt-1">Bugungi natijalar</p>
               </div>
               <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black">{completedJobs.length} ta tugatildi</span>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
               {completedJobs.slice(0, 10).map(job => (
                 <div key={job.id} className="p-5 bg-white border border-slate-50 rounded-[32px] flex items-center justify-between opacity-80 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{job.output_product_name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{job.job_number}</p>
                       </div>
                    </div>
                    <div className="flex gap-6 items-center">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Miqdor</p>
                          <p className="font-black text-emerald-600">{job.quantity_finished} dona</p>
                       </div>
                       <div className="text-right mr-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Chiqindi</p>
                          <p className="font-black text-rose-500">{job.waste_m3} m³</p>
                       </div>
                    </div>
                 </div>
               ))}
               {completedJobs.length === 0 && (
                 <div className="py-20 text-center opacity-40">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Bugun hali vazifa yakunlanmadi</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* New Job Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden">
               <div className="p-10">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Yangi CNC Vazifa</h2>
                      <p className="text-slate-400 text-sm font-medium mt-1">Bloklar omboridan xomashyo olib vazifa yaratish</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all rotate-button">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Box className="w-3 h-3 text-blue-500" /> Xomashyo Blok</label>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {blocks.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setNewJob({ ...newJob, input_block: b.id })}
                            className={`w-full p-4 rounded-3xl border-2 transition-all text-left flex items-center gap-4 ${newJob.input_block === b.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-100'}`}
                          >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm font-black text-xs text-slate-400">#{b.id}</div>
                            <div className="flex-1">
                              <p className="font-black text-slate-900 leading-none mb-1 text-sm">{b.form_number}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{b.block_count} dona | {b.density} kg/m³</p>
                            </div>
                          </button>
                        ))}
                        {blocks.length === 0 && <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-3xl">Bo'sh bloklar mavjud emas</div>}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Cpu className="w-3 h-3 text-blue-500" /> Uskunani Tanlang</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['CNC-1', 'CNC-2'].map(m => (
                             <button
                               key={m}
                               onClick={() => setNewJob({ ...newJob, machine_id: m })}
                               className={`py-3 rounded-2xl font-black text-xs border-2 transition-all ${newJob.machine_id === m ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                             >
                               {m}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Package className="w-3 h-3 text-emerald-500" /> Chiquvchi Mahsulot</label>
                        <select 
                          value={newJob.output_product}
                          onChange={(e) => setNewJob({ ...newJob, output_product: e.target.value })}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm appearance-none transition-all"
                        >
                           <option value="">Tanlang...</option>
                           {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers className="w-3 h-3 text-emerald-500" /> Miqdori (Dona)</label>
                        <input 
                          type="number"
                          value={newJob.quantity_planned}
                          onChange={(e) => setNewJob({ ...newJob, quantity_planned: parseInt(e.target.value) })}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-500 font-black text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateJob}
                    className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Vazifani Tasdiqlash
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finish Confirmation Modal */}
      <AnimatePresence>
        {isFinishModalOpen && selectedJob && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFinishModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10">
                <div className="text-center space-y-4 mb-8">
                   <div className="w-20 h-20 bg-emerald-50 rounded-[30px] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ishni Yakunlash</h3>
                   <p className="text-slate-400 text-sm font-medium">Sarflangan vaqt: <span className="text-slate-900 font-bold">{formatDuration(activeTimer)}</span>. Yakuniy natijalarni kiriting.</p>
                </div>

                <div className="space-y-6 mb-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tayyor mahsulot (dona)</label>
                      <input 
                        type="number" 
                        value={finishData.finished_qty} 
                        onChange={(e) => setFinishData({ ...finishData, finished_qty: parseInt(e.target.value) })}
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-black text-xl focus:border-emerald-500 transition-all text-center"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chiqindi (m³)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={finishData.waste_m3} 
                        onChange={(e) => setFinishData({ ...finishData, waste_m3: parseFloat(e.target.value) })}
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-black text-xl focus:border-rose-500 transition-all text-center"
                      />
                   </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setIsFinishModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Bekor qilish</button>
                   <button onClick={handleFinishConfirm} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-200 transition-all active:scale-95">Tasdiqlash</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
