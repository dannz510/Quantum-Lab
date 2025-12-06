import React, { useState } from 'react';
import { Search, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { searchPhysicsTopic } from '../services/gemini';
import { SearchResult } from '../types';

export const SearchGround: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchPhysicsTopic(query);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
       <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4">
        <div className="p-3 bg-emerald-500/20 rounded-lg">
           <Globe className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Live Physics Search</h2>
          <p className="text-slate-300 text-sm">
            Grounded by Google Search. Get the latest papers, news, and real-world constants.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about recent discoveries, constants, or specific phenomena..."
          className="w-full bg-lab-card border border-slate-600 rounded-full py-4 pl-6 pr-14 text-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-lg"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full transition-all disabled:opacity-50"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Search size={20} />}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto">
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Answer */}
            <div className="bg-lab-card p-6 rounded-2xl border border-slate-700">
              <h3 className="text-emerald-400 font-mono text-sm mb-3 font-bold uppercase tracking-wider">AI Synthesis</h3>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{result.text}</p>
            </div>

            {/* Sources */}
            {result.groundingChunks && result.groundingChunks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.groundingChunks.map((chunk, idx) => {
                  if (!chunk.web) return null;
                  return (
                    <a 
                      key={idx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="group block bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                         <div>
                            <h4 className="font-semibold text-emerald-200 mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1">
                              {chunk.web.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono truncate">{chunk.web.uri}</p>
                         </div>
                         <ExternalLink size={16} className="text-slate-600 group-hover:text-emerald-400" />
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};