import React, { useState } from 'react';
import { Search, MapPin, Navigation, Save, Share2, Languages, Volume2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchPlaces, SearchResult } from '../lib/mapUtils';

interface NavigationPanelProps {
  onSearch: (result: SearchResult, type: 'start' | 'end') => void;
  onStartNav: () => void;
  onShare: () => void;
  onNextStep?: () => void;
  onStopNav?: () => void;
  currentStepIndex?: number;
  routeData: any;
  isNavigating: boolean;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({ 
  onSearch, 
  onStartNav, 
  onShare, 
  onNextStep,
  onStopNav,
  currentStepIndex = 0,
  routeData, 
  isNavigating 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'route'>('search');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    const res = await searchPlaces(query);
    setResults(res);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card border-white/10"
      >
        <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'search' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            Search
          </button>
          <button 
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'route' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            Routes
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {['Parks', 'Coffee', 'Gas', 'Hotels'].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => { setQuery(cat); handleSearch({ preventDefault: () => {} } as any); }}
                  className="px-4 py-1.5 glass rounded-full text-[10px] font-bold text-slate-400 whitespace-nowrap hover:text-white hover:border-white/20 transition-all border border-white/5"
                >
                  {cat}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="relative mb-3">
              <input 
                type="text"
                placeholder="Where to?"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </form>

            <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {results.map((res, i) => (
                  <motion.button
                    key={res.place_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSearch(res, 'end')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{res.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{res.display_name.split(',').slice(1).join(',')}</div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="space-y-4">
             {routeData ? (
               <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-[40px] -mr-12 -mt-12 pointer-events-none" />
                    <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-blue-400 mb-2 ml-1">Arrival Window</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                        {Math.round(routeData.routes[0].duration / 60)}
                      </span>
                      <span className="text-sm font-bold text-slate-400 uppercase">mins</span>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold border-t border-white/5 pt-4 px-1">
                       <div className="flex flex-col">
                          <span className="text-slate-500 uppercase tracking-widest text-[8px] mb-1">Total Distance</span>
                          <span className="text-white">{(routeData.routes[0].distance / 1000).toFixed(1)} KM</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-slate-500 uppercase tracking-widest text-[8px] mb-1">Traffic Impact</span>
                          <span className={routeData.routes[0].duration > routeData.routes[0].distance / 10 ? "text-amber-400" : "text-emerald-400"}>
                            {routeData.routes[0].duration > routeData.routes[0].distance / 10 ? "CONGESTED" : "NOMINAL"}
                          </span>
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={onStartNav}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                 >
                   <Navigation className="w-5 h-5 fill-current" />
                   START NAVIGATION
                 </button>

                 <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 px-4 glass hover:bg-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                      <Save className="w-4 h-4" /> SAVE
                    </button>
                    <button 
                      onClick={onShare}
                      className="py-3 px-4 glass hover:bg-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Share2 className="w-4 h-4" /> SHARE
                    </button>
                 </div>
               </div>
             ) : (
               <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Navigation className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    Set a destination to view optimized routes and real-time traffic updates.
                  </p>
               </div>
             )}
          </div>
        )}
      </motion.div>

      {/* Real-time Alerts / Notifications */}
      <AnimatePresence>
        {isNavigating && routeData && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="glass-card border-blue-500/30 bg-blue-500/10 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Active Navigation</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">
                    {routeData.routes[0].legs[0].steps[currentStepIndex]?.maneuver.instruction || "Proceed to route"}
                  </p>
                  <div className="flex gap-1.5">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <Volume2 className="w-4 h-4 text-slate-300" />
                    </button>
                    <button 
                      onClick={onStopNav}
                      className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-3 custom-scrollbar pr-2 border-t border-white/5 pt-4">
              {routeData.routes[0].legs[0].steps.map((step: any, idx: number) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${idx === currentStepIndex ? 'bg-blue-600/20 border-blue-500/30 shadow-inner' : 'border-transparent opacity-50'}`}>
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${idx === currentStepIndex ? 'bg-blue-500' : 'bg-white/5'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${idx === currentStepIndex ? 'text-white' : 'text-slate-500'}`}>#{idx + 1}</span>
                   </div>
                   <div className="flex-1">
                      <p className={`text-xs leading-tight font-medium ${idx === currentStepIndex ? 'text-white' : 'text-slate-300'}`}>{step.maneuver.instruction}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">In {(step.distance / 1000).toFixed(2)} KM</p>
                   </div>
                   {idx === currentStepIndex && (
                     <div className="h-full flex items-center">
                        <button 
                          onClick={onNextStep}
                          className="px-3 py-1 bg-white text-blue-600 text-[10px] font-black rounded-lg shadow-lg active:scale-95 transition-all"
                        >
                          DONE
                        </button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
