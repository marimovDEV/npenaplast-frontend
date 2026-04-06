import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();

  return (
    <div
      data-i18n-skip="true"
      className={`inline-flex items-center rounded-2xl border border-slate-200 bg-white/90 shadow-sm ${compact ? 'gap-1 p-1' : 'gap-2 px-2 py-1.5'}`}
    >
      <div className={`flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}>
        <Languages className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1">
        {(['uz', 'ru'] as const).map((item) => {
          const isActive = language === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
              aria-label={item === 'uz' ? 'O‘zbekcha' : 'Русский'}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
