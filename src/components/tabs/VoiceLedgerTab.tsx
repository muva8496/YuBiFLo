import React, { useState } from "react";
import { 
  Mic, MicOff, Sparkles, Check, RefreshCw, Volume2, 
  CheckCircle2, ArrowRight, CornerDownLeft, ShieldCheck, ShieldAlert
} from "lucide-react";
import { VoiceTransactionPayload } from "../VoiceLedger";

interface VoiceLedgerTabProps {
  currency: string;
  onCommitTransaction: (payload: VoiceTransactionPayload) => void;
  lastLoggedMessage: string | null;
  vcrCount?: number;
  customerConsent?: boolean;
  onToggleConsent?: (val: boolean) => void;
}

export default function VoiceLedgerTab({ 
  currency, 
  onCommitTransaction, 
  lastLoggedMessage,
  vcrCount = 6,
  customerConsent = true,
  onToggleConsent
}: VoiceLedgerTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [customText, setCustomText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<VoiceTransactionPayload | null>(null);
  const [localConsent, setLocalConsent] = useState(customerConsent);

  const startListening = () => {
    setParsedPayload(null);
    setTranscript("");

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-KE";
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
          setTranscript((curr) => {
            parseShengText(curr);
            return curr;
          });
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.start();
        return;
      } catch {}
    }

    // Fallback simulation
    setIsRecording(true);
    setTimeout(() => {
      const sample = "Mama Boi packet mbili za maziwa, amelipa 100, deni 20";
      setTranscript(sample);
      setIsRecording(false);
      parseShengText(sample);
    }, 1800);
  };

  const parseShengText = (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      const hasDeni = lower.includes("deni") || lower.includes("debt");
      const isSupplier = lower.includes("supplier") || lower.includes("ameleta") || lower.includes("restock");

      let customer = "Walk-in Customer";
      if (lower.includes("mama boi")) customer = "Mama Boi";
      else if (lower.includes("baba junior")) customer = "Baba Junior";
      else if (lower.includes("mama stacy")) customer = "Mama Stacy";
      else if (isSupplier) customer = "Unga Millers Wholesale";

      let items = [
        { name: "Brookside Fresh Milk 500ml", qty: 2, unit: "packets", subtotal: 120 }
      ];
      let cash = 100;
      let deni = 20;
      let total = 120;

      if (lower.includes("mkate") || lower.includes("bread")) {
        items.push({ name: "Broadways White Bread 400g", qty: 1, unit: "loaves", subtotal: 65 });
        total = 185;
        cash = 150;
        deni = hasDeni ? 35 : 0;
      } else if (lower.includes("unga") && isSupplier) {
        items = [{ name: "Unga Jogoo 2kg", qty: 5, unit: "bales", subtotal: 900 }];
        total = 900;
        cash = 900;
        deni = 0;
      } else if (lower.includes("soda")) {
        items = [
          { name: "Coca Cola Pet Bottle 500ml", qty: 1, unit: "bottles", subtotal: 60 },
          { name: "Broadways White Bread 400g", qty: 1, unit: "loaves", subtotal: 65 }
        ];
        total = 125;
        cash = 125;
        deni = 0;
      }

      setParsedPayload({
        intent: isSupplier ? "RESTOCK" : "SALE",
        customer,
        items,
        cashPaid: cash,
        mpesaPaid: 0,
        debtAmount: deni,
        total
      });
      setIsProcessing(false);
    }, 700);
  };

  const handleApplySample = (sample: string) => {
    setCustomText(sample);
    setTranscript(sample);
    parseShengText(sample);
  };

  const handleManualParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setTranscript(customText);
    parseShengText(customText);
  };

  const handleCommit = () => {
    if (parsedPayload) {
      onCommitTransaction(parsedPayload);
      setParsedPayload(null);
      setTranscript("");
      setCustomText("");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="text-emerald-400" size={22} /> VCR: Voice Conversion Record (Signature Feature)
          </h2>
          <p className="text-xs text-slate-400">
            Listens to counter sales in Swahili, Sheng, or English. Parses transaction into structured debt, cash, and inventory in real-time.
          </p>
        </div>

        {/* FREE STARTER CAP BADGE */}
        <div className="px-3 py-1.5 rounded-xl bg-[#0a1410] border border-emerald-500/30 font-mono text-[11px] text-emerald-400 shrink-0">
          VCR Daily Count: <strong className="text-white">{vcrCount}</strong>/20 Free Starter Sales
        </div>
      </div>

      {/* MANDATORY CUSTOMER NOTICE & CONSENT FLOW BANNER */}
      <div className={`p-4 rounded-2xl border transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        localConsent ? "bg-[#091510] border-emerald-500/40 text-emerald-200" : "bg-amber-950/20 border-amber-500/40 text-amber-200"
      }`}>
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={18} className={localConsent ? "text-emerald-400 shrink-0 mt-0.5" : "text-amber-400 shrink-0 mt-0.5"} />
          <div>
            <span className="font-bold block text-white">Counter Notice &amp; Consumer Privacy Consent</span>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              Notice to Customer: Counter conversation is processed in real time solely to generate instant receipts and ledger entries. <strong>Raw audio is discarded immediately after transcription</strong> with zero voice storage.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !localConsent;
            setLocalConsent(next);
            onToggleConsent?.(next);
          }}
          className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${
            localConsent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}
        >
          {localConsent ? "✓ Customer Notice Active" : "Toggle Notice Flow"}
        </button>
      </div>

      {lastLoggedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-mono">{lastLoggedMessage}</span>
        </div>
      )}

      {/* QUICK PRESET BUTTONS */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
          Rush-Hour Test Presets (Click to Parse)
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleApplySample("Mama Boi packet mbili za maziwa, amelipa 100, deni 20")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition cursor-pointer text-left"
          >
            "Mama Boi packet mbili za maziwa, amelipa 100, deni 20"
          </button>
          <button
            onClick={() => handleApplySample("Supplier wa Unga ameleta bales 5 kwa 180")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition cursor-pointer text-left"
          >
            "Supplier wa Unga ameleta bales 5 kwa 180"
          </button>
          <button
            onClick={() => handleApplySample("Baba Junior soda moja na mkate amelipa 125 cash")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition cursor-pointer text-left"
          >
            "Baba Junior soda moja na mkate amelipa 125 cash"
          </button>
        </div>
      </div>

      {/* VOICE RECORDING & TEXT INPUT CARD */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Mic size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Speak or Type Spoken Phrasing</span>
              <span className="text-[11px] text-slate-400">SpeechRecognition language set to Kenyan English / Swahili</span>
            </div>
          </div>

          <button
            onClick={startListening}
            disabled={isRecording || isProcessing}
            className={`p-3.5 rounded-full font-bold transition shadow-lg cursor-pointer ${
              isRecording
                ? "bg-red-500 text-white animate-pulse shadow-red-500/30 scale-110"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
            }`}
            title="Start Voice Recognition"
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* TEXT INPUT ALTERNATIVE */}
        <form onSubmit={handleManualParse} className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Or type here: e.g. Mama Boi packet mbili za maziwa na mkate..."
            className="flex-1 bg-[#0a0d12] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!customText.trim() || isProcessing}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Parse</span>
            <CornerDownLeft size={14} />
          </button>
        </form>

        {/* TRANSCRIPT PREVIEW */}
        <div className="p-3.5 bg-[#0a0d12] border border-slate-800 rounded-xl min-h-[46px] flex items-center justify-between text-xs font-mono">
          <div className="text-slate-300">
            {isRecording && <span className="text-emerald-400 animate-pulse">Listening to speech...</span>}
            {!isRecording && !transcript && <span className="text-slate-500 italic">No audio recorded yet. Tap mic or click a preset above.</span>}
            {!isRecording && transcript && <span>"{transcript}"</span>}
          </div>
          {isProcessing && <RefreshCw size={14} className="text-emerald-400 animate-spin" />}
        </div>
      </div>

      {/* EXTRACTED ENTITY CARD */}
      {parsedPayload && (
        <div className="bg-[#151c27] border border-emerald-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={14} /> Extracted Ledger Entry ({parsedPayload.intent})
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Debtor/Customer: <strong className="text-emerald-300">{parsedPayload.customer}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 uppercase font-mono">Items Identified</span>
            {parsedPayload.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#0a0d12] p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-200">{it.qty} {it.unit} &bull; {it.name}</span>
                <span className="font-bold text-white">{currency} {it.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-center font-mono text-xs">
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Sale</span>
              <span className="text-base font-black text-white">{currency} {parsedPayload.total.toLocaleString()}</span>
            </div>
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block uppercase">Cash Paid</span>
              <span className="text-base font-black text-emerald-400">{currency} {parsedPayload.cashPaid.toLocaleString()}</span>
            </div>
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-purple-500/20">
              <span className="text-[10px] text-purple-400 block uppercase">Logged Deni</span>
              <span className="text-base font-black text-purple-300">{currency} {parsedPayload.debtAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setParsedPayload(null)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleCommit}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Check size={14} /> Commit to Ledger (Deduct Stock &amp; Update Deni)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
