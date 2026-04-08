import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShoppingCart, 
  Trash2,
  Truck,
  DollarSign,
  Filter,
  ArrowRight,
  ArrowLeft,
  QrCode,
  LayoutGrid,
  List,
  Target,
  Users,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { User, Invoice, Product, Client } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import MobileCard from './common/MobileCard';
import { useI18n } from '../i18n';

type ViewMode = 'KANBAN' | 'LIST';

export default function Sales({ user }: { user: User }) {
  const { locale, t } = useI18n();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<ViewMode>(window.innerWidth < 768 ? 'LIST' : 'KANBAN');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New Order Wizard State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerId: '',
    paymentMethod: 'CASH',
    deliveryAddress: '',
    notes: '',
    discount: 0,
    warehouseId: '4' // Default to Sklad 4 (Tayyor mahsulot)
  });
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    price: 0
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, clientsRes, productsRes] = await Promise.all([
        api.get('sales/invoices/'),
        api.get('clients/'),
        api.get('products/'),
      ]);
      setInvoices(invRes.data);
      setClients(clientsRes.data);
      setProducts(productsRes.data);
      
      // Warehouse fetch is optional — may 403 for non-admin roles
      try {
        const whRes = await api.get('warehouses/');
        setWarehouses(whRes.data);
      } catch (e) {
        console.warn("Warehouses not accessible for this role");
      }
    } catch (err) {
      console.error("Failed to fetch sales data", err);
      uiStore.showNotification(t("Ma'lumotlarni yuklashda xatolik"), "error");
    } finally {
      setLoading(false);
    }
  };

  // KPI State
  const [kpi, setKpi] = useState<any>(null);

  const fetchKPI = async () => {
    try {
      const res = await api.get('sales/kpi/');
      setKpi(res.data);
    } catch (err) {
      console.error("Failed to fetch KPI", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchKPI();
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode('LIST');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      uiStore.showNotification(t("Savat bo'sh!"), "error");
      return;
    }

    try {
      setLoading(true);
      await api.post('sales/invoices/create-invoice/', {
        warehouse_id: parseInt(formData.warehouseId),
        customer_id: parseInt(formData.customerId),
        items: cartItems.map(item => ({
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          price: item.price
        })),
        payment_method: formData.paymentMethod,
        delivery_address: formData.deliveryAddress,
        notes: formData.notes,
        discount_amount: formData.discount
      });

      uiStore.showNotification(t("Buyurtma muvaffaqiyatli yaratildi"), "success");
      setIsAddingOrder(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      const msg = t(err.response?.data?.error || "Xatolik yuz berdi");
      uiStore.showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (id: number, status: string) => {
    try {
      await api.post(`sales/invoices/${id}/transition-status/`, { status });
      uiStore.showNotification(t("Holat o'zgartirildi") + `: ${t(status)}`, "success");
      fetchData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleExport = async (format: 'PDF' | 'EXCEL') => {
    try {
      const response = await api.get(`sales/export/?file_format=${format}&period=This%20Month`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: format === 'PDF' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-export.${format === 'PDF' ? 'pdf' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      uiStore.showNotification(t("Sotuv exportida xatolik"), "error");
    }
  };

  const resetForm = () => {
    setStep(1);
    setIsAddingOrder(false);
    setCartItems([]);
    setFormData({
      customerId: '',
      paymentMethod: 'CASH',
      deliveryAddress: '',
      notes: '',
      discount: 0,
      warehouseId: '4'
    });
  };

  const addToCart = () => {
    const product = products.find(p => String(p.id) === currentItem.productId);
    if (!product) return;

    setCartItems([...cartItems, {
      ...currentItem,
      name: product.name,
      total: currentItem.quantity * currentItem.price
    }]);

    setCurrentItem({ productId: '', quantity: 1, price: 0 });
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = String(inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalCartAmount = cartItems.reduce((sum, item) => sum + item.total, 0) - formData.discount;

  const columns = [
    { id: 'NEW', name: t('Yangi'), color: 'blue', icon: Clock },
    { id: 'CONFIRMED', name: t('Tasdiqlangan'), color: 'amber', icon: CheckCircle2 },
    { id: 'IN_PRODUCTION', name: t('Ishlab chiq.'), color: 'orange', icon: Activity },
    { id: 'READY', name: t('Tayyor'), color: 'emerald', icon: CheckCircle2 },
    { id: 'SHIPPED', name: t('Jo\'natilgan'), color: 'indigo', icon: Truck },
    { id: 'EN_ROUTE', name: t('Yo\'lda'), color: 'purple', icon: Truck },
    { id: 'DELIVERED', name: t('Yetkazildi'), color: 'teal', icon: CheckCircle2 },
    { id: 'COMPLETED', name: t('Yakunlangan'), color: 'emerald', icon: DollarSign },
  ];

  return (
    <div className="space-y-4 md:space-y-8 pb-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl md:rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-200 flex-none">
            <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight truncate">{t('Savdo & CRM')}</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium flex items-center gap-2 truncate">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              {t('Savdo voronkasi va mijozlar nazorati')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <button onClick={() => handleExport('PDF')} className="flex-1 sm:flex-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">PDF</button>
            <button onClick={() => handleExport('EXCEL')} className="flex-1 sm:flex-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">Excel</button>
          </div>
          {!isMobile && (
          <div className="flex bg-slate-100 p-1.5 rounded-[22px] border border-slate-200">
            <button 
              onClick={() => setViewMode('KANBAN')}
              className={`p-2.5 rounded-2xl transition-all ${viewMode === 'KANBAN' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('LIST')}
              className={`p-2.5 rounded-2xl transition-all ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          )}

          <button 
            onClick={() => setIsAddingOrder(true)}
            className="flex w-full md:w-auto items-center justify-center gap-2 md:gap-3 bg-slate-900 text-white px-5 md:px-10 py-3 md:py-4.5 rounded-2xl md:rounded-[26px] font-black text-[11px] md:text-[12px] uppercase tracking-widest hover:bg-black shadow-2xl shadow-slate-200 active:scale-95 transition-all touch-target"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('Yangi Buyurtma')}</span>
            <span className="sm:hidden">{t('Buyurtma')}</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: t('Bugungi Savdo'), value: kpi ? new Intl.NumberFormat(locale).format(kpi.today_sum) + ' UZS' : '...', icon: TrendingUp, color: 'blue' },
          { label: t('Aktiv Buyurtmalar'), value: kpi ? kpi.active_orders : '...', icon: Target, color: 'emerald' },
          { label: t('Oylik Reja'), value: kpi ? `${kpi.monthly_progress}%` : '...', icon: Activity, color: 'amber' },
          { label: t('Konversiya'), value: kpi ? `${kpi.conversion_rate}%` : '...', icon: Users, color: 'indigo' },
        ].map((kpiItem, i) => (
          <div key={i} className="card-responsive p-5 md:p-8 flex items-center gap-4 md:gap-6 hover:shadow-lg transition-all">
            <div className={`w-10 h-10 md:w-14 md:h-14 bg-${kpiItem.color}-50 rounded-xl md:rounded-2xl flex items-center justify-center text-${kpiItem.color}-600 shrink-0`}>
              <kpiItem.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs-bold text-slate-400 mb-1 truncate">{kpiItem.label}</p>
              <p className="text-base md:text-xl font-black text-slate-900 truncate leading-none">{kpiItem.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-slate-400" />
           </div>
           <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('Savdo Voronkasi')}</h3>
        </div>
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-all" />
          <input 
            type="text" 
            placeholder={t("Buyurtmalarni qidirish") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-transparent rounded-[20px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold" 
          />
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'KANBAN' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[600px]">
          {columns.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[350px]">
              <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${col.color}-50 rounded-xl flex items-center justify-center text-${col.color}-600 border border-${col.color}-100`}>
                    <col.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">{col.name}</h4>
                </div>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400">
                  {filteredInvoices.filter(inv => inv.status === col.id).length}
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredInvoices.filter(inv => inv.status === col.id).map((inv) => (
                  <motion.div 
                    layoutId={String(inv.id)}
                    key={inv.id} 
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100">{inv.invoice_number}</span>
                      <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical className="w-5 h-5" /></button>
                    </div>
                    
                    <h5 className="text-base font-black text-slate-900 mb-1 leading-tight">{inv.customer_name}</h5>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2">
                        {inv.items.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-5 h-5 bg-slate-100 border-2 border-white rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{inv.items.length} {t('turdagi tovarlar')}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{t('Summa')}</p>
                          <p className="font-black text-slate-900">{inv.total_amount.toLocaleString()} <span className="text-[8px] text-slate-300">UZS</span></p>
                       </div>
                       
                       {inv.status === 'NEW' && (
                         <button onClick={() => handleStatusTransition(inv.id, 'CONFIRMED')} className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"><ArrowRight className="w-5 h-5" /></button>
                       )}
                       {inv.status === 'CONFIRMED' && (
                         <button onClick={() => handleStatusTransition(inv.id, 'SHIPPED')} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"><Truck className="w-5 h-5" /></button>
                       )}
                       {inv.status === 'SHIPPED' && (
                         <button onClick={() => handleStatusTransition(inv.id, 'COMPLETED')} className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"><DollarSign className="w-5 h-5" /></button>
                       )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!isMobile && (
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Ma\'lumot')}</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Mijoz')}</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Summa')}</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Holati')}</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-10 py-6 font-black text-slate-900">{inv.invoice_number}</td>
                      <td className="px-10 py-6">
                        <p className="font-black text-slate-700">{inv.customer_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{inv.payment_method_display}</p>
                      </td>
                      <td className="px-10 py-6 font-black text-blue-600">{inv.total_amount.toLocaleString()} UZS</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          inv.status === 'NEW' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          inv.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          inv.status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {inv.status_display}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-3 text-slate-300 hover:text-slate-600 transition-all"><MoreVertical className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isMobile && (
            <div className="space-y-1 animate-slide-up">
              {filteredInvoices.map((inv) => (
                <MobileCard
                  key={inv.id}
                  title={inv.invoice_number}
                  subtitle={inv.customer_name}
                  icon={ShoppingCart}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  status={{
                    label: inv.status_display,
                    variant: inv.status === 'NEW' ? 'info' :
                             inv.status === 'CONFIRMED' ? 'warning' :
                             inv.status === 'COMPLETED' ? 'success' : 'default'
                  }}
                  rightElement={
                    <span className="text-xs font-black text-blue-600 whitespace-nowrap">{inv.total_amount.toLocaleString()} UZS</span>
                  }
                  footer={
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{inv.payment_method_display}</span>
                      <div className="flex gap-2">
                        {inv.status === 'NEW' && (
                          <button onClick={() => handleStatusTransition(inv.id, 'CONFIRMED')} className="touch-target px-4 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-100">{t('Tasdiq')}</button>
                        )}
                        {inv.status === 'CONFIRMED' && (
                          <button onClick={() => handleStatusTransition(inv.id, 'SHIPPED')} className="touch-target px-4 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">{t('Jo\'natish')}</button>
                        )}
                        {inv.status === 'SHIPPED' && (
                          <button onClick={() => handleStatusTransition(inv.id, 'COMPLETED')} className="touch-target px-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">{t('Yakunlash')}</button>
                        )}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* New Order Modal Wizard */}
      <AnimatePresence>
        {isAddingOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-5xl rounded-[28px] md:rounded-[56px] shadow-2xl overflow-hidden my-auto border border-white/20"
            >
              <div className="p-5 md:p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-200">
                    <ShoppingCart className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Buyurtma Ustasi')}</h2>
                    <div className="flex items-center gap-3 mt-1">
                       {[1, 2, 3].map((s) => (
                         <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`} />
                       ))}
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('Qadam')} {step} / 3</span>
                    </div>
                  </div>
                </div>
                <button onClick={resetForm} className="p-3 bg-white text-slate-300 hover:text-rose-500 hover:shadow-lg rounded-[20px] transition-all border border-slate-100"><XCircle className="w-8 h-8" /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                {/* Wizard Panel */}
                <div className="lg:col-span-4 border-r border-slate-50 p-5 md:p-10 bg-slate-50/20">
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Mijozni tanlang')}</label>
                          <select 
                            className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-500 font-bold text-base shadow-sm transition-all"
                            value={formData.customerId}
                            onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                          >
                            <option value="">{t('Mijozni tanlang')}...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('To\'lov usuli')}</label>
                          <div className="grid grid-cols-2 gap-3">
                             {['CASH', 'BANK', 'CARD', 'DEBT'].map((m) => (
                               <button 
                                 key={m}
                                 onClick={() => setFormData({...formData, paymentMethod: m})}
                                 className={`p-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${formData.paymentMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}
                               >
                                 {m === 'CASH' ? t('Naqd') : m === 'BANK' ? t('Perezich') : m === 'CARD' ? t('Karta') : t('Qarz')}
                               </button>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Mahsulot qidirish')}</label>
                          <div className="relative">
                            <QrCode className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                            <select 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-500 font-bold text-base shadow-sm transition-all appearance-none"
                              value={currentItem.productId}
                              onChange={(e) => {
                                const p = products.find(x => String(x.id) === e.target.value);
                                setCurrentItem({...currentItem, productId: e.target.value, price: p?.price || 0});
                              }}
                            >
                              <option value="">{t('Mahsulotni tanlang')}...</option>
                              {products.filter(p => !p.type?.includes('RAW')).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Miqdor')}</label>
                            <input 
                              type="number" 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-500 font-bold text-base shadow-sm"
                              value={currentItem.quantity}
                              onChange={(e) => setCurrentItem({...currentItem, quantity: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Narxi')}</label>
                            <input 
                              type="number" 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-500 font-bold text-base shadow-sm"
                              value={currentItem.price}
                              onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                       </div>
                       <button 
                        onClick={addToCart}
                        disabled={!currentItem.productId}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                       >
                         {t('Savatga qo\'shish')} &rarr;
                       </button>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Chegirma')} (UZS)</label>
                          <input 
                            type="number" 
                            className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-rose-500 font-black text-xl text-rose-600 shadow-sm"
                            value={formData.discount}
                            onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Izoh')}</label>
                          <textarea 
                            rows={4}
                            className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] outline-none focus:border-blue-500 font-bold text-sm shadow-sm"
                            placeholder={t("Ixtiyoriy izohlar") + "..."}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          />
                       </div>
                    </motion.div>
                  )}
                </div>

                {/* Cart/Summary Panel */}
                <div className="lg:col-span-8 p-5 md:p-10 flex flex-col">
                   <div className="flex-1 space-y-4 overflow-y-auto mb-10 pr-4">
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center font-black text-xs text-slate-300">
                                {idx + 1}
                              </div>
                              <div>
                                 <p className="text-base font-black text-slate-900 leading-tight mb-1">{item.name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} {t('dona')} x {item.price.toLocaleString()} UZS</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <p className="text-lg font-black text-blue-600">{item.total.toLocaleString()} UZS</p>
                              <button onClick={() => removeFromCart(idx)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="pt-6 md:pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-end">
                      <div className="space-y-2">
                         <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('Umumiy Summa')}</span>
                         <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {totalCartAmount.toLocaleString()} <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">UZS</span>
                         </h3>
                         {formData.discount > 0 && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{t('Chegirma')}: -{formData.discount.toLocaleString()}</p>}
                      </div>
                      <div className="flex gap-4">
                         {step > 1 && (
                           <button onClick={() => setStep(step - 1)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[28px] font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                              <ArrowLeft className="w-4 h-4" />
                              {t('Orqaga')}
                           </button>
                         )}
                         <button 
                           onClick={() => step < 3 ? setStep(step + 1) : handleCreateOrder()}
                           disabled={step === 1 && !formData.customerId}
                           className="flex-[2] py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                         >
                            {step === 3 ? t('Tasdiqlash') : t('Keyingi')}
                            <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
