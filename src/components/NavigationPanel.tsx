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
    <div className="w-full flex flex-col gap-4 pointer-events-none">
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card pointer-events-auto border-white/10"
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
            <form onSubmit={handleSearch} className="relative mb-4">
              <input 
                type="text"
                placeholder="Where to?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </form>

            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              <AnimatePresence>
                {results.map((res) => (
                  <motion.button
                    key={res.place_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSearch(res, 'end')}
                    className="w-full text-left p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{res.display_name.split(',')[0]}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-1 line-clamp-2">{res.display_name.split(',').slice(1).join(',')}</div>
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
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400 mb-3 ml-1">Arrival Window</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                        {Math.round(routeData.routes[0].duration / 60)}
                      </span>
                      <span className="text-xl font-bold text-slate-400">MINS</span>
                    </div>
                    <div className="flex justify-between mt-6 text-[12px] font-bold border-t border-white/5 pt-5 px-1">
                       <div className="flex flex-col">
                          <span className="text-slate-500 uppercase tracking-widest text-[9px] mb-1">Total Distance</span>
                          <span className="text-white">{(routeData.routes[0].distance / 1000).toFixed(1)} KM</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-slate-500 uppercase tracking-widest text-[9px] mb-1">Traffic Impact</span>
                          <span className={routeData.routes[0].duration > routeData.routes[0].distance / 10 ? "text-amber-400" : "text-emerald-400"}>
                            {routeData.routes[0].duration > routeData.routes[0].distance / 10 ? "CONGESTED" : "OPTIMAL"}
                          </span>
                       </div>
                    </div>
                 </div>

                 {/* API Assistance Card (Dismissable) */}
                 <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                       <Info className="w-4 h-4 text-blue-400" />
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Dev Insights</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                       For live traffic flux (Red/Yellow lines), a **Thunderforest** or **Mapbox** key is required. 
                       Both offer generous free tiers without card verification for initial development.
                    </p>
                    <a 
                      href="https://www.thunderforest.com/signup/" 
                      target="_blank" 
                      className="text-[9px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-blue-500 transition-colors"
                    >
                      Get Key
                    </a>
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
            className="glass-card border-blue-500/30 pointer-events-auto bg-blue-500/10 flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Active Navigation</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {routeData.routes[0].legs[0].steps[currentStepIndex]?.maneuver.instruction || "Proceed to route"}
                  </p>
                  <div className="flex gap-2">
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
