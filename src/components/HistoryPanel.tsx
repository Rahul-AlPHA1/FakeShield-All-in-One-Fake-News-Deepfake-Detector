// frontend/src/components/HistoryPanel.tsx
import { Clock, ChevronRight, Globe, FileText, Film, Mic } from 'lucide-react';

interface HistoryItem {
  id: string;
  text: string;
  type?: string;
  label: string;
  confidence: number;
  timestamp: string;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
}

export default function HistoryPanel({ history, onLoadHistory }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-slate-300">
          <Clock size={20} />
          <h2 className="font-semibold text-lg">Recent Analysis</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
          <Clock size={48} className="mb-4 opacity-20" />
          <p>No history yet.</p>
          <p className="text-sm mt-1">Your recent analyses will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-slate-300">
        <Clock size={20} />
        <h2 className="font-semibold text-lg">Recent Analysis</h2>
      </div>
      
      <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {history.map((item) => {
          const isReal = item.label === 'REAL';
          const isFake = item.label === 'FAKE';
          const isMisleading = item.label === 'MISLEADING';
          
          let labelColor = 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
          let barColor = 'bg-amber-500';
          if (isReal) {
            labelColor = 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            barColor = 'bg-emerald-500';
          } else if (isFake) {
            labelColor = 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
            barColor = 'bg-rose-500';
          }

          const date = new Date(item.timestamp);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          return (
            <button
              key={item.id}
              onClick={() => onLoadHistory(item)}
              className="w-full text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/50 p-5 rounded-2xl transition-all group relative overflow-hidden hover:shadow-md dark:hover:shadow-lg"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${barColor}`} />
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border border-transparent dark:border-current/20 ${labelColor}`}>
                  {item.label}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {dateString}, {timeString}
                </span>
              </div>
              
              <div className="flex items-start gap-2 pl-2 mb-3">
                <div className="mt-0.5 text-slate-400 dark:text-slate-500 shrink-0">
                  {item.type === 'url' ? <Globe size={14} /> : 
                   item.type === 'video' ? <Film size={14} /> : 
                   item.type === 'audio' ? <Mic size={14} /> : 
                   <FileText size={14} />}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 break-all">
                  {item.type === 'url' ? item.text : 
                   (item.type === 'video' || item.type === 'audio') ? item.text : 
                   `"${item.text}"`}
                </p>
              </div>
              
              <div className="flex justify-between items-center pl-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {Math.round(item.confidence * 100)}% confidence
                </span>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
