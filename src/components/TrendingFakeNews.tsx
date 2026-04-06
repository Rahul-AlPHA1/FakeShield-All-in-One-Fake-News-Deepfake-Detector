import { useState, useEffect } from 'react';
import { Globe, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const TRENDING_FAKE_NEWS = [
  {
    id: 1,
    topic: "AI-Generated Political Audio",
    description: "Deepfake audio clips of politicians endorsing controversial policies are spreading rapidly on social media.",
    region: "Global",
    risk: "High"
  },
  {
    id: 2,
    topic: "Fake Crypto Giveaway Streams",
    description: "Live streams using old footage of tech CEOs promising to double cryptocurrency deposits.",
    region: "North America / Europe",
    risk: "Critical"
  },
  {
    id: 3,
    topic: "Manipulated Protest Images",
    description: "AI-generated images showing exaggerated crowd sizes and violent clashes at peaceful protests.",
    region: "Europe / Asia",
    risk: "High"
  },
  {
    id: 4,
    topic: "Phony Health Cures",
    description: "Articles claiming a newly discovered household spice cures severe illnesses, driving fake supplement sales.",
    region: "Global",
    risk: "Medium"
  },
  {
    id: 5,
    topic: "Fabricated Celebrity Endorsements",
    description: "Deepfake videos of celebrities promoting unverified financial apps and trading platforms.",
    region: "Asia / Global",
    risk: "High"
  }
];

export default function TrendingFakeNews() {
  return (
    <div className="w-full h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">World Trending Fake News</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-4">
        {TRENDING_FAKE_NEWS.map((news, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={news.id} 
            className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {news.topic}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2 ${
                news.risk === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                news.risk === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
              }`}>
                {news.risk}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
              {news.description}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500 font-medium">
              <Globe size={12} />
              {news.region}
            </div>
          </motion.div>
        ))}
        
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shrink-0">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">Stay Vigilant</h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
                These trends are updated based on global misinformation patterns. Always verify suspicious claims using the FakeShield analyzer before sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
