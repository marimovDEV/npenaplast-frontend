import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, Target } from 'lucide-react';
import { CoachingInsight } from '../services/gemini';

interface CoachingCardProps {
  insight: CoachingInsight;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({ insight }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-surface-container-low p-8 rounded-lg border-l-4 border-secondary">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="w-6 h-6 text-secondary" />
          <h3 className="text-lg font-bold uppercase tracking-tight">Key Strengths</h3>
        </div>
        <ul className="space-y-4">
          {insight.pros.map((pro, i) => (
            <li key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-secondary">{i + 1}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{pro}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface-container-low p-8 rounded-lg border-l-4 border-error">
        <div className="flex items-center gap-3 mb-6">
          <XCircle className="w-6 h-6 text-error" />
          <h3 className="text-lg font-bold uppercase tracking-tight">Missed Opportunities</h3>
        </div>
        <ul className="space-y-4">
          {insight.missedOpportunities.map((opp, i) => (
            <li key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-error">{i + 1}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{opp}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
