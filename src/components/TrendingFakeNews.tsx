import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Globe, RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface TrendingItem {
  id: string;
  topic: string;
  description: string;
  region: string;
  risk: 'Critical' | 'High' | 'Medium';
  url: string;
  source: string;
  publishedAt?: string;
}

interface TrendingFakeNewsProps {
  variant?: 'compact' | 'wide';
  maxItems?: number;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function formatUpdatedAt(value: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TrendingFakeNews({ variant = 'compact', maxItems }: TrendingFakeNewsProps) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [feedSource, setFeedSource] = useState('');

  const loadTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      setItems(data.items || []);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setFeedSource(data.source || 'Live feed');
    } catch {
      setItems([]);
      setUpdatedAt(new Date().toISOString());
      setFeedSource('Unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
    const intervalId = window.setInterval(loadTrending, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const visibleItems = maxItems ? items.slice(0, maxItems) : items;
  const isWide = variant === 'wide';

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <div className={`${isWide ? 'p-6 sm:p-8 pb-4' : 'p-6 pb-2'} shrink-0`}>
        <div className={`flex items-start justify-between gap-3 ${isWide ? 'border-b border-white/10 pb-6' : ''}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-rose-300/10 rounded-lg border border-rose-300/20">
              <TrendingUp className="w-5 h-5 text-rose-200" />
            </div>
            <div className="min-w-0">
              <h3 className={`${isWide ? 'font-display text-3xl font-light' : 'text-lg font-bold'} text-cyan-50 leading-tight`}>
                {isWide ? 'Global Watchlist' : 'Live Misinformation Watch'}
              </h3>
              <p className={`${isWide ? 'text-sm' : 'text-[11px]'} text-[#a3b2b3] mt-1 truncate`}>
                {feedSource}{updatedAt ? ` · ${formatUpdatedAt(updatedAt)}` : ''}
              </p>
              {isWide && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d7dfe0]">
                  Recent worldwide misinformation, deepfake, fake-news, and fact-check coverage. This is a monitoring layer, not a final verdict.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={loadTrending}
            disabled={loading}
            className="p-2 rounded-lg text-[#a3b2b3] hover:text-rose-100 hover:bg-rose-300/10 transition-colors disabled:opacity-50"
            title="Refresh trends"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isWide ? 'p-6 sm:p-8 pt-2' : 'p-6 pt-4'} ${isWide ? 'grid grid-cols-1 gap-4 lg:grid-cols-2' : 'space-y-4'}`}>
        {visibleItems.map((news, index) => (
          <motion.a
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={news.id}
            href={news.url}
            target="_blank"
            rel="noreferrer"
            className={`${isWide ? 'min-h-[190px] p-5' : 'p-4'} data-shard block rounded-xl transition-colors group`}
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <h4 className={`font-semibold text-cyan-50 ${isWide ? 'text-base leading-7' : 'text-sm leading-tight'} group-hover:text-cyan-100 transition-colors`}>
                {news.topic}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                news.risk === 'Critical' ? 'bg-rose-300/15 text-rose-200' :
                news.risk === 'High' ? 'bg-orange-300/15 text-orange-200' :
                'bg-yellow-300/15 text-yellow-200'
              }`}>
                {news.risk}
              </span>
            </div>
            <p className={`${isWide ? 'text-sm leading-6 line-clamp-3' : 'text-xs line-clamp-2'} text-[#d7dfe0] mb-3`}>
              {news.description}
            </p>
            <div className="flex items-center justify-between gap-3 text-[10px] text-[#a3b2b3] font-medium">
              <span className="flex items-center gap-1 min-w-0 truncate">
                <Globe size={12} />
                <span className="truncate">{news.source || news.region}</span>
              </span>
              <ExternalLink size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
            </div>
          </motion.a>
        ))}

        {!loading && visibleItems.length === 0 && (
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10 text-sm text-[#a3b2b3] lg:col-span-2">
            Live feed is unavailable right now.
          </div>
        )}
        
        <div className={`${isWide ? 'lg:col-span-2' : 'mt-6'} p-4 bg-cyan-200/5 rounded-xl border border-cyan-200/15 shrink-0`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cyan-200 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-cyan-50 mb-1">Verify Before Sharing</h4>
              <p className="text-xs text-[#d7dfe0] leading-relaxed">
                Trends are pulled from recent global coverage and should be treated as leads, not final verdicts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
