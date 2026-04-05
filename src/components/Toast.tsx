import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { uiStore } from '../lib/store';
import { Notification } from '../types';

export default function Toast() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const unsub = uiStore.subscribe(() => {
      setNotifications([...uiStore.notifications]);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed z-[9999] flex flex-col gap-3 pointer-events-none ${isMobile ? 'left-3 right-3 bottom-20' : 'bottom-6 right-6 max-w-md w-full'}`}>
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-2xl animate-in fade-in duration-300 ${isMobile ? 'slide-in-from-bottom-6' : 'slide-in-from-right-10'} ${
            n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
            n.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
            'bg-blue-50 border-blue-100 text-blue-800'
          }`}
        >
          <div className={`p-2 rounded-xl ${
            n.type === 'success' ? 'bg-emerald-500/10' :
            n.type === 'error' ? 'bg-rose-500/10' :
            'bg-blue-500/10'
          }`}>
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {n.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">{n.message}</p>
          </div>
          <button 
            onClick={() => {
              uiStore.notifications = uiStore.notifications.filter(notif => notif.id !== n.id);
              uiStore.notify();
            }}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      ))}
    </div>
  );
}
