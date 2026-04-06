import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api';
import { useI18n } from '../i18n';

interface ScannerModalProps {
  onScan: (data: any) => void;
  onClose: () => void;
  type?: 'BATCH' | 'DOCUMENT';
}

export default function ScannerModal({ onScan, onClose, type = 'BATCH' }: ScannerModalProps) {
  const { locale } = useI18n();
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDocumentResult = Boolean(scannedData?.number);
  const displayDate = scannedData?.date || scannedData?.created_at;

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    async function onScanSuccess(decodedText: string) {
      setLoading(true);
      setError(null);
      try {
        // Universal scan endpoint handles both DOC: and BAT: prefixes
        const endpoint = `documents/by-qr/${decodedText}/`;
        const res = await api.get(endpoint);
        setScannedData(res.data);
        if (scanner.getState() === 2) {
          scanner.pause();
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Ma'lumot topilmadi");
      } finally {
        setLoading(false);
      }
    }

    function onScanFailure(error: any) {
      // Just ignore failure to find QR in frame
    }

    if (!scannedData) {
      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      scanner.clear().catch(err => console.error("Scanner clear failed", err));
    };
  }, [onScan, type, scannedData]);


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{scannedData ? 'Ma\'lumot topildi' : 'QR Skayner'}</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">
                {scannedData ? scannedData.batch_number || scannedData.number : 'Partiya yoki Hujjatni aniqlash'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
           {!scannedData ? (
             <div id="qr-reader" className="overflow-hidden rounded-3xl border-4 border-slate-100 bg-slate-50 relative min-h-[300px]">
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                     <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                     <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
                  </div>
                )}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-6 left-6 right-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 z-20">
                       <AlertCircle className="w-5 h-5 flex-shrink-0" />
                       <p className="text-xs font-bold leading-tight uppercase tracking-widest text-left">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
           ) : (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
                {isDocumentResult ? (
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hujjat turi</p>
                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{scannedData.type_label || scannedData.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Holat</p>
                        <p className="text-sm font-black text-blue-600">{scannedData.status_label || scannedData.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qayerdan</p>
                        <p className="text-sm font-black text-slate-900">{scannedData.from_entity_name || "Noma'lum"}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qayerga</p>
                        <p className="text-sm font-black text-slate-900">{scannedData.to_entity_name || "Noma'lum"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pozitsiyalar soni</p>
                        <p className="text-sm font-black text-amber-600">{scannedData.items?.length || 0} ta</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yaratilgan sana</p>
                        <p className="text-sm font-black text-slate-900">{displayDate ? new Date(displayDate).toLocaleDateString(locale) : '-'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mahsulot</p>
                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{scannedData.material_name || scannedData.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qolgan miqdor</p>
                        <p className="text-2xl font-black text-blue-600">{scannedData.remaining_quantity || 0} kg</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Band qilingan (Reserved)</p>
                        <p className="text-sm font-black text-amber-600">{scannedData.reserved_quantity || 0} kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kirim sanasi</p>
                        <p className="text-sm font-black text-slate-900">{displayDate ? new Date(displayDate).toLocaleDateString(locale) : '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                   <button 
                    onClick={() => { onScan(scannedData); onClose(); }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                   >
                     {isDocumentResult ? "Hujjat bo'yicha davom etish" : 'Sexga berish / Harakat qilish'}
                   </button>
                   <button 
                    onClick={() => setScannedData(null)}
                    className="w-full py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all font-mono"
                   >
                     QAYTADAN SKAYNERLASH
                   </button>
                </div>
             </motion.div>
           )}
           
           {!scannedData && (
             <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4 italic">Ko'rsatma:</p>
                <ul className="text-xs font-bold text-slate-600 space-y-3">
                   <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] flex-shrink-0">1</div>
                      <span>{type === 'DOCUMENT' ? "Hujjat QR kodini kamera markaziga keltiring." : "Partiya yorlig'idagi QR kodni kamera markaziga keltiring."}</span>
                   </li>
                   <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] flex-shrink-0">2</div>
                      <span>{type === 'DOCUMENT' ? "Tizim hujjatni aniqlab, marshrut va status ma'lumotlarini ochadi." : "Tizim avtomatik ravishda partiyani aniqlaydi va ma'lumotlarni ochadi."}</span>
                   </li>
                </ul>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
