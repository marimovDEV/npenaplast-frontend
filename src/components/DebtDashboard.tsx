import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, CreditCard, Clock, AlertTriangle, 
  Search, ArrowUpRight, TrendingDown,
  PhoneCall, ShieldAlert, History
} from 'lucide-react';
import api from '../lib/api';

interface Debtor {
  id: number;
  name: string;
  company: string;
  phone: string;
  debt: number;
  days_overdue: number;
  aging: string;
}

interface Stats {
  total_debt: number;
  debtors_count: number;
  avg_debt: number;
  top_debtor: Debtor | null;
  aging_summary: Record<string, number>;
}

export default function DebtDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('sales/debtors/');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  if (loading || !stats) return <div className="p-12 text-center text-slate-500 font-bold">Qarzdorlik ma'lumotlari yuklanmoqda...</div>;

  const filteredDebtors = (stats.debtors || []).filter((d: Debtor) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">Qarzdorlik Boshqaruvi</h1>
           <p className="text-sm font-bold text-slate-400">Aging Report & Koleksiya Analitikasi</p>
        </div>
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Mijoz bo'yicha qidiruv..."
            className="pl-11 pr-5 py-3 bg-white border border-slate-100 rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-100 relative overflow-hidden">
            <TrendingDown className="w-20 h-20 text-white/10 absolute -right-4 -bottom-4" />
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest\">Umumiy Debitorlik</p>
            <p className="text-2xl font-black mt-2">{fmt(stats.total_debt)} <span className="text-xs\">uzs</span></p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg backdrop-blur-md">
               <Users className="w-3.5 h-3.5" />
               <span className="text-[10px] font-black uppercase text-white/90">{stats.debtors_count} faol qarzdor</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O'rtacha Qarz</p>
            <p className="text-2xl font-black text-slate-800 mt-2">{fmt(stats.avg_debt)} <span className="text-xs\">uzs</span></p>
            <div className="mt-4 flex items-center gap-2 text-rose-500">
               <ShieldAlert className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-tight tracking-widest\">Yuqori Risk guruhi</span>
            </div>
         </div>

         {/* Aging Summary Card */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4\">Debt Aging (Muddati bo'yicha)</p>
            <div className="flex items-end gap-2 h-20">
               {Object.entries(stats.aging_summary).map(([label, value]) => {
                 const pct = (value / stats.total_debt) * 100;
                 return (
                   <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full relative rounded-lg overflow-hidden flex flex-col justify-end bg-slate-50 mt-auto" style={{ height: '60px' }}>
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${pct || 5}%` }}
                           className={`w-full ${label === '90+' ? 'bg-rose-500' : 'bg-indigo-500'} opacity-80`}
                         />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{label}d</span>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

      {/* Debtors List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2\">
               <History className="w-4 h-4 text-slate-400" /> Qarzdorlar Ro'yxati
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <th className="px-6 py-4\">Mijoz</th>
                     <th className="px-6 py-4 text-right\">Qarz Miqdori</th>
                     <th className="px-6 py-4\">Muddat</th>
                     <th className="px-6 py-4\">Risk Guruhi</th>
                     <th className="px-6 py-4\">Amallar</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredDebtors.map((debtor) => (
                    <tr key={debtor.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-5">
                          <div>
                             <p className="text-sm font-black text-slate-800">{debtor.company || debtor.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5\">
                                <PhoneCall className="w-3 h-3" /> {debtor.phone}
                             </p>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <p className={`text-sm font-black ${debtor.days_overdue > 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                             {fmt(debtor.debt)} <span className="text-[10px] font-bold opacity-40">uzs</span>
                          </p>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2\">
                             <Clock className={`w-3.5 h-3.5 ${debtor.days_overdue > 30 ? 'text-rose-400' : 'text-slate-300'}`} />
                             <span className="text-xs font-bold text-slate-600 font-mono\">{debtor.days_overdue} kun</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                            debtor.aging === '90+' ? 'bg-rose-100 text-rose-700' : 
                            debtor.aging === '60-90' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {debtor.aging} kun
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <button className="p-2 hover:bg-slate-100 rounded-xl transition-all group-hover:text-indigo-600 text-slate-400">
                             <ArrowUpRight className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
