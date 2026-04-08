import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Navigation,
  DollarSign,
  Package,
  ArrowLeft,
  X,
  Camera,
  QrCode,
  Search,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { ERPDocument, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';

const ScannerModal = lazy(() => import('./ScannerModal'));

export default function CourierDashboard({ user }: { user: UserType }) {
  const { locale, t } = useI18n();
  const [documents, setDocuments] = useState<ERPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<ERPDocument | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch documents assigned to this courier via the new DocumentDelivery model
      // Note: We use the documents endpoint and filter by courier in the delivery relation
      const res = await api.get('documents/', { params: { courier_id: user.id } });
      setDocuments(res.data);
    } catch (err) {
      uiStore.showNotification(t("Ma'lumotlarni yuklashda xatolik"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (docId: string | number, action: 'start_delivery' | 'confirm_delivery') => {
    try {
      await api.post(`documents/${docId}/${action}/`);
      uiStore.showNotification(
        action === 'start_delivery' ? t("Yetkazib berish boshlandi") : t("Muvaffaqiyatli yetkazildi"), 
        "success"
      );
      setSelectedDoc(null);
      fetchData();
    } catch (err) {
      uiStore.showNotification(t("Amalni bajarishda xatolik"), "error");
    }
  };

  const onScanSuccess = (data: any) => {
    // If it's a document, show it
    if (data.number || data.items) {
      setSelectedDoc(data);
    } else {
      uiStore.showNotification(t("Noma'lum QR kod"), "info");
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('Kuryer')}</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('Logistika nazorati')}</p>
        </div>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-200 text-white active:scale-90 transition-all"
        >
           <QrCode className="w-8 h-8" />
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[24px]">
         <div className="flex-1 px-6 py-3 bg-white rounded-[20px] shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('Aktiv')}</p>
            <p className="text-xl font-black text-slate-900">{documents.filter(d => d.status === 'IN_TRANSIT').length}</p>
         </div>
         <div className="flex-1 px-6 py-3 rounded-[20px] text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('Kutilmoqda')}</p>
            <p className="text-xl font-black text-slate-600">{documents.filter(d => d.status !== 'IN_TRANSIT' && d.status !== 'DONE').length}</p>
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Ma\'lumotlar yuklanmoqda')}...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-[40px] p-24 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-4">
           <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
              <Package className="w-10 h-10" />
           </div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t('Hozircha topshiriqlar yo\'q')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
           {documents.filter(d => d.status !== 'DONE' && d.status !== 'CANCELLED').map((doc) => (
             <motion.div 
               key={doc.id}
               whileTap={{ scale: 0.97 }}
               onClick={() => setSelectedDoc(doc)}
               className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group"
             >
                <div className={`absolute top-0 left-0 w-2.5 h-full ${
                  doc.status === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-amber-400'
                }`} />

                <div className="flex items-center gap-6 ml-2">
                   <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${
                      doc.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                   }`}>
                      {doc.status === 'IN_TRANSIT' ? <Navigation className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{doc.number}</h4>
                      <p className="text-xs font-bold text-slate-400 truncate max-w-[160px] uppercase tracking-wider">{doc.to_entity_name}</p>
                   </div>
                </div>
                
                <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-colors" />
             </motion.div>
           ))}
        </div>
      )}

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <Suspense fallback={null}>
            <ScannerModal 
              type="DOCUMENT"
              onScan={onScanSuccess}
              onClose={() => setIsScannerOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDoc(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
             
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               className="relative w-full max-w-lg bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
             >
                <div className="p-10 space-y-10">
                   <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('Topshiriq ma\'lumotlari')}</p>
                       <h3 className="text-3xl font-black text-slate-900 text-center tracking-tight">{selectedDoc.number}</h3>
                   </div>

                   <div className="space-y-4">
                      <div className="bg-slate-50 p-6 rounded-[32px] flex items-start gap-5">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                            <MapPin className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Yetkazish manzili')}</p>
                            <p className="text-sm font-black text-slate-900 leading-relaxed">{selectedDoc.to_entity_name}</p>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-[32px] flex items-center gap-5">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                            <Clock className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Yaratilgan vaqt')}</p>
                            <p className="text-sm font-black text-slate-900">{new Date(selectedDoc.created_at || '').toLocaleString(locale)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="border-t border-slate-100 pt-10">
                      <div className="flex items-center justify-between mb-6">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Hujjat holati')}</p>
                         <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedDoc.status_label || selectedDoc.status}</span>
                      </div>

                      <div className="flex flex-col gap-4">
                         {(selectedDoc.status === 'CONFIRMED' || selectedDoc.status === 'CREATED') && (
                           <button 
                             onClick={() => handleAction(selectedDoc.id, 'start_delivery')}
                             className="w-full bg-blue-600 text-white p-7 rounded-[32px] font-black text-lg shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-4"
                           >
                              <Navigation className="w-7 h-7" />
                              {t('YUKNI QABUL QILISH')}
                           </button>
                         )}
                         {selectedDoc.status === 'IN_TRANSIT' && (
                           <button 
                             onClick={() => handleAction(selectedDoc.id, 'confirm_delivery')}
                             className="w-full bg-emerald-500 text-white p-7 rounded-[32px] font-black text-lg shadow-2xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-4"
                           >
                              <CheckCircle2 className="w-7 h-7" />
                              {t('YETKAZILDI (YAKUNLASH)')}
                           </button>
                         )}
                         <button 
                            onClick={() => setSelectedDoc(null)}
                            className="w-full py-6 bg-slate-50 text-slate-400 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all font-mono"
                         >
                            {t('ORQAGA QAYTISH')}
                         </button>
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
