import React from 'react';
import { User, MessageSquare } from 'lucide-react';
import { TranscriptEntry } from '../services/gemini';

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
      <div className="px-8 py-6 bg-surface-container-low flex justify-between items-center">
        <h3 className="font-bold uppercase text-xs tracking-widest">Call Transcript</h3>
        <div className="flex gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Diarized Analysis</span>
        </div>
      </div>
      <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto">
        {transcript.map((entry, i) => {
          const isSalesperson = entry.speaker.toLowerCase().includes('a') || entry.speaker.toLowerCase().includes('sales');
          
          return (
            <div key={i} className={`flex gap-4 ${isSalesperson ? '' : 'flex-row-reverse'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                ${isSalesperson ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface'}
              `}>
                {isSalesperson ? <User className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] space-y-1 ${isSalesperson ? '' : 'text-right'}`}>
                <div className="flex items-center gap-2 justify-inherit">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {entry.speaker}
                  </span>
                  <span className="text-[10px] font-medium text-on-surface-variant/50">
                    {entry.timestamp}
                  </span>
                </div>
                <div className={`p-4 rounded-lg text-sm font-medium leading-relaxed
                  ${isSalesperson ? 'bg-surface-container-low' : 'bg-surface-variant/30'}
                `}>
                  {entry.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
