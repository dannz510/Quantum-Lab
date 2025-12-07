
import React, { useState } from 'react';
import { Search, Globe, ExternalLink, ArrowRight, Database, Server, Terminal } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-6 p-4">
       <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4 shadow-2xl">
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/50">
           <Terminal className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1 font-mono tracking-wide">QUANTUM RESEARCH TERMINAL</h2>
          <p className="text-emerald-400/60 text-xs font-mono">
            CONNECTED TO: GOOGLE SEARCH GROUNDING API // LATENCY: 12ms
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all opacity-0 group-hover:opacity-100"></div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ENTER QUERY (e.g., 'Latest value of Hubble Constant', 'Recent superconductors')"
          className="relative z-10 w-full bg-black/80 border border-emerald-900 rounded-lg py-4 pl-12 pr-14 text-lg text-emerald-100 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-lg font-mono placeholder:text-emerald-900"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-emerald-600">
           <span className="animate-pulse">{'>'}</span>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 p-3 rounded-md transition-all disabled:opacity-50 border border-emerald-700/50 z-20"
        >
          {loading ? <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"/> : <Search size={20} />}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 rounded-xl border border-slate-800 p-1">
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4">
            {/* Main Answer */}
            <div className="bg-slate-900/80 p-6 rounded-xl border-l-4 border-emerald-500 shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                 <Server size={14} className="text-emerald-500" />
                 <h3 className="text-emerald-500 font-mono text-xs font-bold uppercase tracking-wider">Synthesis Output</h3>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm md:text-base">{result.text}</p>
            </div>

            {/* Sources */}
            {result.groundingChunks && result.groundingChunks.length > 0 && (
              <div>
                  <div className="flex items-center gap-2 mb-3 px-2">
                     <Database size={14} className="text-slate-500" />
                     <h3 className="text-slate-500 font-mono text-xs uppercase tracking-wider">Citations & Uplinks</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.groundingChunks.map((chunk, idx) => {
                      if (!chunk.web?.uri) return null;
                      return (
                        <a 
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="group block bg-slate-900 hover:bg-slate-800 p-4 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-all relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          <div className="relative z-10 flex items-start justify-between">
                             <div className="overflow-hidden">
                                <h4 className="font-semibold text-emerald-100 mb-1 group-hover:text-emerald-400 transition-colors line-clamp-1 text-sm font-mono">
                                  {chunk.web.title || "External Source"}
                                </h4>
                                <p className="text-[10px] text-emerald-800 group-hover:text-emerald-600 font-mono truncate">{chunk.web.uri}</p>
                             </div>
                             <ExternalLink size={14} className="text-slate-700 group-hover:text-emerald-400 flex-shrink-0" />
                          </div>
                        </a>
                      )
                    })}
                  </div>
              </div>
            )}
          </div>
        )}
        
        {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 font-mono space-y-4 opacity-50">
                <Globe size={64} strokeWidth={1} />
                <p>TERMINAL READY. AWAITING INPUT.</p>
            </div>
        )}
      </div>
    </div>
  );
};
