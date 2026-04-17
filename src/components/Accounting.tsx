import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator, BookOpen, TrendingUp, TrendingDown, DollarSign,
  FileText, ChevronRight, ChevronDown, Search, Filter,
  Plus, Check, X, Eye, ArrowUpRight, ArrowDownRight,
  Landmark, PieChart, BarChart3, RefreshCw, AlertCircle,
  Wallet, Building2, Receipt, Scale
} from 'lucide-react';
import api from '../lib/api';
import type {
  User, AccountNode, JournalEntry, TrialBalance,
  BalanceSheet, IncomeStatement, CashFlowStatement, AccountingSummary, TaxRate
} from '../types';

interface Props {
  user: User | null;
}

type Tab = 'dashboard' | 'accounts' | 'journal' | 'trial-balance' | 'balance-sheet' | 'pnl' | 'cash-flow' | 'tax';

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

export default function Accounting({ user }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);

  // Data states
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Create entry form
  const [newEntry, setNewEntry] = useState({
    description: '',
    reference: '',
    lines: [
      { account_code: '', debit: '', credit: '', description: '' },
      { account_code: '', debit: '', credit: '', description: '' },
    ]
  });

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (tab) {
        case 'dashboard':
          const sumRes = await api.get('accounting/summary/');
          setSummary(sumRes.data);
          break;
        case 'accounts':
          const accRes = await api.get('accounting/accounts/tree/');
          setAccounts(accRes.data);
          break;
        case 'journal':
          const jeRes = await api.get('accounting/journal-entries/');
          setEntries(jeRes.data.results || jeRes.data);
          break;
        case 'trial-balance':
          const tbRes = await api.get(`accounting/trial-balance/?start_date=${startDate}&end_date=${endDate}`);
          setTrialBalance(tbRes.data);
          break;
        case 'balance-sheet':
          const bsRes = await api.get(`accounting/balance-sheet/?date=${endDate}`);
          setBalanceSheet(bsRes.data);
          break;
        case 'pnl':
          const plRes = await api.get(`accounting/income-statement/?start_date=${startDate}&end_date=${endDate}`);
          setIncomeStatement(plRes.data);
          break;
        case 'cash-flow':
          const cfRes = await api.get(`accounting/cash-flow/?start_date=${startDate}&end_date=${endDate}`);
          setCashFlow(cfRes.data);
          break;
        case 'tax':
          const txRes = await api.get('accounting/tax-rates/');
          setTaxRates(txRes.data.results || txRes.data);
          break;
      }
    } catch (err) {
      console.error('Accounting load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    try {
      setLoading(true);
      const lines = newEntry.lines
        .filter(l => l.account_code && (parseFloat(l.debit || '0') > 0 || parseFloat(l.credit || '0') > 0))
        .map(l => ({
          account_code: l.account_code,
          debit: parseFloat(l.debit || '0'),
          credit: parseFloat(l.credit || '0'),
          description: l.description,
        }));

      await api.post('accounting/journal-entries/', {
        description: newEntry.description,
        reference: newEntry.reference,
        source_type: 'MANUAL',
        auto_post: false,
        lines,
      });

      setShowCreateEntry(false);
      setNewEntry({
        description: '', reference: '',
        lines: [
          { account_code: '', debit: '', credit: '', description: '' },
          { account_code: '', debit: '', credit: '', description: '' },
        ]
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (id: number) => {
    try {
      await api.post(`accounting/journal-entries/${id}/post_entry/`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    }
  };

  const handleVoidEntry = async (id: number) => {
    const reason = prompt('Bekor qilish sababi:');
    if (!reason) return;
    try {
      await api.post(`accounting/journal-entries/${id}/void_entry/`, { reason });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    }
  };

  const addLine = () => {
    setNewEntry(prev => ({
      ...prev,
      lines: [...prev.lines, { account_code: '', debit: '', credit: '', description: '' }]
    }));
  };

  const removeLine = (idx: number) => {
    if (newEntry.lines.length <= 2) return;
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const totalDebit = useMemo(() => 
    newEntry.lines.reduce((s, l) => s + parseFloat(l.debit || '0'), 0), [newEntry.lines]);
  const totalCredit = useMemo(() => 
    newEntry.lines.reduce((s, l) => s + parseFloat(l.credit || '0'), 0), [newEntry.lines]);

  const toggleAccount = (code: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const tabs: { id: Tab; name: string; icon: any }[] = [
    { id: 'dashboard', name: 'Umumiy', icon: PieChart },
    { id: 'accounts', name: 'Hisoblar', icon: Landmark },
    { id: 'journal', name: 'Provodkalar', icon: BookOpen },
    { id: 'trial-balance', name: 'Aylanma', icon: Scale },
    { id: 'balance-sheet', name: 'Balans', icon: BarChart3 },
    { id: 'pnl', name: 'Foyda/Zarar', icon: TrendingUp },
    { id: 'cash-flow', name: 'Pul oqimi', icon: Wallet },
    { id: 'tax', name: 'Soliqlar', icon: Receipt },
  ];

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-amber-100 text-amber-700',
    POSTED: 'bg-emerald-100 text-emerald-700',
    VOID: 'bg-red-100 text-red-700',
  };

  const typeColors: Record<string, string> = {
    ASSET: 'bg-blue-100 text-blue-700',
    LIABILITY: 'bg-purple-100 text-purple-700',
    EQUITY: 'bg-indigo-100 text-indigo-700',
    REVENUE: 'bg-emerald-100 text-emerald-700',
    EXPENSE: 'bg-rose-100 text-rose-700',
    CONTRA: 'bg-gray-100 text-gray-700',
  };

  // ═══════════════ RENDER ACCOUNT TREE ═══════════════
  const renderAccountTree = (nodes: AccountNode[], depth = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedAccounts.has(node.code);
      const matchSearch = !searchQuery || 
        node.code.includes(searchQuery) || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchSearch && !hasChildren) return null;

      return (
        <div key={node.code}>
          <div
            className={`flex items-center gap-2 py-2.5 px-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${depth > 0 ? 'ml-' + (depth * 4) : ''}`}
            onClick={() => hasChildren && toggleAccount(node.code)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-none" /> 
                         : <ChevronRight className="w-4 h-4 text-slate-400 flex-none" />
            ) : <div className="w-4 flex-none" />}
            
            <span className="text-xs font-mono font-bold text-slate-500 w-12 flex-none">{node.code}</span>
            <span className={`text-sm font-semibold flex-1 ${depth === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
              {node.name}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[node.account_type] || 'bg-gray-100'}`}>
              {node.account_type_display}
            </span>
            <span className={`text-sm font-bold tabular-nums ${node.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(node.balance)}
            </span>
          </div>
          {hasChildren && isExpanded && renderAccountTree(node.children!, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto custom-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.name}
          </button>
        ))}
      </div>

      {/* Date Filter (for report tabs) */}
      {['trial-balance', 'pnl', 'cash-flow'].includes(tab) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
          <span className="text-slate-400 text-sm">—</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Yangilash
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            
            {/* ═══════════ DASHBOARD ═══════════ */}
            {tab === 'dashboard' && summary && (
              <div className="space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Kassa', value: summary.balances.cash, icon: Wallet, color: 'emerald' },
                    { label: 'Bank', value: summary.balances.bank, icon: Building2, color: 'blue' },
                    { label: 'Debitorlik', value: summary.balances.receivables, icon: ArrowUpRight, color: 'amber' },
                    { label: 'Kreditorlik', value: summary.balances.payables, icon: ArrowDownRight, color: 'rose' },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                        <div className={`p-1.5 rounded-lg bg-${kpi.color}-50`}>
                          <kpi.icon className={`w-4 h-4 text-${kpi.color}-600`} />
                        </div>
                      </div>
                      <p className={`text-xl font-black ${kpi.value >= 0 ? `text-${kpi.color}-600` : 'text-rose-600'}`}>
                        {fmt(kpi.value)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">so'm</p>
                    </div>
                  ))}
                </div>

                {/* Monthly P&L */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Oylik daromad</p>
                    <p className="text-2xl font-black mt-1">{fmt(summary.monthly_pl.revenue)}</p>
                    <p className="text-xs opacity-70 mt-1">so'm</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Oylik xarajat</p>
                    <p className="text-2xl font-black mt-1">{fmt(summary.monthly_pl.expenses)}</p>
                    <p className="text-xs opacity-70 mt-1">so'm</p>
                  </div>
                  <div className={`bg-gradient-to-br ${summary.monthly_pl.net_income >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} rounded-2xl p-5 text-white`}>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Sof foyda</p>
                    <p className="text-2xl font-black mt-1">{fmt(summary.monthly_pl.net_income)}</p>
                    <p className="text-xs opacity-70 mt-1">{summary.monthly_pl.profit_margin}% marjin</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Xom ashyo', value: summary.balances.raw_materials, color: 'text-amber-600' },
                    { label: 'Tayyor mahsulot', value: summary.balances.finished_goods, color: 'text-blue-600' },
                    { label: 'Provodkalar', value: summary.posted_count, color: 'text-emerald-600', suffix: ' ta' },
                    { label: 'Qoralamalar', value: summary.draft_count, color: 'text-amber-600', suffix: ' ta' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-lg font-black ${s.color} mt-1`}>
                        {fmt(s.value)}{(s as any).suffix || ' so\'m'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recent Entries */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">So'nggi provodkalar</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {(summary.recent_entries || []).slice(0, 8).map(e => (
                      <div key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[e.status]}`}>
                          {e.status_display}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600">{e.entry_number}</span>
                        <span className="text-sm text-slate-700 flex-1 truncate">{e.description}</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{fmt(e.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ CHART OF ACCOUNTS ═══════════ */}
            {tab === 'accounts' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 flex-1">Hisoblar Rejasi (BHM)</h3>
                  <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="text" placeholder="Kod yoki nom..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-32" />
                  </div>
                </div>
                <div className="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {accounts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Hisoblar topilmadi</p>
                    </div>
                  ) : renderAccountTree(accounts)}
                </div>
              </div>
            )}

            {/* ═══════════ JOURNAL ENTRIES ═══════════ */}
            {tab === 'journal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Buxgalteriya Yozuvlari</h3>
                  <button onClick={() => setShowCreateEntry(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Plus className="w-4 h-4" /> Yangi provodka
                  </button>
                </div>

                {/* Create Entry Modal */}
                <AnimatePresence>
                  {showCreateEntry && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl border border-blue-100 shadow-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Yangi Provodka</h4>
                        <button onClick={() => setShowCreateEntry(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Tavsif</label>
                          <input value={newEntry.description}
                            onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mt-1"
                            placeholder="Operatsiya tavsifi..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Hujjat raqami</label>
                          <input value={newEntry.reference}
                            onChange={e => setNewEntry(p => ({ ...p, reference: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mt-1"
                            placeholder="Masalan: INV-0042" />
                        </div>
                      </div>

                      {/* Lines Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="text-left py-2 px-2">Hisob Kodi</th>
                              <th className="text-right py-2 px-2">Debit</th>
                              <th className="text-right py-2 px-2">Kredit</th>
                              <th className="text-left py-2 px-2">Izoh</th>
                              <th className="py-2 px-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {newEntry.lines.map((line, i) => (
                              <tr key={i} className="border-t border-slate-50">
                                <td className="py-1.5 px-2">
                                  <input value={line.account_code}
                                    onChange={e => {
                                      const lines = [...newEntry.lines];
                                      lines[i] = { ...lines[i], account_code: e.target.value };
                                      setNewEntry(p => ({ ...p, lines }));
                                    }}
                                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                    placeholder="5010" />
                                </td>
                                <td className="py-1.5 px-2">
                                  <input type="number" value={line.debit}
                                    onChange={e => {
                                      const lines = [...newEntry.lines];
                                      lines[i] = { ...lines[i], debit: e.target.value, credit: e.target.value ? '' : line.credit };
                                      setNewEntry(p => ({ ...p, lines }));
                                    }}
                                    className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right"
                                    placeholder="0" />
                                </td>
                                <td className="py-1.5 px-2">
                                  <input type="number" value={line.credit}
                                    onChange={e => {
                                      const lines = [...newEntry.lines];
                                      lines[i] = { ...lines[i], credit: e.target.value, debit: e.target.value ? '' : line.debit };
                                      setNewEntry(p => ({ ...p, lines }));
                                    }}
                                    className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right"
                                    placeholder="0" />
                                </td>
                                <td className="py-1.5 px-2">
                                  <input value={line.description}
                                    onChange={e => {
                                      const lines = [...newEntry.lines];
                                      lines[i] = { ...lines[i], description: e.target.value };
                                      setNewEntry(p => ({ ...p, lines }));
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                                    placeholder="Izoh..." />
                                </td>
                                <td className="py-1.5 px-2">
                                  <button onClick={() => removeLine(i)} className="text-slate-300 hover:text-rose-500">
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-200">
                              <td className="py-2 px-2">
                                <button onClick={addLine} className="text-xs text-blue-600 font-bold hover:underline">+ Qator</button>
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-sm">{fmt(totalDebit)}</td>
                              <td className="py-2 px-2 text-right font-bold text-sm">{fmt(totalCredit)}</td>
                              <td className="py-2 px-2">
                                {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Balans</span>
                                ) : (
                                  <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Farq: {fmt(Math.abs(totalDebit - totalCredit))}
                                  </span>
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowCreateEntry(false)}
                          className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl">Bekor</button>
                        <button onClick={handleCreateEntry}
                          disabled={Math.abs(totalDebit - totalCredit) >= 0.01 || !newEntry.description}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200">
                          Saqlash
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Entries List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  {entries.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Provodkalar topilmadi</p>
                    </div>
                  ) : entries.map(entry => (
                    <div key={entry.id} className="p-4 hover:bg-slate-50/50 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-blue-600">{entry.entry_number}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[entry.status]}`}>
                              {entry.status_display}
                            </span>
                            <span className="text-[10px] text-slate-400">{entry.source_type_display}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-700 truncate">{entry.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span>{entry.date}</span>
                            {entry.reference && <span>#{entry.reference}</span>}
                            {entry.created_by_name && <span>👤 {entry.created_by_name}</span>}
                          </div>
                          
                          {/* Lines preview */}
                          {entry.lines && entry.lines.length > 0 && (
                            <div className="mt-2 bg-slate-50 rounded-xl p-2 space-y-1">
                              {entry.lines.map(line => (
                                <div key={line.id} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono text-slate-500 w-10">{line.account_code}</span>
                                  <span className="text-slate-600 flex-1 truncate">{line.account_name}</span>
                                  {line.debit > 0 && <span className="text-emerald-600 font-bold">DR {fmt(line.debit)}</span>}
                                  {line.credit > 0 && <span className="text-rose-600 font-bold">CR {fmt(line.credit)}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-none">
                          <p className="text-lg font-black text-slate-900">{fmt(entry.total_amount)}</p>
                          <div className="flex gap-1 mt-2 justify-end">
                            {entry.status === 'DRAFT' && (
                              <button onClick={() => handlePostEntry(entry.id)}
                                className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                                ✓ Tasdiqlash
                              </button>
                            )}
                            {entry.status === 'POSTED' && (
                              <button onClick={() => handleVoidEntry(entry.id)}
                                className="text-[10px] font-bold px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">
                                ✕ Bekor
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════ TRIAL BALANCE ═══════════ */}
            {tab === 'trial-balance' && trialBalance && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Aylanma Vedomost'</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {trialBalance.start_date} — {trialBalance.end_date}
                    </p>
                  </div>
                  {trialBalance.is_balanced ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                      <Check className="w-3.5 h-3.5" /> Balanslangan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> Balans teng emas!
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                        <th className="text-left py-3 px-4">Hisob</th>
                        <th className="text-right py-3 px-3" colSpan={2}>Kirish qoldiq</th>
                        <th className="text-right py-3 px-3" colSpan={2}>Davr aylanmasi</th>
                        <th className="text-right py-3 px-3" colSpan={2}>Chiqish qoldiq</th>
                      </tr>
                      <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                        <th></th>
                        <th className="text-right px-3 py-1">Debit</th>
                        <th className="text-right px-3 py-1">Kredit</th>
                        <th className="text-right px-3 py-1">Debit</th>
                        <th className="text-right px-3 py-1">Kredit</th>
                        <th className="text-right px-3 py-1">Debit</th>
                        <th className="text-right px-3 py-1">Kredit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalance.accounts.map(acc => (
                        <tr key={acc.code} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2.5 px-4">
                            <span className="font-mono text-xs text-slate-500 mr-2">{acc.code}</span>
                            <span className="text-slate-700">{acc.name}</span>
                          </td>
                          <td className="text-right px-3 tabular-nums">{acc.opening_debit > 0 ? fmt(acc.opening_debit) : ''}</td>
                          <td className="text-right px-3 tabular-nums">{acc.opening_credit > 0 ? fmt(acc.opening_credit) : ''}</td>
                          <td className="text-right px-3 tabular-nums font-semibold">{acc.period_debit > 0 ? fmt(acc.period_debit) : ''}</td>
                          <td className="text-right px-3 tabular-nums font-semibold">{acc.period_credit > 0 ? fmt(acc.period_credit) : ''}</td>
                          <td className="text-right px-3 tabular-nums font-bold">{acc.closing_debit > 0 ? fmt(acc.closing_debit) : ''}</td>
                          <td className="text-right px-3 tabular-nums font-bold">{acc.closing_credit > 0 ? fmt(acc.closing_credit) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold">
                        <td className="py-3 px-4">JAMI</td>
                        <td colSpan={4}></td>
                        <td className="text-right px-3 tabular-nums">{fmt(trialBalance.total_debit)}</td>
                        <td className="text-right px-3 tabular-nums">{fmt(trialBalance.total_credit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════ BALANCE SHEET ═══════════ */}
            {tab === 'balance-sheet' && balanceSheet && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assets */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="p-4 border-b border-blue-50 bg-blue-50/50 rounded-t-2xl">
                    <h3 className="text-sm font-bold text-blue-900">AKTIVLAR</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {balanceSheet.assets.map(a => (
                      <div key={a.code} className="px-4 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono text-slate-400 mr-2">{a.code}</span>
                          <span className="text-sm text-slate-700">{a.name}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-blue-700">{fmt(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t-2 border-blue-200 bg-blue-50 rounded-b-2xl">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-blue-900">JAMI AKTIVLAR</span>
                      <span className="text-lg font-black text-blue-700">{fmt(balanceSheet.total_assets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities + Equity */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-purple-50 bg-purple-50/50 rounded-t-2xl">
                      <h3 className="text-sm font-bold text-purple-900">MAJBURIYATLAR</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {balanceSheet.liabilities.map(l => (
                        <div key={l.code} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-slate-400 mr-2">{l.code}</span>
                            <span className="text-sm text-slate-700">{l.name}</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-purple-700">{fmt(l.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-purple-100 bg-purple-50/50">
                      <div className="flex justify-between text-sm font-bold text-purple-800">
                        <span>Jami</span><span>{fmt(balanceSheet.total_liabilities)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-indigo-50 bg-indigo-50/50 rounded-t-2xl">
                      <h3 className="text-sm font-bold text-indigo-900">KAPITAL</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {balanceSheet.equity.map(e => (
                        <div key={e.code} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-slate-400 mr-2">{e.code}</span>
                            <span className="text-sm text-slate-700">{e.name}</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-indigo-700">{fmt(e.balance)}</span>
                        </div>
                      ))}
                      {balanceSheet.retained_earnings !== 0 && (
                        <div className="px-4 py-2.5 flex items-center justify-between bg-amber-50/50">
                          <span className="text-sm text-amber-700 font-semibold">Taqsimlanmagan foyda</span>
                          <span className="text-sm font-bold tabular-nums text-amber-700">{fmt(balanceSheet.retained_earnings)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-indigo-100 bg-indigo-50/50">
                      <div className="flex justify-between text-sm font-bold text-indigo-800">
                        <span>Jami</span><span>{fmt(balanceSheet.total_equity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className={`p-4 rounded-2xl text-center ${balanceSheet.is_balanced ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                    <p className={`text-sm font-bold ${balanceSheet.is_balanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {balanceSheet.is_balanced ? '✅ BALANS TENG' : '❌ BALANS TENG EMAS!'}
                    </p>
                    <p className="text-xs mt-1 text-slate-500">
                      A: {fmt(balanceSheet.total_assets)} = P: {fmt(balanceSheet.total_liabilities_and_equity)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ P&L / INCOME STATEMENT ═══════════ */}
            {tab === 'pnl' && incomeStatement && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <p className="text-xs font-bold opacity-80">JAMI DAROMAD</p>
                    <p className="text-2xl font-black mt-1">{fmt(incomeStatement.total_revenue)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
                    <p className="text-xs font-bold opacity-80">JAMI XARAJAT</p>
                    <p className="text-2xl font-black mt-1">{fmt(incomeStatement.total_expenses)}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${incomeStatement.net_income >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-600 to-red-700'} rounded-2xl p-5 text-white`}>
                    <p className="text-xs font-bold opacity-80">SOF FOYDA</p>
                    <p className="text-2xl font-black mt-1">{fmt(incomeStatement.net_income)}</p>
                    <p className="text-xs opacity-70 mt-1">{incomeStatement.profit_margin}% marjin</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-emerald-50 bg-emerald-50/50 rounded-t-2xl">
                      <h3 className="text-sm font-bold text-emerald-900">DAROMADLAR</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {incomeStatement.revenues.map(r => (
                        <div key={r.code} className="px-4 py-2.5 flex justify-between">
                          <span className="text-sm text-slate-700">
                            <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>{r.name}
                          </span>
                          <span className="font-bold text-emerald-600 tabular-nums">{fmt(r.amount)}</span>
                        </div>
                      ))}
                      {incomeStatement.revenues.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Daromad yo'q</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-rose-50 bg-rose-50/50 rounded-t-2xl">
                      <h3 className="text-sm font-bold text-rose-900">XARAJATLAR</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {incomeStatement.expenses.map(e => (
                        <div key={e.code} className="px-4 py-2.5 flex justify-between">
                          <span className="text-sm text-slate-700">
                            <span className="font-mono text-xs text-slate-400 mr-2">{e.code}</span>{e.name}
                          </span>
                          <span className="font-bold text-rose-600 tabular-nums">{fmt(e.amount)}</span>
                        </div>
                      ))}
                      {incomeStatement.expenses.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Xarajat yo'q</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ CASH FLOW ═══════════ */}
            {tab === 'cash-flow' && cashFlow && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Kirish qoldiq', value: cashFlow.opening_cash, color: 'text-slate-600' },
                    { label: 'Kirimlar', value: cashFlow.total_inflow, color: 'text-emerald-600' },
                    { label: 'Chiqimlar', value: cashFlow.total_outflow, color: 'text-rose-600' },
                    { label: 'Chiqish qoldiq', value: cashFlow.closing_cash, color: cashFlow.closing_cash >= 0 ? 'text-blue-600' : 'text-rose-600' },
                  ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                      <p className={`text-xl font-black ${k.color} mt-1`}>{fmt(k.value)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-emerald-50 bg-emerald-50/50 rounded-t-2xl flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-emerald-900">KIRIMLAR</h3>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                      {cashFlow.inflows.map((f, i) => (
                        <div key={i} className="px-4 py-2.5 flex justify-between">
                          <div>
                            <p className="text-sm text-slate-700 truncate">{f.description}</p>
                            <p className="text-xs text-slate-400">{f.date} • {f.entry_number}</p>
                          </div>
                          <span className="font-bold text-emerald-600 tabular-nums flex-none">+{fmt(f.amount)}</span>
                        </div>
                      ))}
                      {cashFlow.inflows.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Kirim yo'q</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 border-b border-rose-50 bg-rose-50/50 rounded-t-2xl flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      <h3 className="text-sm font-bold text-rose-900">CHIQIMLAR</h3>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                      {cashFlow.outflows.map((f, i) => (
                        <div key={i} className="px-4 py-2.5 flex justify-between">
                          <div>
                            <p className="text-sm text-slate-700 truncate">{f.description}</p>
                            <p className="text-xs text-slate-400">{f.date} • {f.entry_number}</p>
                          </div>
                          <span className="font-bold text-rose-600 tabular-nums flex-none">-{fmt(f.amount)}</span>
                        </div>
                      ))}
                      {cashFlow.outflows.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Chiqim yo'q</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ TAX RATES ═══════════ */}
            {tab === 'tax' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Soliq Stavkalari</h3>
                  <p className="text-xs text-slate-400 mt-0.5">SuperAdmin tomonidan sozlanadi</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {taxRates.map(rate => (
                    <div key={rate.id} className="px-4 py-3 flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">{rate.name}</p>
                        <p className="text-xs text-slate-400">Kod: {rate.code}</p>
                      </div>
                      <span className="text-xl font-black text-amber-600">{rate.rate}%</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rate.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {rate.is_active ? 'Aktiv' : 'Noaktiv'}
                      </span>
                    </div>
                  ))}
                  {taxRates.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">Soliq stavkalari topilmadi</div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
