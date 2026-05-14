// frontend/src/components/ResultCard.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, ThumbsUp, ThumbsDown, Clock, FileText, Share2, ShieldAlert, BrainCircuit, Globe } from 'lucide-react';
import axios from 'axios';

interface ResultCardProps {
  result: {
    label: string;
    confidence: number;
    reasoning: string;
    breakdown: {
      tone: string;
      logical_fallacies: string[];
      fact_check_summary: string;
      source_reliability?: string;
    };
    claims?: Array<{
      claim: string;
      verdict: 'SUPPORTED' | 'QUESTIONABLE' | 'UNSUPPORTED' | string;
      evidence_note: string;
    }>;
    recommended_actions?: string[];
    top_keywords: string[];
    word_count: number;
    processing_time_ms: number;
    source_url?: string;
    provider_used?: string;
    model_used?: string;
  };
  originalText: string;
  apiUrl: string;
}

export default function ResultCard({ result, originalText, apiUrl }: ResultCardProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const isReal = ['REAL', 'AUTHENTIC', 'HUMAN VOICE'].includes(result.label?.toUpperCase());
  const isFake = ['FAKE', 'DEEPFAKE', 'AI GENERATED'].includes(result.label?.toUpperCase());
  const isMisleading = result.label?.toUpperCase() === 'MISLEADING';
  
  const confidencePercent = Math.round(result.confidence * 100);
  
  let riskLevel = 'LOW';
  let riskColor = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20';
  if (isFake) {
    riskLevel = confidencePercent > 70 ? 'HIGH' : 'MEDIUM';
    riskColor = confidencePercent > 70 ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20' : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20';
  } else if (isMisleading) {
    riskLevel = 'MEDIUM';
    riskColor = 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20';
  }
  
  let confidenceLabel = 'Low Confidence';
  if (confidencePercent > 80) confidenceLabel = 'High Confidence';
  else if (confidencePercent >= 60) confidenceLabel = 'Moderate Confidence';

  const getThemeColors = () => {
    if (isReal) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', fill: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (isFake) return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/30', fill: 'text-rose-500', bar: 'bg-rose-500' };
    return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', fill: 'text-amber-500', bar: 'bg-amber-500' };
  };

  const theme = getThemeColors();
  const sourceIsUrl = /^https?:\/\//i.test(result.source_url || '');

  const getClaimBadgeClass = (verdict: string) => {
    const normalized = verdict.toUpperCase();
    if (normalized === 'SUPPORTED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
    if (normalized === 'UNSUPPORTED') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (feedbackSent) return;
    
    const correctLabel = isCorrect ? result.label : (isReal ? 'FAKE' : 'REAL');
    
    try {
      await axios.post(`${apiUrl}/feedback`, {
        text: originalText,
        predicted_label: result.label,
        correct_label: correctLabel
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Failed to send feedback', err);
    }
  };

  const handleShare = () => {
    const report = `FakeShield Analysis:\nVerdict: ${result.label} (${confidencePercent}% confidence)\nReasoning: ${result.reasoning}\n\nAnalyzed Text: "${originalText.substring(0, 100)}..."`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      className="bg-white/85 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-600/70 overflow-hidden relative"
    >
      {/* Glowing background effect */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 ${theme.bg} blur-3xl -z-10 opacity-50`} />

      {/* Header */}
      <div className={`p-8 flex flex-col sm:flex-row items-center justify-between border-b ${theme.border} bg-slate-50/40 dark:bg-slate-900/40`}>
        <div className="flex items-center gap-5 mb-6 sm:mb-0">
          <div className={`p-4 rounded-2xl ${theme.bg} shadow-inner`}>
            {isReal && <CheckCircle className={`w-10 h-10 ${theme.fill}`} />}
            {isFake && <XCircle className={`w-10 h-10 ${theme.fill}`} />}
            {isMisleading && <AlertTriangle className={`w-10 h-10 ${theme.fill}`} />}
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">
              <span className={theme.text}>{result.label}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mt-1 flex items-center gap-1.5">
              <BrainCircuit size={14} /> AI Fact-Check Complete
            </p>
          </div>
        </div>
        
        {/* Circular Progress */}
        <div className="flex flex-col items-center sm:items-end gap-2">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
              <motion.circle
                cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * confidencePercent) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className={theme.fill}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{confidencePercent}%</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${riskColor}`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Reasoning Section */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-600/70">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-indigo-500 dark:text-indigo-400" />
            AI Reasoning
          </h3>
          <p className="text-slate-700 dark:text-slate-100 leading-relaxed text-lg">
            {result.reasoning}
          </p>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(result.breakdown || {}).map(([key, value]) => {
            if (key === 'logical_fallacies') return null; // Handled separately
            
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return (
              <div key={key} className="bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-600/60">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider block mb-2">{formattedKey}</span>
                <span className="text-slate-700 dark:text-slate-100 text-sm leading-relaxed">{String(value)}</span>
              </div>
            );
          })}
        </div>

        {result.claims && result.claims.length > 0 && (
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Claim-Level Findings</span>
            <div className="space-y-3">
              {result.claims.map((claim, idx) => (
                <div key={`${claim.claim}-${idx}`} className="rounded-2xl border border-slate-200 dark:border-slate-600/70 bg-slate-50 dark:bg-slate-900/70 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{claim.claim}</p>
                    <span className={`shrink-0 w-fit rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider ${getClaimBadgeClass(claim.verdict)}`}>
                      {claim.verdict}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">{claim.evidence_note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.recommended_actions && result.recommended_actions.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-3">Recommended Next Steps</span>
            <ul className="space-y-2">
              {result.recommended_actions.map((action, idx) => (
                <li key={`${action}-${idx}`} className="text-sm text-indigo-900 dark:text-indigo-100 flex gap-2 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source URL (if applicable) */}
        {result.source_url && (
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700/30 flex items-center gap-3">
            <Globe className="text-indigo-500 dark:text-indigo-400 shrink-0" size={20} />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Source Scanned</span>
              {sourceIsUrl ? (
                <a href={result.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 text-sm truncate block hover:underline">
                  {result.source_url}
                </a>
              ) : (
                <span className="text-slate-600 dark:text-slate-300 text-sm truncate block">{result.source_url}</span>
              )}
            </div>
          </div>
        )}

        {/* Logical Fallacies & Keywords */}
        <div className="space-y-6">
          {result.breakdown?.logical_fallacies && result.breakdown.logical_fallacies.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider block mb-3">Logical Fallacies Detected</span>
              <div className="flex flex-wrap gap-2">
                {result.breakdown.logical_fallacies.map((fallacy, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-lg text-sm border border-rose-200 dark:border-rose-500/20 font-medium">
                    {fallacy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.top_keywords && result.top_keywords.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider block mb-3">Key Entities</span>
              <div className="flex flex-wrap gap-2">
                {result.top_keywords.map((word, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg text-sm border border-slate-200 dark:border-slate-600/50">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats & Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6">
            {result.provider_used && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <BrainCircuit size={16} />
                <span>{result.provider_used}{result.model_used ? ` · ${result.model_used}` : ''}</span>
              </div>
            )}
            {result.word_count > 0 && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <FileText size={16} />
                <span>{result.word_count} words</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <Clock size={16} />
              <span>{result.processing_time_ms}ms</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors text-sm font-medium"
            >
              <Share2 size={16} />
              {copied ? 'Copied!' : 'Share Report'}
            </button>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-slate-700/50">
              {feedbackSent ? (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-3 py-1">Feedback saved</span>
              ) : (
                <>
                  <button onClick={() => handleFeedback(true)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors" title="Accurate">
                    <ThumbsUp size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                  <button onClick={() => handleFeedback(false)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="Inaccurate">
                    <ThumbsDown size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
