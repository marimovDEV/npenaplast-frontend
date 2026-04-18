import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  Package, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Box,
  Truck,
  ArrowUpRight,
  Maximize,
  Weight,
  Clock,
  X,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { User, StockItem, BlockProduction, Inventory, Client } from '../types';

interface WarehouseUnifiedProps {
  user: User;
}

type WarehouseTab = 'RAW' | 'WIP' | 'FINISHED' | 'TRANSFERS';

export default function WarehouseUnified({ user }: WarehouseUnifiedProps) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<WarehouseTab>('RAW');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [stocks, setStocks] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<BlockProduction[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Modal States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const isAdmin = ['Bosh Admin', 'Admin'].includes(user.role || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'RAW') {
        const res = await api.get('stocks/', { params: { warehouse_name: 'Sklad №1' } });
        setStocks(res.data);
      } else if (activeTab === 'WIP') {
        const res = await api.get('production/blocks/');
        setBlocks(res.data);
      } else if (activeTab === 'FINISHED') {
        const res = await api.get('stocks/', { params: { warehouse: 3 } }); // Sklad 4
        setStocks(res.data);
        const cRes = await api.get('clients/');
        setClients(cRes.data);
      } else if (activeTab === 'TRANSFERS') {
        const res = await api.get('warehouse/transfers/'); // Future endpoint
        setTransfers(res.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const renderRawStock = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Jami Qiymat')}</p>
              <h4 className="text-xl font-black text-slate-900">{stocks.reduce((acc, s) => acc + (s.total_value || 0), 0).toLocaleString()} UZS</h4>
           </div>
        </div>
        {/* Add more KPIs here */}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Material')}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Miqdor')}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Holat')}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stocks.map(stock => (
              <tr key={stock.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                      {stock.material_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{stock.material_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{stock.material_unit}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center font-black text-slate-700">{stock.quantity.toLocaleString()}</td>
                <td className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest">
                   {stock.status === 'CRITICAL' ? <span className="text-rose-500 bg-rose-50 px-3 py-1 rounded-full">{t('Tanqislik')}</span> : <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">OK</span>}
                </td>
                <td className="px-8 py-5 text-right">
                   <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ArrowUpRight className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWIP = () => (
    <div className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Quritilmoqda')}</p>
             <h4 className="text-xl font-black text-amber-600">{blocks.filter(b => b.status === 'DRYING').length} {t('dona')}</h4>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Tayyor Bloklar')}</p>
             <h4 className="text-xl font-black text-emerald-600">{blocks.filter(b => b.status === 'READY').length} {t('dona')}</h4>
          </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map(block => (
            <div key={block.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Box className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${block.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {t(block.status)}
                  </span>
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-1">{t('Zames')}: {block.zames_number}</h3>
               <p className="text-xs font-bold text-slate-400 mb-4">{block.density} kg/m³ | {block.block_count} dona</p>
               <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">{t('Batafsil')}</button>
                  {block.status === 'READY' && <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Scissors className="w-4 h-4" /></button>}
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-xl">
               <Database className="w-6 h-6" />
             </div>
             {t('Enterprise Ombor Boshqaruvi')}
           </h1>
           <p className="text-slate-500 font-medium">{t('Barcha skladlar va materiallar oqimi nazorati')}</p>
        </div>

        <div className="flex items-center gap-3">
           <button className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('Kirim')}
           </button>
           <button className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              {t('O\'tkazma')}
           </button>
        </div>
      </div>

      {/* Unified Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[28px] w-fit border border-slate-200 shadow-inner">
        {[
          { id: 'RAW', name: t('Xom Ashyo'), icon: Database },
          { id: 'WIP', name: t('Yarim Tayyor (WIP)'), icon: Layers },
          { id: 'FINISHED', name: t('Tayyor Mahsulot'), icon: Package },
          { id: 'TRANSFERS', name: t('O\'tkazmalar'), icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as WarehouseTab)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-lg ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
             <div className="flex items-center justify-center py-40">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             </div>
          ) : activeTab === 'RAW' ? (
             renderRawStock()
          ) : activeTab === 'WIP' ? (
             renderWIP()
          ) : activeTab === 'FINISHED' ? (
             <div className="p-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest">
                {t('Tayyor mahsulotlar ro\'yxati')}
             </div>
          ) : (
            <div className="p-24 bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
              <Truck className="w-20 h-20 text-slate-100 mb-6" />
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">{t('Harakatlar Tarixi')}</h3>
              <p className="text-slate-300 text-sm mt-2 font-black uppercase tracking-widest italic">{t('Tez kunda')}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
