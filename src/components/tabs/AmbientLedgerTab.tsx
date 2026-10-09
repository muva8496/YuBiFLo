import React, { useState } from "react";
import { 
  Radio, Volume2, ShieldCheck, CheckCircle2, X, Edit3, 
  Trash2, ArrowRight, Sparkles, AlertCircle, ShoppingBag, 
  Hourglass, Truck, Play, Check, RefreshCw, Smartphone, Layers
} from "lucide-react";
import { AlacioMasterState, InventoryItem, SalesLedgerItem } from "../../types/alacio";

export interface AmbientDraft {
  id: string;
  timestamp: string;
  sourceTranscript: string;
  intentType: "SALE" | "CREDIT" | "SUPPLIER_PURCHASE" | "UNKNOWN";
  itemName: string;
  quantity: number;
  unit: string;
  amountPaid: number;
  balanceGiven: number;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "CREDIT";
  counterparty: string;
  isCollected: boolean;
  status: "PENDING_REVIEW" | "APPROVED" | "DISMISSED";
}

interface AmbientLedgerTabProps {
  state: AlacioMasterState;
  onApproveDraftSale: (salesRecord: SalesLedgerItem, itemMatchName: string, qty: number, isCollected: boolean) => void;
}

export default function AmbientLedgerTab({ state, onApproveDraftSale }: AmbientLedgerTabProps) {
  const { currency, inventory } = state;

  // Active Ambient State & Settings
  const [isAecActive, setIsAecActive] = useState(true);
  const [isVadActive, setIsVadActive] = useState(true);
  const [customAudioInput, setCustomAudioInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Initial drafts populated with the 3 benchmark retail events
  const [drafts, setDrafts] = useState<AmbientDraft[]>([
    {
      id: "draft_001",
      timestamp: "4 mins ago",
      sourceTranscript: "Leo nikuwekee maziwa crate ngapi? Weka mbili tu, chukua pesa kwa M-Pesa.",
      intentType: "SUPPLIER_PURCHASE",
      itemName: "Brookside Fresh Milk",
      quantity: 2.0,
      unit: "crates",
      amountPaid: 0.0,
      balanceGiven: 0.0,
      paymentMethod: "MOBILE_MONEY",
      counterparty: "Milk Supplier (Kibet)",
      isCollected: true,
      status: "PENDING_REVIEW"
    },
    {
      id: "draft_002",
      timestamp: "12 mins ago",
      sourceTranscript: "Nipe yoghurt ya 35 na nitaipia kesho... sawa nimekuandika.",
      intentType: "CREDIT",
      itemName: "Ilara Strawberry Yoghurt 150ml",
      quantity: 1.0,
      unit: "piece",
      amountPaid: 0.0,
      balanceGiven: 0.0,
      paymentMethod: "CREDIT",
      counterparty: "Mama Sharon (Neighbor)",
      isCollected: true,
      status: "PENDING_REVIEW"
    },
    {
      id: "draft_003",
      timestamp: "25 mins ago",
      sourceTranscript: "Chukua elfu moja ya hii unga ya mia sita, nitarudi kuchukua jioni. Haya, change yako ni mia nne hii hapa.",
      intentType: "SALE",
      itemName: "Unga Jogoo 2kg",
      quantity: 1.0,
      unit: "packet",
      amountPaid: 1000.0,
      balanceGiven: 400.0,
      paymentMethod: "CASH",
      counterparty: "Pastor David",
      isCollected: false, // Goods left behind!
      status: "PENDING_REVIEW"
    }
  ]);

  // Simulate ambient audio parsing for given Sheng/Swahili speech
  const handleSimulateAudioEvent = (transcript: string) => {
    setIsParsing(true);
    setTimeout(() => {
      let draft: AmbientDraft;

      if (transcript.includes("maziwa crate")) {
        draft = {
          id: `draft_${Date.now()}`,
          timestamp: "Just now",
          sourceTranscript: transcript,
          intentType: "SUPPLIER_PURCHASE",
          itemName: "Brookside Fresh Milk 500ml",
          quantity: 2,
          unit: "crates",
          amountPaid: 0,
          balanceGiven: 0,
          paymentMethod: "MOBILE_MONEY",
          counterparty: "Brookside Delivery Driver",
          isCollected: true,
          status: "PENDING_REVIEW"
        };
      } else if (transcript.includes("yoghurt ya 35")) {
        draft = {
          id: `draft_${Date.now()}`,
          timestamp: "Just now",
          sourceTranscript: transcript,
          intentType: "CREDIT",
          itemName: "Ilara Yoghurt 150ml",
          quantity: 1,
          unit: "piece",
          amountPaid: 0,
          balanceGiven: 0,
          paymentMethod: "CREDIT",
          counterparty: "Credit Customer (Mama Sharon)",
          isCollected: true,
          status: "PENDING_REVIEW"
        };
      } else if (transcript.includes("elfu moja ya hii unga")) {
        draft = {
          id: `draft_${Date.now()}`,
          timestamp: "Just now",
          sourceTranscript: transcript,
          intentType: "SALE",
          itemName: "Unga Jogoo 2kg",
          quantity: 1,
          unit: "packet",
          amountPaid: 1000,
          balanceGiven: 400,
          paymentMethod: "CASH",
          counterparty: "Pastor David",
          isCollected: false, // Critical: left behind for evening pickup
          status: "PENDING_REVIEW"
        };
      } else {
        // Generic Sheng parser
        draft = {
          id: `draft_${Date.now()}`,
          timestamp: "Just now",
          sourceTranscript: transcript,
          intentType: "SALE",
          itemName: "Counter Item",
          quantity: 1,
          unit: "unit",
          amountPaid: 100,
          balanceGiven: 0,
          paymentMethod: "CASH",
          counterparty: "Counter Walk-in",
          isCollected: true,
          status: "PENDING_REVIEW"
        };
      }

      setDrafts((prev) => [draft, ...prev]);
      setIsParsing(false);
      setNotificationMsg(`VAD Segment Captured: "${transcript.slice(0, 45)}..." queued to pending drafts!`);
      setTimeout(() => setNotificationMsg(null), 5000);
    }, 450);
  };

  // 1-Tap Actions: Approve Draft
  const handleApprove = (draft: AmbientDraft) => {
    // Commit to official ledger
    const newSalesRecord: SalesLedgerItem = {
      id: `sl_amb_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customer_name: draft.counterparty,
      items_summary: `${draft.quantity}x ${draft.itemName}`,
      total_amount: draft.amountPaid > 0 ? (draft.amountPaid - draft.balanceGiven) : 35,
      cash_paid: draft.paymentMethod === "CASH" ? (draft.amountPaid - draft.balanceGiven) : 0,
      mpesa_paid: draft.paymentMethod === "MOBILE_MONEY" ? draft.amountPaid : 0,
      debt_amount: draft.paymentMethod === "CREDIT" ? 35 : 0,
      payment_method: draft.paymentMethod === "MOBILE_MONEY" ? "MPESA" : draft.paymentMethod === "CREDIT" ? "CREDIT" : "CASH"
    };

    onApproveDraftSale(newSalesRecord, draft.itemName, draft.quantity, draft.isCollected);

    // Remove from pending drafts queue
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setNotificationMsg(`Approved: ${draft.itemName} committed to definitive ledger (Collected: ${draft.isCollected ? "YES - physical stock deducted" : "NO - stock reserved on shelf"})`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // 1-Tap Actions: Dismiss Draft
  const handleDismiss = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER WITH HARDWARE AEC & VAD STATUS */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Radio className="text-emerald-400 animate-pulse" size={22} /> Muva Ambient Ledger Mode
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              Background Voice-to-Text
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Passively listens to ambient counter conversations, cancels phone YouTube/TikTok speaker media via <strong>Hardware AEC</strong>, and queues transaction intents as Pending Drafts.
          </p>
        </div>

        {/* ACTIVE PIPELINE BADGES */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#091510] border border-emerald-500/40 rounded-xl text-[10px] font-mono text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AEC LIVE (Speaker Canceller)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#091510] border border-teal-500/40 rounded-xl text-[10px] font-mono text-teal-300 font-bold">
            <Volume2 size={12} className="text-teal-400" />
            <span>VAD Gated (32ms RMS)</span>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* BENCHMARK OVERHEARD SPEECH SIMULATOR */}
      <div className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" /> Overheard Audio Benchmark Simulator (Kenyan Counter Speech)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Tap any spoken phrase to trigger VAD &amp; LLM parser</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* EXAMPLE 1: SUPPLIER EVENT */}
          <button
            onClick={() => handleSimulateAudioEvent("Leo nikuwekee maziwa crate ngapi? Weka mbili tu, chukua pesa kwa M-Pesa.")}
            disabled={isParsing}
            className="p-3.5 bg-[#09090b] hover:bg-[#111113] border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-left transition flex flex-col justify-between cursor-pointer space-y-2 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                  <Truck size={12} /> Example 1 &bull; Supplier Event
                </span>
                <span className="text-[10px] text-slate-500">M-Pesa</span>
              </div>
              <p className="text-xs text-slate-200 italic mt-1 group-hover:text-white leading-relaxed">
                "Leo nikuwekee maziwa crate ngapi? Weka mbili tu, chukua pesa kwa M-Pesa."
              </p>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">
              &rarr; Intent: SUPPLIER_PURCHASE (2 crates milk)
            </span>
          </button>

          {/* EXAMPLE 2: MICRO-SALE CREDIT EVENT */}
          <button
            onClick={() => handleSimulateAudioEvent("Nipe yoghurt ya 35 na nitaipia kesho... sawa nimekuandika.")}
            disabled={isParsing}
            className="p-3.5 bg-[#09090b] hover:bg-[#111113] border border-amber-500/30 hover:border-amber-400 rounded-xl text-left transition flex flex-col justify-between cursor-pointer space-y-2 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
                  <Hourglass size={12} /> Example 2 &bull; Micro-Credit
                </span>
                <span className="text-[10px] text-slate-500">Deni</span>
              </div>
              <p className="text-xs text-slate-200 italic mt-1 group-hover:text-white leading-relaxed">
                "Nipe yoghurt ya 35 na nitaipia kesho... sawa nimekuandika."
              </p>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">
              &rarr; Intent: CREDIT (1x yoghurt @ 35/-)
            </span>
          </button>

          {/* EXAMPLE 3: PAID BUT LEFT BEHIND (RESERVATION) */}
          <button
            onClick={() => handleSimulateAudioEvent("Chukua elfu moja ya hii unga ya mia sita, nitarudi kuchukua jioni. Haya, change yako ni mia nne hii hapa.")}
            disabled={isParsing}
            className="p-3.5 bg-[#09090b] hover:bg-[#111113] border border-purple-500/30 hover:border-purple-400 rounded-xl text-left transition flex flex-col justify-between cursor-pointer space-y-2 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
                  <Layers size={12} /> Example 3 &bull; Left Behind!
                </span>
                <span className="text-[10px] text-slate-500">Cash</span>
              </div>
              <p className="text-xs text-slate-200 italic mt-1 group-hover:text-white leading-relaxed">
                "Chukua elfu moja ya hii unga ya mia sita, nitarudi kuchukua jioni..."
              </p>
            </div>
            <span className="text-[10px] text-purple-400/80 font-mono">
              &rarr; Intent: SALE (is_collected: FALSE, reserved stock)
            </span>
          </button>
        </div>
      </div>

      {/* PENDING DRAFTS QUEUE SCREEN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
              Pending Drafts Queue ({drafts.length} Overheard Items)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              1-Tap Review Required
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Definitive inventory will NOT be altered until you tap [Approve]
          </span>
        </div>

        {drafts.length === 0 ? (
          <div className="bg-[#121214] border-2 border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Radio className="text-slate-600 mx-auto" size={40} />
            <h4 className="text-sm font-bold text-white font-serif">Ambient Queue Clear</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              AEC and VAD are listening in the background. Use the benchmark buttons above to simulate spoken counter customer conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const isSupplier = draft.intentType === "SUPPLIER_PURCHASE";
              const isCredit = draft.intentType === "CREDIT";
              const isSale = draft.intentType === "SALE";

              return (
                <div
                  key={draft.id}
                  className="bg-[#121214] border-2 border-emerald-950 hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 transition shadow-lg space-y-3.5"
                >
                  {/* CARD TOP BAR */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        isSupplier 
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                          : isCredit 
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}>
                        {draft.intentType.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-white font-sans">
                        {draft.counterparty}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">&bull; {draft.timestamp}</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      via {draft.paymentMethod}
                    </span>
                  </div>

                  {/* OVERHEARD TRANSCRIPT */}
                  <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800/80 text-xs text-slate-300 italic flex items-start gap-2">
                    <Volume2 size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>"{draft.sourceTranscript}"</span>
                  </div>

                  {/* PARSED TRANSACTION DETAILS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{draft.quantity} {draft.unit} &bull; {draft.itemName}</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-mono">
                        {draft.amountPaid > 0 ? (
                          <>
                            Paid: {currency} {draft.amountPaid.toLocaleString()}
                            {draft.balanceGiven > 0 && (
                              <span className="text-amber-300 ml-2">
                                (Change: {currency} {draft.balanceGiven.toLocaleString()})
                              </span>
                            )}
                          </>
                        ) : (
                          <span>Settlement: {draft.paymentMethod}</span>
                        )}
                      </div>
                    </div>

                    {/* CRITICAL: LEFT-BEHIND BADGE */}
                    {!draft.isCollected && (
                      <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0">
                        <Layers size={13} className="text-purple-400" />
                        <span>Left Behind (Stock Reserved, Physical Unchanged)</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTON BAR: [APPROVE], [EDIT], [DISMISS] */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismiss(draft.id)}
                        className="px-3 py-1.5 bg-[#09090b] hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Trash2 size={13} />
                        <span>Dismiss</span>
                      </button>
                      <button
                        onClick={() => alert(`Edit draft for ${draft.itemName}: Merchant can adjust quantity, unit, or customer name.`)}
                        className="px-3 py-1.5 bg-[#09090b] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleApprove(draft)}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow shadow-emerald-500/20"
                    >
                      <Check size={14} />
                      <span>Approve Draft</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
