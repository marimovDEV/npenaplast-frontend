import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Truck, 
  Box, 
  FileText,
  Activity,
  ArrowRight,
  Database,
  QrCode,
  DollarSign,
  AlertCircle,
  TrendingUp,
  History,
  Printer,
  Camera,
  Package,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import api from '../lib/api';
import { RawMaterial } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import QRLabel from './QRLabel';
import DocumentTemplate from './DocumentTemplate';
import MobileCard from './common/MobileCard';

const ScannerModal = lazy(() => import('./ScannerModal'));

export default function Sklad1({ user }: { user: any }) {
  const assignedWarehouses = (user.assignedWarehouses || user.assigned_warehouses || []).map(String);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrintingDocument, setIsPrintingDocument] = useState<any>(null);
  const [isPrintingLabel, setIsPrintingLabel] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'DOCUMENTS'>('INVENTORY');
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Receive Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [receiveItems, setReceiveItems] = useState([
    { productId: '', quantity: '', price: '' }
  ]);
  const [currency, setCurrency] = useState('UZS');
  
  // Transfer Form State
  const [transferQty, setTransferQty] = useState('');
  const [targetShop, setTargetShop] = useState('ZAMES'); // ZAMES, CNC, etc.

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const wRes = await api.get('warehouses/?name=Sklad №1');
      if (wRes.data.length > 0) {
        const wid = wRes.data[0].id;
        setWarehouseId(wid);
        
        // Fetch raw material batches for Sklad 1
        const batchRes = await api.get('batches/');
        setMaterials(batchRes.data.map((b: any) => ({
          id: b.id,
          batchNumber: b.batch_number,
          supplier: b.supplier_name,
          date: new Date(b.date).toLocaleDateString(),
          quantity_kg: b.quantity_kg,
          remaining_quantity: b.remaining_quantity,
          reserved_quantity: b.reserved_quantity,
          responsiblePerson: b.responsible_user_name || 'System',
          status: b.status,
          code: b.material_sku || 'RM-SKU',
          name: b.material_name || 'Noma\'lum mahsulot',
          productId: b.material,
          qr_code: b.qr_code
        })));

        // Fetch documents for Sklad 1
        const docRes = await api.get('documents/', { params: { from_warehouse: wid, to_warehouse: wid } });
        setDocuments(docRes.data);
      }
      
      const pRes = await api.get('products/?type=RAW');
      setProducts(pRes.data);
      
      const sRes = await api.get('suppliers/');
      setSuppliers(sRes.data);
      if (sRes.data.length > 0) setSupplierId(sRes.data[0].id);

      if (pRes.data.length > 0) {
        setReceiveItems([{ productId: pRes.data[0].id, quantity: '', price: '' }]);
      }
    } catch (err) {
      console.error("Failed to fetch Sklad 1 data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (id: number, action: 'confirm' | 'cancel' | 'complete' | 'receive') => {
    try {
      setLoading(true);
      await api.post(`documents/${id}/${action}/`);
      uiStore.showNotification(`Hujjat ${action} qilindi`, "success");
      fetchData();
    } catch (err) {
      uiStore.showNotification("Xatolik: " + (err as any).message, "error");
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

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return;

    setLoading(true);
    try {
      const totalAmount = receiveItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
      
      const res = await api.post('documents/', {
        number: invoiceNumber || `INV-IN-${Date.now()}`,
        type: 'HISOB_FAKTURA_KIRIM',
        to_warehouse: warehouseId,
        supplier: supplierId,
        currency,
        total_amount: totalAmount,
        items: receiveItems.map(item => ({ 
            product: Number(item.productId), 
            quantity: Number(item.quantity),
            price_at_moment: Number(item.price)
        }))
      });
      
      uiStore.showNotification("Kirim muvaffaqiyatli bajarildi", "success");
      fetchData();
      setIsReceiveModalOpen(false);
      
      // Prompt to print document
      setIsPrintingDocument(res.data);
      resetReceiveForm();
    } catch (err) {
      uiStore.showNotification("Xatolik: " + (err as any).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !warehouseId) return;

    setLoading(true);
    try {
      // Create Internal Waybill (ICHKI_NAKLADNOY)
      // Note: The backend consume_material_fifo logic in complete_document
      // will handle the actual batch deduction based on FIFO.
      await api.post('documents/', {
        number: `TRF-${Date.now()}`,
        type: 'ICHKI_YUK_XATI',
        from_warehouse: warehouseId,
        to_warehouse: warehouseId, 
        notes: `${targetShop} sexiga uzatish`,
        items: [{ 
            product: (selectedBatch as any).productId, 
            quantity: Number(transferQty)
        }]
      });

      uiStore.showNotification(`${targetShop} sexiga uzatildi`, "success");
      fetchData();
      setIsTransferModalOpen(false);
      setTransferQty('');
    } catch (err) {
      uiStore.showNotification("Xatolik: " + (err as any).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetReceiveForm = () => {
    setInvoiceNumber('');
    setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    if (products.length > 0) {
      setReceiveItems([{ productId: products[0].id, quantity: '', price: '' }]);
    }
  };

  const addReceiveItem = () => {
    if (products.length > 0) {
      setReceiveItems([...receiveItems, { productId: products[0].id, quantity: '', price: '' }]);
    }
  };

  const updateReceiveItem = (index: number, field: string, value: string) => {
    const newItems = [...receiveItems];
    (newItems[index] as any)[field] = value;
    setReceiveItems(newItems);
  };

  const removeReceiveItem = (index: number) => {
    if (receiveItems.length > 1) {
      setReceiveItems(receiveItems.filter((_, i) => i !== index));
    }
  };

  const filteredMaterials = materials.filter(m => 
    (m as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = {
    total: materials.reduce((acc, current) => acc + (current as any).remaining_quantity, 0),
    eps: materials.filter(m => (m as any).name?.toLowerCase().includes('eps')).reduce((acc, m) => acc + (m as any).remaining_quantity, 0),
    kley: materials.filter(m => (m as any).name?.toLowerCase().includes('kley')).reduce((acc, m) => acc + (m as any).remaining_quantity, 0),
  };

  if (!assignedWarehouses.includes('*') && !assignedWarehouses.includes('sklad1') && !assignedWarehouses.includes('1')) {
     return <div className="p-10 text-center font-bold text-slate-400 italic">Ruxsat mavjud emas</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Database className="w-6 h-6" />
            </div>
            Sklad №1 (Xom Ashyo)
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Nomenklatura, partiyalar va ishlab chiqarishga uzatish</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>QR Skaynerlash</span>
          </button>
          <button 
            onClick={() => setIsReceiveModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Kirim (Faktura)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700 opacity-50" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Umumiy Qoldiq</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{totals.total.toLocaleString()} <span className="text-xs text-slate-400">kg</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700 opacity-50" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-rose-500 w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-rose-100">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">EPS Granula</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{totals.eps.toLocaleString()} <span className="text-xs text-slate-400">kg</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700 opacity-50" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-500 w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Kam Qolgan</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">2 <span className="text-xs text-slate-400">turi</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[22px] w-full sm:w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'INVENTORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Ombor Qoldig'i
        </button>
        <button 
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'DOCUMENTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Hujjatlar & Buyruqlar
        </button>
      </div>

      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Material yoki partiya qidirish..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="min-h-[400px]">
            {isMobile ? (
              <div className="p-3 space-y-1 animate-slide-up">
                {filteredMaterials.map((m) => {
                  const available = (m as any).remaining_quantity - ((m as any).reserved_quantity || 0);
                  return (
                    <MobileCard
                      key={m.id}
                      title={(m as any).name}
                      subtitle={m.code}
                      icon={Database}
                      iconBg="bg-blue-50"
                      iconColor="text-blue-600"
                      status={{
                        label: m.status === 'IN_STOCK' ? 'Omborda' : 'Tugatilgan',
                        variant: m.status === 'IN_STOCK' ? 'success' : 'error'
                      }}
                      rightElement={
                        <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {m.batchNumber}
                        </span>
                      }
                      footer={
                        <div className="flex items-center justify-between w-full">
                           <div className="flex gap-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reserved</span>
                                <span className="text-xs font-black text-amber-500 leading-none">{((m as any).reserved_quantity || 0).toLocaleString()} kg</span>
                              </div>
                              <div className="flex flex-col border-l border-slate-100 pl-4">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mavjud</span>
                                <span className="text-xs font-black text-slate-900 leading-none">{available.toLocaleString()} kg</span>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setIsPrintingLabel(m)}
                                className="touch-target w-10 h-10 bg-slate-50 text-slate-400 rounded-xl"
                              >
                                <Printer className="w-4.5 h-4.5" />
                              </button>
                              {available > 0 && (
                                <button 
                                  onClick={() => { setSelectedBatch(m); setIsTransferModalOpen(true); }}
                                  className="touch-target w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                                >
                                  <Activity className="w-4.5 h-4.5" />
                                </button>
                              )}
                           </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-left">Material / Kod</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-left">Partiya ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Reserved (kg)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Mavjud (Available)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Holati</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMaterials.map((m) => {
                  const available = (m as any).remaining_quantity - ((m as any).reserved_quantity || 0);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1 text-sm">{(m as any).name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.code}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 font-mono">{m.batchNumber}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-xs font-black ${(m as any).reserved_quantity > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                          {((m as any).reserved_quantity || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-black text-slate-900">{available.toLocaleString()} kg</p>
                          <p className="text-[10px] font-bold text-slate-300">{(m as any).remaining_quantity.toLocaleString()} jami</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          m.status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {m.status === 'IN_STOCK' ? 'Omborda' : 'Tugatilgan'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setIsPrintingLabel(m)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm group-hover:scale-110"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {available > 0 && (
                            <button 
                              onClick={() => { setSelectedBatch(m); setIsTransferModalOpen(true); }}
                              className="p-3 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-2xl transition-all shadow-sm border border-blue-100"
                            >
                              <Activity className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="min-h-[400px]">
            {isMobile ? (
              <div className="space-y-3 p-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 break-words">{doc.number}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{doc.type}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        doc.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                        doc.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                        doc.status === 'CREATED' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                      <span>{doc.from_entity_name || '---'}</span>
                      <span className="mx-2 text-slate-300">{'->'}</span>
                      <span>{doc.to_entity_name || '---'}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPrintingDocument(doc)} className="rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-all">
                          <Printer className="w-4 h-4" />
                        </button>
                        {(doc.status === 'CREATED' || doc.status === 'CONFIRMED') && (
                          <button 
                            onClick={() => handleDocumentAction(doc.id, doc.status === 'CREATED' ? 'confirm' : 'complete')}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white"
                          >
                            {doc.status === 'CREATED' ? 'Tasdiqlash' : 'Yakunlash'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-left">Hujjat № / Turi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-left">Qayerdan / Qayerga</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Sanasi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Holati</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full ${
                          doc.type.includes('KIRIM') ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <p className="font-black text-slate-900 text-sm">{doc.number}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <span>{doc.from_entity_name || '---'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span>{doc.to_entity_name || '---'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        doc.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                        doc.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                        doc.status === 'CREATED' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setIsPrintingDocument(doc)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm">
                             <Printer className="w-4 h-4" />
                          </button>
                          {doc.status === 'CREATED' && ['Admin', 'Bosh Admin'].includes(user.effective_role || user.role_display || user.role) && (
                            <button 
                              onClick={() => handleDocumentAction(doc.id, 'confirm')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-100"
                            >
                              Tasdiqlash
                            </button>
                          )}
                          {doc.status === 'CONFIRMED' && (
                            <button 
                              onClick={() => handleDocumentAction(doc.id, 'complete')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                            >
                              Yakunlash
                            </button>
                          )}
                          {(doc.status === 'CREATED' || doc.status === 'CONFIRMED') && (
                            <button 
                              onClick={() => handleDocumentAction(doc.id, 'cancel')}
                              className="px-3 py-1.5 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl font-black text-[9px] uppercase tracking-widest"
                            >
                              Bekor
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Kirim Modal */}
      <AnimatePresence>
        {isReceiveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsReceiveModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="relative bg-white w-full max-w-xl rounded-[28px] md:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
               <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Yangi Kirim (Faktura)</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Xom ashyo qabul qilish</p>
                    </div>
                  </div>
                  <button onClick={() => setIsReceiveModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                    <X className="w-6 h-6" />
                  </button>
               </div>

               <form onSubmit={handleReceive} className="p-5 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faktura №</label>
                      <input required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="m-n: F-12345" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yetkazib beruvchi</label>
                      <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          required 
                          value={supplierId} 
                          onChange={e => setSupplierId(e.target.value)} 
                          className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold appearance-none"
                        >
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mahsulotlar Ro'yxati</label>
                      <button 
                        type="button" 
                        onClick={addReceiveItem}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Mahsulot qo'shish
                      </button>
                    </div>
                    
                    {receiveItems.map((item, index) => (
                      <div key={index} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4 relative group/item">
                        {receiveItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeReceiveItem(index)}
                            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mahsulot nomi</label>
                          <select 
                            value={item.productId} 
                            onChange={e => updateReceiveItem(index, 'productId', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm appearance-none"
                          >
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Miqdor (kg)</label>
                            <input 
                              type="number" 
                              required 
                              value={item.quantity} 
                              onChange={e => updateReceiveItem(index, 'quantity', e.target.value)}
                              placeholder="0.00" 
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Narx (1kg uchun)</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                              <input 
                                type="number" 
                                required 
                                value={item.price} 
                                onChange={e => updateReceiveItem(index, 'price', e.target.value)}
                                placeholder="0.00" 
                                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button type="button" onClick={() => setIsReceiveModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Bekor qilish</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Muvaffaqiyatli Saqlash</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferModalOpen && selectedBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsTransferModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="relative bg-white w-full max-w-md rounded-[28px] md:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-center">
               <div className="p-5 md:p-10">
                  <div className="w-20 h-20 bg-indigo-50 rounded-[30px] flex items-center justify-center text-indigo-600 mx-auto mb-6">
                    <Activity className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Sexga Berish</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ichki Nakladnoy yaratish</p>
                  
                  <div className="mt-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-left space-y-4">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Partiya ID</p>
                       <p className="text-sm font-black text-blue-600">{selectedBatch.batchNumber}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Material</p>
                       <p className="text-sm font-black text-slate-900">{(selectedBatch as any).name}</p>
                     </div>
                  </div>

                  <form onSubmit={handleTransfer} className="mt-8 space-y-5">
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yo'naltirilgan sex</label>
                       <select value={targetShop} onChange={e => setTargetShop(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold appearance-none text-sm">
                          <option value="ZAMES">Zames (Qorishma)</option>
                          <option value="CNC">CNC (Kesish)</option>
                          <option value="FINISHING">Pardozlash</option>
                       </select>
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miqdor (kg)</label>
                       <div className="relative">
                          <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="number" required value={transferQty} onChange={e => setTransferQty(e.target.value)} placeholder="0.00" className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold" />
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Bekor</button>
                        <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Tasdiqlash</button>
                    </div>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <Suspense fallback={null}>
            <ScannerModal 
              onScan={(batch) => {
                setSelectedBatch(batch);
                setIsTransferModalOpen(true);
                setIsScannerOpen(false);
              }}
              onClose={() => setIsScannerOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Label Print Modal */}
      <AnimatePresence>
        {isPrintingLabel && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsPrintingLabel(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">QR Yorliqni Chiqarish</h3>
                  <button onClick={() => setIsPrintingLabel(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="p-12 flex flex-col items-center justify-center space-y-8 min-h-[300px]">
                  <div className="p-4 bg-white shadow-xl rounded-xl border border-slate-100">
                    <QRLabel batch={isPrintingLabel} />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-black text-slate-900">Yorliq chop etishga tayyor</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O'lcham: 40mm x 25mm</p>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    <Printer className="w-5 h-5" />
                    Chop etish (Print)
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Print Modal */}
      <AnimatePresence>
        {isPrintingDocument && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsPrintingDocument(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[28px] md:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
               <div className="p-5 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Rasmiy Hujjat (PDF/Print)</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{isPrintingDocument.number}</p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Chop etish
                    </button>
                    <button onClick={() => setIsPrintingDocument(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-100/50">
                  <DocumentTemplate 
                    document={isPrintingDocument} 
                    items={isPrintingDocument.items || []} 
                  />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Style for printing only specific elements */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
