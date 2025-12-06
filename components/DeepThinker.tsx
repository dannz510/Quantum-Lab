import React, { useState } from 'react';
import { BrainCircuit, Send, Lightbulb, Sparkles } from 'lucide-react';
import { solveComplexProblem } from '../services/gemini';
import ReactMarkdown from 'react-markdown'; // Assuming standard usage, but if not installed, we can render text directly. Since instructions said "Use popular libraries", I will simulate markdown rendering with simple whitespace handling if library issues arise, but for this context I will render raw text nicely or use a simple formatter. 

// Actually, I will write a simple text renderer to avoid unlisted dependency issues if `react-markdown` isn't implicitly allowed in the prompt environment (though it is popular). I'll stick to basic formatting.

export const DeepThinker: React.FC = () => {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSolve = async () => {
    if (!problem.trim()) return;
    
    setIsThinking(true);
    setSolution('');
    
    try {
      const result = await solveComplexProblem(problem);
      setSolution(result);
    } catch (e) {
      setSolution('An error occurred while analyzing the problem.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
      <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-purple-500/20 rounded-lg">
           <BrainCircuit className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Deep Thinking Mode</h2>
          <p className="text-slate-300 text-sm">
            Powered by Gemini 3 Pro with an extended thinking budget (32k tokens). 
            Ideal for complex derivations, multi-step physics problems, and theoretical analysis.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-lab-card rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {!solution && !isThinking && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <Lightbulb size={64} className="mb-4" />
                <p>Enter a complex physics problem to begin analysis</p>
             </div>
           )}

           {isThinking && (
             <div className="animate-pulse space-y-4 p-4 rounded-lg bg-purple-900/10 border border-purple-500/20">
               <div className="flex items-center gap-3 text-purple-300 font-mono">
                 <Sparkles className="w-5 h-5 animate-spin" />
                 <span>Thinking deeply... Exploring solution space...</span>
               </div>
               <div className="h-2 bg-slate-700 rounded-full w-3/4"></div>
               <div className="h-2 bg-slate-700 rounded-full w-1/2"></div>
               <div className="h-2 bg-slate-700 rounded-full w-5/6"></div>
             </div>
           )}

           {solution && (
             <div className="prose prose-invert max-w-none">
               <div className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                 {solution}
               </div>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex gap-2">
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="E.g., Derive the time dilation formula using the Lorentz transformation..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
            />
            <button
              onClick={handleSolve}
              disabled={isThinking || !problem}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 font-bold disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-1 min-w-[100px]"
            >
              <Send size={20} />
              <span className="text-xs">SOLVE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};