import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, XCircle, Check } from 'lucide-react';
import api from '../lib/api';
import type { Alert } from '../types';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('alerts/alerts/unread/');
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id: number) => {
    try {
      await api.post(`alerts/alerts/${id}/resolve/`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && alerts.length === 0) {
    return <div className="text-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block"/></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
        <Bell className="w-6 h-6 text-indigo-600" /> Tizim Alertlari (Jurnal)
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Yangi xabarlar yo'q</p>
          </div>
        ) : alerts.map(alert => {
          let Icon = Info;
          let color = 'text-blue-600';
          let bg = 'bg-blue-50';

          if (alert.severity === 'WARNING') {
            Icon = AlertTriangle;
            color = 'text-amber-600'; bg = 'bg-amber-50';
          } else if (alert.severity === 'CRITICAL') {
            Icon = XCircle;
            color = 'text-rose-600'; bg = 'bg-rose-50';
          }

          return (
            <div key={alert.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className={`p-2 rounded-xl flex-none ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold ${color}`}>{alert.title}</h3>
                  <span className="text-[10px] text-slate-400">{alert.created_at.slice(0, 16)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
              </div>
              <button onClick={() => resolveAlert(alert.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                <Check className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
