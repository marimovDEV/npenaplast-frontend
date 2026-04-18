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
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
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
      uiStore.showNotification(t("Ishlab chiqarish buyurtmasi yaratildi"), "success");
      fetchProductionData();
      setIsOrderModalOpen(false);
      setSelectedProductId('');
      setOrderQuantity('');
      setOrderDeadline('');
    } catch (err) {
      uiStore.showNotification(t("Xatolik"), "error");
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
      uiStore.showNotification(t("Bosqich boshlandi"), "success");
      fetchProductionData();
      setIsStageBunkerModalOpen(null);
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
    }
  };

  const handleTransitionStage = async (orderId: number, stageId: number) => {
    try {
      await api.post(`production/orders/${orderId}/transition/`, {
        stage_id: stageId
      });
      uiStore.showNotification(t("Bosqich yakunlandi"), "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
    }
  };

  const handleFailStage = async () => {
    if (!isFailModalOpen || !failReason) return;
    try {
      await api.post(`production/orders/${isFailModalOpen.orderId}/fail-stage/`, {
        stage_id: isFailModalOpen.stageId,
        reason: failReason
      });
      uiStore.showNotification(t("Xatolik qayd etildi"), "info");
      fetchProductionData();
      setIsFailModalOpen(null);
      setFailReason('');
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
    }
  };

  const handleForceReleaseBunker = async (bunkerId: number) => {
    if (!window.confirm(t("Bunkerni majburiy bo'shatishni xohlaysizmi?"))) return;
    try {
      await api.post(`production/bunkers/${bunkerId}/force-release/`);
      uiStore.showNotification(t("Bunker bo'shatildi"), "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
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
      uiStore.showNotification(t("Bosqich majburiy yakunlandi"), "success");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
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
      uiStore.showNotification(t("Bosqich qayta tiklandi"), "info");
      fetchProductionData();
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
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
      uiStore.showNotification(t("Blok quyish qayd etildi"), "success");
      fetchProductionData();
      setIsBlockModalOpen(false);
      // Reset form
      setFormNumber('');
      setBlockCount('');
      setBlockDensity('');
      setSelectedZamesForBlock('');
    } catch (err) {
      uiStore.showNotification(t("Xatolik") + ": " + ((err as any).response?.data?.error || t("Qayd etib bo'lmadi")), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      uiStore.showNotification(t("Retseptni tanlang"), "error");
      return;
    }

    setLoading(true);
    try {
      const zamesNumber = `ZM-${new Date().getTime().toString().slice(-6)}`;
      await api.post('production/zames/', {
        zames_number: zamesNumber,
        recipe: Number(selectedRecipeId),
        stage_id: selectedStageId,
        items: zamesBatchItems.map(item => ({
          material: item.material,
          batch: batches.find(b => b.batch_number === item.batch)?.id,
          quantity: item.quantity
        }))
      });
      uiStore.showNotification(t("Zames yaratildi"), "success");
      fetchProductionData();
      setIsZamesModalOpen(false);
      setSelectedRecipeId('');
      setSelectedStageId(null);
      setZamesBatchItems([]);
    } catch (err) {
      uiStore.showNotification(t("Zames yaratishda xatolik"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartZames = async (id: number) => {
    try {
      await api.post(`production/zames/${id}/start/`);
      uiStore.showNotification(t("Zames boshlandi"), "success");
      fetchProductionData();
    } catch (err) {
      uiStore.showNotification(t("Xatolik"), "error");
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
      uiStore.showNotification(t("Zames muvaffaqiyatli yakunlandi"), "success");
      fetchProductionData();
      setIsFinishModalOpen(null);
      setOutputWeight('');
    } catch (err: any) {
      uiStore.showNotification(t(err.response?.data?.error || "Xatolik"), "error");
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
      uiStore.showNotification(t("Bunkerga joylandi"), "success");
      fetchProductionData();
      setIsBunkerModalOpen(false);
      setSelectedZamesId('');
      setSelectedBunkerId('');
    } catch (err) {
      uiStore.showNotification(t("Bunkerga joylab bo'lmadi"), "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'zames', name: t('Zames Jurnali') },
    { id: 'bunker', name: t('Bunkerlar') },
    { id: 'formovka', name: t('Blok Formovka') },
    { id: 'orders', name: t('Buyurtmalar (MTO)') },
  ];

  if (currentRole === 'Bosh Admin' || currentRole === 'Admin' || currentRole === 'Ishlab chiqarish ustasi') {
    tabs.push({ id: 'monitoring', name: t('Monitoring') });
  }

  const availableZames = zamesy.filter(z => z.status === 'DONE' && !bunkers.some(b => b.batchNumber === `EXP-${z.zames_number}`));

  return (
    <>
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
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FlaskConical className="w-8 h-8 text-blue-600" />
                    {t('Zameslar Jurnali')}
                  </h3>
                  <p className="text-slate-500 font-medium">{t('Xom ashyoni ko\'pirtirish va partiyalash jarayoni')}</p>
                </div>
                <button 
                  onClick={() => setIsZamesModalOpen(true)}
                  className="bg-blue-600 text-white px-10 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <span>{t('Yangi Zames Yaratish')}</span>
                </button>
              </div>

              {zamesy.some(z => z.status === 'IN_PROGRESS') && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                    <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">{t('Aktiv Jarayonlar')}</h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {zamesy.filter(z => z.status === 'IN_PROGRESS').map(z => (
                      <motion.div 
                        key={z.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[48px] border-4 border-blue-500/20 p-10 shadow-2xl shadow-blue-100 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative flex flex-col md:flex-row gap-10">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200">
                                  <FlaskConical className="w-8 h-8 animate-bounce" />
                               </div>
                               <div>
                                  <h4 className="text-2xl font-black text-slate-900">{z.zames_number}</h4>
                                  <span className="text-blue-600 font-black text-sm uppercase tracking-widest">{z.recipe_name}</span>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Kiritilgan Vazn')}</p>
                                <div className="flex items-center gap-3">
                                  <Weight className="w-6 h-6 text-slate-400" />
                                  <span className="text-xl font-black text-slate-900">{z.input_weight} <span className="text-sm font-bold text-slate-400">kg</span></span>
                                </div>
                              </div>
                              <div className="p-5 bg-blue-50/50 rounded-[32px] border border-blue-100/50">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('Davomiyligi')}</p>
                                <div className="flex items-center gap-3">
                                  <Clock className="w-6 h-6 text-blue-500" />
                                  <span className="text-xl font-black text-blue-900">
                                    {z.start_time ? Math.floor((new Date().getTime() - new Date(z.start_time).getTime()) / 1000 / 60) : 0} <span className="text-sm font-bold text-blue-400">min</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center gap-4 md:w-64">
                            <button 
                              onClick={() => setIsFinishModalOpen(z)}
                              className="bg-emerald-500 text-white p-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-3"
                            >
                              <CheckCircle2 className="w-10 h-10" />
                              {t('Tugatish')}
                            </button>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 180, ease: "linear" }}
                            className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)]"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('Yaqindagi Zameslar')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence mode="popLayout">
                    {zamesy
                      .filter(z => z.status !== 'IN_PROGRESS')
                      .map(z => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={z.id} 
                        className={`
                          relative overflow-hidden rounded-[40px] border p-6 transition-all duration-300 bg-white group hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1
                          ${z.status === 'DONE' ? 'border-emerald-100' : 'border-slate-100'}
                        `}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className={`
                            p-4 rounded-3xl shadow-lg transition-transform group-hover:scale-110
                            ${z.status === 'DONE' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-400'}
                          `}>
                            <FlaskConical className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`
                              px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                              ${z.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                z.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-50 text-slate-500 border-slate-200'}
                            `}>
                              {z.status === 'PENDING' ? t('Kutilmoqda') : z.status === 'DONE' ? t('Tayyor') : t('Bekor qilingan')}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">
                              {new Date(z.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-8">
                          <div>
                            <h4 className="text-xl font-black text-slate-900 mb-1">{z.zames_number}</h4>
                            <p className="text-xs font-bold text-blue-600 truncate">{z.recipe_name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Kirish')}</p>
                              <span className="text-sm font-black text-slate-900">{z.input_weight} kg</span>
                            </div>
                            <div className={`p-3 rounded-2xl border ${z.status === 'DONE' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${z.status === 'DONE' ? 'text-emerald-500' : 'text-slate-400'}`}>{t('Chiqish')}</p>
                              <span className={`text-sm font-black ${z.status === 'DONE' ? 'text-emerald-900' : 'text-slate-900'}`}>{z.output_weight || '—'} kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] border border-white">
                            {z.operator_name?.charAt(0)}
                          </div>
                          <span>{z.operator_name}</span>
                        </div>

                        {z.status === 'PENDING' && (
                          <button 
                            onClick={() => handleStartZames(z.id)}
                            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            {t('Boshlash')}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {subTab === 'bunker' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t('Bunkerlar Holati')}</h3>
                  <p className="text-slate-500 text-sm">{t('Zameslarni bunkerlarda yetiltirish')}</p>
                </div>
                <button 
                  onClick={() => setIsBunkerModalOpen(true)}
                  className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('Bunkerga joylash')}</span>
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
                        {b.status === 'Empty' ? t('Bo\'sh') : b.status === 'Aging' ? t('Yetilmoqda') : t('Tayyor')}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-1 tracking-tight">{t('Bunker')} №{b.bunkerNumber}</h4>
                    <div className="flex flex-col gap-1.5 mb-6 min-h-[48px]">
                      {b.batchNumber ? (
                        <>
                          <p className="text-xs text-slate-500 font-bold">{t('Partiya')}: <span className="text-blue-600 font-black tracking-wider">{b.batchNumber}</span></p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.loadedAt ? new Date(b.loadedAt).toLocaleTimeString() : ''}</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic font-medium mt-1">{t('Joylash uchun tayyor')}</p>
                      )}
                    </div>
                    
                    {b.status !== 'Empty' && (
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>{t('Saqlash jarayoni')}</span>
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
                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]' 
                        : 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {t('Formovkaga yuborish')}
                    </button>

                    {b.status !== 'Empty' && (
                      <button 
                        onClick={() => handleForceReleaseBunker(b.id)}
                        className="w-full mt-2 py-2 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        {t('Reset (Majburiy Bo\'shatish)')}
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
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('Blok Formovka Jurnali')}</h3>
                  <p className="text-slate-500 font-medium">{t('Bunkerlardan bloklar quyish jarayoni')}</p>
                </div>
                <button 
                  onClick={() => setIsBlockModalOpen(true)}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all group"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('Blok Quyishni Qayd Etish')}</span>
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
                        {b.status === 'DRYING' ? t('Quritilmoqda') : t('Sklad 2 da')}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 leading-none">{t('Forma')} №: {b.form_number}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('Zames')}: {b.zames_number}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Miqdor')}</p>
                          <p className="text-sm font-black text-slate-900">{b.block_count} {t('dona')}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Hajm')}</p>
                          <p className="text-sm font-black text-slate-900">{b.volume.toFixed(2)} m³</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Zichlik')}</p>
                          <p className="text-sm font-black text-slate-900">{b.density} kg/m³</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Sana')}</p>
                          <p className="text-sm font-black text-slate-900">{new Date(b.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('Ishlab Chiqarish Nazorati')}</h3>
                  <p className="text-slate-500 text-sm font-medium">{t('Buyurtma-naryadlar va texnologik jarayon monitoringi')}</p>
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
                    {operatorMode ? t('🏭 Operator Rejimi ON') : t('⚙️ Grid Rejimi')}
                  </button>
                  <button 
                    onClick={() => setIsOrderModalOpen(true)}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    {t('Yangi Buyurtma')}
                  </button>
                </div>
              </div>

              {operatorMode ? (
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
                          className={`p-10 rounded-[48px] border-4 transition-all ${
                            activeStage?.status === 'FAILED' ? 'bg-red-50 border-red-200' : 
                            activeStage ? 'bg-amber-50 border-amber-200 shadow-2xl shadow-amber-100' : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-8">
                             <div>
                                <h4 className="text-2xl font-black text-slate-900 mb-1">{order.order_number}</h4>
                                <p className="text-sm font-bold text-slate-500">{order.product_name}</p>
                             </div>
                             <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${
                               activeStage?.status === 'FAILED' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
                             }`}>
                               {focusStage.stage_type_display}
                             </span>
                          </div>
                          
                          <div className="space-y-4">
                            {focusStage.status === 'PENDING' && (
                               <button 
                                  onClick={() => focusStage.stage_type === 'BUNKER' ? setIsStageBunkerModalOpen({ orderId: order.id, stageId: focusStage.id }) : handleStartStage(order.id, focusStage.id)}
                                  className="w-full py-6 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3"
                               >
                                  <Play className="w-5 h-5 fill-current" /> {t('Boshlash')}
                               </button>
                            )}
                            {focusStage.status === 'ACTIVE' && (
                               <div className="grid grid-cols-4 gap-4">
                                  <button onClick={() => handleTransitionStage(order.id, focusStage.id)} className="col-span-3 py-6 bg-emerald-500 text-white rounded-[32px] text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                    <CheckCircle2 className="w-5 h-5" /> {t('Yakunlash')}
                                  </button>
                                  <button onClick={() => setIsFailModalOpen({ orderId: order.id, stageId: focusStage.id })} className="col-span-1 p-6 bg-red-100 text-red-600 rounded-[32px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                     <AlertTriangle className="w-6 h-6" />
                                  </button>
                               </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
                  {(['PENDING', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const).map(colStatus => (
                    <div key={colStatus} className="flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          {colStatus === 'PENDING' ? t('Kutilmoqda') : colStatus === 'PLANNED' ? t('Rejalashtirilgan') : colStatus === 'IN_PROGRESS' ? t('Jarayonda') : t('Tugallangan')}
                        </h4>
                      </div>
                      <div className="flex flex-col gap-4">
                        {productionOrders.filter(o => o.status === colStatus).map(order => (
                          <motion.div key={order.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{order.order_number}</span>
                            </div>
                            <h5 className="text-lg font-black text-slate-900 mb-1">{order.product_name}</h5>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">{t('Hajm')}: {order.quantity} m³</p>
                            {order.status !== 'COMPLETED' && (() => {
                               const currentStage = order.stages.find(s => s.status === 'PENDING' || s.status === 'ACTIVE' || s.status === 'FAILED');
                               if (!currentStage) return null;
                               if (currentStage.status === 'PENDING') return (
                                 <button onClick={() => currentStage.stage_type === 'BUNKER' ? setIsStageBunkerModalOpen({ orderId: order.id, stageId: currentStage.id }) : handleStartStage(order.id, currentStage.id)} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                   <Play className="w-3.5 h-3.5 fill-current" /> {currentStage.stage_type_display}{t('ni boshlash')}
                                 </button>
                               );
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
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Factory Live Monitoring')}</h3>
                  <p className="text-slate-500 font-medium">{t('Barcha aktiv ishlab chiqarish jarayonlari nazorati')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {productionOrders
                  .filter(order => order.stages?.some(s => s.status === 'ACTIVE'))
                  .map(order => {
                    const activeStage = order.stages?.find(s => s.status === 'ACTIVE');
                    if (!activeStage) return null;
                    return (
                      <motion.div key={order.id} className="rounded-[40px] border-2 border-slate-100 bg-white p-8 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100">
                              <Factory className="w-10 h-10" />
                           </div>
                           <div>
                              <h4 className="text-2xl font-black text-slate-900">{order.order_number}</h4>
                              <p className="text-sm font-bold text-slate-500">{order.product_name}</p>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{t('Joriy Bosqich')}: {activeStage.stage_type_display}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <button onClick={() => handleResetStage(order.id, activeStage.id)} className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                              <RotateCcw className="w-4 h-4" /> {t('Tayyor holatga') }
                           </button>
                           <button onClick={() => handleForceComplete(order.id, activeStage.id)} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> {t('Yakunlash')}
                           </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals Section */}
      <AnimatePresence>
        {isZamesModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsZamesModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
               <form onSubmit={handleCreateZames}>
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                        <Plus className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{t('Yangi Zames Yaratish')}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Xom ashyo va retseptura')}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsZamesModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Buyurtmani bog\'lang (Ixtiyoriy)')}</label>
                           <select 
                              value={selectedStageId || ''} 
                              onChange={(e) => setSelectedStageId(e.target.value ? Number(e.target.value) : null)} 
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                           >
                              <option value="">{t('Mustaqil Zames')}</option>
                              {productionOrders
                                 .filter(o => o.status !== 'COMPLETED')
                                 .map(o => (
                                    <optgroup key={o.id} label={`${o.order_number} - ${o.product_name}`}>
                                       {o.stages?.filter(s => s.stage_type === 'ZAMES' && s.status !== 'DONE').map(s => (
                                          <option key={s.id} value={s.id}>
                                             {o.order_number} (Stage: {s.stage_type_display})
                                          </option>
                                       ))}
                                    </optgroup>
                                 ))
                              }
                           </select>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Retsept tanlang')}</label>
                           <select 
                             value={selectedRecipeId} 
                             onChange={(e) => handleRecipeChange(e.target.value)} 
                             required
                             className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                           >
                              <option value="">{t('Tanlang...')}</option>
                              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                           </select>
                        </div>
                     </div>
                     
                     {zamesBatchItems.length > 0 && (
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Materiallar va Partiyalar')}</h4>
                           <div className="space-y-3">
                              {zamesBatchItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{item.material_name}</span>
                                      <span className="text-sm font-black text-slate-900">{item.quantity} kg</span>
                                   </div>
                                   <select 
                                     required
                                     className="p-2 bg-white border border-blue-100 rounded-xl text-xs font-bold"
                                     value={item.batch}
                                     onChange={(e) => {
                                       const newItems = [...zamesBatchItems];
                                       newItems[idx].batch = e.target.value;
                                       setZamesBatchItems(newItems);
                                     }}
                                   >
                                      <option value="">{t('Partiya tanlang')}</option>
                                      {batches.filter(b => b.material === item.material).map(b => (
                                        <option key={b.id} value={b.batch_number}>{b.batch_number} ({b.quantity}kg)</option>
                                      ))}
                                   </select>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                  
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                     <button type="button" onClick={() => setIsZamesModalOpen(false)} className="flex-1 py-4 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all">{t('Bekor qilish')}</button>
                     <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">{loading ? t('Yaratilmoqda...') : t('Zamesni Boshlash')}</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {isFinishModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFinishModalOpen(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
               <form onSubmit={handleFinishZames} className="p-8 space-y-8">
                  <div className="text-center">
                     <div className="w-20 h-20 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
                        <CheckCircle2 className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900">{t('Zamesni Yakunlash')}</h3>
                     <p className="text-sm font-bold text-slate-400 mt-2">{isFinishModalOpen.zames_number} • {isFinishModalOpen.recipe_name}</p>
                  </div>
                  
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Tayyor mahsulot vazni (kg)')}</label>
                     <input 
                       type="number" 
                       step="0.01"
                       value={outputWeight}
                       onChange={(e) => setOutputWeight(e.target.value)}
                       required
                       className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-center text-3xl font-black text-blue-600 focus:border-blue-500 focus:bg-white outline-none transition-all"
                       placeholder="0.00"
                     />
                  </div>
                  
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setIsFinishModalOpen(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl">{t('Qaytish')}</button>
                     <button type="submit" disabled={loading} className="flex-2 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600">{t('Tasdiqlash')}</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {isBunkerModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBunkerModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('Bunkerga Yuklash')}</h3>
                  <button onClick={() => setIsBunkerModalOpen(false)}><X className="text-slate-400" /></button>
               </div>
               <form onSubmit={handleBunkerLoad} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Zamesni Tanlang')}</label>
                     <select value={selectedZamesId} onChange={(e) => setSelectedZamesId(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all">
                        <option value="">{t('Zames tanlang...')}</option>
                        {availableZames.map(z => <option key={z.id} value={z.id}>{z.zames_number} ({z.output_weight} kg)</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Bunkerni Tanlang')}</label>
                     <select value={selectedBunkerId} onChange={(e) => setSelectedBunkerId(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all">
                        <option value="">{t('Bunker tanlang...')}</option>
                        {bunkers.filter(b => b.status === 'Empty').map(b => <option key={b.id} value={b.id}>Bunker №{b.bunkerNumber}</option>)}
                     </select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">{t('Joylash')}</button>
               </form>
            </motion.div>
           </div>
        )}

        {isBlockModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBlockModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('Blok Quyishni Qayd Etish')}</h3>
                  <button onClick={() => setIsBlockModalOpen(false)}><X className="text-slate-400" /></button>
               </div>
               <form onSubmit={handleCreateBlock} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Bunkerdagi Zames')}</label>
                     <select value={selectedZamesForBlock} onChange={(e) => setSelectedZamesForBlock(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all">
                        <option value="">{t('Tanlang...')}</option>
                        {bunkers.filter(b => b.status === 'Ready').map(b => <option key={b.id} value={b.id}>Bunker №{b.bunkerNumber} ({b.batchNumber})</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Forma №')}</label>
                       <input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Dona')}</label>
                       <input type="number" value={blockCount} onChange={(e) => setBlockCount(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Zichlik (kg/m³)')}</label>
                     <input type="number" value={blockDensity} onChange={(e) => setBlockDensity(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">{t('Qayd Etish')}</button>
               </form>
            </motion.div>
           </div>
        )}

        {isOrderModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOrderModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('Yangi Ishlab Chiqarish Buyurtmasi')}</h3>
                  <button onClick={() => setIsOrderModalOpen(false)}><X className="text-slate-400" /></button>
               </div>
               <form onSubmit={handleCreateOrder} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Mahsulot')}</label>
                     <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold">
                        <option value="">{t('Mahsulot tanlang...')}</option>
                        {materials.filter(m => m.category_name === 'Tayyor Mahsulot').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Miqdor (m³)')}</label>
                     <input type="number" value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value)} required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Muddat')}</label>
                     <input type="date" value={orderDeadline} onChange={(e) => setOrderDeadline(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">{t('Yaratish')}</button>
               </form>
            </motion.div>
           </div>
        )}

        {isStageBunkerModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStageBunkerModalOpen(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
               <h3 className="text-xl font-black text-slate-900 mb-6">{t('Bunker Tanlang')}</h3>
               <div className="grid grid-cols-2 gap-4">
                 {bunkers.filter(b => b.status === 'Ready').map(b => (
                   <button 
                     key={b.id} 
                     onClick={() => handleStartStage(isStageBunkerModalOpen.orderId, isStageBunkerModalOpen.stageId, { bunker_id: b.id })}
                     className="p-6 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all flex flex-col items-center gap-2 group"
                   >
                     <Database className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                     <span className="text-sm font-black text-slate-700">№{b.bunkerNumber}</span>
                   </button>
                 ))}
               </div>
               <button onClick={() => setIsStageBunkerModalOpen(null)} className="w-full mt-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">{t('Bekor qilish')}</button>
            </motion.div>
           </div>
        )}

        {isFailModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFailModalOpen(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
               <h3 className="text-xl font-black text-slate-900 mb-6 underline decoration-red-500">{t('Xatolikni Qayd Etish')}</h3>
               <textarea 
                 value={failReason} 
                 onChange={(e) => setFailReason(e.target.value)} 
                 placeholder={t('Xatolik sababini kiriting...')}
                 className="w-full h-32 p-4 bg-red-50/50 border-2 border-red-100 rounded-2xl outline-none focus:border-red-500 transition-all font-bold placeholder:text-red-300"
               />
               <div className="grid grid-cols-2 gap-4 mt-6">
                 <button onClick={() => setIsFailModalOpen(null)} className="py-4 bg-slate-100 text-slate-500 rounded-xl font-black">{t('Bekor qilish')}</button>
                 <button onClick={handleFailStage} className="py-4 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-100">{t('Qayd Etish')}</button>
               </div>
            </motion.div>
           </div>
        )}
      </AnimatePresence>
    </>
  );
}
