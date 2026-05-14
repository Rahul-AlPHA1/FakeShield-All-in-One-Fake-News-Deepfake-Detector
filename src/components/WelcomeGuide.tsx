import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, FileSearch, Globe2, Languages, ShieldCheck, X } from 'lucide-react';

interface WelcomeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeGuide({ isOpen, onClose }: WelcomeGuideProps) {
  const [step, setStep] = useState(1);

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
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-600/70 z-10 flex flex-col max-h-[92vh]"
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
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <FileSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Why This Website Exists</h3>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed">
                    FakeShield was built to help people slow down before sharing suspicious content. Fake news, AI-generated images, deepfake videos, and cloned voices can spread quickly, so this app gives you a fast investigation workspace for checking whether something looks real, fake, or misleading.
                  </p>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed">
                    Its main job is to analyze claims and media, explain the warning signs in plain language, and suggest practical next steps so users can verify content more responsibly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Text and URL checks', 'Image manipulation review', 'Video deepfake signals', 'Voice clone analysis'].map((item) => (
                      <div key={item} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100">
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <Languages className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">What FakeShield Checks</h3>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed">
                    For text and URLs, FakeShield looks for suspicious framing, unsupported claims, manipulative tone, missing context, and source reliability signals. For images, videos, and voice clips, it checks for AI-generation or manipulation clues.
                  </p>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed">
                    You can also choose the report language from the selector above the analyzer, so reasoning and recommendations are easier to understand.
                  </p>
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 p-4 text-sm text-indigo-900 dark:text-indigo-100">
                    The language selector includes a broad set of world languages, including Urdu, Hindi, Arabic, English, Spanish, French, Chinese, Japanese, Turkish, and more.
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
                    <Globe2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">How To Use It Properly</h3>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed">
                    The sidebar keeps a live watchlist of recent misinformation, fake-news, fact-check, and deepfake coverage. It refreshes automatically and can be used as a starting point for investigation.
                  </p>
                  <ul className="space-y-3 text-slate-700 dark:text-slate-100 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Paste the original claim or URL whenever possible, not just a short screenshot caption.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Live trends are leads, not final verdicts. Always run suspicious content through the analyzer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Use the result as guidance, then verify with trusted sources before sharing.</span>
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
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/25"
                  >
                    Start Checking
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
