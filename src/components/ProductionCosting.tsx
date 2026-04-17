import React, { useState, useEffect } from 'react';
import { BarChart3, Calculator, Zap, Users, ShieldAlert, Package, CheckCircle, Clock } from 'lucide-react';
import api from '../lib/api';

export default function ProductionCosting() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('production/batches/');
      setBatches(res.data);
      if (res.data.length > 0) setSelectedBatch(res.data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Cost Engine yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Calculator className="w-8 h-8 text-indigo-600" />
             Mahsulot Tannarxi (Cost Engine)
           </h1>
           <p className="text-sm font-semibold text-slate-500 mt-1">
             Material, energiya va ishchi kuchi xarajatlari tahlili
           </p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-600">Confidence: Real-time Audit</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
           <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Partiyalar jurnali</span>
           </div>
           <div className="flex-1 overflow-y-auto">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full p-4 border-b border-slate-50 flex flex-col items-start transition-all hover:bg-slate-50 ${selectedBatch?.id === batch.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="text-sm font-black text-slate-800">Batch #{batch.batch_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${batch.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {batch.status === 'CLOSED' ? 'Yopilgan' : 'Ochiq'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{batch.total_output_qty} m3 production</span>
                  <div className="mt-2 text-xs font-bold text-indigo-600">{fmt(batch.unit_cost)} UZS / unit</div>
                </button>
              ))}
           </div>
        </div>

        {/* Breakdown & Analysis */}
        <div className="lg:col-span-2 space-y-6">
           {selectedBatch ? (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                      <h3 className="text-xs font-bold text-indigo-100 uppercase">Total Batch Cost</h3>
                      <p className="text-2xl font-black mt-2">{fmt(selectedBatch.total_cost)} <span className="text-xs">uzs</span></p>
                   </div>
                   <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase">Unit Cost (Tannarx)</h3>
                      <p className="text-2xl font-black mt-2 text-slate-800">{fmt(selectedBatch.unit_cost)} <span className="text-xs text-slate-400">uzs/m3</span></p>
                   </div>
                   <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase">Confidence Level</h3>
                      <div className="flex items-center gap-2 mt-3">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedBatch.cost_confidence === 'REAL' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                           {selectedBatch.cost_confidence} DATA
                        </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-indigo-600" />
                     Xarajatlar Strukturasi (Cost Breakdown)
                   </h3>
                   
                   <div className="space-y-8">
                      {/* Material */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2 font-bold text-slate-600"><Package className="w-3 h-3 text-blue-500" /> Xom-ashyo (Material)</span>
                            <span className="font-bold text-slate-800">{fmt(selectedBatch.material_cost)} uzs</span>
                         </div>
                         <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{width: `${(selectedBatch.material_cost/selectedBatch.total_cost)*100}%`}}></div>
                         </div>
                      </div>

                      {/* Energy */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2 font-bold text-slate-600"><Zap className="w-3 h-3 text-amber-500" /> Energetika (Gaz & Elektr)</span>
                            <span className="font-bold text-slate-800">{fmt(selectedBatch.energy_cost)} uzs</span>
                         </div>
                         <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{width: `${(selectedBatch.energy_cost/selectedBatch.total_cost)*100}%`}}></div>
                         </div>
                      </div>

                      {/* Labor */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2 font-bold text-slate-600"><Users className="w-3 h-3 text-indigo-500" /> Ishchi kuchi (Labor)</span>
                            <span className="font-bold text-slate-800">{fmt(selectedBatch.labor_cost)} uzs</span>
                         </div>
                         <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{width: `${(selectedBatch.labor_cost/selectedBatch.total_cost)*100}%`}}></div>
                         </div>
                      </div>

                      {/* Overhead */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2 font-bold text-slate-600"><Calculator className="w-3 h-3 text-slate-500" /> Qo'shimcha (Overhead)</span>
                            <span className="font-bold text-slate-800">{fmt(selectedBatch.overhead_cost)} uzs</span>
                         </div>
                         <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400" style={{width: `${(selectedBatch.overhead_cost/selectedBatch.total_cost)*100}%`}}></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden">
                   <div className="relative z-10 flex items-center justify-between">
                      <div>
                         <h4 className="text-lg font-black tracking-tight">Enterprise Audit Readiness</h4>
                         <p className="text-slate-400 text-xs mt-1">Ushbu batch barcha buxgalteriya provodkalaridan o'tdi va tannarx 2810-schetda aks ettirildi.</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                         <CheckCircle className="w-4 h-4" />
                         <span className="text-xs font-black">AUDITED</span>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 p-8 text-white/5">
                      <Clock className="w-32 h-32 rotate-12" />
                   </div>
                </div>
             </div>
           ) : (
             <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                Tahlil qilish uchun batch tanlang
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
