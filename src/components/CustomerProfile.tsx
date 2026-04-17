import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Building2, Phone, Mail, MapMarker, 
  CreditCard, TrendingUp, Calendar, AlertCircle,
  ArrowLeft, ShoppingCart, UserCheck, Star
} from 'lucide-react';
import api from '../lib/api';

interface CustomerDetail {
  id: number;
  name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  segment: 'VIP' | 'REGULAR' | 'RISK';
  debt_status: 'HEALTHY' | 'OVERDUE';
  credit_limit: number;
  balance: number;
  total_revenue: number;
  avg_order_value: number;
  last_purchase_date: string;
  order_count: number;
}

interface Order {
  id: number;
  invoice_number: string;
  date: string;
  total_amount: number;
  status: string;
}

interface Props {
  customerId: number;
  onBack: () => void;
}

export default function CustomerProfile({ customerId, onBack }: Props) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      const [cusRes, ordRes] = await Promise.all([
        api.get(`sales/customers/${customerId}/`),
        api.get(`sales/invoices/?customer=${customerId}`)
      ]);
      setCustomer(cusRes.data);
      setOrders(ordRes.data.results || ordRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));

  if (loading || !customer) return <div className="p-12 text-center text-slate-500 font-bold">Mijoz ma'lumotlari yuklanmoqda...</div>;

  const segmentColors = {
    VIP: 'bg-amber-100 text-amber-700 border-amber-200',
    REGULAR: 'bg-blue-100 text-blue-700 border-blue-200',
    RISK: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{customer.company_name || customer.name}</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${segmentColors[customer.segment]}`}>
               {customer.segment}
             </span>
             <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${customer.debt_status === 'OVERDUE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
               {customer.debt_status}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Kontakt ma'lumotlari
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold">Kompaniya</p>
                  <p className="text-sm font-bold text-slate-800">{customer.company_name || 'Shaxsiy'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold">Telefon</p>
                  <p className="text-sm font-bold text-slate-800">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold">Email</p>
                  <p className="text-sm font-bold text-slate-800">{customer.email || 'Kiritilmagan'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
             <CreditCard className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4" />
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Moliyaviy Holat</h3>
             <div className="space-y-2 relative z-10">
                <p className="text-xs text-slate-400 font-bold">Umumiy Qarzdorlik</p>
                <p className={`text-2xl font-black ${customer.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {fmt(customer.balance)} <span className="text-xs">uzs</span>
                </p>
             </div>
             <div className="pt-4 border-t border-white/10 relative z-10">
                <p className="text-xs text-slate-400 font-bold">Kredit Limiti</p>
                <p className="text-lg font-bold">{fmt(customer.credit_limit)} <span className="text-xs">uzs</span></p>
             </div>
          </div>
        </div>

        {/* Middle: Intelligence Stats */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Jami Savdo', value: fmt(customer.total_revenue), unit: 'uzs', icon: TrendingUp, color: 'text-indigo-600' },
                { label: 'Buyurtmalar', value: customer.order_count, unit: 'ta', icon: ShoppingCart, color: 'text-amber-600' },
                { label: 'O\'rtacha Chek', value: fmt(customer.avg_order_value), unit: 'uzs', icon: Star, color: 'text-emerald-600' },
                { label: 'Oxirgi xarid', value: customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'N/A', unit: '', icon: Calendar, color: 'text-rose-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                  <p className="text-lg font-black text-slate-800">{stat.value} <span className="text-[10px] font-bold text-slate-400">{stat.unit}</span></p>
                </div>
              ))}
           </div>

           {/* Orders History */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Buyurtmalar Tarixi</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-3">Invoys</th>
                      <th className="px-6 py-3">Sana</th>
                      <th className="px-6 py-3">Summa</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-indigo-600">{order.invoice_number}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-xs font-black text-slate-800">{fmt(order.total_amount)} uzs</td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-slate-100 text-[9px] font-black rounded-lg uppercase">{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
