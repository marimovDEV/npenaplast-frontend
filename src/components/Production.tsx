import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Database, 
  Weight, 
  Layers, 
  Box, 
  ShoppingCart,
  Factory,
  Package,
  User as UserIcon,
  Play,
  RotateCcw,
  Clock,
  FlaskConical,
  AlertTriangle
} from 'lucide-react';
import api from '../lib/api';
import { User, Zames, Bunker, Recipe, RawMaterialBatch, Material, ProductionOrder, ProductionOrderStage, BlockProduction } from '../types';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';

export default function Production({ user }: { user: User }) {
  const { t } = useI18n();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const currentRole = user.effective_role || user.role_display || user.role;
  const [subTab, setSubTab] = useState('zames');
  const [zamesy, setZamesy] = useState<Zames[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [batches, setBatches] = useState<RawMaterialBatch[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [bunkers, setBunkers] = useState<Bunker[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [blockProductions, setBlockProductions] = useState<BlockProduction[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Modals
  const [isZamesModalOpen, setIsZamesModalOpen] = useState(false);
  const [isBunkerModalOpen, setIsBunkerModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<Zames | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isStageBunkerModalOpen, setIsStageBunkerModalOpen] = useState<{orderId: number, stageId: number} | null>(null);
  const [isFailModalOpen, setIsFailModalOpen] = useState<{orderId: number, stageId: number} | null>(null);
  const [failReason, setFailReason] = useState('');
  const [operatorMode, setOperatorMode] = useState(false);
  
  // Zames Form
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [zamesBatchItems, setZamesBatchItems] = useState<{material: number, material_name: string, batch: string, quantity: number}[]>([]);
  const [outputWeight, setOutputWeight] = useState('');

  // Bunker Load Form
  const [selectedZamesId, setSelectedZamesId] = useState('');
  const [selectedBunkerId, setSelectedBunkerId] = useState('');

  // Order Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderDeadline, setOrderDeadline] = useState('');
  
  // Block Form
  const [selectedZamesForBlock, setSelectedZamesForBlock] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [blockCount, setBlockCount] = useState('');
  const [blockLength, setBlockLength] = useState(1000);
  const [blockWidth, setBlockWidth] = useState(1000);
  const [blockHeight, setBlockHeight] = useState(500);
  const [blockDensity, setBlockDensity] = useState('');

  const handleRecipeChange = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const recipe = recipes.find(r => r.id === Number(recipeId));
    if (recipe) {
      setZamesBatchItems(recipe.items.map(item => ({
        material: item.material,
        material_name: item.material_name,
        batch: '',
        quantity: item.quantity
      })));
    } else {
      setZamesBatchItems([]);
    }
  };

  const fetchProductionData = async () => {
    try {
      const results = await Promise.all([
        api.get('production/zames/'),
        api.get('production/recipes/'),
        api.get('batches/?status=IN_STOCK'),
        api.get('materials/'),
        api.get('production/bunkers/'),
        api.get('production/orders/'),
        api.get('production/blocks/')
      ]);
      const [zamesRes, recipesRes, batchesRes, materialsRes, bunkersRes, ordersRes, blockRes] = results;
      setZamesy(zamesRes.data);
      setRecipes(recipesRes.data);
      setBatches(batchesRes.data);
      setMaterials(materialsRes.data);
      setBunkers(bunkersRes.data);
      setProductionOrders(ordersRes.data);
      setBlockProductions(blockRes.data);
    } catch (err) {
      console.error("Failed to fetch production data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionData();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !orderQuantity) return;

    setLoading(true);
    try {
      await api.post('production/orders/', {
        product: Number(selectedProductId),
        quantity: Number(orderQuantity),
        deadline: orderDeadline || null
      });
      uiStore.showNotification("Ishlab chiqarish buyurtmasi yaratildi", "success");
      fetchProductionData();
      setIsOrderModalOpen(false);
      setSelectedProductId('');
      setOrderQuantity('');
      setOrderDeadline('');
    } catch (err) {
      uiStore.showNotification("Xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartStage = async (orderId: number, stageId: number, extraData: any = {}) => {
    try {
      await api.post(`production/orders/${orderId}/start-stage/`, {
        stage_id: stageId,
        extra_data: extraData
      });
      uiStore.showNotification("Bosqich boshlandi", "success");
      fetchProductionData();
      setIsStageBunkerModalOpen(null);
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleTransitionStage = async (orderId: number, stageId: number) => {
    try {
      await api.post(`production/orders/${orderId}/transition/`, {
        stage_id: stageId
      });
      uiStore.showNotification("Bosqich yakunlandi", "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleFailStage = async () => {
    if (!isFailModalOpen || !failReason) return;
    try {
      await api.post(`production/orders/${isFailModalOpen.orderId}/fail-stage/`, {
        stage_id: isFailModalOpen.stageId,
        reason: failReason
      });
      uiStore.showNotification("Xatolik qayd etildi", "info");
      fetchProductionData();
      setIsFailModalOpen(null);
      setFailReason('');
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleForceReleaseBunker = async (bunkerId: number) => {
    if (!window.confirm(t("Bunkerni majburiy bo'shatishni xohlaysizmi?"))) return;
    try {
      await api.post(`production/bunkers/${bunkerId}/force-release/`);
      uiStore.showNotification("Bunker bo'shatildi", "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleForceComplete = async (orderId: number, stageId: number) => {
    const reason = window.prompt(t('Majburiy tugatish sababini kiritng:'));
    if (!reason) return;
    try {
      await api.post(`production/orders/${orderId}/force-complete/`, {
        stage_id: stageId,
        reason: reason
      });
      uiStore.showNotification("Bosqich majburiy yakunlandi", "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleResetStage = async (orderId: number, stageId: number) => {
    const reason = window.prompt(t('Qayta kutilayotgan holatga qaytarish sababini kiriting:'));
    if (!reason) return;
    try {
      await api.post(`production/orders/${orderId}/reset-stage/`, {
        stage_id: stageId,
        reason: reason
      });
      uiStore.showNotification("Bosqich qayta tiklandi", "info");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(err.response?.data?.error || "Xatolik", "error");
    }
  };

  const handleCreateFormovka = async (bunkerId: number) => {
    try {
      await uiStore.createFormovka(bunkerId, `F-${Math.floor(Math.random() * 9 + 1)}`, 12);
      fetchProductionData();
    } catch (err) {
      // Notified by store
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZamesForBlock || !formNumber || !blockCount || !blockDensity) return;

    setLoading(true);
    try {
      await api.post('production/blocks/', {
        zames: Number(selectedZamesForBlock),
        form_number: formNumber,
        block_count: Number(blockCount),
        length: Number(blockLength),
        width: Number(blockWidth),
        height: Number(blockHeight),
        density: Number(blockDensity)
      });
      uiStore.showNotification("Blok quyish qayd etildi", "success");
      fetchProductionData();
      setIsBlockModalOpen(false);
      // Reset form
      setFormNumber('');
      setBlockCount('');
      setBlockDensity('');
      setSelectedZamesForBlock('');
    } catch (err) {
      uiStore.showNotification("Xatolik: " + (err as any).response?.data?.error || "Qayd etib bo'lmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      uiStore.showNotification("Retseptni tanlang", "error");
      return;
    }

    setLoading(true);
    try {
      const zamesNumber = `ZM-${new Date().getTime().toString().slice(-6)}`;
      await api.post('production/zames/', {
        zames_number: zamesNumber,
        recipe: Number(selectedRecipeId),
        items: zamesBatchItems.map(item => ({
          material: item.material,
          batch: batches.find(b => b.batch_number === item.batch)?.id,
          quantity: item.quantity
        }))
      });
      uiStore.showNotification("Zames yaratildi", "success");
      fetchProductionData();
      setIsZamesModalOpen(false);
      setSelectedRecipeId('');
      setZamesBatchItems([]);
    } catch (err) {
      uiStore.showNotification("Zames yaratishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartZames = async (id: number) => {
    try {
      await api.post(`production/zames/${id}/start/`);
      uiStore.showNotification("Zames boshlandi", "success");
      fetchProductionData();
    } catch (err) {
      uiStore.showNotification("Xatolik", "error");
    }
  };

  const handleFinishZames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFinishModalOpen || !outputWeight) return;
    
    setLoading(true);
    try {
      await api.post(`production/zames/${isFinishModalOpen.id}/finish/`, {
        output_weight: Number(outputWeight)
      });
      uiStore.showNotification("Zames yakunlandi", "success");
      fetchProductionData();
      setIsFinishModalOpen(null);
      setOutputWeight('');
    } catch (err) {
      uiStore.showNotification("Xatolik", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleBunkerLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZamesId || !selectedBunkerId) return;
    
    setLoading(true);
    try {
      await api.post('production/loads/', {
        zames: Number(selectedZamesId),
        bunker: Number(selectedBunkerId),
        required_time: 120 // Example 2 hours
      });
      uiStore.showNotification("Bunkerga joylandi", "success");
      fetchProductionData();
      setIsBunkerModalOpen(false);
      setSelectedZamesId('');
      setSelectedBunkerId('');
    } catch (err) {
      uiStore.showNotification("Bunkerga joylab bo'lmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'zames', name: 'Zames Jurnali' },
    { id: 'bunker', name: 'Bunkerlar' },
    { id: 'formovka', name: 'Blok Formovka' },
    { id: 'orders', name: 'Buyurtmalar (MTO)' },
  ];

  if (currentRole === 'Bosh Admin' || currentRole === 'Admin' || currentRole === 'Ishlab chiqarish ustasi') {
    tabs.push({ id: 'monitoring', name: '📊 Monitoring' });
  }

  const availableZames = zamesy.filter(z => z.status === 'DONE' && !bunkers.some(b => b.batchNumber === `EXP-${z.zames_number}`));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`
              px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300
              ${subTab === tab.id ? 'bg-white text-blue-600 shadow-lg shadow-blue-100 ring-1 ring-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
            `}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[500px]">
        {subTab === 'zames' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zameslar Jurnali</h3>
                <p className="text-slate-500 font-medium">Xom ashyoni ko'pirtirish va partiyalash jarayoni</p>
              </div>
              <button 
                onClick={() => setIsZamesModalOpen(true)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Yangi Zames Yaratish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {zamesy.map(z => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={z.id} 
                    className={`
                      relative overflow-hidden rounded-[32px] border p-6 transition-all duration-300
                      ${z.status === 'IN_PROGRESS' ? 'bg-white border-blue-200 shadow-2xl shadow-blue-100 ring-2 ring-blue-500/10' : 
                        z.status === 'PENDING' ? 'bg-slate-50/50 border-slate-100' : 
                        'bg-white border-slate-100 opacity-80'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`
                        p-3 rounded-2xl shadow-lg
                        ${z.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-blue-200' : 
                          z.status === 'DONE' ? 'bg-emerald-500 text-white shadow-emerald-100' : 
                          'bg-white text-slate-400 border border-slate-100'}
                      `}>
                        <FlaskConical className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                          ${z.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' : 
                            z.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            'bg-slate-100 text-slate-500 border-slate-200'}
                        `}>
                          {z.status === 'PENDING' ? 'Kutilmoqda' : z.status === 'IN_PROGRESS' ? 'Jarayonda' : z.status === 'DONE' ? 'Tayyor' : 'Bekor qilingan'}
                        </span>
                        {z.start_time && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            {new Date(z.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{z.zames_number}</h4>
                        <p className="text-sm font-bold text-blue-600">Retsept: {z.recipe_name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kirish (Kg)</p>
                          <div className="flex items-center gap-2">
                            <Weight className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-black text-slate-900">{z.input_weight}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Chiqish (Kg)</p>
                          <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-black text-emerald-900">{z.output_weight || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <UserIcon className="w-3 h-3" />
                        <span>Operator: {z.operator_name}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 relative z-10">
                      {z.status === 'PENDING' && (
                        <button 
                          onClick={() => handleStartZames(z.id)}
                          className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Boshlash
                        </button>
                      )}
                      {z.status === 'IN_PROGRESS' && (
                        <button 
                          onClick={() => setIsFinishModalOpen(z)}
                          className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Yakunlash
                        </button>
                      )}
                      {z.status === 'DONE' && (
                        <div className="flex-1 py-3.5 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100 cursor-default">
                          <CheckCircle2 className="w-4 h-4" />
                          Yakunlangan
                        </div>
                      )}
                    </div>

                    {z.status === 'IN_PROGRESS' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 120, ease: "linear" }}
                          className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {subTab === 'bunker' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Bunkerlar Holati</h3>
                <p className="text-slate-500 text-sm">Zameslarni bunkerlarda yetiltirish</p>
              </div>
              <button 
                onClick={() => setIsBunkerModalOpen(true)}
                className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all font-bold"
              >
                <Plus className="w-5 h-5" />
                <span>Bunkerga joylash</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bunkers.map(b => (
                <div key={b.id} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ring-1 ring-transparent hover:ring-blue-100">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${b.status === 'Empty' ? 'bg-white text-slate-300 border border-slate-100 group-hover:scale-110' : 'bg-blue-600 text-white shadow-blue-200 group-hover:scale-110'}`}>
                      <Database className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      b.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      b.status === 'Aging' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {b.status === 'Empty' ? 'Bo\'sh' : b.status === 'Aging' ? 'Yetilmoqda' : 'Tayyor'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-1 tracking-tight">Bunker №{b.bunkerNumber}</h4>
                  <div className="flex flex-col gap-1.5 mb-6 min-h-[48px]">
                    {b.batchNumber ? (
                      <>
                        <p className="text-xs text-slate-500 font-bold">Partiya: <span className="text-blue-600 font-black tracking-wider">{b.batchNumber}</span></p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.loadedAt ? new Date(b.loadedAt).toLocaleTimeString() : ''}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium mt-1">Joylash uchun tayyor</p>
                    )}
                  </div>
                  
                  {b.status !== 'Empty' && (
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Saqlash jarayoni</span>
                        <span className={b.status === 'Ready' ? 'text-emerald-600' : 'text-amber-600'}>{b.status === 'Ready' ? '100%' : '45%'}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: b.status === 'Ready' ? '100%' : '45%' }}
                          className={`h-full rounded-full transition-all duration-1000 ${b.status === 'Ready' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-amber-500 shadow-lg shadow-amber-200'}`}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => handleCreateFormovka(b.id)}
                    disabled={b.status !== 'Ready'}
                    className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                      b.status === 'Ready' 
                      ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95' 
                      : 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Formovkaga yuborish
                  </button>

                  {b.status !== 'Empty' && (
                    <button 
                      onClick={async () => {
                        if (window.confirm(t("Bunkerni majburiy bo'shatmoqchimisiz?"))) {
                          try {
                            await api.post(`production/bunkers/${b.id}/force-release/`);
                            uiStore.showNotification("Bunker bo'shatildi", "info");
                            fetchProductionData();
                          } catch (err) {
                            uiStore.showNotification("Xatolik", "error");
                          }
                        }
                      }}
                      className="w-full mt-2 py-2 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      Reset (Majburiy Bo'shatish)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'formovka' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Blok Formovka Jurnali</h3>
                <p className="text-slate-500 font-medium">Bunkerlardan bloklar quyish jarayoni</p>
              </div>
              <button 
                onClick={() => setIsBlockModalOpen(true)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all group"
              >
                <Plus className="w-5 h-5" />
                <span>Blok Quyishni Qayd Etish</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blockProductions.map(b => (
                <div key={b.id} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                       <Box className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      b.status === 'DRYING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {b.status === 'DRYING' ? 'Quritilmoqda' : 'Sklad 2 da'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 leading-none">Forma №: {b.form_number}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Zames: {b.zames_number}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Miqdor</p>
                        <p className="text-sm font-black text-slate-900">{b.block_count} dona</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hajm</p>
                        <p className="text-sm font-black text-slate-900">{b.volume.toFixed(2)} m³</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Zichlik</p>
                        <p className="text-sm font-black text-slate-900">{b.density} kg/m³</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sana</p>
                        <p className="text-sm font-black text-slate-900">{new Date(b.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {blockProductions.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 italic font-bold">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p>Hozircha bloklar quyilmadi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ishlab Chiqarish Nazorati</h3>
                <p className="text-slate-500 text-sm font-medium">Buyurtma-naryadlar va texnologik jarayon monitoringi</p>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setOperatorMode(!operatorMode)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    operatorMode 
                      ? 'bg-amber-100 text-amber-700 shadow-inner' 
                      : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  {operatorMode ? '🏭 Operator Rejimi ON' : '⚙️ Grid Rejimi'}
                </button>
                <button 
                  onClick={() => setIsOrderModalOpen(true)}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Yangi Buyurtma
                </button>
              </div>
            </div>

            {operatorMode ? (
              /* FOCUSED OPERATOR VIEW */
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productionOrders
                      .filter(o => o.status !== 'COMPLETED')
                      .map(order => {
                        const activeStage = order.stages.find(s => s.status === 'ACTIVE' || s.status === 'FAILED');
                        const pendingStage = order.stages.find(s => s.status === 'PENDING');
                        const focusStage = activeStage || pendingStage;

                        if (!focusStage) return null;

                        return (
                          <motion.div 
                            key={order.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-10 rounded-[48px] border-4 transition-all ${
                              activeStage?.status === 'FAILED' 
                                ? 'bg-red-50 border-red-200' 
                                : activeStage 
                                  ? 'bg-amber-50 border-amber-200 shadow-2xl shadow-amber-100' 
                                  : 'bg-white border-slate-100'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <h4 className="text-2xl font-black text-slate-900 leading-tight mb-2">{order.order_number}</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{order.product_name}</p>
                              </div>
                              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${
                                activeStage?.status === 'FAILED' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
                              }`}>
                                {focusStage.stage_type_display}
                              </span>
                            </div>

                            <div className="mb-10">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vazifa holati</p>
                              <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${activeStage ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`} />
                                <span className="text-lg font-black text-slate-900">{focusStage.status_display}</span>
                              </div>
                            </div>

                             {/* MAIN CONTROLS */}
                             <div className="space-y-4">
                                {focusStage.status === 'PENDING' && (
                                   <button 
                                      onClick={() => {
                                        if (focusStage.stage_type === 'BUNKER') {
                                          setIsStageBunkerModalOpen({ orderId: order.id, stageId: focusStage.id });
                                        } else {
                                          handleStartStage(order.id, focusStage.id);
                                        }
                                      }}
                                      className="w-full py-6 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                                   >
                                      <Play className="w-5 h-5 fill-current" />
                                      Boshlash
                                   </button>
                                )}

                                {focusStage.status === 'ACTIVE' && (
                                   <div className="grid grid-cols-4 gap-4">
                                      <button 
                                        onClick={() => handleTransitionStage(order.id, focusStage.id)}
                                        className="col-span-3 py-6 bg-emerald-500 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all"
                                      >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Yakunlash
                                      </button>
                                      <button 
                                         onClick={() => setIsFailModalOpen({ orderId: order.id, stageId: focusStage.id })}
                                         className="col-span-1 p-6 bg-red-100 text-red-600 rounded-3xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-50"
                                      >
                                         <AlertTriangle className="w-6 h-6" />
                                      </button>
                                   </div>
                                )}

                                {focusStage.status === 'FAILED' && (
                                   <button 
                                      onClick={() => handleStartStage(order.id, focusStage.id)}
                                      className="w-full py-6 bg-amber-500 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-95 transition-all"
                                   >
                                      <RotateCcw className="w-5 h-5" />
                                      Qayta Boshlash
                                   </button>
                                )}
                             </div>
                          </motion.div>
                        );
                      })}
                 </div>
              </div>
            ) : (
              /* TRADITIONAL GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
              {(['PENDING', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const).map(colStatus => (
                <div key={colStatus} className="flex flex-col gap-6">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {colStatus === 'PENDING' ? 'Kutilmoqda' : 
                       colStatus === 'PLANNED' ? 'Rejalashtirilgan' : 
                       colStatus === 'IN_PROGRESS' ? 'Jarayonda' : 'Tugallangan'}
                    </h4>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold">
                      {productionOrders.filter(o => o.status === colStatus).length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {productionOrders.filter(o => o.status === colStatus).map(order => (
                      <motion.div 
                        key={order.id}
                        layoutId={`order-${order.id}`}
                        className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                            {order.order_number}
                          </span>
                          {order.deadline && (
                            <div className="flex items-center gap-1.5 text-rose-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {new Date(order.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <h5 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {order.product_name}
                        </h5>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">
                          Hajm: {order.quantity} m³ / blok
                        </p>

                        {/* Pipeline Tracker */}
                        <div className="flex items-center justify-between gap-1 mb-6">
                          {order.stages.map((stage) => (
                            <div key={stage.id} className="flex-1 group/stage relative">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  stage.status === 'DONE' ? 'bg-emerald-500' :
                                  stage.status === 'FAILED' ? 'bg-red-500' :
                                  stage.status === 'ACTIVE' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                                  'bg-slate-100'
                                }`}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/stage:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                {stage.stage_type_display}: {stage.status_display}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-6">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                             <span className="text-sm font-black text-slate-900">{Math.round(order.progress)}%</span>
                           </div>
                           <div className="flex -space-x-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                                {order.responsible_name?.[0]?.toUpperCase() || 'A'}
                              </div>
                           </div>
                        </div>

                        {order.status !== 'COMPLETED' && (() => {
                          const currentStageIndex = order.stages.findIndex(s => s.status === 'PENDING' || s.status === 'ACTIVE');
                          const currentStage = order.stages[currentStageIndex];
                          if (!currentStage) return null;

                          const prevStage = currentStageIndex > 0 ? order.stages[currentStageIndex - 1] : null;
                          const isLocked = prevStage && prevStage.status !== 'DONE';

                          if (currentStage.status === 'PENDING') {
                            return (
                              <button 
                                onClick={() => {
                                  if (isLocked) return;
                                  if (currentStage.stage_type === 'BUNKER') {
                                    setIsStageBunkerModalOpen({ orderId: order.id, stageId: currentStage.id });
                                  } else {
                                    handleStartStage(order.id, currentStage.id);
                                  }
                                }}
                                disabled={isLocked}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                  isLocked 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                                    : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95'
                                }`}
                              >
                                {isLocked ? (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {prevStage.stage_type_display} kutilmoqda
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    {currentStage.stage_type_display}ni boshlash
                                  </>
                                )}
                              </button>
                            );
                          } else if (currentStage.status === 'ACTIVE') {
                            return (
                              <div className="grid grid-cols-4 gap-2">
                                <button 
                                  onClick={() => handleTransitionStage(order.id, currentStage.id)}
                                  className="col-span-3 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {currentStage.stage_type_display}ni yakunlash
                                </button>
                                <button 
                                  onClick={() => setIsFailModalOpen({ orderId: order.id, stageId: currentStage.id })}
                                  className="col-span-1 p-4 bg-red-100 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          } else if (currentStage.status === 'FAILED') {
                            return (
                               <button 
                                onClick={() => handleStartStage(order.id, currentStage.id)}
                                className="w-full py-4 bg-amber-100 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-200 transition-all active:scale-95"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Qayta urinib ko'rish
                              </button>
                            )
                          }
                          return null;
                        })()}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'monitoring' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Factory Live Monitoring</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium">Barcha aktiv ishlab chiqarish jarayonlari nazorati</p>
            </div>
            <div className="flex gap-4">
              <div className="w-full md:w-auto px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center gap-3">
                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                 <span className="text-xs md:text-sm font-black text-blue-700 uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {productionOrders
              .filter(order => order.stages?.some(s => s.status === 'ACTIVE'))
              .map(order => {
                const activeStage = order.stages?.find(s => s.status === 'ACTIVE');
                if (!activeStage) return null;

                const startTime = activeStage.started_at ? new Date(activeStage.started_at).getTime() : 0;
                const durationHrs = startTime ? Math.floor((new Date().getTime() - startTime) / (1000 * 60 * 60)) : 0;
                const isStuck = durationHrs >= 4;

                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
                      relative overflow-hidden rounded-[28px] md:rounded-[40px] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 p-5 md:p-8
                      ${isStuck ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-100 shadow-sm'}
                    `}
                  >
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8 flex-1 w-full">
                      <div className={`
                        w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center shadow-2xl
                        ${isStuck ? 'bg-red-600 text-white shadow-red-200' : 'bg-blue-600 text-white shadow-blue-200'}
                      `}>
                         <Factory className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <h4 className="text-xl md:text-2xl font-black text-slate-900">{order.order_number}</h4>
                          <span className="self-start px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {order.product_name}
                          </span>
                        </div>
                        <p className="text-sm md:text-base text-slate-500 font-bold flex flex-wrap items-center gap-2">
                           Joriy Bosqich: <span className="text-blue-600 font-black underline decoration-2 underline-offset-4">{activeStage.stage_type_display}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-5 md:w-auto md:flex-row md:items-center md:gap-12">
                      <div className="text-left md:text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Davomiyligi</p>
                        <div className={`flex items-center gap-2 text-2xl md:text-3xl font-black ${isStuck ? 'text-red-600' : 'text-slate-900'}`}>
                           <Clock className="w-5 h-5 md:w-6 md:h-6" />
                           <span>{durationHrs} soat+</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => handleResetStage(Number(order.id), activeStage.id)}
                          className="px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-2"
                          title="Pending holatiga qaytarish"
                        >
                           <RotateCcw className="w-4 h-4" />
                           Reset
                        </button>
                        <button 
                          onClick={() => handleForceComplete(Number(order.id), activeStage.id)}
                          className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           <CheckCircle2 className="w-4 h-4" />
                           Force Finish
                        </button>
                      </div>
                    </div>

                    {isStuck && (
                      <div className="absolute left-4 top-4 md:left-auto md:right-8 flex items-center gap-2 text-red-600 bg-red-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                         <AlertTriangle className="w-3 h-3" />
                         Stuck Detected
                      </div>
                    )}
                  </motion.div>
                );
              })}

            {productionOrders.filter(o => o.stages?.some(s => s.status === 'ACTIVE')).length === 0 && (
              <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                 <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <h5 className="text-xl font-black text-slate-400">Hozirda aktiv jarayonlar yo'q</h5>
                 <p className="text-slate-400 font-medium">Barcha liniyalar bo'sh yoki kutish holatida</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      <AnimatePresence>
        {isZamesModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsZamesModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Plus className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Yangi Zames Yaratish</h3>
                    <p className="text-xs text-slate-500 font-medium">Xom ashyoni ko'pirtirish jarayoni</p>
                  </div>
                </div>
                <button onClick={() => setIsZamesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleCreateZames} className="p-4 md:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Retseptni tanlang</label>
                  <select 
                    required
                    value={selectedRecipeId}
                    onChange={(e) => handleRecipeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                  >
                    <option value="">Retseptni tanlang...</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {zamesBatchItems.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Materiallar va Partiyalar</label>
                    {zamesBatchItems.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-[24px] border border-slate-200 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-900">{item.material_name}</span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">{item.quantity} kg kutilmoqda</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Partiya</label>
                            <select
                              required
                              value={item.batch}
                              onChange={(e) => {
                                const newItems = [...zamesBatchItems];
                                newItems[idx].batch = e.target.value;
                                setZamesBatchItems(newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="">Partiyani tanlang...</option>
                              {batches
                                .filter(b => b.material === item.material)
                                .map(b => (
                                  <option key={b.id} value={b.batch_number}>{b.batch_number} ({b.quantity_kg} kg qolgan)</option>
                                ))
                              }
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vazn (kg)</label>
                            <input 
                              type="number"
                              required
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...zamesBatchItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setZamesBatchItems(newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setIsZamesModalOpen(false)} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Bekor qilish</button>
                  <button type="submit" disabled={loading} className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:bg-slate-300">
                    {loading ? 'Saqlanmoqda...' : 'Zames Yaratish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isFinishModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFinishModalOpen(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Zamesni Yakunlash</h3>
                    <p className="text-xs text-slate-500 font-medium">Haqiqiy chiqish vaznini kiriting</p>
                  </div>
                </div>
                <button onClick={() => setIsFinishModalOpen(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleFinishZames} className="p-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 px-1">
                    <span>Nomi: {isFinishModalOpen.zames_number}</span>
                    <span>Kutilgan: {isFinishModalOpen.input_weight} kg</span>
                  </div>
                  <div className="relative">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      autoFocus
                      type="number"
                      required
                      placeholder="Chiqish vazni (kg)..."
                      value={outputWeight}
                      onChange={(e) => setOutputWeight(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-black text-xl text-slate-900 placeholder:font-bold placeholder:text-slate-300"
                    />
                  </div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 bg-amber-50 p-2 rounded-lg border border-amber-100/50">Diqqat: Chiqish vazni asosida Sklad №2 ga yarim tayyor mahsulot kirim qilinadi.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsFinishModalOpen(null)} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Bekor qilish</button>
                  <button type="submit" disabled={loading} className="flex-1 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all">
                    {loading ? 'Saqlanmoqda...' : 'Yakunlash va Saqlash'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isBunkerModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBunkerModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Database className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bunkerga Joylash</h3>
                    <p className="text-xs text-slate-500 font-medium">Tayyor zamesni bunkerga o'tkazish</p>
                  </div>
                </div>
                <button onClick={() => setIsBunkerModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleBunkerLoad} className="p-4 md:p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Zamesni tanlang</label>
                  <select 
                    required
                    value={selectedZamesId}
                    onChange={(e) => setSelectedZamesId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                  >
                    <option value="">Tanlang...</option>
                    {availableZames.map(z => (
                      <option key={z.id} value={z.id}>{z.zames_number} (Retsept: {z.recipe_name})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Bunkerni tanlang</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bunkers.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => b.status === 'Empty' && setSelectedBunkerId(b.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          selectedBunkerId === b.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                            : b.status === 'Empty' 
                              ? 'bg-white border-slate-100 hover:border-blue-300 text-slate-600' 
                              : 'bg-slate-50 border-slate-50 text-slate-200 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Database className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Bunker {b.bunkerNumber}</span>
                        <span className="text-[9px] uppercase font-bold">{b.status === 'Empty' ? 'Ochiq' : 'Band'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={() => setIsBunkerModalOpen(false)} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Bekor qilish</button>
                  <button 
                    type="submit" 
                    disabled={!selectedZamesId || !selectedBunkerId || loading}
                    className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {loading ? 'Joylanmoqda...' : 'Joylash'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Production Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white"
            >
              <div className="p-5 md:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Yangi Buyurtma</h3>
                    <p className="text-slate-500 text-sm font-medium">Buyurtma-naryad yaratish</p>
                  </div>
                  <button 
                    onClick={() => setIsOrderModalOpen(false)}
                    className="p-4 bg-slate-50 text-slate-400 rounded-[24px] hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mahsulot turi</label>
                    <select 
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      required
                      className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                    >
                      <option value="">Tanlang...</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Hajm (Blok/m³)</label>
                      <input 
                        type="number"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        required
                        className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        placeholder="Masalan: 50"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                      <input 
                        type="date"
                        value={orderDeadline}
                        onChange={(e) => setOrderDeadline(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Yaratilmoqda...' : 'Buyurtmani Tasdiqlash'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Block Production Modal */}
      <AnimatePresence>
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBlockModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-200">
                     <Layers className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Blok Quyishni Qayd Etish</h3>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Ishlab chiqarilgan bloklarni omborga kiritish</p>
                   </div>
                </div>
                <button onClick={() => setIsBlockModalOpen(false)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm border border-slate-100 hover:border-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateBlock} className="p-5 md:p-10 space-y-8 max-h-[82vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Zamesni tanlang</label>
                    <div className="relative">
                      <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select 
                        required
                        value={selectedZamesForBlock}
                        onChange={(e) => setSelectedZamesForBlock(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 appearance-none shadow-inner"
                      >
                        <option value="">Zamesni tanlang...</option>
                        {zamesy.filter(z => z.status === 'DONE').map(z => (
                          <option key={z.id} value={z.id}>Zames №{z.zames_number} ({z.recipe_name})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma №</label>
                    <div className="relative">
                      <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="Masalan: F-01"
                        value={formNumber}
                        onChange={(e) => setFormNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloklar soni (dona)</label>
                    <div className="relative">
                      <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="number" 
                        placeholder="14"
                        value={blockCount}
                        onChange={(e) => setBlockCount(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Zichlik (kg/m³)</label>
                    <div className="relative">
                      <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="number" 
                        placeholder="20"
                        value={blockDensity}
                        onChange={(e) => setBlockDensity(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Blok o'lchamlari (mm)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 ml-2">Uzunlik</span>
                      <input type="number" value={blockLength} onChange={e => setBlockLength(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 ml-2">Eni</span>
                      <input type="number" value={blockWidth} onChange={e => setBlockWidth(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 ml-2">Bo'yi</span>
                      <input type="number" value={blockHeight} onChange={e => setBlockHeight(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button type="button" onClick={() => setIsBlockModalOpen(false)} className="flex-1 px-8 py-5 border-2 border-slate-100 text-slate-500 rounded-[28px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-xs">Bekor qilish</button>
                  <button 
                    type="submit" 
                    className="flex-[1.5] px-8 py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all text-xs"
                  >
                    Qayd etish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Failure Reason Modal */}
      <AnimatePresence>
        {isFailModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFailModalOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Muammoni Qayd Etish</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sababni kiriting</p>
                 </div>
               </div>

               <div className="mb-8">
                  <textarea 
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    placeholder="Masalan: Uskuna to'xtadi yoki xom ashyo yetishmadi..."
                    className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[24px] outline-none text-sm font-bold min-h-[120px] transition-all"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setIsFailModalOpen(null)} className="py-5 bg-slate-100 text-slate-500 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all">Bekor Qilish</button>
                  <button onClick={handleFailStage} className="py-5 bg-red-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-100">Tasdiqlash</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bunker Selection for Stage Modal */}
      <AnimatePresence>
        {isStageBunkerModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStageBunkerModalOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bunker Tanlang</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Zamesni yetiltirish uchun bunker biriktiring</p>
                </div>
                <button onClick={() => setIsStageBunkerModalOpen(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">1. Zames Partiyasini tanlang</p>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {availableZames.map(z => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZamesId(z.id.toString())}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        selectedZamesId === z.id.toString() 
                          ? 'bg-blue-50 border-blue-500 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900">{z.zames_number}</p>
                        <p className="text-[10px] font-bold text-slate-400 italic">{z.recipe_name}</p>
                      </div>
                      {selectedZamesId === z.id.toString() && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </button>
                  ))}
                  {availableZames.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">Bo'sh (tayyor) zameslar topilmadi</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">2. Bunkerni tanlang</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bunkers.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (b.status !== 'Empty') return;
                      if (!selectedZamesId) {
                        uiStore.showNotification("Zames partiyasini tanlang", "error");
                        return;
                      }
                      handleStartStage(isStageBunkerModalOpen.orderId, isStageBunkerModalOpen.stageId, { 
                        bunker_id: b.id,
                        zames_id: Number(selectedZamesId)
                      });
                    }}
                    disabled={b.status !== 'Empty' || !selectedZamesId}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                      b.status === 'Empty' 
                        ? (selectedZamesId ? 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed')
                        : 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Database className={`w-6 h-6 ${b.status === 'Empty' ? 'text-blue-600' : 'text-slate-300'}`} />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-900 uppercase">Bunker {b.bunkerNumber}</p>
                      <p className="text-[9px] font-bold text-slate-400">{b.status === 'Empty' ? 'BO\'SH' : 'BAND'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button 
                onClick={() => setIsStageBunkerModalOpen(null)}
                className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
              >
                Bekor qilish
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
