import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api';
import { useI18n } from '../i18n';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationDropdown({ isOpen, onClose, onUnreadChange }: NotificationDropdownProps) {
  const { locale, t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('notifications/');
      const data = response.data.results || response.data;
      setNotifications(data);
      const unreadCount = data.filter((n: any) => !n.is_read).length;
      onUnreadChange?.(unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Initial fetch for count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await api.get('notifications/');
        const data = response.data.results || response.data;
        const unreadCount = data.filter((n: any) => !n.is_read).length;
        onUnreadChange?.(unreadCount);
      } catch (err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`notifications/${id}/mark_as_read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const newUnreadCount = notifications.filter(n => !n.is_read && n.id !== id).length;
      onUnreadChange?.(newUnreadCount);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('notifications/mark_all_as_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onUnreadChange?.(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const wasUnread = !notifications.find(n => n.id === id)?.is_read;
      if (wasUnread) {
        onUnreadChange?.(notifications.filter(n => !n.is_read && n.id !== id).length);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[70] overflow-hidden flex flex-col max-h-[500px]"
          >
            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Bildirishnomalar
              </h3>
              <div className="flex items-center gap-1">
                {notifications.some(n => !n.is_read) && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-white rounded-lg text-blue-600 transition-colors"
                    title={t("Hammasini o'qilgan deb belgilash")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400 italic">{t('Yuklanmoqda...')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 italic uppercase tracking-widest">{t("Bildirishnomalar yo'q")}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`group relative p-4 rounded-2xl border transition-all ${
                      n.is_read ? 'bg-white border-transparent' : 'bg-blue-50/30 border-blue-50'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none ${
                        n.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                        n.type === 'ERROR' ? 'bg-rose-100 text-rose-600' :
                        n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {n.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> :
                         n.type === 'ERROR' ? <AlertCircle className="w-5 h-5" /> :
                         n.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                         <Info className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm font-black mb-0.5 leading-tight ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-1.5">
                          {n.message}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                          {new Date(n.created_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title={t("O'qilgan deb belgilash")}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(n.id)}
                        className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title={t("O'chirish")}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {!n.is_read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full border border-white group-hover:hidden" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
