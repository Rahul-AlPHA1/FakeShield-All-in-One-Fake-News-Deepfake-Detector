import React, { useState, useRef } from 'react';
import { UploadCloud, X, Mic, AlertCircle, RefreshCw } from 'lucide-react';

interface VoiceAnalyzerProps {
  onAnalyze: (file: File) => void;
  loading: boolean;
}

export default function VoiceAnalyzer({ onAnalyze, loading }: VoiceAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('audio/') && !selected.type.startsWith('video/')) {
      setError('Please select a valid audio or video file.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB for browser-based analysis.');
      return;
    }

    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div className="p-6 md:p-8 relative">
        {!file ? (
          <div 
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-4 bg-pink-100 dark:bg-pink-500/10 rounded-full mb-4">
              <Mic className="w-10 h-10 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Upload Audio for Analysis</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
              Drag and drop an audio file here, or click to browse. Supports MP3, WAV, M4A up to 10MB.
            </p>
            <button className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors">
              Select File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="audio/*,video/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-500/20 rounded-lg">
                  <Mic className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Remove audio"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 p-4 flex items-center justify-center relative">
              {previewUrl && (
                <audio 
                  src={previewUrl} 
                  controls 
                  className="w-full"
                />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Scanning Overlay Animation */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-pink-500/30 overflow-hidden z-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 shadow-[0_0_15px_#ec4899] animate-[scan_2s_ease-in-out_infinite]" />
            <RefreshCw className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-spin mb-3" />
            <span className="text-pink-600 dark:text-pink-300 font-medium tracking-wide animate-pulse">
              Analyzing vocal prosody and spectral features...
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/60 px-6 md:px-8 py-5 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-4">
        <button
          onClick={handleClear}
          disabled={loading || !file}
          className="px-6 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={() => file && onAnalyze(file)}
          disabled={loading || !file}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? 'Analyzing...' : 'Analyze Voice'}
        </button>
      </div>
    </div>
  );
}
