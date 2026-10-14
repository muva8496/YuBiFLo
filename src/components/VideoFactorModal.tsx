import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, 
  Minimize2, X, CheckCircle2, ChevronRight, Sparkles, 
  Sun, Mic, Layers, BookOpen, TrendingUp, ShieldCheck
} from "lucide-react";

interface VideoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

interface Chapter {
  id: number;
  title: string;
  timestamp: string;
  seconds: number;
  description: string;
  tag: string;
  icon: React.ReactNode;
}

export default function VideoFactorModal({
  isOpen,
  onClose,
  isDocked = false,
  onToggleDock
}: VideoFactorModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(18);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  const totalDuration = 180; // 3 minutes total

  const chapters: Chapter[] = [
    {
      id: 1,
      title: "05:57 AM Dawn Lock & Float Count",
      timestamp: "00:00",
      seconds: 0,
      description: "Count cash drawer notes and verify M-Pesa float before morning rush starts.",
      tag: "Reconciliation",
      icon: <Sun size={15} className="text-amber-500" />
    },
    {
      id: 2,
      title: "Hands-Free Voice Ledger Counter Recording",
      timestamp: "00:36",
      seconds: 36,
      description: "Counter microphone records transactions in Swahili and Sheng without touching screens.",
      tag: "VCR Engine",
      icon: <Mic size={15} className="text-emerald-500" />
    },
    {
      id: 3,
      title: "Supply Restock & Batch Margin Calibrator",
      timestamp: "01:12",
      seconds: 72,
      description: "Arriving inventory auto-clears previous batches and recalibrates shelf profit.",
      tag: "Supply Accounting",
      icon: <Layers size={15} className="text-blue-500" />
    },
    {
      id: 4,
      title: "Customer Deni Book (Digital Khata)",
      timestamp: "01:48",
      seconds: 108,
      description: "Verbal credit capture, credit limit safeguards, and 1-tap partial repayments.",
      tag: "Credit Defense",
      icon: <BookOpen size={15} className="text-purple-500" />
    },
    {
      id: 5,
      title: "Cashflow & 3-Fold Double Entry Ledgers",
      timestamp: "02:24",
      seconds: 144,
      description: "Real-time Personal, Real, and Nominal accounts keeping cash and stock in balance.",
      tag: "Zero Leakage",
      icon: <TrendingUp size={15} className="text-rose-500" />
    }
  ];

  // Auto-advance simulated playback timer
  useEffect(() => {
    let interval: any;
    if (isOpen && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= totalDuration) {
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, totalDuration]);

  // Sync active chapter with current playback time
  useEffect(() => {
    const idx = chapters.findIndex((ch, i) => {
      const nextCh = chapters[i + 1];
      if (nextCh) {
        return currentTime >= ch.seconds && currentTime < nextCh.seconds;
      }
      return currentTime >= ch.seconds;
    });
    if (idx !== -1) {
      setActiveChapterIndex(idx);
    }
  }, [currentTime]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  // MINI-PLAYER DOCKED MODE (FLOATING IN CORNER)
  if (isDocked) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#0F172A] text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* VIDEO HEADER */}
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate text-slate-200">{currentChapter.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {onToggleDock && (
              <button 
                onClick={onToggleDock}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Expand video"
              >
                <Maximize2 size={13} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* COMPACT VIDEO CANVAS */}
        <div className="relative aspect-video bg-[#020617] flex flex-col items-center justify-center p-3 text-center overflow-hidden">
          {/* ANIMATED PULSE BACKGROUND */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-slate-900 to-emerald-900/20 opacity-80" />
          
          <div className="relative z-10 space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              {currentChapter.icon}
            </div>
            <p className="text-[11px] font-semibold text-white leading-tight">
              {currentChapter.title}
            </p>
            <span className="text-[9px] font-mono text-emerald-400 block">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {/* PLAY/PAUSE OVERLAY BUTTON */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute bottom-2 left-2 z-20 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition cursor-pointer"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
          </button>
        </div>

        {/* PROGRESS SCRUBBER */}
        <div className="w-full bg-slate-800 h-1 cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          setCurrentTime(clickPos * totalDuration);
        }}>
          <div 
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // FULL WORKSPACE VIDEO MODAL
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP BAR */}
        <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Play size={14} className="fill-white ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                YuBiFLo MSME Workspace Walkthrough
                <span className="text-[10px] font-mono px-2 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                  HD Interactive Guide
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Operating a Kenyan FMCG Duka: Dawn Float Check, Voice VCR &amp; Cashflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleDock && (
              <button
                onClick={onToggleDock}
                className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                title="Dock to bottom corner"
              >
                <Minimize2 size={13} />
                <span className="hidden sm:inline">Dock mini-player</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN VIDEO PLAYER + CHAPTERS SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
          
          {/* VIDEO DISPLAY SCREEN (2 COLS) */}
          <div className="lg:col-span-2 bg-[#020617] flex flex-col justify-between relative group select-none overflow-hidden">
            
            {/* SIMULATED DUKA VIDEO PLAYBACK SCREEN */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
              
              {/* VIDEO AMBIENCE BACKGROUND */}
              <div className="absolute inset-0 bg-radial from-blue-900/25 via-[#020617] to-black opacity-90" />
              
              {/* LIVE SIMULATED VIDEO GRAPHIC */}
              <div className="relative z-10 max-w-md w-full space-y-4">
                
                {/* DUKA STAGE CARD */}
                <div className="bg-[#0B1420]/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-left space-y-3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">
                        {currentChapter.id}
                      </div>
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                        {currentChapter.tag}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Simulating Live Action
                    </span>
                  </div>

                  {/* ACTIVE SCENE ILLUSTRATION */}
                  <div className="space-y-2">
                    <h4 className="text-base font-serif font-bold text-white">
                      {currentChapter.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {currentChapter.description}
                    </p>
                  </div>

                  {/* DYNAMIC TELEMETRY CHIPS */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Verified Hardware</span>
                      <strong className="text-emerald-400">Till 892041 Synced</strong>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Kenya Data Act</span>
                      <strong className="text-cyan-400">Zero Audio Storage</strong>
                    </div>
                  </div>
                </div>

                {/* VIDEO CAPTION SUBTITLE */}
                <div className="p-2.5 bg-black/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono inline-block">
                  <span className="text-amber-400 font-bold mr-2">NARRATOR:</span>
                  <span>"{currentChapter.description}"</span>
                </div>
              </div>
            </div>

            {/* VIDEO CONTROLS BAR */}
            <div className="bg-slate-900/90 border-t border-slate-800 p-3 space-y-2">
              
              {/* TIMELINE SCRUBBER */}
              <div 
                className="w-full bg-slate-800 hover:bg-slate-700 h-2 rounded-full cursor-pointer relative overflow-hidden transition-colors"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickRatio = (e.clientX - rect.left) / rect.width;
                  setCurrentTime(clickRatio * totalDuration);
                }}
              >
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>

              {/* BUTTONS ROW */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 fill-white" />}
                  </button>

                  <button
                    onClick={() => setCurrentTime(0)}
                    className="p-1.5 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                    title="Restart from beginning"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  <span className="text-[11px] font-mono text-slate-400">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* SPEED SELECTOR */}
                  <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    {[1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${playbackSpeed === speed ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800">
                    1080p 60fps
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* CHAPTERS SIDEBAR (1 COL) */}
          <div className="bg-[#0B131F] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Guide Chapters ({chapters.length})
                </span>
                <span className="text-[11px] font-mono text-blue-400">
                  {formatTime(totalDuration)} Total
                </span>
              </div>

              {/* CHAPTER CARDS LIST */}
              <div className="mt-3 space-y-2">
                {chapters.map((ch, idx) => {
                  const isActive = activeChapterIndex === idx;
                  const isCompleted = currentTime >= ch.seconds + 30;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setCurrentTime(ch.seconds);
                        setIsPlaying(true);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? "bg-blue-600/20 border border-blue-500/40 text-white"
                          : "hover:bg-slate-800/60 border border-transparent text-slate-300"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                            isActive ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}>
                            {ch.id}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-semibold truncate ${isActive ? "text-blue-300" : "text-white"}`}>
                            {ch.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {ch.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {ch.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CALLOUT AT BOTTOM */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 mt-4 space-y-1">
              <strong className="text-white block font-serif">Try it in your duka:</strong>
              <p className="text-slate-400 text-[10px]">
                You can count your morning float in <strong>Dawn Lock</strong>, test voice phrases in <strong>The Voice Ledger</strong>, or record a customer in <strong>Customer Deni</strong>.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
