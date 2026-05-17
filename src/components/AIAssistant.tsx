import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askAI } from '../lib/mapUtils';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AI guide. Want to plan a trip or find hidden gems nearby?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await askAI(userMsg, history);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: response.text || response.error }]);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all z-30 group"
      >
        <Bot className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#020617]">
            <Sparkles className="w-2 h-2 text-white fill-current" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="absolute bottom-20 right-6 w-[320px] sm:w-[360px] h-[480px] sm:h-[540px] glass overflow-hidden rounded-[24px] flex flex-col z-40 shadow-2xl border-white/10"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shadow-inner">
                   <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                   <div className="text-xs font-bold text-white tracking-tight">Trip Strategist</div>
                   <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Gemini Neural</span>
                   </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#020617]/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-xl text-[13px] leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10 shadow-inner'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/10">
                    <div className="flex gap-1 items-center">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s]" />
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-3xl">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ask for an itinerary..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-white transition-all bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
