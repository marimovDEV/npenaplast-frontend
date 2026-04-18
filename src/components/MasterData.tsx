import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Database, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Settings, 
  BarChart3, 
  ChevronRight,
  ClipboardList,
  Box,
  FlaskConical,
  Scale,
  X,
  PlusCircle
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { uiStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export default function MasterData() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'RECIPES' | 'PRODUCTS'>('RECIPES');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'RECIPES') {
        const res = await api.get('production/recipes/');
        setRecipes(res.data);
      } else {
        const res = await api.get('materials/');
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
      uiStore.showNotification("Ma'lumotlarni yuklashda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
               <Database className="w-6 h-6" />
             </div>
             {t('Master Data Boshqaruvi')}
           </h1>
           <p className="text-slate-500 font-medium">{t('Retseptlar, normalar va mahsulot katalogi')}</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[22px] border border-slate-200">
          {[
            { id: 'RECIPES', name: t('Retseptlar'), icon: FlaskConical },
            { id: 'PRODUCTS', name: t('Mahsulotlar'), icon: Box },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative group w-full md:max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-all" />
          <input 
            type="text" 
            placeholder={t('Qidiruv...')}
            className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-[28px] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          onClick={() => activeTab === 'RECIPES' ? setIsRecipeModalOpen(true) : null}
          className="w-full md:w-fit bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          {activeTab === 'RECIPES' ? t('Yangi Retsept') : t('Yangi Mahsulot')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
           {loading ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-50 h-64 rounded-[40px] animate-pulse border border-slate-100" />
             ))
           ) : activeTab === 'RECIPES' ? (
             filteredRecipes.length > 0 ? (
                filteredRecipes.map(r => (
                  <motion.div 
                    key={r.id} 
                    layout 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => { setSelectedRecipe(r); setIsRecipeModalOpen(true); }}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-6 h-6" />
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-100">Active</span>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-2">{r.name}</h3>
                     <div className="flex flex-wrap gap-1.5 mb-6">
                        {r.items?.slice(0, 3).map((i: any, idx: number) => (
                           <span key={idx} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                             {i.material_name}: {i.quantity}
                           </span>
                        ))}
                        {r.items?.length > 3 && <span className="text-[9px] font-bold text-slate-300">+{r.items.length - 3}</span>}
                     </div>
                     <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <div className="flex items-center gap-2">
                           <Scale className="w-3.5 h-3.5" />
                           <span>1 {r.output_unit || 'cycle'}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </div>
                  </motion.div>
                ))
             ) : (
                <div className="col-span-full py-40 flex flex-col items-center border-4 border-dashed border-slate-50 rounded-[48px]">
                   <ClipboardList className="w-20 h-20 text-slate-100 mb-4" />
                   <p className="text-slate-300 font-black uppercase tracking-widest">{t('Retseptlar topilmadi')}</p>
                </div>
             )
           ) : (
             filteredProducts.map(p => (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Box className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-1">{p.name}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{p.sku || 'NO SKU'}</p>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Narxi')}</p>
                       <p className="text-sm font-black text-slate-900">{p.price?.toLocaleString()} UZS</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Birlik')}</p>
                       <p className="text-sm font-black text-slate-900 uppercase">{p.unit}</p>
                    </div>
                 </div>
              </motion.div>
             ))
           )}
        </AnimatePresence>
      </div>

      {/* Recipe Detail/Edit Modal */}
      <AnimatePresence>
         {isRecipeModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl"
               >
                  <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                           <FlaskConical className="w-7 h-7" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-slate-900">{selectedRecipe ? selectedRecipe.name : t('Yangi Retsept')}</h3>
                           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('Normalar va Tarkib')}</p>
                        </div>
                     </div>
                     <button onClick={() => { setIsRecipeModalOpen(false); setSelectedRecipe(null); }} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('Tarkibiy qismlar')}</h4>
                        <div className="space-y-3">
                           {selectedRecipe?.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
                                       {idx + 1}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-800">{item.material_name}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase">{t('Tannarxi hisoblanadi')}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-slate-900">{item.quantity}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">kg</span>
                                 </div>
                              </div>
                           ))}
                           {!selectedRecipe && (
                              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                 <p className="text-slate-300 font-bold uppercase text-xs">{t('Materiallar qo\'shish uchun formdan foydalaning')}</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="p-6 bg-indigo-50/30 border border-indigo-100/50 rounded-[32px]">
                           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('Standart Hajm')}</p>
                           <p className="text-xl font-black text-indigo-900">4.5 m³ <span className="text-xs font-bold text-indigo-400">/ cycle</span></p>
                        </div>
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px]">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Taxminiy Tannarx')}</p>
                           <p className="text-xl font-black text-slate-900">12,500 <span className="text-xs font-bold text-slate-400">UZS</span></p>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                     <button className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">{t('Saqlash')}</button>
                     <button className="px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">{t('Yopish')}</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
