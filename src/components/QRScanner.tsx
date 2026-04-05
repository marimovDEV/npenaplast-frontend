import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Package, 
  Clock, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uiStore } from '../lib/store';
import api from '../lib/api';

export default function QRScanner({ onClose }: { onClose: () => void }) {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  const fetchRecentDocs = async () => {
    try {
      const res = await api.get('documents/', {
        params: { status: 'CREATED' }
      });
      setRecentDocs(res.data);
    } catch (err) {
      console.error("Failed to fetch recent docs", err);
    }
  };

  useEffect(() => {
    fetchRecentDocs();
  }, []);

  const handleScan = async (code: string) => {
    setError(null);
    try {
      const res = await api.get(`documents/?qr_code=${code}`);
      if (res.data.length > 0) {
        setScanResult(res.data[0]);
        setIsScanning(false);
      } else {
        setError('Hujjat topilmadi yoki QR kod noto\'g\'ri');
      }
    } catch (err) {
      setError('Qidiruvda xatolik yuz berdi');
    }
  };

  const handleConfirm = async () => {
    if (scanResult) {
      try {
        await api.post(`documents/${scanResult.id}/complete/`);
        uiStore.showNotification(`Hujjat ${scanResult.number} tasdiqlandi!`, 'success');
        setIsScanning(true);
        setScanResult(null);
        fetchRecentDocs();
      } catch (err) {
        alert("Tasdiqlashda xatolik");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 40 }} 
        className="relative bg-white w-full max-w-4xl rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left Side: Scanner */}
        <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 flex items-center gap-3 text-white/60">
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Scanner Simulator</span>
          </div>

          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-72 h-72"
              >
                {/* Scanner Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />

                <div className="absolute inset-4 bg-blue-500/10 rounded-xl overflow-hidden flex items-center justify-center">
                   <div className="w-full h-1 bg-blue-500/50 absolute top-0 left-0 animate-scan-line shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                   <QrCode className="w-24 h-24 text-blue-500/30 animate-pulse" />
                </div>

                <div className="absolute -bottom-16 left-0 right-0 text-center">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">Hujjatdagi QR kodni ko'rsating</p>
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <input 
                      type="text" 
                      placeholder="Manual QR..." 
                      className="bg-transparent border-none outline-none text-white text-xs px-4 flex-1 font-bold"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                    />
                    <button 
                      onClick={() => handleScan(manualCode)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : scanResult ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm text-center"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 translate-y-[-10px]">
                  <CheckCircle2 className="text-white w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">QR Tasdiqlandi!</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Hujjat: {scanResult.number}</p>
                
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 mb-8">
                  <div className="flex justify-between items-center text-left">
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase mb-1">Qayerdan</p>
                      <p className="text-xs font-bold text-white">{scanResult.from_entity_name || '---'}</p>
                    </div>
                    <ArrowRight className="text-white/20 w-4 h-4" />
                    <div className="text-right">
                      <p className="text-[9px] font-black text-white/30 uppercase mb-1">Qayerga</p>
                      <p className="text-xs font-bold text-white">{scanResult.to_entity_name || '---'}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleConfirm}
                  className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Tranzaksiyani Tasdiqlash
                </button>
                <button 
                  onClick={() => setIsScanning(true)}
                  className="w-full mt-4 py-4 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                >
                  Qayta Scan Qilish
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="absolute bottom-8 px-6 py-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 text-[10px] font-bold"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Right Side: Ready Documents */}
        <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Scanning Queue</h4>
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[8px] font-black">{recentDocs.length}</div>
          </div>

          <div className="space-y-4">
            {recentDocs.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[9px] font-black text-slate-400 uppercase">Navbatda hujjat yo'q</p>
              </div>
            ) : (
              recentDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleScan(doc.qr_code || doc.qrCode || `DOC:${doc.number}`)}
                  className="w-full bg-white p-4 rounded-[24px] border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 transition-all" />
                  </div>
                  <h5 className="text-xs font-black text-slate-900 mb-1">{doc.number}</h5>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase leading-none">
                     <span className="truncate max-w-[60px]">{doc.from_entity_name || '---'}</span>
                     <ArrowRight className="w-2 h-2" />
                     <span className="truncate max-w-[60px]">{doc.to_entity_name || '---'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 transition-all z-10">
          <X className="w-6 h-6" />
        </button>
      </motion.div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
