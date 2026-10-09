import React, { useState } from "react";
import { 
  Radio, Volume2, ShieldCheck, CheckCircle2, X, Edit3, 
  Trash2, ArrowRight, Sparkles, AlertCircle, ShoppingBag, 
  Hourglass, Truck, Play, Check, Layers, DollarSign, Plus
} from "lucide-react";
import { AlacioMasterState, SalesLedgerItem } from "../../types/alacio";

export interface VoiceDraftRecord {
  id: string;
  merchant_id: string;
  intent_type: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT";
  raw_transcript: string;
  payload: any;
  total_amount: number;
  status: "PENDING" | "APPROVED" | "DISMISSED";
  created_at: string;
}

interface PendingDraftsQueueTabProps {
  state: AlacioMasterState;
  onApproveDraft: (draft: VoiceDraftRecord) => void;
}

export default function PendingDraftsQueueTab({ state, onApproveDraft }: PendingDraftsQueueTabProps) {
  const { currency } = state;

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
      created_at: "18 mins ago"
    },
    {
      id: "vd_003",
      merchant_id: "alacio_mini_shop",
      intent_type: "ADVANCE_PAYMENT",
      raw_transcript: "Ameacha 600 taken change 400 ya item atachukua jioni",
      payload: {
        customer_name: "Mama Boi",
        amount_paid: 600,
        change_given: 400,
        net_item_cost: 200,
        items: [
          { item_name: "Unga Jogoo 2kg", quantity: 1, unit: "packet" }
        ],
        pickup_terms: "Paid in advance, goods reserved on shelf for evening pickup"
      },
      total_amount: 200,
      status: "PENDING",
      created_at: "34 mins ago"
    }
  ]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [customSpeechText, setCustomSpeechText] = useState("");

  const handleSimulateIntent = (sampleText: string) => {
    let intent: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT";
    let payload: any;
    let total = 0;

    if (sampleText.includes("Leta maziwa")) {
      intent = "SUPPLIER_DELIVERY";
      payload = {
        supplier_name: "Brookside Distributor",
        items: [
          { item_name: "Brookside Fresh Milk 500ml", quantity: 2, unit: "crates" },
          { item_name: "Broadways Bread", quantity: 20, unit: "loaves" }
        ],
        payment_mode: "MPESA",
        total_cost: 3940
      };
      total = 3940;
    } else if (sampleText.includes("Kamau amechukua")) {
      intent = "CREDIT_RECORD";
      payload = {
        customer_name: "Kamau",
        items: [
          { item_name: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
        ],
        amount_owed: 40,
        notes: "Unpaid micro-credit taken during rush hour"
      };
      total = 40;
    } else {
      intent = "ADVANCE_PAYMENT";
      payload = {
        customer_name: "Mama Boi",
        amount_paid: 600,
        change_given: 400,
        net_item_cost: 200,
        items: [
          { item_name: "Unga Jogoo 2kg", quantity: 1, unit: "packet" }
        ],
        pickup_terms: "Paid in advance, goods reserved on shelf for evening pickup"
      };
      total = 200;
    }

    const newDraft: VoiceDraftRecord = {
      id: `vd_${Date.now()}`,
      merchant_id: "alacio_mini_shop",
      intent_type: intent,
      raw_transcript: sampleText,
      payload,
      total_amount: total,
      status: "PENDING",
      created_at: "Just now"
    };

    setDrafts([newDraft, ...drafts]);
    setNotificationMsg(`Voice transcription parsed: Intent [${intent}] queued into pending_drafts!`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleApprove = (draft: VoiceDraftRecord) => {
    onApproveDraft(draft);
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setNotificationMsg(
      `Approved: Intent [${draft.intent_type}] finalized to official ledger and inventory accounts!`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleDismiss = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Radio className="text-emerald-400 animate-pulse" size={24} /> Ambient Voice Drafts Queue
            </h2>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              NLP Intent Staging
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Passively captured Swahili/Sheng conversations routed to the <strong>pending_drafts</strong> buffer. 
            <strong className="text-white ml-1">Zero auto-finalization:</strong> stock and ledgers are only updated upon merchant approval.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-[#121214] border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-400 shrink-0">
          Pending Review: <strong>{drafts.length} Drafts</strong>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* QUICK BENCHMARK TEST TRIGGERS (3 CORE INTENTS) */}
      <div className="bg-[#121214] border-2 border-emerald-950 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" /> Simulate Spoken Swahili / Sheng Phrases (The 3 Core Intents)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Tap any quote to test /api/v1/voice-parse</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* INTENT 1: SUPPLIER_DELIVERY */}
          <button
            onClick={() => handleSimulateIntent("Leta maziwa crate 2 na mkate 20")}
            className="p-3 bg-[#09090b] hover:bg-[#111113] border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-left transition cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
              <Truck size={12} /> 1. SUPPLIER_DELIVERY
            </span>
            <p className="text-xs text-slate-200 italic font-serif">
              "Leta maziwa crate 2 na mkate 20"
            </p>
            <span className="text-[10px] text-slate-500 block">Extracts supplier, milk crates, bread, M-Pesa</span>
          </button>

          {/* INTENT 2: CREDIT_RECORD (DENI) */}
          <button
            onClick={() => handleSimulateIntent("Kamau amechukua sugar ya 40 na deni")}
            className="p-3 bg-[#09090b] hover:bg-[#111113] border border-amber-500/30 hover:border-amber-400 rounded-xl text-left transition cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
              <Hourglass size={12} /> 2. CREDIT_RECORD (DENI)
            </span>
            <p className="text-xs text-slate-200 italic font-serif">
              "Kamau amechukua sugar ya 40 na deni"
            </p>
            <span className="text-[10px] text-slate-500 block">Extracts customer Kamau, sugar, 40/- credit</span>
          </button>

          {/* INTENT 3: ADVANCE_PAYMENT */}
          <button
            onClick={() => handleSimulateIntent("Ameacha 600 taken change 400 ya item atachukua jioni")}
            className="p-3 bg-[#09090b] hover:bg-[#111113] border border-purple-500/30 hover:border-purple-400 rounded-xl text-left transition cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
              <Layers size={12} /> 3. ADVANCE_PAYMENT
            </span>
            <p className="text-xs text-slate-200 italic font-serif">
              "Ameacha 600 taken change 400 ya item atachukua jioni"
            </p>
            <span className="text-[10px] text-slate-500 block">Extracts paid 600, change 400, item reserved</span>
          </button>
        </div>
      </div>

      {/* DRAFTS LIST */}
      <div className="space-y-4">
        {drafts.length === 0 ? (
          <div className="bg-[#121214] border-2 border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Radio className="text-slate-600 mx-auto" size={40} />
            <h4 className="text-sm font-bold text-white font-serif">No Pending Drafts</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ambient listening is active in the background. Use the test triggers above to simulate spoken counter transactions.
            </p>
          </div>
        ) : (
          drafts.map((draft) => {
            const isDelivery = draft.intent_type === "SUPPLIER_DELIVERY";
            const isCredit = draft.intent_type === "CREDIT_RECORD";
            const isAdvance = draft.intent_type === "ADVANCE_PAYMENT";

            return (
              <div
                key={draft.id}
                className="bg-[#121214] border-2 border-emerald-950 hover:border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-xl transition"
              >
                {/* CARD HEADER */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      isDelivery 
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : isCredit
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    }`}>
                      {draft.intent_type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {isDelivery && draft.payload.supplier_name}
                      {isCredit && `Customer: ${draft.payload.customer_name}`}
                      {isAdvance && `Customer: ${draft.payload.customer_name}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">&bull; {draft.created_at}</span>
                  </div>

                  <span className="text-xs font-mono font-bold text-white">
                    {currency} {draft.total_amount.toLocaleString()}
                  </span>
                </div>

                {/* SPOKEN QUOTE */}
                <div className="p-3 bg-[#09090b] rounded-xl border border-slate-800 text-xs text-slate-300 italic flex items-start gap-2">
                  <Volume2 size={15} className="text-slate-500 shrink-0 mt-0.5" />
                  <span>"{draft.raw_transcript}"</span>
                </div>

                {/* EXTRACTED DETAILS */}
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  {isDelivery && (
                    <div>
                      Items: {draft.payload.items?.map((i: any) => `${i.quantity}x ${i.unit} ${i.item_name}`).join(", ")} &bull; Settlement: {draft.payload.payment_mode}
                    </div>
                  )}

                  {isCredit && (
                    <div className="text-amber-300 font-semibold">
                      Owed to Duka: {currency} {draft.payload.amount_owed} &bull; Item: {draft.payload.items?.[0]?.item_name}
                    </div>
                  )}

                  {isAdvance && (
                    <div className="space-y-0.5">
                      <div>
                        Paid: {currency} {draft.payload.amount_paid} &bull; Change Returned: {currency} {draft.payload.change_given} &bull; Net Item: {currency} {draft.payload.net_item_cost}
                      </div>
                      <div className="text-purple-300 text-[11px] font-sans">
                        ℹ️ {draft.payload.pickup_terms} (Stock physical count unchanged until pickup)
                      </div>
                    </div>
                  )}
                </div>

                {/* 1-TAP ACTION BAR */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDismiss(draft.id)}
                      className="px-3 py-1.5 bg-[#09090b] hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      <Trash2 size={13} />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => alert(`Edit draft modal opened for ${draft.intent_type}. You can modify quantities, amounts, or names.`)}
                      className="px-3 py-1.5 bg-[#09090b] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleApprove(draft)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Check size={14} />
                    <span>Approve Draft</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
