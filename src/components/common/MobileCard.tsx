import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface MobileCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  status?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  rightElement?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}

const statusVariants = {
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  error: 'bg-rose-50 text-rose-600 border-rose-100',
  info: 'bg-blue-50 text-blue-600 border-blue-100',
  default: 'bg-slate-50 text-slate-600 border-slate-100',
};

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-600',
  status,
  rightElement,
  footer,
  children,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`card-responsive p-4 mb-3 border border-slate-100 shadow-sm ${onClick ? 'active:bg-slate-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center flex-none`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-900 truncate leading-tight">{title}</h4>
            {subtitle && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate border-none outline-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {status && (
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusVariants[status.variant]}`}>
            {status.label}
          </span>
        )}
        {!status && rightElement && (
          <div className="flex-none">{rightElement}</div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}

      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          {footer}
        </div>
      )}
    </motion.div>
  );
};

export default MobileCard;
