import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Film,
  Globe,
  Github,
  Image as ImageIcon,
  Info,
  Languages,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Mic,
  Moon,
  Newspaper,
  Phone,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import axios from 'axios';
import HistoryPanel from './components/HistoryPanel';
import FakeShieldLogo from './components/FakeShieldLogo';
import ImageAnalyzer from './components/ImageAnalyzer';
import ResultCard from './components/ResultCard';
import TrendingFakeNews from './components/TrendingFakeNews';
import VideoAnalyzer from './components/VideoAnalyzer';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import WelcomeGuide from './components/WelcomeGuide';
import {
  ClaimComparisonResult,
  EvidenceTimelineItem,
  LLMConfig,
  SourceTrustResult,
  analyzeMedia,
  analyzeText,
  compareClaims,
  getEvidenceTimeline,
  getSourceTrust,
} from './services/llmService';

const API_URL = '/api';
const DASHBOARD_CACHE_KEY = 'fakeshield_dashboard_news_cache';
const DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;
const ALERT_CHANNELS_KEY = 'fakeshield_alert_channels';
const REVIEW_QUEUE_KEY = 'fakeshield_review_queue';

const sanitizeConfig = (config: any): LLMConfig => ({
  provider: 'auto',
  language: config?.language || 'English',
});

const languageOptions = [
  'Acehnese',
  'Afrikaans',
  'Albanian',
  'Amharic',
  'Arabic',
  'Armenian',
  'Assamese',
  'Aymara',
  'Azerbaijani',
  'Bambara',
  'Basque',
  'Belarusian',
  'Bengali',
  'Bhojpuri',
  'Bosnian',
  'Bulgarian',
  'Burmese',
  'Catalan',
  'Cebuano',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Chichewa',
  'Corsican',
  'Croatian',
  'Czech',
  'Danish',
  'Dhivehi',
  'Dogri',
  'Dutch',
  'English',
  'Estonian',
  'Ewe',
  'Filipino',
  'Finnish',
  'French',
  'Frisian',
  'Galician',
  'Georgian',
  'German',
  'Greek',
  'Guarani',
  'Gujarati',
  'Haitian Creole',
  'Hausa',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Icelandic',
  'Igbo',
  'Indonesian',
  'Irish',
  'Italian',
  'Japanese',
  'Javanese',
  'Kannada',
  'Kazakh',
  'Khmer',
  'Kinyarwanda',
  'Konkani',
  'Korean',
  'Krio',
  'Kurdish',
  'Kyrgyz',
  'Lao',
  'Latin',
  'Latvian',
  'Lingala',
  'Lithuanian',
  'Luxembourgish',
  'Macedonian',
  'Maithili',
  'Malay',
  'Malayalam',
  'Maltese',
  'Maori',
  'Marathi',
  'Meiteilon',
  'Mizo',
  'Mongolian',
  'Nepali',
  'Norwegian',
  'Odia',
  'Oromo',
  'Pashto',
  'Persian',
  'Polish',
  'Portuguese',
  'Punjabi',
  'Quechua',
  'Romanian',
  'Russian',
  'Sanskrit',
  'Scots Gaelic',
  'Sepedi',
  'Serbian',
  'Sesotho',
  'Shona',
  'Sindhi',
  'Sinhala',
  'Slovak',
  'Slovenian',
  'Somali',
  'Spanish',
  'Sundanese',
  'Swahili',
  'Swedish',
  'Tajik',
  'Tamil',
  'Tatar',
  'Telugu',
  'Thai',
  'Tigrinya',
  'Tsonga',
  'Turkish',
  'Turkmen',
  'Twi',
  'Ukrainian',
  'Urdu',
  'Uyghur',
  'Uzbek',
  'Vietnamese',
  'Welsh',
  'Xhosa',
  'Yiddish',
  'Yoruba',
  'Zulu',
];

const tabs = [
  { id: 'text', label: 'Text & URL', icon: Search, accent: 'from-cyan-300 to-sky-300' },
  { id: 'image', label: 'Visual', icon: ImageIcon, accent: 'from-emerald-300 to-cyan-300' },
  { id: 'video', label: 'Spatial', icon: Film, accent: 'from-violet-300 to-cyan-300' },
  { id: 'voice', label: 'Acoustic', icon: Mic, accent: 'from-fuchsia-300 to-cyan-300' },
] as const;

const featureIdeas = [
  {
    title: 'Source Trust Graph',
    summary: 'Score publishers, domains, repeated sources, and citation quality so every result shows where the claim came from and how reliable that source usually is.',
    impact: 'Best for URL/news analysis credibility.',
    icon: Globe,
  },
  {
    title: 'Evidence Timeline',
    summary: 'Build a chronological trail of when an image, quote, or video first appeared online and how the claim changed as it spread.',
    impact: 'Useful for old media reposted as breaking news.',
    icon: Clock,
  },
  {
    title: 'Claim Comparison Mode',
    summary: 'Let users compare two claims or URLs side by side and highlight contradictions, missing context, and copied wording.',
    impact: 'Strong for political and viral social posts.',
    icon: Layers,
  },
  {
    title: 'Alert Watch Channels',
    summary: 'Allow users to track topics, people, regions, or keywords and notify them when similar misinformation trends appear.',
    impact: 'Turns FakeShield into a monitoring product.',
    icon: Radar,
  },
  {
    title: 'Community Review Queue',
    summary: 'Let trusted reviewers add notes, evidence links, and corrections to high-risk results before content is shared further.',
    impact: 'Adds human verification on top of AI.',
    icon: CheckCircle2,
  },
  {
    title: 'Public Share Report',
    summary: 'Generate a clean, shareable report page with verdict, confidence, evidence notes, and recommended verification steps.',
    impact: 'Great for schools, journalists, and teams.',
    icon: Newspaper,
  },
] as const;

type ActiveView = 'dashboard' | 'analysis' | 'watchlist';

function getInitialView(): ActiveView {
  if (typeof window === 'undefined') return 'dashboard';
  const view = new URLSearchParams(window.location.search).get('view');
  return view === 'analysis' || view === 'watchlist' ? view : 'dashboard';
}

interface DashboardItem {
  id: string;
  title: string;
  excerpt: string;
  originalText: string;
  type: string;
  label: string;
  confidence: number;
  timestamp: string;
  sourceUrl?: string | null;
  provider?: string;
  model?: string;
}

interface AlertChannel {
  id: string;
  keyword: string;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  title: string;
  label: string;
  confidence: number;
  sourceUrl?: string | null;
  notes: string;
  evidenceLinks: string[];
  status: "open" | "reviewed";
  createdAt: string;
}

interface WatchItem {
  id: string;
  topic: string;
  description: string;
  source: string;
  url: string;
  risk: string;
}

interface ShareReport {
  id: string;
  title: string;
  originalText: string;
  createdAt: string;
  result: any;
  sourceTrust: SourceTrustResult | null;
  timeline: EvidenceTimelineItem[];
}

function readDashboardCache(): DashboardItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return [];

    const cached = JSON.parse(raw);
    if (!cached?.expiresAt || cached.expiresAt < Date.now()) {
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      return [];
    }

    return Array.isArray(cached.items) ? cached.items : [];
  } catch {
    localStorage.removeItem(DASHBOARD_CACHE_KEY);
    return [];
  }
}

function writeDashboardCache(items: DashboardItem[]) {
  localStorage.setItem(
    DASHBOARD_CACHE_KEY,
    JSON.stringify({
      expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
      items,
    }),
  );
}

function compactInput(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function readLocalArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalArray<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function encodeReport(report: ShareReport) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(report))));
}

function decodeReport(encoded: string): ShareReport | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(() => getInitialView());
  const [mainTab, setMainTab] = useState<'text' | 'video' | 'voice' | 'image'>('text');
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>(() => readDashboardCache());
  const [sourceTrust, setSourceTrust] = useState<SourceTrustResult | null>(null);
  const [timeline, setTimeline] = useState<EvidenceTimelineItem[]>([]);
  const [timelineSource, setTimelineSource] = useState('');
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [compareLeft, setCompareLeft] = useState('');
  const [compareRight, setCompareRight] = useState('');
  const [compareResult, setCompareResult] = useState<ClaimComparisonResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [alertChannels, setAlertChannels] = useState<AlertChannel[]>(() => readLocalArray<AlertChannel>(ALERT_CHANNELS_KEY));
  const [alertInput, setAlertInput] = useState('');
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(() => readLocalArray<ReviewItem>(REVIEW_QUEUE_KEY));
  const [reviewDraft, setReviewDraft] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [sharedReport, setSharedReport] = useState<ShareReport | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return new URLSearchParams(window.location.search).get('screenshot') !== 'true';
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const requestedTheme = new URLSearchParams(window.location.search).get('theme');
    if (requestedTheme === 'light') return false;
    if (requestedTheme === 'dark') return true;
    return localStorage.getItem('theme') !== 'light';
  });
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    try {
      const saved = localStorage.getItem('llmConfig');
      return saved ? sanitizeConfig(JSON.parse(saved)) : { provider: 'auto', language: 'English' };
    } catch {
      return { provider: 'auto', language: 'English' };
    }
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setHistory([]);
        setResult(null);
        setText('');
        setUrl('');
      }, 30 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    checkServerHealth();
    loadWatchItems();
  }, []);

  useEffect(() => {
    const reportHash = window.location.hash.match(/^#report=(.+)$/);
    if (reportHash?.[1]) {
      const report = decodeReport(reportHash[1]);
      if (report) {
        setSharedReport(report);
        setActiveView('dashboard');
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDashboardItems(readDashboardCache());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const checkServerHealth = async () => {
    try {
      await axios.get(`${API_URL}/health`);
      setServerStatus('online');
    } catch {
      setServerStatus('offline');
    }
  };

  const loadWatchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/trending`);
      const data = await res.json();
      setWatchItems(data.items || []);
    } catch {
      setWatchItems([]);
    }
  };

  const loadInvestigationContext = async (analysisResult: any, originalInput: string) => {
    setIntelligenceLoading(true);
    setSourceTrust(null);
    setTimeline([]);
    setTimelineSource('');

    const sourceUrl =
      typeof analysisResult.source_url === 'string' && analysisResult.source_url.startsWith('http')
        ? analysisResult.source_url
        : null;
    const query = compactInput(originalInput || analysisResult.reasoning || analysisResult.source_url || '').slice(0, 300);

    try {
      const [trustResult, timelineResult] = await Promise.all([
        getSourceTrust(sourceUrl),
        getEvidenceTimeline(query, sourceUrl),
      ]);
      setSourceTrust(trustResult);
      setTimeline(timelineResult.items || []);
      setTimelineSource(timelineResult.source || '');
    } catch (err) {
      console.error('Investigation context error:', err);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  const addAlertChannel = () => {
    const keyword = alertInput.trim();
    if (!keyword) return;
    const next = [
      { id: Date.now().toString(), keyword, createdAt: new Date().toISOString() },
      ...alertChannels.filter((item) => item.keyword.toLowerCase() !== keyword.toLowerCase()),
    ].slice(0, 12);
    setAlertChannels(next);
    writeLocalArray(ALERT_CHANNELS_KEY, next);
    setAlertInput('');
  };

  const removeAlertChannel = (id: string) => {
    const next = alertChannels.filter((item) => item.id !== id);
    setAlertChannels(next);
    writeLocalArray(ALERT_CHANNELS_KEY, next);
  };

  const addToReviewQueue = () => {
    if (!result) return;
    const title = compactInput(mainTab === 'text' ? (mode === 'text' ? text : url) : result.source_url || 'Media file').slice(0, 120);
    const item: ReviewItem = {
      id: Date.now().toString(),
      title: title || 'Untitled investigation',
      label: result.label,
      confidence: result.confidence,
      sourceUrl: result.source_url,
      notes: reviewDraft.trim() || 'Needs manual evidence review.',
      evidenceLinks: sourceTrust?.domain && sourceTrust.domain !== 'Direct submission' ? [`https://${sourceTrust.domain}`] : [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...reviewQueue].slice(0, 20);
    setReviewQueue(next);
    writeLocalArray(REVIEW_QUEUE_KEY, next);
    setReviewDraft('');
  };

  const toggleReviewStatus = (id: string) => {
    const next = reviewQueue.map((item) =>
      item.id === id ? { ...item, status: item.status === 'open' ? 'reviewed' as const : 'open' as const } : item,
    );
    setReviewQueue(next);
    writeLocalArray(REVIEW_QUEUE_KEY, next);
  };

  const removeReviewItem = (id: string) => {
    const next = reviewQueue.filter((item) => item.id !== id);
    setReviewQueue(next);
    writeLocalArray(REVIEW_QUEUE_KEY, next);
  };

  const createShareReport = async () => {
    if (!result) return;
    const originalText = mainTab === 'text' ? (mode === 'text' ? text : url) : result.source_url || 'Media File';
    const report: ShareReport = {
      id: Date.now().toString(),
      title: compactInput(originalText).slice(0, 120) || 'FakeShield Report',
      originalText,
      createdAt: new Date().toISOString(),
      result,
      sourceTrust,
      timeline,
    };
    const reportUrl = `${window.location.origin}${window.location.pathname}#report=${encodeReport(report)}`;
    setShareUrl(reportUrl);
    await navigator.clipboard?.writeText(reportUrl).catch(() => undefined);
  };

  const handleCompareClaims = async () => {
    if (compareLeft.trim().length < 10 || compareRight.trim().length < 10) {
      setError('Both comparison inputs need at least 10 characters.');
      return;
    }

    setCompareLoading(true);
    setCompareResult(null);
    setError(null);
    try {
      const comparison = await compareClaims(compareLeft, compareRight, llmConfig);
      setCompareResult(comparison);
    } catch (err: any) {
      setError(err.message || 'Claim comparison failed.');
    } finally {
      setCompareLoading(false);
    }
  };

  const saveToHistory = (newResult: any, inputText: string, inputType: string) => {
    const historyItem = {
      id: Date.now().toString(),
      text: inputText,
      type: inputType,
      label: newResult.label,
      confidence: newResult.confidence,
      timestamp: new Date().toISOString(),
    };

    setHistory((items) => [historyItem, ...items].slice(0, 10));

    const compacted = compactInput(inputText);
    const dashboardItem: DashboardItem = {
      id: historyItem.id,
      title:
        inputType === 'url'
          ? inputText
          : compacted.slice(0, 92) || `${inputType.toUpperCase()} artifact`,
      excerpt: newResult.reasoning || compacted.slice(0, 180) || 'Analysis completed.',
      originalText: inputText,
      type: inputType,
      label: newResult.label,
      confidence: newResult.confidence,
      timestamp: historyItem.timestamp,
      sourceUrl: newResult.source_url,
      provider: newResult.provider_used,
      model: newResult.model_used,
    };

    setDashboardItems((items) => {
      const next = [dashboardItem, ...items.filter((item) => item.id !== dashboardItem.id)].slice(0, 18);
      writeDashboardCache(next);
      return next;
    });
  };

  const handleLanguageChange = (language: string) => {
    const sanitized = sanitizeConfig({ ...llmConfig, language });
    setLlmConfig(sanitized);
    localStorage.setItem('llmConfig', JSON.stringify(sanitized));
  };

  const handleAnalyze = async () => {
    if (mode === 'text' && text.length < 10) {
      setError('Please enter more text (at least 10 characters).');
      return;
    }
    if (mode === 'url' && !url.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      let contentToAnalyze = text;
      let sourceUrl = null;

      if (mode === 'url') {
        sourceUrl = url;
        const scrapeRes = await axios.post(`${API_URL}/scrape`, { url });
        contentToAnalyze = scrapeRes.data.text;
      }

      const aiResult = await analyzeText(contentToAnalyze, sourceUrl, llmConfig);
      const processingTimeMs = Date.now() - startTime;
      const words = contentToAnalyze.match(/\b\w+\b/g) || [];
      const finalResult = {
        ...aiResult,
        word_count: words.length,
        processing_time_ms: processingTimeMs,
        source_url: sourceUrl,
      };

      setResult(finalResult);
      saveToHistory(finalResult, mode === 'text' ? text : url, mode);
      loadInvestigationContext(finalResult, mode === 'text' ? text : url);
    } catch (err: any) {
      console.error('Analysis Error:', err);
      if (err.response?.data?.error) {
        setError(`Scraping Error: ${err.response.data.error}`);
      } else {
        setError(err.message || 'An unexpected error occurred during analysis.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMedia = async (file: File, type: 'video' | 'audio' | 'image') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const aiResult = await analyzeMedia(file, type, llmConfig);
      const finalResult = {
        ...aiResult,
        word_count: 0,
        processing_time_ms: Date.now() - startTime,
        source_url: file.name,
      };

      setResult(finalResult);
      saveToHistory(finalResult, file.name, type);
      loadInvestigationContext(finalResult, file.name);
    } catch (err: any) {
      console.error('Media Analysis Error:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setUrl('');
    setResult(null);
    setError(null);
  };

  const handleLoadHistory = (item: any) => {
    if (item.type === 'video') {
      setActiveView('analysis');
      setMainTab('video');
    } else if (item.type === 'audio') {
      setActiveView('analysis');
      setMainTab('voice');
    } else if (item.type === 'image') {
      setActiveView('analysis');
      setMainTab('image');
    } else if (item.type === 'url') {
      setActiveView('analysis');
      setMainTab('text');
      setMode('url');
      setUrl(item.text);
    } else {
      setActiveView('analysis');
      setMainTab('text');
      setMode('text');
      setText(item.text);
    }
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canAnalyzeText = mode === 'text' ? text.trim().length > 0 : url.trim().length > 0;
  const statusLabel = serverStatus === 'online' ? 'Core Online' : serverStatus === 'checking' ? 'Syncing Core' : 'Core Offline';
  const statusClass = serverStatus === 'online' ? 'bg-emerald-300' : serverStatus === 'checking' ? 'bg-cyan-300' : 'bg-rose-300';
  const dashboardStats = {
    total: dashboardItems.length,
    real: dashboardItems.filter((item) => item.label === 'REAL').length,
    risky: dashboardItems.filter((item) => item.label === 'FAKE' || item.label === 'MISLEADING').length,
    avgConfidence: dashboardItems.length
      ? Math.round((dashboardItems.reduce((sum, item) => sum + item.confidence, 0) / dashboardItems.length) * 100)
      : 0,
  };
  const alertMatches = alertChannels.map((channel) => ({
    channel,
    matches: watchItems
      .filter((item) => `${item.topic} ${item.description} ${item.source}`.toLowerCase().includes(channel.keyword.toLowerCase()))
      .slice(0, 4),
  }));
  const openReviews = reviewQueue.filter((item) => item.status === 'open').length;

  return (
    <div className="app-shell min-h-screen font-sans overflow-x-hidden selection:bg-cyan-300/30 selection:text-cyan-50">
      <div className="mesh-aura" />
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-70"
        style={{
          background: `radial-gradient(620px circle at ${mousePos.x}px ${mousePos.y}px, ${isDark ? 'rgba(125,244,255,0.08)' : 'rgba(0,105,112,0.07)'}, transparent 44%)`,
        }}
      />

      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="glass-panel sticky top-0 z-50 border-x-0 border-t-0 rounded-none"
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-8 xl:px-20">
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-3">
              <FakeShieldLogo />
            </button>
            <nav className="hidden items-center gap-7 md:flex">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'analysis', label: 'Analysis' },
                { id: 'watchlist', label: 'Watchlist' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ActiveView)}
                  className={`font-display text-xs uppercase tracking-[0.2em] transition ${
                    activeView === item.id
                      ? 'border-b border-cyan-200 pb-1 text-cyan-200 drop-shadow-[0_0_9px_rgba(125,244,255,0.55)]'
                      : 'text-[#a3b2b3] hover:text-cyan-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWelcomeOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-cyan-200/20 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-200/10 sm:flex"
            >
              <Info size={17} />
              Guide
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-[#a3b2b3] transition hover:border-cyan-200/40 hover:text-cyan-100"
              title="Toggle theme"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={() => {
                if (activeView !== 'analysis') {
                  setActiveView('analysis');
                  return;
                }
                if (mainTab === 'text') handleAnalyze();
              }}
              disabled={loading || (activeView === 'analysis' && (mainTab !== 'text' || !canAnalyzeText))}
              className="hidden overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 to-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.16em] text-[#006970] shadow-[0_0_24px_rgba(125,244,255,0.22)] transition hover:scale-[1.03] hover:shadow-[0_0_34px_rgba(125,244,255,0.45)] disabled:cursor-not-allowed disabled:opacity-40 lg:inline-flex"
            >
              {activeView === 'analysis' ? 'Initiate Scan' : 'Open Scan'}
            </button>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-4 py-8 sm:px-8 lg:py-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:px-20">
        <main className="flex min-w-0 flex-col gap-8">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              <Zap size={14} />
              AI Misinformation Forensics
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
              Media Intelligence{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">
                Center
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#a3b2b3] sm:text-lg">
              High-fidelity workspace for fake news, manipulated media, deepfake video, and voice clone analysis with Gemini to Groq auto fallback for text investigations.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="glass-panel rounded-2xl p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-display text-xs uppercase tracking-[0.2em] text-[#6f7f80]">Active Engine</span>
                <div className="flex items-center gap-3 rounded-xl border border-cyan-200/20 bg-[#050505]/50 px-4 py-2.5 shadow-inner">
                  <Sparkles className="h-4 w-4 text-cyan-200" />
                  <span className="font-display text-sm tracking-wide text-cyan-100">Auto Fallback</span>
                  <span className="text-xs text-[#a3b2b3]">Gemini → Groq</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-[#a3b2b3]">
                  <span className={`h-2 w-2 rounded-full ${statusClass} shadow-[0_0_10px_currentColor]`} />
                  {statusLabel}
                </div>
              </div>

              <label className="flex min-w-0 items-center gap-2 rounded-xl border border-cyan-200/20 bg-[#050505]/60 px-3 py-2 text-sm text-cyan-50">
                <Languages size={18} className="shrink-0 text-cyan-200" />
                <select
                  value={llmConfig.language || 'English'}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent text-cyan-50 outline-none focus:ring-0"
                >
                  {languageOptions.map((language) => (
                    <option key={language} value={language} className="bg-[#121213] text-cyan-50">
                      {language}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </motion.section>

          {activeView === 'dashboard' && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Saved Reports', value: dashboardStats.total, icon: Database, hint: '30 min cache' },
                  { label: 'Authentic', value: dashboardStats.real, icon: CheckCircle2, hint: 'REAL verdicts' },
                  { label: 'Risk Flags', value: dashboardStats.risky, icon: AlertCircle, hint: 'Fake or misleading' },
                  { label: 'Avg Confidence', value: `${dashboardStats.avgConfidence}%`, icon: BarChart3, hint: 'AI certainty' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -4 }}
                      className="glass-panel rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display text-xs uppercase tracking-[0.18em] text-[#6f7f80]">{stat.label}</p>
                          <p className="mt-3 font-display text-3xl font-light text-cyan-50">{stat.value}</p>
                        </div>
                        <span className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/8 text-cyan-200">
                          <Icon size={22} />
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-[#a3b2b3]">{stat.hint}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="glass-panel hud-border rounded-3xl p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                      <Newspaper size={14} />
                      Dashboard Cache
                    </div>
                    <h2 className="font-display text-2xl font-light text-cyan-50">Recently analyzed news intelligence</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a3b2b3]">
                      Every completed scan is saved locally for 30 minutes, so reloads keep the dashboard alive without exposing API keys or server data.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('analysis')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-5 py-3 font-display text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                  >
                    <Search size={17} />
                    Analyze News
                  </button>
                </div>

                {dashboardItems.length === 0 ? (
                  <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-8 text-center">
                    <div>
                      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-200/8 text-cyan-200">
                        <Newspaper size={30} />
                      </div>
                      <h3 className="font-display text-xl text-cyan-50">No dashboard news saved yet</h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a3b2b3]">
                        Run a text, URL, image, video, or voice scan. The result card will appear here and stay cached for 30 minutes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {dashboardItems.map((item) => {
                      const risky = item.label === 'FAKE' || item.label === 'MISLEADING';
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ y: -3 }}
                          onClick={() =>
                            handleLoadHistory({
                              id: item.id,
                              text: item.originalText || item.sourceUrl || item.title,
                              type: item.type,
                              label: item.label,
                              confidence: item.confidence,
                              timestamp: item.timestamp,
                            })
                          }
                          className="data-shard rounded-2xl p-5 text-left"
                        >
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                              risky
                                ? 'border-rose-300/25 bg-rose-300/10 text-rose-200'
                                : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                            }`}>
                              {item.label}
                            </span>
                            <span className="text-xs text-[#a3b2b3]">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="line-clamp-2 font-display text-lg leading-7 text-cyan-50">{item.title}</h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d7dfe0]">{item.excerpt}</p>
                          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#a3b2b3]">
                            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">{item.type}</span>
                            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">{Math.round(item.confidence * 100)}% confidence</span>
                            {item.provider && <span className="rounded-md border border-cyan-200/15 bg-cyan-200/5 px-2.5 py-1 text-cyan-100">{item.provider}</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-3xl p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                      <Sparkles size={14} />
                      Production Roadmap
                    </div>
                    <h2 className="font-display text-2xl font-light text-cyan-50">Features worth building next</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a3b2b3]">
                      These are the highest-value upgrades for making FakeShield feel like a real investigation platform instead of a single analyzer screen.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {featureIdeas.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div key={feature.title} whileHover={{ y: -3 }} className="data-shard rounded-2xl p-5">
                        <div className="mb-4 flex items-start gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/8 text-cyan-200">
                            <Icon size={22} />
                          </span>
                          <div>
                            <h3 className="font-display text-lg text-cyan-50">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#d7dfe0]">{feature.summary}</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#a3b2b3]">
                          {feature.impact}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                      <ClipboardList size={14} />
                      Community Review Queue
                    </div>
                    <h2 className="font-display text-2xl font-light text-cyan-50">Human verification workspace</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a3b2b3]">
                      Cases added from analysis appear here with reviewer notes. This gives FakeShield an AI plus human-check workflow.
                    </p>
                  </div>
                  <span className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[#a3b2b3]">
                    {openReviews} open
                  </span>
                </div>

                {reviewQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-6 text-sm text-[#a3b2b3]">
                    No community review items yet. Analyze content, then add a case from the review panel under the result.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {reviewQueue.map((item) => (
                      <div key={item.id} className="data-shard rounded-2xl p-5">
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              item.status === 'open' ? 'border-amber-300/25 bg-amber-300/10 text-yellow-200' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                            }`}>
                              {item.status}
                            </span>
                            <h3 className="mt-3 line-clamp-2 font-display text-lg text-cyan-50">{item.title}</h3>
                          </div>
                          <button onClick={() => removeReviewItem(item.id)} className="rounded-lg p-2 text-[#a3b2b3] transition hover:bg-rose-300/10 hover:text-rose-200">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="line-clamp-3 text-sm leading-6 text-[#d7dfe0]">{item.notes}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#a3b2b3]">
                          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">{item.label}</span>
                          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1">{Math.round(item.confidence * 100)}%</span>
                          <button onClick={() => toggleReviewStatus(item.id)} className="rounded-md border border-cyan-200/20 bg-cyan-200/5 px-2.5 py-1 text-cyan-100">
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {activeView === 'watchlist' && (
            <motion.section
              key="watchlist"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="space-y-6"
            >
              <div className="glass-panel rounded-3xl p-5 sm:p-7">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                      <Bell size={14} />
                      Alert Watch Channels
                    </div>
                    <h2 className="font-display text-2xl font-light text-cyan-50">Track topics across the live watchlist</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a3b2b3]">
                      Save keywords like elections, deepfake, health, crypto, or a politician name. FakeShield highlights matching global trend items.
                    </p>
                  </div>
                  <div className="flex w-full gap-3 lg:w-[420px]">
                    <input
                      value={alertInput}
                      onChange={(event) => setAlertInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && addAlertChannel()}
                      placeholder="Keyword or topic"
                      className="min-w-0 flex-1 rounded-xl border border-cyan-200/15 bg-[#050505]/70 px-4 py-3 text-sm text-cyan-50 outline-none placeholder:text-[#6f7f80] focus:border-cyan-200/50"
                    />
                    <button
                      onClick={addAlertChannel}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-4 py-3 font-display text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                    >
                      <Plus size={17} />
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {alertChannels.length === 0 && (
                    <span className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#a3b2b3]">
                      No alert channels yet.
                    </span>
                  )}
                  {alertChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => removeAlertChannel(channel.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/5 px-4 py-2 text-sm font-semibold text-cyan-100"
                    >
                      {channel.keyword}
                      <Trash2 size={14} />
                    </button>
                  ))}
                </div>

                {alertChannels.length > 0 && (
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {alertMatches.map(({ channel, matches }) => (
                      <div key={channel.id} className="data-shard rounded-2xl p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="font-display text-lg text-cyan-50">{channel.keyword}</h3>
                          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-[#a3b2b3]">
                            {matches.length} matches
                          </span>
                        </div>
                        <div className="space-y-2">
                          {matches.length ? matches.map((item) => (
                            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#d7dfe0] hover:border-cyan-200/30">
                              <span className="line-clamp-2 font-semibold text-cyan-50">{item.topic}</span>
                              <span className="mt-1 block text-xs text-[#a3b2b3]">{item.source}</span>
                            </a>
                          )) : (
                            <p className="text-sm text-[#a3b2b3]">No current watchlist match. FakeShield will keep checking as the live feed refreshes.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-panel min-h-[720px] overflow-hidden rounded-3xl">
                <TrendingFakeNews variant="wide" />
              </div>
            </motion.section>
          )}

          {activeView === 'analysis' && (
          <>
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="glass-panel hud-border overflow-hidden rounded-3xl"
          >
            <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#050505]/35 p-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = mainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    disabled={loading}
                    onClick={() => setMainTab(tab.id)}
                    className={`relative flex min-w-[132px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      active ? 'text-[#00282b]' : 'text-[#a3b2b3] hover:text-cyan-100'
                    } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeMainTab"
                        className={`absolute inset-0 -z-0 rounded-2xl bg-gradient-to-r ${tab.accent} shadow-[0_0_24px_rgba(125,244,255,0.22)]`}
                        transition={{ type: 'spring', bounce: 0.28, duration: 0.62 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {mainTab === 'text' ? (
              <>
                <div className="drop-zone relative min-h-[420px] overflow-hidden p-5 sm:p-8 lg:p-12">
                  <div className="scanner-line" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-200/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-light tracking-wide text-cyan-50">Ingest Intelligence</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a3b2b3]">
                        Paste a claim, article, caption, or live URL. FakeShield extracts signals, checks source context, and returns a cautious verdict.
                      </p>
                    </div>
                    <div className="flex rounded-xl border border-white/10 bg-[#050505]/55 p-1">
                      {(['text', 'url'] as const).map((item) => (
                        <button
                          key={item}
                          onClick={() => setMode(item)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            mode === item
                              ? 'bg-cyan-200 text-[#003538]'
                              : 'text-[#a3b2b3] hover:text-cyan-100'
                          }`}
                        >
                          {item === 'text' ? 'Text' : 'URL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    {mode === 'text' ? (
                      <textarea
                        value={text}
                        onChange={(event) => {
                          setText(event.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Paste a news article, viral claim, political statement, or suspicious headline..."
                        className="min-h-[220px] w-full resize-y rounded-2xl border border-cyan-200/15 bg-[#050505]/70 p-5 text-base leading-8 text-cyan-50 shadow-inner outline-none transition placeholder:text-[#6f7f80] focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-200/20"
                      />
                    ) : (
                      <div className="flex items-center rounded-2xl border border-cyan-200/15 bg-[#050505]/70 p-2 shadow-inner transition focus-within:border-cyan-200/50 focus-within:ring-2 focus-within:ring-cyan-200/20">
                        <Globe className="ml-3 h-6 w-6 text-cyan-200" />
                        <input
                          type="url"
                          value={url}
                          onChange={(event) => {
                            setUrl(event.target.value);
                            if (error) setError(null);
                          }}
                          onKeyDown={(event) => event.key === 'Enter' && handleAnalyze()}
                          placeholder="https://example.com/news-article"
                          className="w-full border-none bg-transparent px-4 py-5 text-base text-cyan-50 outline-none placeholder:text-[#6f7f80] focus:ring-0"
                        />
                      </div>
                    )}

                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/30 bg-[#050505]/85 backdrop-blur-md"
                      >
                        <span className="scanner-line opacity-100" />
                        <RefreshCw className="mb-3 h-8 w-8 animate-spin text-cyan-200" />
                        <span className="font-display text-sm uppercase tracking-[0.2em] text-cyan-100">
                          {mode === 'url' ? 'Scraping and analyzing URL' : 'Cross-checking claim signals'}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[#a3b2b3]">
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        {mode === 'text' ? `${text.length} Characters` : 'Live URL Scanner'}
                      </span>
                      <span className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-3 py-2 text-emerald-200">
                        Gemini → Groq Ready
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleClear}
                        disabled={loading || (!text && !url && !result)}
                        className="rounded-xl px-5 py-3 font-semibold text-[#a3b2b3] transition hover:bg-white/10 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Clear Queue
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={loading || !canAnalyzeText}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/40 bg-cyan-200/10 px-6 py-3 font-display text-sm font-semibold tracking-wide text-cyan-100 shadow-[0_0_22px_rgba(125,244,255,0.08)] transition hover:bg-cyan-200/20 hover:shadow-[0_0_28px_rgba(125,244,255,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UploadCloud size={18} />
                        {loading ? 'Processing' : 'Process Artifact'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 sm:p-6">
                {mainTab === 'image' && <ImageAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'image')} loading={loading} />}
                {mainTab === 'video' && <VideoAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'video')} loading={loading} />}
                {mainTab === 'voice' && <VoiceAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'audio')} loading={loading} />}
              </div>
            )}
          </motion.section>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-4 text-rose-100"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence>
            {loading && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="hud-border relative overflow-hidden rounded-2xl p-6 sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Radar className="h-5 w-5 text-cyan-200" />
                    <h3 className="font-display text-xl font-light tracking-wide text-cyan-50">Active Forensics</h3>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-cyan-200/30 bg-cyan-200/10 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-200 animate-pulse" />
                    <span className="font-display text-xs uppercase tracking-[0.18em] text-cyan-100">Processing</span>
                  </div>
                </div>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="scanner-ring relative grid h-32 w-32 shrink-0 place-items-center rounded-full">
                    <span className="font-display text-3xl font-light text-cyan-50">75<span className="text-base text-cyan-200">%</span></span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <span className="font-display text-xs uppercase tracking-[0.18em] text-[#6f7f80]">Target Artifact</span>
                        <p className="mt-1 text-lg text-cyan-50">
                          {mainTab === 'text' ? (mode === 'text' ? 'submitted_claim.txt' : url || 'live_url_scan') : `${mainTab}_artifact`}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-cyan-200">AI Core Active</span>
                    </div>
                    <div className="h-6 overflow-hidden rounded border border-white/10 bg-[#050505] p-1">
                      <div className="scan-progress h-full w-3/4 rounded-sm bg-gradient-to-r from-violet-400 via-cyan-200 to-white" />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#a3b2b3]">
                      <Activity className="h-4 w-4 text-cyan-200" />
                      Isolating misinformation and media manipulation signals...
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 34, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -28, scale: 0.97 }}
                transition={{ type: 'spring', bounce: 0.28, duration: 0.62 }}
              >
                <ResultCard
                  result={result}
                  originalText={mainTab === 'text' ? (mode === 'text' ? text : url) : result.source_url || 'Media File'}
                  apiUrl={API_URL}
                />
                <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div className="glass-panel rounded-2xl p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          <Globe size={14} />
                          Source Trust Graph
                        </div>
                        <h3 className="font-display text-xl text-cyan-50">{sourceTrust?.domain || 'Checking source'}</h3>
                      </div>
                      <div className="scanner-ring grid h-20 w-20 shrink-0 place-items-center rounded-full">
                        <span className="font-display text-xl text-cyan-50">{sourceTrust?.score ?? '--'}</span>
                      </div>
                    </div>
                    {intelligenceLoading && !sourceTrust ? (
                      <p className="text-sm text-[#a3b2b3]">Building source reliability graph...</p>
                    ) : (
                      <>
                        <p className="text-sm leading-6 text-[#d7dfe0]">{sourceTrust?.summary}</p>
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(sourceTrust?.signals || []).map((signal) => (
                            <div key={`${signal.label}-${signal.value}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f7f80]">{signal.label}</p>
                              <p className={`mt-1 text-sm font-semibold ${
                                signal.status === 'positive' ? 'text-emerald-200' : signal.status === 'negative' ? 'text-rose-200' : 'text-cyan-100'
                              }`}>{signal.value}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="glass-panel rounded-2xl p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          <Clock size={14} />
                          Evidence Timeline
                        </div>
                        <h3 className="font-display text-xl text-cyan-50">{timelineSource || 'Timeline builder'}</h3>
                      </div>
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[#a3b2b3]">
                        {timeline.length} events
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(timeline.length ? timeline : []).slice(0, 5).map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-200/30"
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-cyan-100">{new Date(item.date).toLocaleDateString()}</span>
                            <span className="text-[10px] uppercase tracking-[0.14em] text-[#6f7f80]">{item.type}</span>
                          </div>
                          <p className="line-clamp-2 text-sm font-semibold text-cyan-50">{item.title}</p>
                          <p className="mt-1 text-xs text-[#a3b2b3]">{item.source}</p>
                        </a>
                      ))}
                      {intelligenceLoading && timeline.length === 0 && <p className="text-sm text-[#a3b2b3]">Searching for first appearances and related coverage...</p>}
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 xl:col-span-2">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          <ClipboardList size={14} />
                          Community Review Queue
                        </div>
                        <h3 className="font-display text-xl text-cyan-50">Send this case for manual review</h3>
                        <textarea
                          value={reviewDraft}
                          onChange={(event) => setReviewDraft(event.target.value)}
                          placeholder="Add reviewer notes, evidence links to check, or why this needs human review..."
                          className="mt-4 min-h-[120px] w-full resize-y rounded-2xl border border-cyan-200/15 bg-[#050505]/70 p-4 text-sm leading-6 text-cyan-50 outline-none placeholder:text-[#6f7f80] focus:border-cyan-200/50"
                        />
                        <button
                          onClick={addToReviewQueue}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-5 py-3 font-display text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                        >
                          <Plus size={17} />
                          Add To Review Queue
                        </button>
                      </div>

                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          <Share2 size={14} />
                          Public Share Report
                        </div>
                        <h3 className="font-display text-xl text-cyan-50">Generate clean report link</h3>
                        <p className="mt-3 text-sm leading-6 text-[#d7dfe0]">
                          Creates a self-contained report URL with verdict, source score, timeline, and evidence notes. The link is copied automatically when the browser allows it.
                        </p>
                        <button
                          onClick={createShareReport}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-5 py-3 font-display text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                        >
                          <Copy size={17} />
                          Generate Report Link
                        </button>
                        {shareUrl && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-[#a3b2b3] break-all">
                            {shareUrl}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="glass-panel rounded-3xl p-5 sm:p-7"
          >
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                  <Layers size={14} />
                  Claim Comparison Mode
                </div>
                <h2 className="font-display text-2xl font-light text-cyan-50">Compare two claims or articles</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a3b2b3]">
                  Paste two versions of a story to catch contradictions, copied framing, missing context, or partial overlap.
                </p>
              </div>
              <button
                onClick={handleCompareClaims}
                disabled={compareLoading || compareLeft.trim().length < 10 || compareRight.trim().length < 10}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-5 py-3 font-display text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw size={17} className={compareLoading ? 'animate-spin' : ''} />
                {compareLoading ? 'Comparing' : 'Compare Claims'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <textarea
                value={compareLeft}
                onChange={(event) => setCompareLeft(event.target.value)}
                placeholder="Input A: paste first claim, article excerpt, or URL text..."
                className="min-h-[170px] resize-y rounded-2xl border border-cyan-200/15 bg-[#050505]/70 p-4 text-sm leading-7 text-cyan-50 outline-none placeholder:text-[#6f7f80] focus:border-cyan-200/50"
              />
              <textarea
                value={compareRight}
                onChange={(event) => setCompareRight(event.target.value)}
                placeholder="Input B: paste second claim, article excerpt, or URL text..."
                className="min-h-[170px] resize-y rounded-2xl border border-cyan-200/15 bg-[#050505]/70 p-4 text-sm leading-7 text-cyan-50 outline-none placeholder:text-[#6f7f80] focus:border-cyan-200/50"
              />
            </div>
            {compareResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-xl text-cyan-50">{compareResult.verdict.replace(/_/g, ' ')}</h3>
                  <span className="rounded-lg border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-sm font-semibold text-cyan-100">
                    {Math.round(compareResult.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm leading-6 text-[#d7dfe0]">{compareResult.summary}</p>
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {[
                    ['Shared Claims', compareResult.shared_claims],
                    ['Contradictions', compareResult.contradictions],
                    ['Missing Context', compareResult.missing_context],
                  ].map(([title, values]) => (
                    <div key={title as string} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#6f7f80]">{title as string}</h4>
                      <ul className="space-y-2 text-sm leading-6 text-[#d7dfe0]">
                        {(values as string[]).length ? (values as string[]).map((value) => <li key={value}>{value}</li>) : <li>No major item returned.</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>
          </>
          )}
        </main>

        <aside className="flex min-h-0 flex-col gap-6 xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)]">
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.26 }}
            className="glass-panel min-h-[320px] overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-cyan-200" />
                <h2 className="font-display text-xl font-light tracking-wide text-cyan-50">Data Shards</h2>
              </div>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-display text-xs uppercase tracking-[0.16em] text-[#a3b2b3]">
                Queue: {history.length}
              </span>
            </div>
            <div className="cyber-scrollbar max-h-[360px] overflow-y-auto">
              <HistoryPanel history={history} onLoadHistory={handleLoadHistory} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="glass-panel flex min-h-[380px] flex-1 flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-cyan-200" />
                <h2 className="font-display text-xl font-light tracking-wide text-cyan-50">Live Watch</h2>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Auto
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <TrendingFakeNews maxItems={8} />
            </div>
          </motion.section>
        </aside>
      </div>

      <footer className="glass-panel mt-auto border-x-0 border-b-0 rounded-none">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-7 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr] xl:px-20">
          <div className="flex items-start gap-4">
            <FakeShieldLogo compact />
            <div>
              <p className="font-display text-xl font-semibold text-cyan-50">Rahool Gir</p>
              <p className="mt-1 text-sm font-semibold text-cyan-100">Senior Software Engineer</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#a3b2b3]">
                Java · Microservices · Full-Stack engineer focused on Fintech, Core Banking, AI-integrated products, and production-grade web platforms.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#6f7f80]">Contact</p>
            <div className="space-y-2 text-sm text-[#a3b2b3]">
              <a href="mailto:rahool.goswami16@gmail.com" className="flex items-center gap-2 transition hover:text-cyan-100">
                <Mail size={16} className="text-cyan-200" />
                rahool.goswami16@gmail.com
              </a>
              <a href="tel:+923089567074" className="flex items-center gap-2 transition hover:text-cyan-100">
                <Phone size={16} className="text-cyan-200" />
                +92 308 9567074
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-cyan-200" />
                Karachi, Pakistan
              </span>
            </div>
          </div>

          <div>
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#6f7f80]">Profiles</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://github.com/Rahul-AlPHA1" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/5 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/12">
                <Github size={16} />
                GitHub
              </a>
              <a href="https://linkedin.com/in/rahool-goswami-4b055a126" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/5 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/12">
                <Linkedin size={16} />
                LinkedIn
              </a>
              <a href="https://rahul-alpha1.github.io/RahoolPortfolio.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/5 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/12">
                <ExternalLink size={16} />
                Portfolio
              </a>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-[#6f7f80]">
              © {new Date().getFullYear()} FakeShield · AI Media Intelligence Framework
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {sharedReport && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharedReport(null)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="glass-panel relative z-10 max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                    <Share2 size={14} />
                    Public FakeShield Report
                  </div>
                  <h2 className="font-display text-2xl text-cyan-50">{sharedReport.title}</h2>
                  <p className="mt-2 text-sm text-[#a3b2b3]">
                    Generated {new Date(sharedReport.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSharedReport(null)} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#a3b2b3]">
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6f7f80]">Verdict</p>
                  <p className="mt-2 font-display text-2xl text-cyan-50">{sharedReport.result.label}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6f7f80]">Confidence</p>
                  <p className="mt-2 font-display text-2xl text-cyan-50">{Math.round((sharedReport.result.confidence || 0) * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6f7f80]">Source Score</p>
                  <p className="mt-2 font-display text-2xl text-cyan-50">{sharedReport.sourceTrust?.score ?? '--'}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="font-display text-lg text-cyan-50">Reasoning</h3>
                <p className="mt-2 text-sm leading-6 text-[#d7dfe0]">{sharedReport.result.reasoning}</p>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="font-display text-lg text-cyan-50">Evidence Timeline</h3>
                <div className="mt-3 space-y-3">
                  {sharedReport.timeline.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs text-cyan-100">{new Date(item.date).toLocaleDateString()} · {item.source}</p>
                      <p className="mt-1 text-sm font-semibold text-cyan-50">{item.title}</p>
                      <p className="mt-1 text-xs text-[#a3b2b3]">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WelcomeGuide isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />
    </div>
  );
}
