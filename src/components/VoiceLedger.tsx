import React, { useState } from "react";
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Volume2
} from "lucide-react";

export interface VoiceTransactionPayload {
  intent: string;
  customer: string;
  items: Array<{
    name: string;
    qty: number;
    unit: string;
    subtotal: number;
  }>;
  cashPaid: number;
  mpesaPaid: number;
  debtAmount: number;
  total: number;
}

interface VoiceLedgerProps {
  currency?: string;
  onLogTransaction?: (payload: VoiceTransactionPayload) => void;
}

export default function VoiceLedger({ currency = "KSh", onLogTransaction }: VoiceLedgerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<VoiceTransactionPayload | null>(null);

  // Initialize SpeechRecognition if supported by browser
  const startListening = () => {
    setParsedPayload(null);
    setTranscript("");

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-KE"; // Supports Kenyan English / regional phonetics
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsRecording(true);

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onend = () => {
          setIsRecording(false);
          // Use latest transcript from state or event
          setTranscript((curr) => {
            processSpokenText(curr);
            return curr;
          });
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch {
        // Fallback simulation
        runSimulation();
      }
    } else {
      // Prototyping simulation if browser has mic permissions restricted
      runSimulation();
    }
  };

  const runSimulation = () => {
    setIsRecording(true);
    setTimeout(() => {
      const sampleText = "Mama Boi packet mbili za maziwa na mkate, amelipa cash 150, deni 35";
      setTranscript(sampleText);
      setIsRecording(false);
      processSpokenText(sampleText);
    }, 2000);
  };

  // Simulated AI NLP Parser (Gemini structured extraction mock)
  const processSpokenText = (text: string) => {
    if (!text) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Intelligent rule-based parsing simulation
      const lower = text.toLowerCase();
      const hasDeni = lower.includes("deni") || lower.includes("debt");
      const customerMatch = text.match(/(mama \w+|\w+)/i);

      setParsedPayload({
        intent: lower.includes("leta") || lower.includes("restock") ? "RESTOCK" : "SALE",
        customer: customerMatch ? customerMatch[0] : "Walk-in Customer",
        items: [
          { name: "Milk 500ml", qty: 2, unit: "packets", subtotal: 120 },
          { name: "Festive Bread 400g", qty: 1, unit: "loaves", subtotal: 65 }
        ],
        cashPaid: 150,
        mpesaPaid: 0,
        debtAmount: hasDeni ? 35 : 0,
        total: 185
      });
      setIsProcessing(false);
    }, 900);
  };

  const handleConfirm = () => {
    if (onLogTransaction && parsedPayload) {
      onLogTransaction(parsedPayload);
    }
    setParsedPayload(null);
    setTranscript("");
  };

  return (
    <div className="bg-[#121822] border border-slate-800 rounded-2xl p-6 font-sans text-slate-200 space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Volume2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              YuBiFlo Voice Ledger <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Sheng / Swahili Ingestion</span>
            </h3>
            <p className="text-[11px] text-slate-400">Speak transactions naturally during rush hour. AI structures the ledger entry.</p>
          </div>
        </div>

        {/* MIC BUTTON */}
        <button
          onClick={startListening}
          disabled={isRecording || isProcessing}
          className={`relative p-3.5 rounded-full font-bold transition-all shadow-lg cursor-pointer ${
            isRecording 
              ? "bg-red-500 text-white animate-pulse shadow-red-500/30 scale-110" 
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
          }`}
          title="Click to speak transaction"
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* SPOKEN TRANSCRIPT PREVIEW */}
      <div className="p-3.5 bg-[#0a0d12] border border-slate-800 rounded-xl min-h-[50px] flex items-center justify-between text-xs">
        <div className="text-slate-300 font-mono">
          {isRecording && <span className="text-emerald-400 animate-pulse">Listening to Sheng/Swahili speech...</span>}
          {!isRecording && !transcript && <span className="text-slate-500 italic">Tap the mic and speak: "Mama Boi packet mbili za maziwa, amelipa 100, deni 20..."</span>}
          {!isRecording && transcript && <span>"{transcript}"</span>}
        </div>
        {isProcessing && <RefreshCw size={14} className="text-emerald-400 animate-spin" />}
      </div>

      {/* AI PARSED CARD (ONE-CLICK AUDIT BEFORE SAVING) */}
      {parsedPayload && (
        <div className="bg-[#151c27] border border-emerald-500/30 rounded-xl p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={13} /> Extracted Ledger Entry
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Party: <strong className="text-white">{parsedPayload.customer}</strong>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-slate-400 text-[11px]">Items Detected:</div>
            {parsedPayload.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#0e1218] p-2 rounded border border-slate-800 font-mono">
                <span className="text-slate-200">{it.qty} {it.unit} - {it.name}</span>
                <span className="font-bold text-white">{currency} {it.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-slate-500 block">Total Sale</span>
              <span className="font-bold text-white">{currency} {parsedPayload.total}</span>
            </div>
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-emerald-400 block">Cash Paid</span>
              <span className="font-bold text-emerald-400">{currency} {parsedPayload.cashPaid}</span>
            </div>
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-red-400 block">Logged Deni</span>
              <span className="font-bold text-red-400">{currency} {parsedPayload.debtAmount}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button 
              onClick={() => setParsedPayload(null)} 
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Discard
            </button>
            <button 
              onClick={handleConfirm} 
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Commit to Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
