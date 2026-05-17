/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapComponent } from './components/MapComponent';
import { NavigationPanel } from './components/NavigationPanel';
import { AIAssistant } from './components/AIAssistant';
import { SearchResult, getRoute, speak, saveRoute, getSharedRoute } from './lib/mapUtils';
import { Layers, Download, Users, Award, Settings, Map as MapIcon, Globe, LogIn, LogOut, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09]); // Default London
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [zoom, setZoom] = useState(13);
  const [badges, setBadges] = useState<string[]>(['Early Adopter']);
  const [language, setLanguage] = useState('en-US');
  const [baseLayer, setBaseLayer] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [showTraffic, setShowTraffic] = useState(false);
  const [isLayerPickerOpen, setIsLayerPickerOpen] = useState(false);

  // Handle Shared Routes from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routeIdParam = params.get('routeId');
    if (routeIdParam) {
      loadSharedRoute(routeIdParam);
    }
  }, []);

  const loadSharedRoute = async (id: string) => {
    const data = await getSharedRoute(id);
    if (data) {
      const start = data.startPoint;
      const end = data.endPoint;
      const routeData = JSON.parse(data.routeData);
      
      setUserLocation([start[0], start[1]]);
      setDestination(end);
      setRoute(routeData);
      setMapCenter([parseFloat(end.lat), parseFloat(end.lon)]);
      setZoom(15);
      
      speak("Shared route loaded. Destinations sync complete.", language);
    }
  };

  const handleShare = async () => {
    if (!destination || !route) return;
    const res = await saveRoute(destination.display_name.split(',')[0], userLocation, destination, route);
    if (res.success && res.id) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?routeId=${res.id}`;
      await navigator.clipboard.writeText(shareUrl);
      speak("Share link copied to clipboard.", language);
      alert("✓ Shareable link copied to clipboard!"); // Simple replacement for toast for now
    } else if (res.error) {
       alert(res.error);
    }
  };

  const handleOfflineDownload = () => {
    speak("Starting offline map download for this region.", language);
    // Simulate progress
    const btn = document.querySelector('[data-tool="offline"]');
    if (btn) {
      btn.classList.add('animate-pulse', 'text-blue-400');
      setTimeout(() => {
        btn.classList.remove('animate-pulse', 'text-blue-400');
        alert("Region downloaded for offline use.");
      }, 3000);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/popup-closed-by-user') {
        alert("Login popup was closed. Please ensure popups are allowed and try again. Alternatively, open the app in a new tab.");
      } else if (err.code === 'auth/cancelled-by-user') {
        // Silently handle cancellation
      } else {
        alert(`Login transition failed: ${err.message}`);
      }
    }
  };

  const handleSave = async () => {
    if (!destination || !route) return;
    const res = await saveRoute(destination.display_name.split(',')[0], userLocation, destination, route);
    if (res.success) {
      alert("Route saved successfully!");
    } else {
      alert(res.error);
    }
  };

  // Load user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (err) => console.warn("Geolocation denied", err)
      );
    }
  }, []);

  const handleSearchSelect = async (result: SearchResult) => {
    setDestination(result);
    const destCoords: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setMapCenter(destCoords);
    setZoom(15);
    
    // Calculate route
    const routeData = await getRoute(userLocation, destCoords);
    setRoute(routeData);
  };

  const startNavigation = () => {
    setIsNavigating(true);
    setCurrentStepIndex(0);
    const firstStep = route?.routes[0]?.legs[0]?.steps[0]?.maneuver?.instruction;
    if (firstStep) speak(`Navigation started. ${firstStep}`, language);
    
    // Simulate badge earn
    if (badges.length < 2) {
      setTimeout(() => {
        setBadges(prev => [...prev, 'Navigator']);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 5000);
    }
  };

  const nextStep = () => {
    if (!route) return;
    const totalSteps = route.routes[0].legs[0].steps.length;
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const instruction = route.routes[0].legs[0].steps[nextIdx].maneuver.instruction;
      speak(instruction, language);
      
      // Update map center to follow the step
      const coords = route.routes[0].legs[0].steps[nextIdx].maneuver.location;
      setMapCenter([coords[1], coords[0]]);
    } else {
      setIsNavigating(false);
      speak("You have reached your destination.", language);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    speak("Navigation stopped.", language);
  };

  const [weather, setWeather] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load Weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`/api/weather?lat=${userLocation[0]}&lon=${userLocation[1]}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await response.json();
           if (!data.error) setWeather(data);
        } else {
           console.warn("Weather API returned non-JSON response");
        }
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    };
    fetchWeather();
  }, [userLocation]);

  return (
    <div className="relative w-screen h-screen bg-[#020617] font-sans overflow-hidden">
      {/* Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-[1]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none z-[1]" />

      {/* Main Map */}
      <MapComponent 
        center={mapCenter} 
        zoom={zoom} 
        route={route}
        baseLayer={baseLayer}
        showTraffic={showTraffic}
        startPoint={userLocation}
        endPoint={destination ? [parseFloat(destination.lat), parseFloat(destination.lon)] : undefined}
      />

      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MapIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-gradient">Maps</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {weather && (
            <div className="flex items-center gap-3 px-4 py-1.5 glass rounded-full border border-white/10">
              <img src={weather.current.condition.icon} className="w-6 h-6" alt="weather" />
              <div className="text-[11px] font-bold">
                <span className="text-white">{weather.current.temp_c}°C</span>
                <span className="text-slate-400 ml-2 uppercase tracking-widest">{weather.current.condition.text}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Gemini Active</span>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10" />

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => signOut(auth)}
                className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-white/30 transition-all"
              >
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-full h-full object-cover" alt="avatar" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Navigation UI */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-16 left-0 bottom-0 w-full md:w-72 p-3 z-20"
          >
            <NavigationPanel 
              onSearch={handleSearchSelect}
              onStartNav={startNavigation}
              onShare={handleShare}
              onNextStep={nextStep}
              onStopNav={stopNavigation}
              currentStepIndex={currentStepIndex}
              routeData={route}
              isNavigating={isNavigating}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Toolbars */}
      <div className="absolute top-20 right-4 md:right-6 flex flex-col gap-3 z-20">
        <div className="glass flex flex-col p-0.5 rounded-xl">
          <div className="relative">
            <button 
              onClick={() => setIsLayerPickerOpen(!isLayerPickerOpen)}
              className={`p-2.5 hover:bg-white/10 rounded-lg transition-colors ${baseLayer !== 'dark' || showTraffic || isLayerPickerOpen ? 'text-blue-400' : 'text-slate-300'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {isLayerPickerOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                  className="absolute right-full mr-3 top-0 glass p-2 rounded-xl transition-all flex flex-col gap-1 min-w-[130px] z-50 shadow-2xl"
                >
                   <div className="flex justify-between items-center px-1.5 py-1">
                     <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Base Layers</p>
                   </div>
                   <button onClick={() => { setBaseLayer('dark'); setIsLayerPickerOpen(false); }} className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${baseLayer === 'dark' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}>Dark Vector</button>
                   <button onClick={() => { setBaseLayer('satellite'); setIsLayerPickerOpen(false); }} className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${baseLayer === 'satellite' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}>Satellite View</button>
                   <button onClick={() => { setBaseLayer('street'); setIsLayerPickerOpen(false); }} className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${baseLayer === 'street' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}>Standard Street</button>
                   
                   <div className="h-[1px] bg-white/5 my-1" />
                   
                   <p className="text-[8px] uppercase font-bold text-slate-500 px-1.5 py-1 tracking-widest">Overlays</p>
                   <button 
                     onClick={() => setShowTraffic(!showTraffic)} 
                     className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex justify-between items-center ${showTraffic ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-white/5 text-slate-300'}`}
                   >
                     <span>Flux</span>
                     {showTraffic && <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />}
                   </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleOfflineDownload}
            data-tool="offline"
            className="p-2.5 hover:bg-white/10 rounded-lg transition-colors group relative border-t border-white/5 mt-0.5 pt-2.5"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="absolute right-full mr-3 px-2 py-1 glass text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Offline</span>
          </button>
          
          <button onClick={handleSave} className="p-2.5 hover:bg-white/10 rounded-lg transition-colors group relative">
            <Save className="w-4 h-4 text-emerald-400" />
            <span className="absolute right-full mr-3 px-2 py-1 glass text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Save</span>
          </button>
        </div>

        <button className="glass p-2.5 rounded-xl group relative">
          <Users className="w-4 h-4 text-slate-300" />
          <span className="absolute right-full mr-3 px-2 py-1 glass text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Social</span>
        </button>
      </div>

      {/* Bottom Profile / Badges Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <motion.div 
            whileHover={{ y: -3 }}
            className="glass-dark px-4 py-2 rounded-full flex items-center gap-3 border border-white/20"
        >
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
             <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-yellow-500" />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold leading-none">Rank</span>
                <span className="text-xs font-semibold text-slate-200">Explorer</span>
             </div>
          </div>

          <div className="flex gap-1.5">
            {badges.map((badge, i) => (
                <div key={i} className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] font-bold text-blue-300 uppercase tracking-wider">
                  {badge}
                </div>
            ))}
          </div>

          <button className="ml-2 p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>

      {/* AI Assistant */}
      <AIAssistant />

      {/* Interface Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <motion.div 
           animate={{ 
             y: [0, 20, 0],
             rotate: [0, 5, 0]
           }}
           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[20%] left-[-5%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
         />
         <motion.div 
           animate={{ 
             y: [0, -30, 0],
             rotate: [0, -8, 0]
           }}
           transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
           className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
         />
      </div>
    </div>
  );
}
