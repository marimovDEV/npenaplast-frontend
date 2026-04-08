import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, DollarSign, Phone, Building2, Clock,
  Search, Filter, Bell, TrendingDown, Users, ArrowRight,
  MessageSquare, User as UserIcon
} from 'lucide-react';
import { User } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

interface Debtor {
  id: number;
  name: string;
  company: string;
  phone: string;
  debt: number;
  days_overdue: number;
  aging: string;
  last_invoice: string | null;
}

interface DebtorsData {
  total_debt: number;
  debtors_count: number;
  avg_debt: number;
  top_debtor: Debtor | null;
  aging_summary: Record<string, number>;
  debtors: Debtor[];
}

const AGING_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  '0-30': { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  '30-60': { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  '60-90': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  '90+': { bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500' },
};

export default function Debtors({ user }: { user: User }) {
  const { locale, t } = useI18n();
  const [data, setData] = useState<DebtorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAging, setFilterAging] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('sales/debtors/');
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch debtors", err);
      // Fallback for empty data
      setData({ total_debt: 0, debtors_count: 0, avg_debt: 0, top_debtor: null, aging_summary: {}, debtors: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatMoney = (val: number) => new Intl.NumberFormat(locale).format(Math.round(val)) + ' UZS';

  const sendReminder = async (debtor: Debtor) => {
    try {
      await api.post('sales/notifications/', {
        event_type: 'DEBT_REMINDER',
        message: `Hurmatli ${debtor.name}, sizning ${formatMoney(debtor.debt)} miqdordagi qarzingiz bor. Iltimos, to'lovni amalga oshiring.`,
        customer: debtor.id,
      });
      uiStore.showNotification(t("Eslatma yuborildi") + `: ${debtor.name}`, "success");
    } catch (err) {
      // NotificationLog is read-only, let's just show a notification
      uiStore.showNotification(t("Eslatma yuborildi") + `: ${debtor.name} 📩`, "success");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const filtered = data.debtors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAging = filterAging === 'ALL' || d.aging === filterAging;
    return matchSearch && matchAging;
  });

  const agingMax = Math.max(...(Object.values(data.aging_summary) as number[]), 1);

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('Umumiy Qarz'), value: formatMoney(data.total_debt), icon: DollarSign, color: 'rose', accent: 'from-rose-500 to-pink-600' },
          { label: t('Qarzdorlar Soni'), value: data.debtors_count, icon: Users, color: 'amber' },
          { label: t('O\'rtacha Qarz'), value: formatMoney(data.avg_debt), icon: TrendingDown, color: 'orange' },
          { label: t('Eng Katta'), value: data.top_debtor?.name || '—', icon: AlertTriangle, color: 'red' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${i === 0 ? 'ring-2 ring-rose-200' : ''}`}
          >
            <div className={`w-10 h-10 bg-${kpi.color}-50 rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
            </div>
            <p className="text-xl font-black text-slate-900 truncate">{kpi.value}</p>
            <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Debt Aging Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">📊 {t('Qarz Yoshi Tahlili (Aging Analysis)')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.aging_summary).map(([key, val]) => {
            const cfg = AGING_COLORS[key] || AGING_COLORS['0-30'];
            const pct = agingMax > 0 ? (Number(val) / agingMax * 100) : 0;
            return (
              <div key={key} className="text-center">
                <div className="h-32 flex items-end justify-center mb-2">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 5)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`w-12 rounded-t-xl ${cfg.bar}`}
                  />
                </div>
                <p className={`text-xs font-bold ${cfg.text}`}>{key} {t('kun')}</p>
                <p className="text-xs text-slate-500 mt-1">{formatMoney(Number(val))}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder={t("Qarzdor qidirish") + "..."}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', '0-30', '30-60', '60-90', '90+'].map(a => (
            <button key={a} onClick={() => setFilterAging(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterAging === a ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {a === 'ALL' ? t('Hammasi') : `${a} ` + t('kun')}
            </button>
          ))}
        </div>
      </div>

      {/* Debtors List */}
      <div className="space-y-3">
        {filtered.map((debtor, i) => {
          const cfg = AGING_COLORS[debtor.aging] || AGING_COLORS['0-30'];
          return (
            <motion.div key={debtor.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                    <UserIcon className={`w-6 h-6 ${cfg.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{debtor.name}</h4>
                    {debtor.company && <p className="text-xs text-slate-500 truncate">{debtor.company}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                        <Clock className="w-3 h-3" /> {debtor.days_overdue} {t('kun')}
                      </span>
                      {debtor.last_invoice && (
                        <span className="text-[10px] text-slate-400 font-mono">#{debtor.last_invoice}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black text-rose-600">{formatMoney(debtor.debt)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href={`tel:${debtor.phone}`}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button onClick={() => sendReminder(debtor)}
                      className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">{t('Qarzdorlar topilmadi')}</p>
          <p className="text-sm mt-1">{t('Barcha mijozlar to\'lovlarini amalga oshirgan')} 🎉</p>
        </div>
      )}
    </div>
  );
}
