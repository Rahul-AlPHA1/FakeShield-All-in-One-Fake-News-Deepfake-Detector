import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';

export default function NewsDashboard() {
  const [newsText, setNewsText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResult({
        truthScore: 88,
        reasoning: "The article presents verifiable facts but lacks primary source citations for the main claim.",
        lstmScore: 0.85
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-sans tracking-tight">Fake News Detector</h1>
      
      <div className="space-y-4">
        <textarea
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
          placeholder="Paste news text here..."
          className="w-full p-4 border border-gray-300 rounded-lg h-40 focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !newsText}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Search size={20} />
          {loading ? 'Analyzing...' : 'Analyze News'}
        </button>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border rounded-lg shadow-sm space-y-4"
        >
          <div className="flex items-center gap-4">
            {result.truthScore > 70 ? (
              <CheckCircle className="text-green-500" size={40} />
            ) : (
              <AlertCircle className="text-red-500" size={40} />
            )}
            <div>
              <h2 className="text-xl font-semibold">Truth Score: {result.truthScore}/100</h2>
              <p className="text-gray-600">{result.reasoning}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500 font-mono">
            Legacy LSTM Confidence: {(result.lstmScore * 100).toFixed(1)}%
          </div>
        </motion.div>
      )}
    </div>
  );
}
