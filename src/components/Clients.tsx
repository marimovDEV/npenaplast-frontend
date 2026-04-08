import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Phone, DollarSign, ChevronRight, 
  Trash2, Edit2, X, Clock, Calendar, Plus, Search, 
  Building2, History, FileText, Filter,
  Briefcase, UserCheck, ShieldAlert, BadgeCheck,
  MessageSquare, Star, UserPlus, Info, CheckCircle,
  AlertCircle, XCircle
} from 'lucide-react';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { Client, Invoice, Cashbox, ContactLog, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';

type ModalType = 'ADD' | 'EDIT' | 'PAYMENT' | 'ORDERS' | 'CRM';

export default function Clients({ user }: { user: User }) {
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WHOLESALE' | 'RETAIL' | 'DEBT' | 'LEAD'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('ADD');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  
  // CRM / History state
  const [clientOrders, setClientOrders] = useState<Invoice[]>([]);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);

  // Form states
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    company_name: '',
    phone: '',
    secondary_phone: '',
    email: '',
    address: '',
    stir_inn: '',
    customer_type: 'RETAIL',
    lead_status: 'LEAD',
    interest_level: 'MEDIUM',
    credit_limit: 0
  });

  const [crmLogData, setCrmLogData] = useState({
    contact_type: 'CALL',
    notes: '',
    follow_up_date: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    cashbox_id: '',
    description: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('clients/');
      setClients(response.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashboxes = async () => {
    try {
      const res = await api.get('finance/cashboxes/');
      setCashboxes(res.data);
      if (res.data.length > 0) {
        setPaymentData(prev => ({ ...prev, cashbox_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch cashboxes", err);
    }
  };

  const fetchClientData = async (clientId: number) => {
    try {
      const [ordersRes, logsRes] = await Promise.all([
        api.get(`sales/invoices/?customer=${clientId}`),
        api.get(`clients/${clientId}/contact-logs/`)
      ]);
      setClientOrders(ordersRes.data);
      setContactLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to fetch client data", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCashboxes();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modalType === 'ADD') {
        await api.post('clients/', formData);
        uiStore.showNotification(t("Mijoz muvaffaqiyatli qo'shildi"), "success");
      } else {
        await api.put(`clients/${selectedClient?.id}/`, formData);
        uiStore.showNotification(t("Mijoz ma'lumotlari yangilandi"), "success");
      }
      fetchClients();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      uiStore.showNotification(t("Xatolik yuz berdi"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCRMLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await api.post(`clients/${selectedClient.id}/add-contact-log/`, crmLogData);
      uiStore.showNotification(t("Muloqot tarixi saqlandi"), "success");
      fetchClientData(selectedClient.id);
      setCrmLogData({ contact_type: 'CALL', notes: '', follow_up_date: '' });
    } catch (err) {
      uiStore.showNotification(t("Xatolik"), "error");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(t(`${name}ni bazadan o'chirmoqchimisiz?`))) {
      try {
        await api.delete(`clients/${id}/`);
        uiStore.showNotification(t("Mijoz o'chirildi"), "info");
        fetchClients();
      } catch (err) {
        uiStore.showNotification(t("Mijozni o'chirib bo'lmadi"), "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', company_name: '', phone: '', secondary_phone: '', email: '',
      address: '', stir_inn: '', customer_type: 'RETAIL',
      lead_status: 'LEAD', interest_level: 'MEDIUM', credit_limit: 0
    });
    setSelectedClient(null);
  };

  const openCRMModal = (client: Client) => {
    setModalType('CRM');
    setSelectedClient(client);
    fetchClientData(client.id);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'DEBT') return matchesSearch && c.balance < 0;
    if (filterType === 'LEAD') return matchesSearch && c.lead_status === 'LEAD';
    return matchesSearch && c.customer_type === filterType;
  });

  const getInterestColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'LOW': return 'text-slate-500 bg-slate-50 border-slate-100';
      default: return 'bg-slate-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'LEAD': return { label: t('Yangi Lead'), color: 'blue', icon: UserPlus };
      case 'NEGOTIATION': return { label: t('Muzokara'), color: 'amber', icon: MessageSquare };
      case 'WON': return { label: t('Yutilgan (Mijoz)'), color: 'emerald', icon: BadgeCheck };
      case 'LOST': return { label: t('Boy berilgan'), color: 'rose', icon: XCircle };
      default: return { label: status, color: 'slate', icon: Info };
    }
  };

  const Trophy = ({ className }: { className?: string }) => <CheckCircle className={className} />;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('Mijozlar & CRM')}</h1>
          <p className="text-slate-500 text-sm font-medium">{t('Barcha hamkorlar, leadlar va aloqa tarixi')}</p>
        </div>
        
        <button 
          onClick={() => { setModalType('ADD'); resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Mijoz Qo\'shish')}</span>
        </button>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const status = getStatusBadge(client.lead_status);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={client.id} 
                className="bg-white rounded-[44px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <UserIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{client.name}</h4>
                      <p className="text-xs font-bold text-slate-400">{client.company_name || t('Shaxsiy mijoz')}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getInterestColor(client.interest_level)}`}>
                    {client.interest_level === 'HIGH' ? '🔥 ' + t('Yuqori') : client.interest_level === 'MEDIUM' ? '⚡ ' + t('O\'rtacha') : '❄️ ' + t('Past')}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                     <Phone className="w-4 h-4 text-blue-500" />
                     {client.phone}
                  </div>
                  <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest p-3 rounded-2xl border bg-${status.color}-50 text-${status.color}-600 border-${status.color}-100`}>
                     <status.icon className="w-4 h-4" />
                     {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => openCRMModal(client)}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all"
                   >
                     <MessageSquare className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase">CRM</span>
                   </button>
                   <button 
                    onClick={() => { setSelectedClient(client); setFormData({...client}); setModalType('EDIT'); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-100 transition-all"
                   >
                     <Edit2 className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase">{t('Tahrirlash')}</span>
                   </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Advanced CRM Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              layoutId="modal"
              className={`bg-white w-full ${modalType === 'CRM' ? 'max-w-5xl' : 'max-w-2xl'} rounded-[56px] shadow-2xl overflow-hidden`}
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">{selectedClient?.name || t('Mijoz')}</h2>
                  <p className="text-slate-400 font-medium">{modalType === 'CRM' ? t('CRM Muloqot Markazi') : t('Ma\'lumotlarni tahrirlash')}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {modalType === 'CRM' ? (
                <div className="grid grid-cols-12 max-h-[70vh]">
                   {/* Left Side: Interaction History */}
                   <div className="col-span-7 p-10 overflow-y-auto space-y-6 bg-slate-50/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('Muloqot Tarixi')}</h4>
                        <div className="flex gap-2">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">{contactLogs.length} {t('ta aloqa')}</span>
                        </div>
                      </div>
                      
                      {contactLogs.map((log) => (
                        <div key={log.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500">
                                 {log.contact_type === 'CALL' ? <Phone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800">{log.manager_name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(log.created_at).toLocaleString()}</p>
                              </div>
                           </div>
                           <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">{log.notes}</p>
                           {log.follow_up_date && (
                             <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 p-2 px-4 rounded-xl inline-flex">
                                <Calendar className="w-3.5 h-3.5" />
                                {t('Keyingi aloqa')}: {log.follow_up_date}
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                   
                   {/* Right Side: Add Log Form */}
                   <div className="col-span-5 p-10 border-l border-slate-50">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">{t('Yangi muloqot kiritish')}</h4>
                      <form onSubmit={handleAddCRMLog} className="space-y-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aloqa turi</label>
                            <select 
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold"
                              value={crmLogData.contact_type}
                              onChange={(e) => setCrmLogData({...crmLogData, contact_type: e.target.value})}
                            >
                              <option value="CALL">📞 {t('Telefon')}</option>
                              <option value="TELEGRAM">✈️ Telegram</option>
                              <option value="MEETING">🤝 {t('Uchrashuv')}</option>
                              <option value="EMAIL">📧 Email</option>
                            </select>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Natija / Izoh')}</label>
                            <textarea 
                              rows={5}
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                              placeholder={t("Mijoz nima dedi?") + "..."}
                              value={crmLogData.notes}
                              onChange={(e) => setCrmLogData({...crmLogData, notes: e.target.value})}
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Keyingi aloqa sanasi')}</label>
                            <input 
                              type="date" 
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold"
                              value={crmLogData.follow_up_date}
                              onChange={(e) => setCrmLogData({...crmLogData, follow_up_date: e.target.value})}
                            />
                         </div>
                         <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <BadgeCheck className="w-5 h-5" />
                            {t('Saqlash')}
                         </button>
                      </form>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleCreateOrUpdate} className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <input className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder={t("FIO")} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    <input className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder={t("Kompaniya")} value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} />
                    <input className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" placeholder={t("Telefon")} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    <select className="p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={formData.lead_status} onChange={(e) => setFormData({...formData, lead_status: e.target.value as any})}>
                      <option value="LEAD">{t('Yangi Lead')}</option>
                      <option value="NEGOTIATION">{t('Muzokara')}</option>
                      <option value="WON">{t('Yutilgan')}</option>
                      <option value="LOST">{t('Boy berilgan')}</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px]">{t('Mijozni Saqlash')}</button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
