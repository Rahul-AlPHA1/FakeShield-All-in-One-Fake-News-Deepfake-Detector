import { useState } from 'react';
import { Settings, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { LLMConfig, testConnection } from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

export default function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<LLMConfig>(config);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus('testing');
    const success = await testConnection(localConfig);
    setTestStatus(success ? 'success' : 'error');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-[#0a0f1c]/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <Settings className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Provider Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider</label>
            <select 
              value={localConfig.provider}
              onChange={(e) => setLocalConfig({...localConfig, provider: e.target.value as any})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq (Fast Inference)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          {localConfig.provider === 'gemini' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gemini API Key</label>
              <input 
                type="password"
                value={localConfig.geminiKey || ''}
                onChange={(e) => setLocalConfig({...localConfig, geminiKey: e.target.value})}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {localConfig.provider === 'groq' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Groq API Key</label>
              <input 
                type="password"
                value={localConfig.groqKey || ''}
                onChange={(e) => setLocalConfig({...localConfig, groqKey: e.target.value})}
                placeholder="gsk_..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {localConfig.provider === 'ollama' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ollama URL</label>
                <input 
                  type="text"
                  value={localConfig.ollamaUrl || 'http://localhost:11434'}
                  onChange={(e) => setLocalConfig({...localConfig, ollamaUrl: e.target.value})}
                  placeholder="http://localhost:11434"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model Name</label>
                <input 
                  type="text"
                  value={localConfig.ollamaModel || 'llama3'}
                  onChange={(e) => setLocalConfig({...localConfig, ollamaModel: e.target.value})}
                  placeholder="llama3"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-2 rounded-lg transition-colors font-medium"
            >
              {testStatus === 'testing' && <Loader2 size={16} className="animate-spin" />}
              {testStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />}
              {testStatus === 'error' && <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />}
              {testStatus === 'idle' && 'Test Connection'}
              {testStatus !== 'idle' && testStatus !== 'testing' && 'Tested'}
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
