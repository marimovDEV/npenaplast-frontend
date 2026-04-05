import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  User as UserIcon,
  Tag,
  MessageSquare,
  X,
  CheckCircle2,
  Calendar,
  ArrowLeftRight,
  Building2,
  Paperclip,
  Users,
  LayoutDashboard,
  History,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, 
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
    Cashbox, ExpenseCategory, FinancialTransaction, 
    User, InternalTransfer, ClientBalance 
} from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';

interface FinanceProps {
  user: User;
}

export default function Finance({ user }: FinanceProps) {
  const currentRole = user.effective_role || user.role_display || user.role;
  const canManageTransfers = ['Bosh Admin', 'Admin'].includes(currentRole) || !!user.is_superuser;
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [balances, setBalances] = useState<ClientBalance[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'TRANSFERS' | 'DEBTS'>('DASHBOARD');
  const [isAdding, setIsAdding] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [formData, setFormData] = useState({
    cashbox: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    department: 'OTHER',
    category: '',
    customer: '',
    description: '',
  });

  const [transferData, setTransferData] = useState({
    from_cashbox: '',
    to_cashbox: '',
    amount: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      const [cbRes, transRes, catRes, transferRes, balanceRes, analyticsRes] = await Promise.all([
        api.get('finance/cashboxes/'),
        api.get('finance/transactions/'),
        api.get('finance/categories/'),
        canManageTransfers ? api.get('finance/transfers/') : Promise.resolve({ data: [] }),
        api.get('finance/client-balances/'),
        api.get('finance/analytics/')
      ]);
      setCashboxes(cbRes.data.results || cbRes.data);
      setTransactions(transRes.data.results || transRes.data);
      setCategories(catRes.data.results || catRes.data);
      setTransfers(transferRes.data.results || transferRes.data);
      setBalances(balanceRes.data.results || balanceRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Failed to fetch finance data", err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cashbox || !formData.amount) return;

    setLoading(true);
    try {
      await api.post('finance/transactions/', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      uiStore.showNotification("Tranzaksiya muvaffaqiyatli saqlandi", "success");
      setIsAdding(false);
      setFormData({ 
        cashbox: '', amount: '', type: 'EXPENSE', 
        department: 'OTHER', category: '', customer: '', 
        description: '' 
      });
      fetchData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.detail || "Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.from_cashbox || !transferData.to_cashbox || !transferData.amount) return;

    setLoading(true);
    try {
      await api.post('finance/transfers/', {
        ...transferData,
        amount: parseFloat(transferData.amount)
      });
      uiStore.showNotification("O'tkazma muvaffaqiyatli amalga oshirildi", "success");
      setIsTransferring(false);
      setTransferData({ from_cashbox: '', to_cashbox: '', amount: '', description: '' });
      fetchData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.detail || "Xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'PDF' | 'EXCEL') => {
    try {
      const response = await api.get(`finance/export/?file_format=${format}&period=This%20Month`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: format === 'PDF' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance-export.${format === 'PDF' ? 'pdf' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      uiStore.showNotification("Moliya exportida xatolik", "error");
    }
  };

  const totalBalance = cashboxes.reduce((sum, cb) => sum + parseFloat(String(cb.balance)), 0);
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cashbox_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Moliya & Kassa</h1>
          <p className="text-slate-500 text-sm font-medium">Pul oqimi, kassa transferlari va qarzdorlik nazorati</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <button onClick={() => handleExport('PDF')} className="flex-1 sm:flex-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">PDF</button>
            <button onClick={() => handleExport('EXCEL')} className="flex-1 sm:flex-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">Excel</button>
          </div>
          {canManageTransfers && (
            <button 
              onClick={() => setIsTransferring(true)}
              className="flex items-center justify-center gap-2 bg-white text-blue-600 px-5 py-3 rounded-2xl font-bold border border-blue-100 shadow-sm hover:bg-blue-50 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <ArrowLeftRight className="w-4 h-4" />
              O'tkazma
            </button>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-[22px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 text-sm uppercase tracking-widest"
          >
            <Plus className="w-5 h-5 text-blue-100" />
            Amal qo'shish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-[24px] gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'TRANSACTIONS', label: 'Amallar jurnali', icon: History },
          { id: 'DEBTS', label: 'Qarzdorlik', icon: Users },
          ...(canManageTransfers ? [{ id: 'TRANSFERS', label: 'O\'tkazmalar', icon: ArrowLeftRight }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Summary (Conditional based on Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-900 rounded-[32px] p-7 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Umumiy Qoldiq</p>
          <h3 className="text-2xl font-black tracking-tight mb-4">
            {totalBalance.toLocaleString()} <span className="text-sm font-bold opacity-50 ml-1 text-blue-400">UZS</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Aktiv Holatda
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">30 kunlik Kirim</p>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight mb-4">
            +{totalIncome.toLocaleString()} <span className="text-sm font-bold opacity-50 ml-1">UZS</span>
          </h3>
          <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">30 kunlik Chiqim</p>
          <h3 className="text-2xl font-black text-rose-600 tracking-tight mb-4">
            -{totalExpense.toLocaleString()} <span className="text-sm font-bold opacity-50 ml-1">UZS</span>
          </h3>
          <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm group hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Umumiy Qarzdorlik</p>
          <h3 className="text-2xl font-black text-amber-600 tracking-tight mb-4">
            {analytics?.summary?.total_debt?.toLocaleString() || '0'} <span className="text-sm font-bold opacity-50 ml-1">UZS</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
            <AlertCircle className="w-3.5 h-3.5" />
            Kutilayotgan tushum
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Cashflow Chart */}
              <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Pul Oqimi Dinamikasi</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oxirgi 30 kunlik tahlil</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Kirim</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Chiqim</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full mt-8">
                <ResponsiveContainer width="99%" height={300} debounce={50}>
                    <AreaChart data={analytics?.cashflow || []}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '20px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          padding: '15px'
                        }}
                        labelStyle={{ fontWeight: 900, marginBottom: '5px' }}
                      />
                      <Area type="monotone" dataKey="income" name="Kirim" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" name="Chiqim" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Xarajatlar Strukturasi</h3>
                <div className="w-full">
                  <ResponsiveContainer width="99%" height={250} debounce={50}>
                    <PieChart>
                      <Pie
                        data={analytics?.categories || [{ name: 'Ma\'lumot yo\'q', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analytics?.categories || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {(analytics?.categories || []).slice(0, 4).map((cat: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4] }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase">{cat.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-900">{((cat.value / totalExpense) * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Cashboxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {cashboxes.map((cb) => (
                    <div key={cb.id} className="bg-white rounded-[32px] p-7 border border-slate-100 shadow-sm group hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cb.type === 'CASH' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                {cb.type === 'CASH' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cb.type === 'CASH' ? 'Naqd Kassa' : 'Bank Hisobi'}</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-4">{cb.name}</h4>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mavjud Qoldiq</p>
                                <h3 className="text-2xl font-black text-blue-600 tracking-tight">{parseFloat(String(cb.balance)).toLocaleString()} UZS</h3>
                            </div>
                            <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-slate-50 rounded-[32px] p-7 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all group"
                >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Kassa qo'shish</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Tavsif, kassa yoki kategoriya bo'yicha qidiruv..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300 text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* Transactions Table (Similar to original but with more fields) */}
            {!isMobile && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operatsiya</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kassa / Bo'lim</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategoriya / Kim</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Summa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{t.description || 'Izohsiz'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(t.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{t.cashbox_name}</p>
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{t.department_display}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600">{t.category_name || 'Boshqa'}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">{t.performed_by_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <p className={`text-base font-black tracking-tight ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{parseFloat(String(t.amount)).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">UZS</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
            {isMobile && (
              <div className="space-y-3">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{t.description || 'Izohsiz'}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.cashbox_name} • {t.department_display}</p>
                      </div>
                      <span className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'}{parseFloat(String(t.amount)).toLocaleString()}</span>
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'TRANSFERS' && (
           <div className="space-y-6">
             {!isMobile && (
             <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">O'tkazmalar Tarixi</h3>
                    <button onClick={() => setIsTransferring(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Yangi O'tkazma</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sana / Kim</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chiqish</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kirim</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Summa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transfers.map((tr) => (
                                <tr key={tr.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-slate-900 mb-1">{new Date(tr.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">{tr.performed_by_name}</p>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{tr.from_cashbox_name}</td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{tr.to_cashbox_name}</td>
                                    <td className="px-8 py-5 text-right font-black text-slate-900">
                                        {parseFloat(String(tr.amount)).toLocaleString()} UZS
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
             )}
             {isMobile && (
               <div className="space-y-3">
                 {transfers.map((tr) => (
                   <div key={tr.id} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                     <p className="text-sm font-black text-slate-900">{tr.from_cashbox_name} {'->'} {tr.to_cashbox_name}</p>
                     <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{tr.performed_by_name} • {new Date(tr.created_at).toLocaleDateString()}</p>
                     <p className="mt-3 text-base font-black text-blue-600">{parseFloat(String(tr.amount)).toLocaleString()} UZS</p>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {activeTab === 'DEBTS' && (
          <div className="space-y-6">
            {!isMobile && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Mijozlar Qarzdorligi</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mijoz</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oxirgi Harakat</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qarz Summasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {balances.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                              {b.customer_name?.charAt(0)}
                            </div>
                            <span className="text-sm font-black text-slate-900">{b.customer_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-400">
                          {new Date(b.last_updated).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-lg font-black tracking-tight ${parseFloat(String(b.total_debt)) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {parseFloat(String(b.total_debt)).toLocaleString()} UZS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
            {isMobile && (
              <div className="space-y-3">
                {balances.map((b) => (
                  <div key={b.id} className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-slate-900">{b.customer_name}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(b.last_updated).toLocaleString()}</p>
                    <p className={`mt-3 text-base font-black ${parseFloat(String(b.total_debt)) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{parseFloat(String(b.total_debt)).toLocaleString()} UZS</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-xl ${formData.type === 'INCOME' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-rose-600 shadow-rose-100'}`}>
                    {formData.type === 'INCOME' ? <TrendingUp className="w-7 h-7 text-white" /> : <TrendingDown className="w-7 h-7 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">Yangi Amal</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Moliya operatsiyasini yozish</p>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-95 border border-transparent hover:border-slate-100">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="flex bg-slate-100 p-1.5 rounded-2.5xl gap-1">
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, type: 'INCOME'})}
                        className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${formData.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Kirim (+)
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, type: 'EXPENSE'})}
                        className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${formData.type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Chiqim (-)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Summa (UZS)</label>
                    <div className="relative">
                      <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="number" 
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Kassa / Hisob</label>
                    <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                            required
                            value={formData.cashbox}
                            onChange={(e) => setFormData({...formData, cashbox: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                            <option value="">Tanlang...</option>
                            {cashboxes.map(cb => (
                                <option key={cb.id} value={cb.id}>{cb.name}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Bo'lim</label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                             <option value="ADMIN">Ma'muriyat</option>
                             <option value="PRODUCTION">Ishlab chiqarish</option>
                             <option value="LOGISTICS">Logistika</option>
                             <option value="SALES">Sotuv bo'limi</option>
                             <option value="OTHER">Boshqa</option>
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Kategoriya</label>
                    <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                            <option value="">Ixtiyoriy...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Mijoz (Qarzdorlik uchun)</label>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                            value={formData.customer}
                            onChange={(e) => setFormData({...formData, customer: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                            <option value="">Shaxsiylashtirilmagan</option>
                            {balances.map(b => (
                                <option key={b.id} value={b.customer}>{b.customer_name}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Tavsif (Izoh)</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-800 shadow-inner min-h-[80px] resize-none"
                      placeholder="Amal uchun qisqacha izoh..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 px-8 py-4.5 border border-slate-200 text-slate-600 rounded-[24px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-xs">Bekor qilish</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[1.5] px-8 py-4.5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all text-xs disabled:opacity-50"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Amalni Saqlash'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal Transfer Modal */}
      <AnimatePresence>
        {isTransferring && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTransferring(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-100">
                    <ArrowLeftRight className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">Ichki O'tkazma</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kassalararo pul o'tkazish</p>
                  </div>
                </div>
                <button onClick={() => setIsTransferring(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-95 border border-transparent hover:border-slate-100">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kimdan (Chiqish)</label>
                        <select 
                            required
                            value={transferData.from_cashbox}
                            onChange={(e) => setTransferData({...transferData, from_cashbox: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                            <option value="">Tanlang...</option>
                            {cashboxes.map(cb => (
                                <option key={cb.id} value={cb.id}>{cb.name} ({parseFloat(String(cb.balance)).toLocaleString()} UZS)</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kimga (Kirim)</label>
                        <select 
                            required
                            value={transferData.to_cashbox}
                            onChange={(e) => setTransferData({...transferData, to_cashbox: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                            <option value="">Tanlang...</option>
                            {cashboxes.map(cb => (
                                <option key={cb.id} value={cb.id}>{cb.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Summa (UZS)</label>
                        <input 
                            required
                            type="number" 
                            value={transferData.amount}
                            onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900 shadow-inner"
                            placeholder="0.00"
                        />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsTransferring(false)} className="flex-1 px-8 py-4.5 border border-slate-200 text-slate-600 rounded-[24px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-xs">Bekor qilish</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[1.5] px-8 py-4.5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all text-xs disabled:opacity-50"
                  >
                    {loading ? 'O\'tkazilmoqda...' : 'O\'tkazishni Tasdiqlash'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
