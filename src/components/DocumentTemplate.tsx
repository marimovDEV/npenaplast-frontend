import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DocumentTemplateProps {
  document: any;
  items: any[];
}

export default function DocumentTemplate({ document, items }: DocumentTemplateProps) {
  return (
    <div className="max-w-[210mm] min-h-[297mm] bg-white p-12 flex flex-col mx-auto border border-slate-100 shadow-sm print:shadow-none print:border-none print:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">Penoplast ERP</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Industrial Production Management</p>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase">Hujjat turi</p>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {document.type === 'HISOB_FAKTURA_KIRIM' ? 'Hisob-faktura (Kirim)' : 'Ichki yuk xati (Nakladnoy)'}
            </h2>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col items-end gap-3 text-right">
          <QRCodeSVG value={document.qr_code} size={80} level="H" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Hujjat raqami</p>
            <p className="text-xl font-black text-slate-900 font-mono tracking-widest">{document.number}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12 py-8 border-y border-slate-100 italic font-medium text-slate-600">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest not-italic mb-1">Beruvchi (Supplier)</p>
            <p className="text-sm font-black text-slate-900 not-italic">{document.from_entity_name || "Noma'lum"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest not-italic mb-1">Sana</p>
            <p className="text-sm font-black text-slate-900 not-italic">{new Date(document.created_at).toLocaleDateString()} {new Date(document.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="space-y-4 text-right">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest not-italic mb-1">Qabul qiluvchi (Recipient)</p>
            <p className="text-sm font-black text-slate-900 not-italic">{document.to_entity_name || "Asosiy Ombor (Sklad №1)"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest not-italic mb-1">Mas'ul xodim</p>
            <p className="text-sm font-black text-slate-900 not-italic">{document.created_by_name || "Administrator"}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mahsulot nomi</th>
            <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Partiya ID</th>
            <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Miqdor</th>
            <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Narx</th>
            <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <tr key={index}>
              <td className="py-6">
                <p className="font-black text-slate-900 uppercase tracking-tight">{item.product_name}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.product_sku}</p>
              </td>
              <td className="py-6 font-mono text-xs">{item.batch_number || "Yangi"}</td>
              <td className="py-6 text-right font-black text-slate-900">{item.quantity} {item.unit || 'kg'}</td>
              <td className="py-6 text-right text-slate-600 font-bold">{item.price_at_moment?.toLocaleString() || '0'}</td>
              <td className="py-6 text-right font-black text-slate-900">{(item.quantity * (item.price_at_moment || 0)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-900">
            <td colSpan={4} className="py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Umumiy qiymat (TOTAL)</td>
            <td className="py-6 text-right font-black text-xl text-slate-900 tracking-tight">
              {items.reduce((acc, i) => acc + (i.quantity * (i.price_at_moment || 0)), 0).toLocaleString()} <span className="text-xs uppercase ml-1">{document.currency}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer / Signatures */}
      <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between gap-12 text-center">
        <div className="flex-1 space-y-8">
           <div className="w-full border-b border-slate-900 h-8" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jo'natuvchi Imzosi</p>
        </div>
        <div className="flex-1 space-y-8">
           <div className="w-full border-b border-slate-900 h-8" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qabul qiluvchi Imzosi</p>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-[8px] text-slate-300 uppercase tracking-[0.5em] font-black italic">
          Generated automatically by Penoplast ERP System - Secure Industrial Ledger
        </p>
      </div>
    </div>
  );
}
