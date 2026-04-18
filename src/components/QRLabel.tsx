import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRLabelProps {
  batch: {
    batchNumber: string;
    name: string;
    quantity_kg: number;
    remaining_quantity: number;
    qr_code: string;
    date: string;
    supplier?: string;
  };
}

export default function QRLabel({ batch }: QRLabelProps) {
  return (
    <div className="w-[40mm] h-[25mm] bg-white p-2 flex flex-col items-center justify-center border border-slate-200 rounded-sm print:border-none print:m-0">
      <div className="flex w-full items-start justify-between gap-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-[7px] font-black uppercase text-slate-400 leading-none">Material</p>
          <p className="text-[9px] font-black text-slate-900 truncate leading-tight">{batch.name}</p>
          
          <p className="text-[7px] font-black uppercase text-slate-400 mt-1 leading-none">Partiya</p>
          <p className="text-[9px] font-black text-blue-600 truncate leading-tight">{batch.batchNumber}</p>
          
          <div className="flex gap-2 mt-1">
            <div>
              <p className="text-[6px] font-black uppercase text-slate-400 leading-none">Og'irlik</p>
              <p className="text-[8px] font-black text-slate-900">{batch.quantity_kg}kg</p>
            </div>
            <div>
              <p className="text-[6px] font-black uppercase text-slate-400 leading-none">Sana</p>
              <p className="text-[8px] font-black text-slate-900">{batch.date}</p>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <QRCodeSVG 
            value={batch.qr_code} 
            size={45}
            level="M"
            includeMargin={false}
          />
          <p className="text-[5px] font-mono text-slate-400 uppercase tracking-tighter">SCAN TO VERIFY</p>
        </div>
      </div>
      
      <div className="w-full mt-1 border-t border-slate-100 pt-0.5">
        <p className="text-[6px] font-black text-center text-slate-500 uppercase tracking-widest">Yuksar ERP System</p>
      </div>
    </div>
  );
}
