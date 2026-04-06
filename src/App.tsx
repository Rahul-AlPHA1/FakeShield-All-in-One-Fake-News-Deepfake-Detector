// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { Shield, AlertCircle, RefreshCw, Zap, Globe, Search, Settings, Moon, Sun, Film, Mic, Github, Linkedin, Mail, User, ExternalLink, Phone, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ResultCard from './components/ResultCard';
import HistoryPanel from './components/HistoryPanel';
import SettingsModal from './components/SettingsModal';
import VideoAnalyzer from './components/VideoAnalyzer';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import ImageAnalyzer from './components/ImageAnalyzer';
import WelcomeGuide from './components/WelcomeGuide';
import TrendingFakeNews from './components/TrendingFakeNews';
import { LLMConfig, analyzeText, analyzeMedia } from './services/llmService';

const API_URL = '/api';

export default function App() {
  const [mainTab, setMainTab] = useState<'text' | 'video' | 'voice' | 'image'>('text');
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    const saved = localStorage.getItem('llmConfig');
    if (saved) {
      const config = JSON.parse(saved);
      return !config.geminiKey && !import.meta.env.VITE_GEMINI_API_KEY;
    }
    return !import.meta.env.VITE_GEMINI_API_KEY;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('llmConfig');
    return saved ? JSON.parse(saved) : { provider: 'gemini' };
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Inactivity timer logic (30 mins)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Clear all data after 30 mins of inactivity
        setHistory([]);
        setResult(null);
        setText('');
        setUrl('');
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    checkServerHealth();
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
    } catch (err) {
      setServerStatus('offline');
    }
  };

  const saveToHistory = (newResult: any, inputText: string, inputType: string) => {
    const historyItem = {
      id: Date.now().toString(),
      text: inputText,
      type: inputType,
      label: newResult.label,
      confidence: newResult.confidence,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [historyItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
  };

  const handleSaveSettings = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    localStorage.setItem('llmConfig', JSON.stringify(newConfig));
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
        source_url: sourceUrl
      };

      setResult(finalResult);
      saveToHistory(finalResult, mode === 'text' ? text : url, mode);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      if (err.response?.data?.error) {
        // Error from our backend scraper
        setError(`Scraping Error: ${err.response.data.error}`);
      } else {
        // Error from the LLM service or network
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
      
      const processingTimeMs = Date.now() - startTime;
      
      const finalResult = {
        ...aiResult,
        word_count: 0,
        processing_time_ms: processingTimeMs,
        source_url: file.name
      };

      setResult(finalResult);
      saveToHistory(finalResult, file.name, type);
    } catch (err: any) {
      console.error("Media Analysis Error:", err);
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
      setMainTab('video');
    } else if (item.type === 'audio') {
      setMainTab('voice');
    } else if (item.type === 'image') {
      setMainTab('image');
    } else if (item.type === 'url') {
      setMainTab('text');
      setMode('url');
      setUrl(item.text);
    } else {
      setMainTab('text');
      setMode('text');
      setText(item.text);
    }
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050814] text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row relative overflow-hidden transition-colors duration-500">
      
      {/* Ultra Instinct Mouse Follower */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: isDark 
            ? `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.08), transparent 40%)`
            : `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.05), transparent 40%)`
        }}
      />

      {/* Premium Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-600/10 dark:bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/5 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 overflow-y-auto custom-scrollbar z-10">
        
        {/* Header */}
        <header className="w-full max-w-4xl flex flex-col items-center mb-8 text-center pt-12 relative">
          <div className="absolute top-0 right-0 flex gap-2 z-20">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-3 bg-white/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-white/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title="AI Provider Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
            <Zap size={14} /> Architected by Rahool Gir | Full-Stack & Microservices
          </div>
          <div className="flex items-center gap-4 mb-4 relative">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 dark:opacity-40 rounded-full animate-pulse" />
            <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] relative z-10">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-indigo-200 relative z-10">
              FakeShield
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl font-light">
            Enterprise-grade misinformation detection by <span className="font-semibold text-indigo-600 dark:text-indigo-400">Rahool Goswami</span>. Paste an article, claim, or URL to instantly verify its authenticity.
          </p>
          
          {serverStatus === 'offline' && (
            <div className="mt-6 flex items-center gap-2 text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-5 py-2.5 rounded-xl text-sm font-medium">
              <AlertCircle size={18} />
              <span>Backend server is unreachable.</span>
            </div>
          )}
        </header>

        {/* Main Tabs - Animated Ultra Instinct Style */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 w-full max-w-3xl relative p-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
          {[
            { id: 'text', icon: Search, label: 'Text & URL', color: 'bg-indigo-600', shadow: 'shadow-indigo-500/40' },
            { id: 'image', icon: ImageIcon, label: 'Image', color: 'bg-emerald-600', shadow: 'shadow-emerald-500/40' },
            { id: 'video', icon: Film, label: 'Video', color: 'bg-purple-600', shadow: 'shadow-purple-500/40' },
            { id: 'voice', icon: Mic, label: 'Voice', color: 'bg-pink-600', shadow: 'shadow-pink-500/40' }
          ].map((tab) => (
            <button 
              key={tab.id}
              disabled={loading} 
              onClick={() => setMainTab(tab.id as any)} 
              className={`relative flex-1 py-3 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors z-10 ${mainTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mainTab === tab.id && (
                <motion.div
                  layoutId="activeMainTab"
                  className={`absolute inset-0 rounded-xl -z-10 shadow-lg ${tab.color} ${tab.shadow}`}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}
              <tab.icon size={18} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div className="w-full max-w-4xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden mb-10 transition-all hover:border-slate-300 dark:hover:border-slate-600/50 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {mainTab === 'text' && (
            <>
              {/* Input Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-900/40">
                <button 
                  onClick={() => setMode('text')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${mode === 'text' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-white/50 dark:bg-slate-800/30' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Search size={18} /> Text Analysis
                </button>
                <button 
                  onClick={() => setMode('url')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${mode === 'url' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-white/50 dark:bg-slate-800/30' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Globe size={18} /> URL Scanner
                </button>
              </div>

              <div className="p-6 md:p-8">
                <div className="relative">
                  {mode === 'text' ? (
                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Paste a news article, controversial claim, or headline to fact-check..."
                      className="w-full min-h-[180px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-y text-lg leading-relaxed shadow-inner"
                    />
                  ) : (
                    <div className="flex items-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 shadow-inner transition-all">
                      <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500">
                        <Globe size={24} />
                      </div>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="https://example.com/news-article"
                        className="w-full bg-transparent border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none py-4 text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      />
                    </div>
                  )}
                  
                  {/* Scanning Overlay Animation */}
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-indigo-500/30 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-[scan_2s_ease-in-out_infinite]" />
                      <RefreshCw className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin mb-3" />
                      <span className="text-indigo-600 dark:text-indigo-300 font-medium tracking-wide animate-pulse">
                        {mode === 'url' ? 'Scraping and analyzing URL...' : 'Cross-referencing facts...'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4 text-sm font-medium">
                  <span className="text-slate-500 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    {mode === 'text' ? `${text.length} characters` : 'URL Scanner'}
                  </span>
                  {error && <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1"><AlertCircle size={14}/> {error}</span>}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/60 px-6 md:px-8 py-5 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-4">
                <button
                  onClick={handleClear}
                  disabled={loading || (mode === 'text' ? !text : !url) && !result}
                  className="px-6 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || (mode === 'text' ? text.length === 0 : url.length === 0)}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? 'Analyzing...' : 'Verify Claim'}
                </button>
              </div>
            </>
          )}

          {mainTab === 'image' && (
            <ImageAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'image')} loading={loading} />
          )}

          {mainTab === 'video' && (
            <VideoAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'video')} loading={loading} />
          )}

          {mainTab === 'voice' && (
            <VoiceAnalyzer onAnalyze={(file) => handleAnalyzeMedia(file, 'audio')} loading={loading} />
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="w-full max-w-4xl mb-16"
            >
              <ResultCard 
                result={result} 
                originalText={mainTab === 'text' ? (mode === 'text' ? text : url) : result.source_url || 'Media File'} 
                apiUrl={API_URL} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator Profile Section */}
        <div className="w-full max-w-4xl mt-8 mb-12">
          <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.05)] dark:shadow-[0_0_40px_rgba(99,102,241,0.1)] relative overflow-hidden group transition-all hover:border-indigo-500/40">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-28 h-28 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow duration-500">
                <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/profile.jpg" 
                    alt="Rahool Gir" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image is not found
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <User size={48} className="text-indigo-500 dark:text-indigo-400 hidden" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wider uppercase mb-3 border border-indigo-200 dark:border-indigo-500/20">
                  Creator & Developer
                </div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">Rahool Gir</h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-3 text-lg">Mid-Level Software Engineer</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed mb-4">
                  Specialized in microservices architecture, REST API development, and full-stack engineering using Java, Spring Boot, Quarkus, Node.js, and React. Experienced in Core Banking & Fintech solutions.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><Globe size={16} className="text-indigo-500" /> Karachi, Pakistan</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} className="text-indigo-500" /> +92 308 9567074</span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col justify-center gap-3 shrink-0">
                <a href="https://github.com/Rahul-AlPHA1" target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="GitHub">
                  <Github size={22} />
                </a>
                <a href="https://linkedin.com/in/rahool-goswami-4b055a126" target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="LinkedIn">
                  <Linkedin size={22} />
                </a>
                <a href="https://rahul-alpha1.github.io/RahoolPortfolio.com" target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="Portfolio">
                  <ExternalLink size={22} />
                </a>
                <a href="mailto:rahool.goswami16@gmail.com" className="p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="Email">
                  <Mail size={22} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full max-w-4xl mt-auto pt-8 pb-12 flex flex-col items-center justify-center text-center z-10 border-t border-slate-200/50 dark:border-slate-800/50">
          
          {/* Monetization & Analytics */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <a 
              href="https://www.buymeacoffee.com/rg9859943c" 
              target="_blank" 
              rel="noreferrer"
              className="hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                alt="Buy Me A Coffee" 
                className="h-10"
              />
            </a>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Visitors:</span>
              <img 
                src="https://api.visitorbadge.io/api/visitors?path=Rahul-AlPHA1.FakeShield&countColor=%234f46e5&labelColor=%231e293b" 
                alt="Visitor Count" 
                className="h-5 rounded"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['React 19', 'Tailwind CSS', 'Framer Motion', 'Node.js', 'Express', 'Vercel Serverless', 'Google Gemini AI', 'Cheerio'].map((tech) => (
              <span key={tech} className="px-3 py-1 text-xs font-medium bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                {tech}
              </span>
            ))}
          </div>
          <p className="text-slate-500 dark:text-slate-500 text-sm flex items-center gap-1 font-medium">
            &copy; {new Date().getFullYear()} Architected by <span className="font-bold text-indigo-600 dark:text-indigo-400">Rahool Gir</span>. All rights reserved.
          </p>
        </footer>

      </div>

      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-auto md:h-screen sticky top-0 z-20 shadow-2xl overflow-hidden">
        <div className="flex-shrink-0">
          <HistoryPanel history={history} onLoadHistory={handleLoadHistory} />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <TrendingFakeNews />
        </div>
      </div>

      <WelcomeGuide 
        isOpen={isWelcomeOpen} 
        onClose={() => setIsWelcomeOpen(false)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
