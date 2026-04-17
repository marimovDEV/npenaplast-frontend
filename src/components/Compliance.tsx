import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, FileWarning, Eye, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import type { ComplianceRule, ComplianceViolation, LegalDocument } from '../types';

type Tab = 'rules' | 'violations' | 'documents';

export default function Compliance() {
  const [tab, setTab] = useState<Tab>('violations');
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'rules') {
        const res = await api.get('compliance/rules/');
        setRules(res.data.results || res.data);
      } else if (tab === 'violations') {
        const res = await api.get('compliance/violations/?is_resolved=false');
        setViolations(res.data.results || res.data);
      } else {
        const res = await api.get('compliance/documents/');
        setDocuments(res.data.results || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    const note = prompt("Qanday hal qilindi?");
    if (note === null) return;
    try {
      await api.post(`compliance/violations/${id}/resolve/`, { note });
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Xato!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit">
        <button onClick={() => setTab('violations')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'violations' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          <FileWarning className="w-4 h-4 inline-block mr-1.5" /> Qoida Buzilishlari
        </button>
        <button onClick={() => setTab('rules')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          <ShieldAlert className="w-4 h-4 inline-block mr-1.5" /> Biznes Qoidalar
        </button>
        <button onClick={() => setTab('documents')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'documents' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          <FileText className="w-4 h-4 inline-block mr-1.5" /> Yuridik Hujjatlar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {tab === 'violations' && (
            <div className="divide-y divide-slate-50">
              {violations.length === 0 ? <p className="p-8 text-center text-slate-500">Hammasi joyida, qoida buzilishlari yo'q! 🎉</p> : null}
              {violations.map(v => (
                <div key={v.id} className="p-4 flex items-start gap-4 hover:bg-slate-50">
                  <div className={`p-2 rounded-xl ${v.severity === 'BLOCK' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{v.rule_name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{v.created_at.slice(0, 10)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{v.description}</p>
                  </div>
                  <button onClick={() => handleResolve(v.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100">
                    Hal qilish / Yopish
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'rules' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                <tr><th className="p-4 text-left">Qoida Nomi</th><th className="p-4 text-left">Jazo/Harakat</th><th className="p-4 text-left">Holati</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rules.map(r => (
                  <tr key={r.id}>
                    <td className="p-4 font-semibold text-slate-800">{r.name}</td>
                    <td className="p-4 text-xs font-bold"><span className={r.severity === 'BLOCK' ? 'text-rose-600' : 'text-amber-600'}>{r.severity}</span></td>
                    <td className="p-4"><span className={r.is_active ? 'text-emerald-600' : 'text-slate-400'}>{r.is_active ? 'Faol' : 'Noaktiv'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      )}
    </div>
  );
}
