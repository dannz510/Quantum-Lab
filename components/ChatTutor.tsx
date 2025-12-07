import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, Zap } from 'lucide-react';
import { createChatSession, getFastResponse } from '../services/gemini';
import { ChatMessage } from '../types';
import type { Chat } from '@google/genai';

export const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useFastMode, setUseFastMode] = useState(false);
  
  // Refs
  const chatSessionRef = useRef<Chat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize standard chat session
    chatSessionRef.current = createChatSession();
    
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Quantum, your physics lab assistant. Whether you need help with equations, concepts, or experiment ideas, I'm here. Toggle 'Fast Mode' for quick definitions!",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      let responseText = '';
      
      if (useFastMode) {
        // Use Flash Lite via generateContent
        responseText = await getFastResponse(userMsg.text);
      } else {
        // Use Pro Chat session
        if (!chatSessionRef.current) {
             chatSessionRef.current = createChatSession();
        }
        const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
        responseText = result.text || "I'm not sure how to answer that.";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         text: "I encountered an error connecting to the quantum network. Please try again.",
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-lab-card/30 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-lab-card flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Quantum Tutor</h3>
            <div className="flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full ${useFastMode ? 'bg-amber-400' : 'bg-purple-400'} animate-pulse`}></span>
               <span className="text-xs text-slate-400">{useFastMode ? 'Flash Lite Mode' : 'Pro Reasoning Mode'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setUseFastMode(!useFastMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${useFastMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-700 text-slate-400 border-transparent hover:bg-slate-600'}`}
        >
          <Zap size={14} />
          {useFastMode ? 'Fast Mode ON' : 'Enable Fast Mode'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700/50 text-slate-200 border border-slate-600 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
             </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 rounded-2xl rounded-bl-none p-4 border border-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-lab-card border-t border-slate-700">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={useFastMode ? "Ask a quick question..." : "Ask complex physics questions..."}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-6 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};