import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  QrCode,
  Menu,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useI18n } from '../../i18n';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationDropdown from '../NotificationDropdown';

interface TopbarProps {
  user: any;
  activeTabName: string;
  onToggleMobileSidebar?: () => void;
  isMobile: boolean;
  onOpenScanner: () => void;
  unreadCount: number;
  onUnreadChange: (count: number) => void;
}

export default function Topbar({
  user,
  activeTabName,
  onToggleMobileSidebar,
  isMobile,
  onOpenScanner,
  unreadCount,
  onUnreadChange
}: TopbarProps) {
  const { t } = useI18n();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Page Title / Mobile Menu */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <button 
            onClick={onToggleMobileSidebar}
            className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {t(activeTabName)}
          </h2>
          {!isMobile && (
            <div className="flex items-center gap-2 mt-1">
               <Clock className="w-3 h-3 text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
               </span>
            </div>
          )}
        </div>
      </div>

      {/* Global Utilities */}
      <div className="flex items-center gap-4">
        {/* Search - Desktop Only */}
        {!isMobile && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t('Global qidiruv...')} 
              className="bg-slate-100/50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-2.5 pl-11 pr-4 text-sm w-64 outline-none transition-all font-medium" 
            />
          </div>
        )}

        {/* Global Language Switcher */}
        <LanguageSwitcher />

        {/* Tools */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
           <button 
             onClick={onOpenScanner}
             className="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group shadow-sm active:scale-90"
           >
             <QrCode className="w-5 h-5 group-hover:rotate-12 transition-all" />
           </button>

           <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 relative transition-all active:scale-90"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                onUnreadChange={onUnreadChange}
              />
           </div>
        </div>
      </div>
    </header>
  );
}
