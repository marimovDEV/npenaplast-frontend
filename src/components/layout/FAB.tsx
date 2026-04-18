import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ShoppingCart, 
  Factory, 
  Database,
  X,
  Target,
  FileText
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface FABProps {
  userRole: string;
  onAction: (tabId: string) => void;
}

export default function FAB({ userRole, onAction }: FABProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = ['Bosh Admin', 'Admin', 'SUPERADMIN', 'ADMIN'].includes(userRole);
  
  const actions = [
    { id: 'sales', name: 'Yangi Sotuv', icon: ShoppingCart, color: 'bg-emerald-500', roles: ['Bosh Admin', 'Admin', 'Sotuv menejeri'] },
    { id: 'production', name: 'Zames boshlash', icon: Factory, color: 'bg-blue-500', roles: ['Bosh Admin', 'Admin', 'Ishlab chiqarish ustasi'] },
    { id: 'sklad1', name: 'Xom ashyo kirim', icon: Database, color: 'bg-amber-500', roles: ['Bosh Admin', 'Admin', 'Omborchi'] },
    { id: 'contracts', name: 'Shartnoma', icon: FileText, color: 'bg-indigo-500', roles: ['Bosh Admin', 'Admin', 'Sotuv menejeri'] },
  ].filter(a => isAdmin || a.roles.includes(userRole));

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {actions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                   onAction(action.id);
                   setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl shadow-premium text-[10px] font-black uppercase tracking-widest text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100">
                  {t(action.name)}
                </span>
                <div className={`${action.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all`}>
                  <action.icon className="w-6 h-6" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-all duration-300 active:scale-90 ${isOpen ? 'bg-slate-900 rotate-45' : 'bg-primary-accent'}`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
      </button>
    </div>
  );
}
