import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Calendar, Clock, 
  CheckCircle2, XCircle, AlertTriangle, User as UserIcon,
  MoreVertical, Filter, DollarSign, Building2, ChevronRight
} from 'lucide-react';
import { User, Client } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';

interface Contract {
  id: number;
  contract_number: string;
  customer: number;
  customer_name: string;
  title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  status_display: string;
  terms: string;
  days_remaining: number;
  created_by_name: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  DRAFT: { color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  ACTIVE: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  EXPIRED: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  CANCELLED: { color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
};

export default function Contracts({ user }: { user: User }) {
  const { locale } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    customer: '',
    title: 'Yetkazib berish shartnomasi',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    total_value: 0,
    terms: '',
    status: 'DRAFT'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, clientsRes] = await Promise.all([
        api.get('sales/contracts/'),
        api.get('clients/')
      ]);
      setContracts(contractsRes.data);
      setClients(clientsRes.data);
    } catch (err) {
      console.error("Failed to fetch contracts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!formData.customer || !formData.end_date) {
      uiStore.showNotification("Mijoz va tugash sanasini tanlang", "error");
      return;
    }
    try {
      await api.post('sales/contracts/', formData);
      uiStore.showNotification("Shartnoma yaratildi ✅", "success");
      setIsModalOpen(false);
      setFormData({ customer: '', title: 'Yetkazib berish shartnomasi', start_date: new Date().toISOString().split('T')[0], end_date: '', total_value: 0, terms: '', status: 'DRAFT' });
      fetchData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const filtered = contracts.filter(c => {
    const matchSearch = c.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'ACTIVE').length,
    expiring: contracts.filter(c => c.status === 'ACTIVE' && c.days_remaining <= 30).length,
    totalValue: contracts.reduce((s, c) => s + Number(c.total_value), 0),
  };

  const formatMoney = (val: number) => new Intl.NumberFormat(locale).format(val) + ' UZS';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami Shartnomalar', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Aktiv', value: stats.active, icon: CheckCircle2, color: 'emerald' },
          { label: '⚠️ Tugayapti (30 kun)', value: stats.expiring, icon: AlertTriangle, color: 'amber' },
          { label: 'Umumiy Qiymat', value: formatMoney(stats.totalValue), icon: DollarSign, color: 'violet' },
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 bg-${kpi.color}-50 rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Qidirish..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'DRAFT', 'EXPIRED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'Hammasi' : s === 'ACTIVE' ? 'Aktiv' : s === 'DRAFT' ? 'Qoralama' : 'Muddati o\'tgan'}
            </button>
          ))}
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> Yangi Shartnoma
          </button>
        </div>
      </div>

      {/* Contract Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((contract, i) => {
          const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.DRAFT;
          const StatusIcon = cfg.icon;
          return (
            <motion.div 
              key={contract.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-blue-600 font-mono">{contract.contract_number}</p>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{contract.title}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {contract.status_display}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{contract.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{contract.start_date} — {contract.end_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">{formatMoney(Number(contract.total_value))}</span>
                  </div>
                </div>

                {contract.status === 'ACTIVE' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Qolgan kun</span>
                      <span className={`font-bold ${contract.days_remaining <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {contract.days_remaining} kun
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${contract.days_remaining <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, contract.days_remaining / 3.65)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">Shartnomalar topilmadi</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900">📄 Yangi Shartnoma</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mijoz *</label>
                  <select value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Tanlang...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sarlavha</label>
                  <input type="text" value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Boshlanish</label>
                    <input type="date" value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tugash *</label>
                    <input type="date" value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qiymat (UZS)</label>
                  <input type="number" value={formData.total_value}
                    onChange={e => setFormData({...formData, total_value: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shartlar</label>
                  <textarea value={formData.terms} rows={3}
                    onChange={e => setFormData({...formData, terms: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none resize-none"
                    placeholder="Yetkazib berish, to'lov va kafolatlar haqida..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >Bekor qilish</button>
                <button onClick={handleCreate}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >Saqlash</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
