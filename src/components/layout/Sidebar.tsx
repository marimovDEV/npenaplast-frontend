import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Factory, 
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Circle
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { User } from '../../types';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigationGroups: any[];
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  navigationGroups, 
  onLogout,
  isOpen,
  setIsOpen
}: SidebarProps) {
  const { t } = useI18n();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const currentRole = user?.effective_role || user?.role_display || user?.role || '';

  const toggleGroup = (groupId: string) => {
    setActiveGroup(prev => prev === groupId ? null : groupId);
  };

  return (
    <motion.aside 
      animate={{ width: isOpen ? 288 : 88 }}
      className="fixed inset-y-0 left-0 z-50 bg-primary text-white border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out shadow-2xl"
    >
      {/* Header Logo */}
      <div className="h-20 flex items-center px-6 gap-3 overflow-hidden whitespace-nowrap">
        <div className="flex-none w-10 h-10 bg-primary-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <Factory className="text-white w-6 h-6" />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1"
            >
              <h1 className="font-black text-lg leading-none tracking-tight">Penoplast</h1>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Enterprise ERP</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto no-scrollbar scroll-smooth">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item: any) => {
            const isPrivileged = !!(user?.is_superuser || ['Bosh Admin', 'SuperAdmin', 'Admin', 'SUPERADMIN', 'ADMIN'].includes(currentRole));
            if (isPrivileged) return true;
            const hasRole = item.roles?.includes(currentRole);
            return hasRole;
          });
          
          if (visibleItems.length === 0) return null;

          const isGroupOpen = activeGroup === group.id || !isOpen;
          const isMain = group.id === 'main';

          return (
            <div key={group.id} className="space-y-1">
              {isOpen && !isMain && group.title && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 group/header hover:bg-white/5 rounded-xl transition-all"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/header:text-blue-400 transition-colors">
                    {t(group.title)}
                  </span>
                  <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${activeGroup === group.id ? 'rotate-90 text-blue-400' : ''}`} />
                </button>
              )}

              <div className="space-y-1">
                {visibleItems.map((item: any) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative overflow-hidden group
                        ${isActive ? 'bg-primary-accent text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                        ${!isOpen ? 'justify-center px-0' : ''}
                      `}
                      title={!isOpen ? t(item.name) : ''}
                    >
                      <item.icon className={`w-5 h-5 flex-none ${isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'}`} />
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-bold text-sm whitespace-nowrap truncate"
                          >
                            {t(item.name)}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {isActive && isOpen && (
                        <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <div className={`flex items-center gap-3 p-3 bg-white/5 rounded-2xl ${!isOpen ? 'justify-center border-none bg-transparent px-0' : 'border border-white/5'}`}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center border border-white/10 shadow-sm flex-none">
            <UserIcon className="w-5 h-5 text-slate-300" />
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate leading-none mb-1">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate">{t(currentRole)}</p>
            </div>
          )}
        </div>

        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-bold text-sm ${!isOpen ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-none" />
          {isOpen && <span>{t('Chiqish')}</span>}
        </button>
      </div>

      {/* Collapse Toggle Button (Floating) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-24 w-6 h-6 bg-primary-accent border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl invisible md:visible hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </motion.aside>
  );
}
