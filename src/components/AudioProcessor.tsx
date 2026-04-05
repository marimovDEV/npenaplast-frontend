import React, { useState, useRef } from 'react';
import { Upload, Mic, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeSalesCall, AnalysisResult } from '../services/gemini';

interface AudioProcessorProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const AudioProcessor: React.FC<AudioProcessorProps> = ({ onAnalysisComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeSalesCall(base64, file.type);
        onAnalysisComplete(result);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error(err);
      setError("Failed to analyze audio. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`p-12 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer
          ${isProcessing ? 'bg-surface-container-low border-surface-variant' : 'bg-surface-container-lowest border-surface-variant hover:border-secondary/50'}
        `}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*" 
          onChange={handleFileChange}
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto" />
            <div>
              <h3 className="text-xl font-bold">Analyzing Sales Call...</h3>
              <p className="text-sm text-on-surface-variant mt-1">Gemini is diarizing and generating insights</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Upload Sales Call Audio</h3>
              <p className="text-sm text-on-surface-variant mt-1">Drag and drop or click to select a file (.mp3, .wav, .m4a)</p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <Mic className="w-4 h-4" />
                Live Recording Supported
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-error/10 text-error rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
