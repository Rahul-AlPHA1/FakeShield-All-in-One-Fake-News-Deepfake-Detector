import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Settings, ShieldCheck, X, ChevronRight, ExternalLink } from 'lucide-react';

interface WelcomeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function WelcomeGuide({ isOpen, onClose, onOpenSettings }: WelcomeGuideProps) {
  const [step, setStep] = useState(1);

  // Reset step when opened
  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 z-10 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={28} />
                Welcome to FakeShield
              </h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Step 1: Get Your Free API Key</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    FakeShield uses Google's powerful Gemini AI to analyze text, images, videos, and audio. To use the app flawlessly, you need a free API key from Google AI Studio.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <ol className="list-decimal list-inside space-y-3 text-slate-700 dark:text-slate-300 font-medium">
                      <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={14} /></a></li>
                      <li>Sign in with your Google Account.</li>
                      <li>Click on <strong>"Create API key"</strong>.</li>
                      <li>Copy the generated key.</li>
                    </ol>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Step 2: Configure Settings</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Now that you have your API key, you need to add it to the app's settings.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <ol className="list-decimal list-inside space-y-3 text-slate-700 dark:text-slate-300 font-medium">
                      <li>Click the <strong>Settings (⚙️)</strong> icon at the top right of the screen.</li>
                      <li>Select <strong>Google Gemini</strong> as your provider.</li>
                      <li>Paste your API key into the input field.</li>
                      <li>Click <strong>Save Settings</strong>.</li>
                    </ol>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Step 3: You're Ready!</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    The app is now fully configured and will work flawlessly! Here are some tips:
                  </p>
                  <ul className="space-y-3 text-slate-700 dark:text-slate-300 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✔</span>
                      <span><strong>Privacy First:</strong> If you refresh the page or remain inactive for 30 minutes, all your analysis data will be securely cleared.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✔</span>
                      <span><strong>Multimodal:</strong> You can analyze Text, URLs, Images, Videos, and Voice notes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✔</span>
                      <span><strong>Trending News:</strong> Check the sidebar for live trending fake news around the world.</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                {step > 1 && (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/25"
                  >
                    Open Settings
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
