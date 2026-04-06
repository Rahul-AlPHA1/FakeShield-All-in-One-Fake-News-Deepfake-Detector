import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageAnalyzerProps {
  onAnalyze: (file: File) => void;
  loading: boolean;
}

export default function ImageAnalyzer({ onAnalyze, loading }: ImageAnalyzerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      return false;
    }
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setPreviewUrl(URL.createObjectURL(droppedFile));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <ImageIcon className="text-emerald-500" /> Image Deepfake Detection
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Upload an image to detect AI generation artifacts, unnatural anatomy, and digital manipulation.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!file ? (
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.02]' 
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  Drag & drop an image here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  or click to browse (JPEG, PNG, WEBP up to 10MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
          >
            <button 
              onClick={clearFile}
              disabled={loading}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="aspect-video w-full relative flex items-center justify-center bg-black/5 dark:bg-black/20">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-white font-medium animate-pulse">Analyzing image artifacts...</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="truncate pr-4">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/60 px-6 md:px-8 py-5 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-4">
        <button
          onClick={clearFile}
          disabled={loading || !file}
          className="px-6 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={() => file && onAnalyze(file)}
          disabled={loading || !file}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? 'Analyzing...' : 'Scan Image'}
        </button>
      </div>
    </div>
  );
}
