import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SentimentPoint } from '../services/gemini';

interface SentimentGraphProps {
  data: SentimentPoint[];
}

export const SentimentGraph: React.FC<SentimentGraphProps> = ({ data }) => {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-lg shadow-ambient h-[400px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Engagement Sentiment</h3>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Call duration engagement levels</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-3 h-3 bg-secondary rounded-full"></span>
            Engagement
          </div>
        </div>
      </div>
      
      <div className="w-full">
        <ResponsiveContainer width="99%" height={250} debounce={50}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#006c49" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#006c49" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#45464d' }}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: 'none', 
                borderRadius: '4px',
                boxShadow: '0px 20px 40px rgba(19, 27, 46, 0.06)'
              }}
              labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="engagement" 
              stroke="#006c49" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorEngagement)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
