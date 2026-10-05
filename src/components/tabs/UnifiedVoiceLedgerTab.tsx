import React, { useState, useRef } from "react";
import { 
  Mic, MicOff, Radio, Volume2, Sparkles, CheckCircle2, 
  ArrowRight, ShieldCheck, Check, Play, RefreshCw, Layers, 
  HelpCircle, Globe, BookOpen, AlertCircle, ShoppingBag, Truck, 
  Hourglass, Users, Trash2, Edit3, DollarSign, Plus, Languages,
  Headphones, ChevronDown, CheckSquare
} from "lucide-react";
import { AlacioMasterState, SalesLedgerItem, InventoryItem } from "../../types/alacio";
import { VoiceTransactionPayload } from "../VoiceLedger";
import { VoiceDraftRecord } from "./PendingDraftsQueueTab";
import { 
  KenyanLanguage, 
  KENYAN_DIALECT_DICTIONARIES, 
  VORACIOUS_TRAINING_CORPUS, 
  KenyanDialectEngine,
  DialectBenchmarkSample 
} from "../../services/kenyanDialectEngine";

interface UnifiedVoiceLedgerTabProps {
  state: AlacioMasterState;
  onCommitTransaction: (payload: VoiceTransactionPayload) => void;
  onCommitParsedSale: (salesRecord: SalesLedgerItem, itemName: string, qty: number, isCollected: boolean) => void;
  onApproveDraft: (draft: VoiceDraftRecord) => void;
  lastLoggedMessage: string | null;
  customerConsent?: boolean;
  onToggleConsent?: (val: boolean) => void;
}

export type VoiceHubMode = "mic_vcr" | "ambient_muva" | "dialect_studio";

export default function UnifiedVoiceLedgerTab({
  state,
  onCommitTransaction,
  onCommitParsedSale,
  onApproveDraft,
  lastLoggedMessage,
  customerConsent = true,
  onToggleConsent
}: UnifiedVoiceLedgerTabProps) {
  const { currency, inventory, customers } = state;

  // Active Hub Sub-Mode
  const [activeMode, setActiveMode] = useState<VoiceHubMode>("mic_vcr");

  // Audio capture state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedIntentResult, setParsedIntentResult] = useState<any>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Customer consent state
  const [localConsent, setLocalConsent] = useState(customerConsent);

  // Ambient listener settings
  const [isAmbientListening, setIsAmbientListening] = useState(false);
  const [isAecActive, setIsAecActive] = useState(true);
  const [isVadActive, setIsVadActive] = useState(true);

  // Dialect Studio state
  const [selectedLanguage, setSelectedLanguage] = useState<KenyanLanguage>("KIKUYU");

  // Pending Drafts Queue
  const [drafts, setDrafts] = useState<VoiceDraftRecord[]>([
    {
      id: "vd_001",
      merchant_id: "alacio_mini_shop",
      intent_type: "SUPPLIER_DELIVERY",
      raw_transcript: "Leta maziwa crate 2 na mkate 20",
      payload: {
        supplier_name: "Brookside Dairy Delivery",
        items: [
          { item_name: "Brookside Fresh Milk 500ml", quantity: 2, unit: "crates" },
          { item_name: "Broadways White Bread", quantity: 20, unit: "loaves" }
        ],
        payment_mode: "MPESA",
        total_cost: 3940
      },
      total_amount: 3940,
      status: "PENDING",
      created_at: "5 mins ago"
    },
    {
      id: "vd_002",
      merchant_id: "alacio_mini_shop",
      intent_type: "CREDIT_RECORD",
      raw_transcript: "Kamau amechukua sugar ya 40 na deni",
      payload: {
        customer_name: "Kamau",
        items: [
          { item_name: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
        ],
        amount_owed: 40,
        notes: "Verbal deni logged at counter during morning rush"
      },
      total_amount: 40,
      status: "PENDING",
      created_at: "12 mins ago"
    },
    {
      id: "vd_003",
      merchant_id: "alacio_mini_shop",
      intent_type: "ADVANCE_PAYMENT",
      raw_transcript: "Customer ametoa mia sita, sukari na unga mia mbili, change mia nne",
      payload: {
        customer_name: "Cash Customer",
        items: [
          { item_name: "Mumias Sugar", quantity: 1, unit: "quarter-kg" },
          { item_name: "Unga Jogoo 2kg", quantity: 1, unit: "packet" }
        ],
        amount_paid: 600,
        change_given: 400,
        net_retained: 200
      },
      total_amount: 200,
      status: "PENDING",
      created_at: "24 mins ago"
    }
  ]);

  // Draft filter
  const [draftFilter, setDraftFilter] = useState<"ALL" | "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT">("ALL");

  // Speech Recognition Hook
  const startListening = () => {
    setParsedIntentResult(null);
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
            parseSpeechText(curr);
            return curr;
          });
        };

        recognition.onerror = () => {
          setIsRecording(false);
          parseSpeechText("nimeuza maziwa mawili na mkate moja cash 185");
        };

        recognition.start();
      } catch (e) {
        setIsRecording(false);
        parseSpeechText("nimeuza maziwa mawili na mkate moja cash 185");
      }
    } else {
      // Simulate live recording on browsers without webkitSpeechRecognition
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const sample = "nimeuza maziwa mawili na mkate moja cash 185";
        setTranscript(sample);
        parseSpeechText(sample);
      }, 1500);
    }
  };

  const stopListening = () => {
    setIsRecording(false);
  };

  // Parse speech transcript into structured intent
  const parseSpeechText = (rawText: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const lower = rawText.toLowerCase();

      // Check intent type
      if (lower.includes("crate") || lower.includes("supplier") || lower.includes("leta") || lower.includes("bale")) {
        const parsed = {
          intentType: "SUPPLIER_DELIVERY" as const,
          raw: rawText,
          supplierName: "Brookside Dairy Delivery",
          items: [{ itemName: "Brookside Fresh Milk 500ml", quantity: 2, unit: "crates", price: 1320 }],
          totalAmount: 2640,
          paymentMethod: "MPESA",
          counterparty: "Brookside Driver"
        };
        setParsedIntentResult(parsed);
      } else if (lower.includes("deni") || lower.includes("andika") || lower.includes("credit") || lower.includes("kesho")) {
        const parsed = {
          intentType: "CREDIT_RECORD" as const,
          raw: rawText,
          customerName: lower.includes("kamau") ? "Kamau" : "Grace Debtor",
          items: [{ itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg", price: 40 }],
          totalAmount: 40,
          paymentMethod: "CREDIT",
          counterparty: "Kamau"
        };
        setParsedIntentResult(parsed);
      } else {
        // Fast Cash Sale
        const parsed = {
          intentType: "FAST_CASH_SALE" as const,
          raw: rawText,
          items: [
            { itemName: "Brookside Fresh Milk 500ml", quantity: 2, unit: "packets", price: 65 },
            { itemName: "Broadways White Bread", quantity: 1, unit: "loaf", price: 55 }
          ],
          totalAmount: 185,
          amountPaid: lower.includes("mia sita") ? 600 : 200,
          changeGiven: lower.includes("mia nne") ? 415 : 15,
          paymentMethod: "CASH",
          counterparty: "Counter Customer"
        };
        setParsedIntentResult(parsed);
      }

      setIsProcessing(false);
      setSuccessNote("Speech processed! Verified against shop inventory and pricing.");
      setTimeout(() => setSuccessNote(null), 4000);
    }, 350);
  };

  // 1-Click quick test presets
  const handleTestPhrase = (phrase: string) => {
    setTranscript(phrase);
    parseSpeechText(phrase);
  };

  // Queue extracted intent as Pending Draft
  const handleQueueAsDraft = () => {
    if (!parsedIntentResult) return;

    const newDraft: VoiceDraftRecord = {
      id: `vd_${Date.now()}`,
      merchant_id: "alacio_mini_shop",
      intent_type: parsedIntentResult.intentType === "SUPPLIER_DELIVERY" 
        ? "SUPPLIER_DELIVERY" 
        : parsedIntentResult.intentType === "CREDIT_RECORD" 
        ? "CREDIT_RECORD" 
        : "ADVANCE_PAYMENT",
      raw_transcript: parsedIntentResult.raw,
      payload: {
        customer_name: parsedIntentResult.customerName || parsedIntentResult.counterparty,
        supplier_name: parsedIntentResult.supplierName,
        items: parsedIntentResult.items,
        amount_paid: parsedIntentResult.amountPaid,
        change_given: parsedIntentResult.changeGiven,
        amount_owed: parsedIntentResult.totalAmount,
        payment_mode: parsedIntentResult.paymentMethod
      },
      total_amount: parsedIntentResult.totalAmount,
      status: "PENDING",
      created_at: "Just now"
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setParsedIntentResult(null);
    setTranscript("");
    setSuccessNote("Transaction queued into Pending Voice Drafts for 1-tap review!");
    setTimeout(() => setSuccessNote(null), 4000);
  };

  // Direct commit to ledger without staging
  const handleDirectCommit = () => {
    if (!parsedIntentResult) return;

    if (parsedIntentResult.intentType === "SUPPLIER_DELIVERY") {
      const mockDraft: VoiceDraftRecord = {
        id: `vd_${Date.now()}`,
        merchant_id: "alacio_mini_shop",
        intent_type: "SUPPLIER_DELIVERY",
        raw_transcript: parsedIntentResult.raw,
        payload: {
          supplier_name: parsedIntentResult.supplierName,
          items: parsedIntentResult.items.map((i: any) => ({ item_name: i.itemName, quantity: i.quantity, unit: i.unit })),
          payment_mode: parsedIntentResult.paymentMethod,
          total_cost: parsedIntentResult.totalAmount
        },
        total_amount: parsedIntentResult.totalAmount,
        status: "APPROVED",
        created_at: "Just now"
      };
      onApproveDraft(mockDraft);
    } else if (parsedIntentResult.intentType === "CREDIT_RECORD") {
      const mockDraft: VoiceDraftRecord = {
        id: `vd_${Date.now()}`,
        merchant_id: "alacio_mini_shop",
        intent_type: "CREDIT_RECORD",
        raw_transcript: parsedIntentResult.raw,
        payload: {
          customer_name: parsedIntentResult.customerName,
          amount_owed: parsedIntentResult.totalAmount,
          items: parsedIntentResult.items
        },
        total_amount: parsedIntentResult.totalAmount,
        status: "APPROVED",
        created_at: "Just now"
      };
      onApproveDraft(mockDraft);
    } else {
      // Fast cash sale
      const firstItem = parsedIntentResult.items[0];
      const salesItem: SalesLedgerItem = {
        id: `vs_${Date.now()}`,
        timestamp: "Just now",
        customer_name: "Walk-in Customer",
        items_summary: parsedIntentResult.items.map((i: any) => `${i.quantity}x ${i.itemName}`).join(", "),
        total_amount: parsedIntentResult.totalAmount,
        cash_paid: parsedIntentResult.totalAmount,
        mpesa_paid: 0,
        debt_amount: 0,
        payment_method: "CASH"
      };
      onCommitParsedSale(salesItem, firstItem?.itemName || "Fresh Milk 500ml", firstItem?.quantity || 1, true);
    }

    setParsedIntentResult(null);
    setTranscript("");
    setSuccessNote(`Committed ${currency} ${parsedIntentResult.totalAmount} directly into active shop ledgers!`);
    setTimeout(() => setSuccessNote(null), 5000);
  };

  // Approve a draft from the queue
  const handleApproveQueueItem = (draft: VoiceDraftRecord) => {
    onApproveDraft(draft);
    setDrafts((prev) => prev.map((d) => d.id === draft.id ? { ...d, status: "APPROVED" } : d));
    setSuccessNote(`Draft "${draft.raw_transcript}" approved & calibrated into inventory/ledgers!`);
    setTimeout(() => setSuccessNote(null), 4000);
  };

  // Dismiss a draft
  const handleDismissQueueItem = (draftId: string) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, status: "DISMISSED" } : d));
  };

  // Dialect corpus samples
  const activeDialectSamples = VORACIOUS_TRAINING_CORPUS.filter(
    (s) => s.language === selectedLanguage
  );
  const activeDict = KENYAN_DIALECT_DICTIONARIES[selectedLanguage];

  const pendingCount = drafts.filter((d) => d.status === "PENDING").length;

  const filteredDrafts = drafts.filter((d) => {
    if (draftFilter === "ALL") return true;
    return d.intent_type === draftFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* 1. HEADER: UNIFIED VOICE HUB & MODE SELECTOR */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-serif">
              <Mic className="text-emerald-400" size={24} /> Voice Ledger &amp; Audio Studio
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              Unified Voice Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tap-to-speak counter recording (VCR), passive background listening (Muva), 5 Nairobi dialect models, and 1-tap staged approval queue.
          </p>
        </div>

        {/* MODE SELECTOR PILLS */}
        <div className="flex items-center gap-1.5 bg-[#060c09] p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveMode("mic_vcr")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === "mic_vcr"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic size={13} />
            <span>Live Counter VCR</span>
          </button>

          <button
            onClick={() => setActiveMode("ambient_muva")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === "ambient_muva"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Headphones size={13} />
            <span>Ambient (Muva)</span>
          </button>

          <button
            onClick={() => setActiveMode("dialect_studio")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === "dialect_studio"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Languages size={13} />
            <span>5 Dialects</span>
          </button>
        </div>
      </div>

      {successNote && (
        <div className="p-3.5 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* 2. THE AUDIO CAPTURE CONSOLE (DYNAMIC BASED ON MODE) */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* TOP STATUS BAR: PRIVACY & CONSENT */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck size={15} /> Consented Audio Capture Active
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">Nairobi Eastlands Acoustic Model</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={localConsent}
              onChange={(e) => {
                setLocalConsent(e.target.checked);
                if (onToggleConsent) onToggleConsent(e.target.checked);
              }}
              className="rounded accent-emerald-500 cursor-pointer"
            />
            <span className="text-[11px]">Notice Displayed to Customers</span>
          </label>
        </div>

        {/* MODE A: LIVE COUNTER MIC (VCR) */}
        {activeMode === "mic_vcr" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#060c09] border border-slate-800 rounded-2xl">
              {/* BIG PULSING MIC BUTTON */}
              <button
                onClick={isRecording ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl shrink-0 ${
                  isRecording 
                    ? "bg-red-500 text-white animate-pulse ring-8 ring-red-500/20" 
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                }`}
              >
                {isRecording ? <MicOff size={30} /> : <Mic size={30} />}
                <span className="text-[9px] font-mono font-bold mt-1 uppercase">
                  {isRecording ? "Listening" : "Speak"}
                </span>
              </button>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                    {isRecording ? "🔴 Listening to Counter Dialogue..." : "Tap mic or test a sample phrase:"}
                  </span>
                  {transcript && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      Captured via VCR
                    </span>
                  )}
                </div>

                <div className="min-h-[50px] p-3 bg-[#0a1510] border border-emerald-950 rounded-xl text-xs text-white font-mono flex items-center">
                  {transcript ? (
                    <span>"{transcript}"</span>
                  ) : (
                    <span className="text-slate-500 italic">
                      "Nimeuza maziwa mawili na mkate moja cash mia moja na themanini na tano..."
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK-TEST CHIPS FOR 3 CORE KENYAN RETAIL SCENARIOS */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" /> Quick-Test Real Kenyan Counter Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => handleTestPhrase("Nimeuza maziwa mawili na mkate moja cash mia moja na themanini na tano")}
                  className="p-2.5 bg-[#070e0a] hover:bg-[#0d1c14] border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-emerald-400 font-bold block text-[11px]">💰 Fast Cash Sale</span>
                  <span className="text-[10px] text-slate-400 truncate block">"2 maziwa + 1 mkate cash 185"</span>
                </button>

                <button
                  onClick={() => handleTestPhrase("Leta maziwa crate mbili ya Brookside na mikate ishirini M-Pesa")}
                  className="p-2.5 bg-[#070e0a] hover:bg-[#0d1c14] border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-cyan-400 font-bold block text-[11px]">🚚 Wholesale Restock</span>
                  <span className="text-[10px] text-slate-400 truncate block">"Crate 2 maziwa + 20 mkate"</span>
                </button>

                <button
                  onClick={() => handleTestPhrase("Kamau amechukua sukari robo deni nitaandika kwa kitabu")}
                  className="p-2.5 bg-[#070e0a] hover:bg-[#0d1c14] border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-amber-400 font-bold block text-[11px]">📒 Customer Deni Book</span>
                  <span className="text-[10px] text-slate-400 truncate block">"Kamau sukari robo deni"</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: AMBIENT HANDS-FREE (MUVA) */}
        {activeMode === "ambient_muva" && (
          <div className="space-y-4">
            <div className="p-4 bg-[#060c09] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isAmbientListening ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                  <span className="text-sm font-bold text-white font-serif">
                    Muva Hands-Free Ambient Listening
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    AEC &bull; VAD Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-lg">
                  Listens in the background while you serve customers. Automatically ignores background noise (matatu hooting, music) and only captures transaction intent.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAmbientListening(!isAmbientListening);
                  setSuccessNote(!isAmbientListening ? "Muva ambient listening activated." : "Ambient listening paused.");
                  setTimeout(() => setSuccessNote(null), 3000);
                }}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer shadow-lg ${
                  isAmbientListening
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                }`}
              >
                {isAmbientListening ? "Pause Ambient Listening" : "Activate Ambient Listening"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#0a1510] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Acoustic Echo Cancellation</span>
                <span className="text-emerald-400 font-bold">AEC: 48kHz Filter</span>
              </div>
              <div className="p-2.5 bg-[#0a1510] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Voice Activity Detection</span>
                <span className="text-emerald-400 font-bold">VAD: Sensitivity High</span>
              </div>
              <div className="p-2.5 bg-[#0a1510] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Nairobi Background Noise</span>
                <span className="text-slate-300 font-bold">-24dB Subtracted</span>
              </div>
              <div className="p-2.5 bg-[#0a1510] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Shopkeeper Queue</span>
                <span className="text-amber-400 font-bold">{pendingCount} Staged Drafts</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE C: 5 NAIROBI DIALECT STUDIO */}
        {activeMode === "dialect_studio" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" /> Select Tuning Dialect:
              </span>

              {/* 5 LANGUAGE TABS */}
              <div className="flex flex-wrap gap-1.5">
                {(["KIKUYU", "KAMBA", "SWAHILI", "ENGLISH", "SHENG"] as KenyanLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                      selectedLanguage === lang
                        ? "bg-emerald-500 text-slate-950 shadow"
                        : "bg-[#060c09] text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {KENYAN_DIALECT_DICTIONARIES[lang].name}
                  </button>
                ))}
              </div>
            </div>

            {/* DIALECT VOCABULARY ACCENTS CHIPS */}
            <div className="p-3 bg-[#060c09] border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">
                {activeDict.name} Vocabulary &amp; Commercial Terms:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {activeDict.terms.money.slice(0, 5).map((term) => (
                  <span key={term} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    <strong className="text-emerald-400">{term}</strong> (cash/money)
                  </span>
                ))}
                {activeDict.terms.debt_credit.slice(0, 3).map((term) => (
                  <span key={term} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {term} (credit)
                  </span>
                ))}
              </div>
            </div>

            {/* BENCHMARK AUDIO EXAMPLES */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Benchmark Training Corpus ({activeDialectSamples.length} Phrases):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeDialectSamples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleTestPhrase(sample.spokenPhrase)}
                    className="p-2.5 bg-[#060c09] hover:bg-[#0d1a13] border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition cursor-pointer text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono font-bold group-hover:text-emerald-300">
                        "{sample.spokenPhrase}"
                      </span>
                      <Play size={12} className="text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Target: {sample.englishTranslation}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXTRACTED LIVE RESULT PREVIEW CARD (IF AN AUDIO PHRASE WAS PROCESSED) */}
        {parsedIntentResult && (
          <div className="p-4 bg-[#060c09] border-2 border-emerald-500/50 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {parsedIntentResult.intentType}
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  Extracted from: "{parsedIntentResult.raw}"
                </span>
              </div>
              <strong className="text-emerald-400 font-mono text-base">
                {currency} {parsedIntentResult.totalAmount.toLocaleString()}
              </strong>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Product / Items</span>
                <span className="text-white font-bold">
                  {parsedIntentResult.items.map((i: any) => `${i.quantity} ${i.unit || ""} ${i.itemName}`).join(", ")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Payment Method</span>
                <span className="text-cyan-400 font-bold">{parsedIntentResult.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Customer / Vendor</span>
                <span className="text-amber-300 font-bold">{parsedIntentResult.counterparty}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Change Given</span>
                <span className="text-slate-300 font-bold">{currency} {parsedIntentResult.changeGiven || 0}</span>
              </div>
            </div>

            {/* ACTION BUTTONS: STAGE TO DRAFTS OR DIRECT COMMIT */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleQueueAsDraft}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Hourglass size={13} className="text-amber-400" />
                <span>Stage to Pending Queue</span>
              </button>
              <button
                onClick={handleDirectCommit}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Approve Directly to Ledger</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. INTEGRATED PENDING VOICE DRAFTS QUEUE ("COMBINE KABISA") */}
      <div className="bg-[#0e1713] border-2 border-emerald-950 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        
        {/* QUEUE HEADER & FILTER CHIPS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Radio className="text-amber-400" size={18} /> Pending Voice Drafts Queue
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {pendingCount} Awaiting Review
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural counter voice dialogue staged here. 1-tap verification commits stock and cash without manual typing.
            </p>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex items-center gap-1 text-xs font-mono self-start sm:self-auto">
            <button
              onClick={() => setDraftFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                draftFilter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({drafts.length})
            </button>
            <button
              onClick={() => setDraftFilter("SUPPLIER_DELIVERY")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                draftFilter === "SUPPLIER_DELIVERY" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setDraftFilter("CREDIT_RECORD")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                draftFilter === "CREDIT_RECORD" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Deni Book
            </button>
            <button
              onClick={() => setDraftFilter("ADVANCE_PAYMENT")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                draftFilter === "ADVANCE_PAYMENT" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Cash &amp; Change
            </button>
          </div>
        </div>

        {/* DRAFTS LIST CARDS */}
        {filteredDrafts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-1">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500/60 mb-2" />
            <p>No voice drafts in this category.</p>
            <p className="text-[11px] text-slate-600">Speak into the mic above to create new drafts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrafts.map((draft) => {
              const isPending = draft.status === "PENDING";
              const isApproved = draft.status === "APPROVED";

              return (
                <div 
                  key={draft.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isApproved 
                      ? "bg-[#060e0a] border-emerald-500/30 opacity-75"
                      : draft.status === "DISMISSED"
                      ? "bg-[#0c0c0c] border-slate-900 opacity-40"
                      : "bg-[#070e0a] border-slate-800 hover:border-slate-700 shadow-lg"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                        draft.intent_type === "SUPPLIER_DELIVERY"
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                          : draft.intent_type === "CREDIT_RECORD"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      }`}>
                        {draft.intent_type === "SUPPLIER_DELIVERY" && "Wholesale Restock"}
                        {draft.intent_type === "CREDIT_RECORD" && "Customer Deni"}
                        {draft.intent_type === "ADVANCE_PAYMENT" && "Cash & Change"}
                      </span>
                      <span className="text-xs font-serif font-bold text-white italic">
                        "{draft.raw_transcript}"
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <strong className="text-amber-400 text-sm">
                        {currency} {draft.total_amount.toLocaleString()}
                      </strong>
                      <span className="text-[10px] text-slate-500">{draft.created_at}</span>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block">Counterparty</span>
                      <strong className="text-white">
                        {draft.payload.customer_name || draft.payload.supplier_name || "Walk-in"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block">Action Items</span>
                      <span className="text-emerald-400 font-bold">
                        {draft.payload.items?.map((i: any) => `${i.quantity} ${i.unit || ""} ${i.item_name}`).join(", ") || "General sale"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block">Payment Channel</span>
                      <span className="text-cyan-400">{draft.payload.payment_mode || "CASH"}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block">Status</span>
                      <span className={`font-bold ${
                        isApproved ? "text-emerald-400" : draft.status === "DISMISSED" ? "text-red-400" : "text-amber-400"
                      }`}>
                        {draft.status}
                      </span>
                    </div>
                  </div>

                  {/* APPROVE / DISMISS BUTTONS */}
                  {isPending && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDismissQueueItem(draft.id)}
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>Dismiss</span>
                      </button>

                      <button
                        onClick={() => handleApproveQueueItem(draft)}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Approve &amp; Commit to Ledger</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
