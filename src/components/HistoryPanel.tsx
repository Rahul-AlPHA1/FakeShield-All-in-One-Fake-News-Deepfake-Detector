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
      <div className="p-6 flex flex-col min-h-[200px]">
        <div className="flex items-center gap-2 mb-6 text-cyan-50">
          <Clock size={20} />
          <h2 className="font-semibold text-lg">Recent Analysis</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[#a3b2b3]">
          <Clock size={48} className="mb-4 opacity-25 text-cyan-200" />
          <p>No history yet.</p>
          <p className="text-sm mt-1">Your recent analyses will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col max-h-[50vh]">
      <div className="flex items-center gap-2 mb-6 text-cyan-50">
        <Clock size={20} />
        <h2 className="font-semibold text-lg">Recent Analysis</h2>
      </div>
      
      <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {history.map((item) => {
          const isReal = item.label === 'REAL';
          const isFake = item.label === 'FAKE';
          const isMisleading = item.label === 'MISLEADING';
          
          let labelColor = 'bg-amber-300/10 text-amber-200';
          let barColor = 'bg-amber-500';
          if (isReal) {
            labelColor = 'bg-emerald-300/10 text-emerald-200';
            barColor = 'bg-emerald-500';
          } else if (isFake) {
            labelColor = 'bg-rose-300/10 text-rose-200';
            barColor = 'bg-rose-500';
          }

          const date = new Date(item.timestamp);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          return (
            <button
              key={item.id}
              onClick={() => onLoadHistory(item)}
              className="data-shard w-full text-left p-5 rounded-xl transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${barColor}`} />
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border border-current/20 ${labelColor}`}>
                  {item.label}
                </span>
                <span className="text-xs text-[#a3b2b3]">
                  {dateString}, {timeString}
                </span>
              </div>
              
              <div className="flex items-start gap-2 pl-2 mb-3">
                <div className="mt-0.5 text-cyan-200 shrink-0">
                  {item.type === 'url' ? <Globe size={14} /> : 
                   item.type === 'video' ? <Film size={14} /> : 
                   item.type === 'audio' ? <Mic size={14} /> : 
                   <FileText size={14} />}
                </div>
                <p className="text-sm text-cyan-50 line-clamp-2 break-all">
                  {item.type === 'url' ? item.text : 
                   (item.type === 'video' || item.type === 'audio') ? item.text : 
                   `"${item.text}"`}
                </p>
              </div>
              
              <div className="flex justify-between items-center pl-2">
                <span className="text-xs text-[#a3b2b3]">
                  {Math.round(item.confidence * 100)}% confidence
                </span>
                <ChevronRight size={16} className="text-[#6f7f80] group-hover:text-cyan-200 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
