import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  RefreshCw,
  Volume2,
  CheckCircle2,
  CornerDownLeft,
  ShieldCheck,
  ShieldAlert,
  Clock
} from "lucide-react";
import { VoiceTransactionPayload } from "../VoiceLedger";
import {
  VoiceShiftRecorderEngine,
  AcousticTelemetry,
  formatShiftDuration,
  MAX_SHIFT_DURATION_SECONDS
} from "../../services/voiceShiftRecorderEngine";
import { KenyanDialectEngine } from "../../services/kenyanDialectEngine";
import { GeminiApiService } from "../../services/api";

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
  const [filteredNotice, setFilteredNotice] = useState<string | null>(null);
  const [localConsent, setLocalConsent] = useState(customerConsent);
  const [telemetry, setTelemetry] = useState<AcousticTelemetry>({
    elapsedSeconds: 0,
    remainingSeconds: MAX_SHIFT_DURATION_SECONDS,
    shiftStartedAt: null,
    rmsLevel: 0,
    vocalClarityScore: 0,
    musicSuppressionScore: 0,
    gateStatus: "IDLE",
    autoRenewals: 0,
    capturedSegments: 0,
    discardedMusicOrSilentSegments: 0,
    wakeLockActive: false,
    hardwareAecEnabled: true
  });

  const engineRef = useRef<VoiceShiftRecorderEngine | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.stop("Unmounted");
    };
  }, []);

  const parseUtteranceOrAudio = async (opts: {
    text?: string;
    audioBase64?: string;
    mimeType?: string;
  }) => {
    const clean = (opts.text || "").trim();
    if (!clean && !opts.audioBase64) return;
    setIsProcessing(true);
    setFilteredNotice(null);

    try {
      const aiRes = await GeminiApiService.parseVoiceSegment({
        transcript: clean || undefined,
        audioBase64: opts.audioBase64,
        mimeType: opts.mimeType,
        strictBuyIntentFilter: true,
        ignoreMediaAndTikTok: true
      });
      if (aiRes.success && aiRes.data) {
        const d = aiRes.data;
        if (d.transcript) setTranscript(d.transcript);
        if (!d.isCommercialTransaction || d.intentType === "NONE") {
          setFilteredNotice(d.rejectionReason || `Filtered (${d.classification}): non-buying speech or media ignored.`);
          setIsProcessing(false);
          return;
        }
        setParsedPayload({
          intent: d.intentType === "SUPPLIER_DELIVERY" ? "RESTOCK" : "SALE",
          customer: d.customerOrSupplier || "Walk-in Customer",
          items: (d.items || []).map((it) => ({
            name: it.itemName,
            qty: it.quantity,
            unit: it.unit,
            subtotal: it.subtotal
          })),
          cashPaid: d.cashPaid ?? (d.paymentMethod === "CASH" ? d.totalAmount : 0),
          mpesaPaid: d.mpesaPaid ?? (d.paymentMethod === "MPESA" ? d.totalAmount : 0),
          debtAmount: d.debtAmount ?? (d.paymentMethod === "CREDIT" ? d.totalAmount : 0),
          total: d.totalAmount || 0
        });
        setIsProcessing(false);
        return;
      }
    } catch {
      // Fallback locally
    }

    if (clean) {
      const evalRes = KenyanDialectEngine.evaluateCommercialUtterance(clean, [], {
        strictBuyIntentFilter: true,
        ignoreMediaAndTikTok: true
      });
      if (!evalRes.isCommercialTransaction) {
        setFilteredNotice(evalRes.rejectionReason || "Non-buying speech or background media filtered out.");
        setIsProcessing(false);
        return;
      }
      setParsedPayload({
        intent: evalRes.intentType === "SUPPLIER_DELIVERY" ? "RESTOCK" : "SALE",
        customer: evalRes.counterparty || "Walk-in Customer",
        items: evalRes.items.map((it) => ({
          name: it.itemName,
          qty: it.quantity,
          unit: it.unit,
          subtotal: it.subtotal
        })),
        cashPaid: evalRes.cashPaid,
        mpesaPaid: evalRes.mpesaPaid,
        debtAmount: evalRes.debtAmount,
        total: evalRes.totalAmount
      });
    }
    setIsProcessing(false);
  };

  const toggle24hListening = async () => {
    if (isRecording) {
      engineRef.current?.stop("Stopped");
      setIsRecording(false);
      return;
    }
    setParsedPayload(null);
    setFilteredNotice(null);
    setTranscript("");

    const engine = new VoiceShiftRecorderEngine(
      {
        onTelemetry: (t) => setTelemetry(t),
        onInterimTranscript: (txt) => setTranscript(txt),
        onFinalUtterance: (txt) => {
          setTranscript(txt);
          void parseUtteranceOrAudio({ text: txt });
        },
        onSpeechAudioSegment: (audioBase64, mimeType) => {
          void parseUtteranceOrAudio({ audioBase64, mimeType });
        },
        onError: (err) => {
          setFilteredNotice(err);
          setIsRecording(false);
        }
      },
      {
        language: "en-KE",
        enableHardwareAec: true,
        enableVocalBandpass: true,
        ignoreMusicAndMedia: true,
        maxShiftSeconds: MAX_SHIFT_DURATION_SECONDS,
        segmentDurationMs: 12000
      }
    );

    engineRef.current = engine;
    const started = await engine.start();
    if (started) setIsRecording(true);
  };

  const handleApplySample = (sample: string) => {
    setCustomText(sample);
    setTranscript(sample);
    void parseUtteranceOrAudio({ text: sample });
  };

  const handleManualParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setTranscript(customText);
    void parseUtteranceOrAudio({ text: customText });
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
            <Volume2 className="text-emerald-400" size={22} /> VCR: 24-Hour Voice Conversion Record
          </h2>
          <p className="text-xs text-slate-400">
            Runs up to 24 hours continuously with Hardware AEC and vocal filtering to ignore music, TikTok, and non-buying chatter.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-[#0a1410] border border-emerald-500/30 font-mono text-[11px] text-emerald-400 shrink-0 tabular-nums">
          VCR Daily Count: <strong className="text-white">{vcrCount}</strong> Sales Captured
        </div>
      </div>

      {/* CUSTOMER NOTICE & CONSENT */}
      <div
        className={`p-4 rounded-2xl border transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          localConsent
            ? "bg-[#091510] border-emerald-500/40 text-emerald-200"
            : "bg-amber-950/20 border-amber-500/40 text-amber-200"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            size={18}
            className={localConsent ? "text-emerald-400 shrink-0 mt-0.5" : "text-amber-400 shrink-0 mt-0.5"}
          />
          <div>
            <span className="font-bold block text-white">Counter Notice &amp; Consumer Privacy Consent</span>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              Counter audio is filtered in real time over rolling 12-second windows for sales, credit, and restock entries. Background silence, music, and TikTok audio are discarded immediately.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !localConsent;
            setLocalConsent(next);
            onToggleConsent?.(next);
          }}
          className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${
            localConsent
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}
        >
          {localConsent ? "Customer Notice Active" : "Toggle Notice Flow"}
        </button>
      </div>

      {lastLoggedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-mono">{lastLoggedMessage}</span>
        </div>
      )}

      {/* QUICK TEST & NOISE FILTER PRESETS */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
          Rush-Hour Sale &amp; Noise-Rejection Presets
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleApplySample("Mama Boi packet mbili za maziwa, amelipa 100, deni 20")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition cursor-pointer text-left"
          >
            &ldquo;Mama Boi packet mbili za maziwa, amelipa 100, deni 20&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleApplySample("TikTok sound: Follow for part 2, like and subscribe! Amapiano remix dj")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-amber-500/40 rounded-lg text-xs text-amber-200 transition cursor-pointer text-left"
          >
            Filter Test: &ldquo;TikTok / Amapiano Music&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleApplySample("Baba Junior soda moja na mkate amelipa 125 cash")}
            className="px-3 py-1.5 bg-[#121822] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition cursor-pointer text-left"
          >
            &ldquo;Baba Junior soda moja na mkate amelipa 125 cash&rdquo;
          </button>
        </div>
      </div>

      {/* VOICE RECORDING & TEXT INPUT CARD */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Mic size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">24-Hour Continuous Shift Recorder</span>
              <span className="text-[11px] text-slate-400">
                Auto-renews past 5 minutes · Filters TikTok, music &amp; idle chatter
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggle24hListening}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer flex items-center gap-2 shrink-0 ${
              isRecording
                ? "bg-red-500 text-white shadow-red-500/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? "Stop 24h Recorder" : "Start 24h Recorder"}</span>
          </button>
        </div>

        {isRecording && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#0a0d12] border border-slate-800 rounded-xl text-xs font-mono tabular-nums">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <Clock size={13} />
              Elapsed: {formatShiftDuration(telemetry.elapsedSeconds)} / 24:00:00
            </span>
            <span className="text-slate-400">
              Gate: <strong className="text-white">{telemetry.gateStatus}</strong> · Blocked Windows:{" "}
              {telemetry.discardedMusicOrSilentSegments} · Auto-Heal: {telemetry.autoRenewals}
            </span>
          </div>
        )}

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

        <div className="p-3.5 bg-[#0a0d12] border border-slate-800 rounded-xl min-h-[46px] flex items-center justify-between text-xs font-mono">
          <div className="text-slate-300">
            {isRecording && !transcript && (
              <span className="text-emerald-400">24-hour shift microphone live...</span>
            )}
            {!isRecording && !transcript && (
              <span className="text-slate-500 italic">No audio captured yet. Start 24h recorder or click a preset above.</span>
            )}
            {transcript && <span>&ldquo;{transcript}&rdquo;</span>}
          </div>
          {isProcessing && <RefreshCw size={14} className="text-emerald-400 animate-spin shrink-0" />}
        </div>

        {filteredNotice && (
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-mono flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-400 shrink-0" />
            <span>{filteredNotice}</span>
          </div>
        )}
      </div>

      {/* EXTRACTED ENTITY CARD */}
      {parsedPayload && (
        <div className="bg-[#151c27] border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
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
              <div
                key={idx}
                className="flex justify-between items-center bg-[#0a0d12] p-2.5 rounded-lg border border-slate-800 font-mono text-xs tabular-nums"
              >
                <span className="text-slate-200">
                  {it.qty} {it.unit} · {it.name}
                </span>
                <span className="font-bold text-white">
                  {currency} {it.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-center font-mono text-xs tabular-nums">
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Sale</span>
              <span className="text-base font-black text-white">
                {currency} {parsedPayload.total.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block uppercase">Paid</span>
              <span className="text-base font-black text-emerald-400">
                {currency} {(parsedPayload.cashPaid + parsedPayload.mpesaPaid).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0a0d12] p-2.5 rounded-xl border border-purple-500/20">
              <span className="text-[10px] text-purple-400 block uppercase">Logged Deni</span>
              <span className="text-base font-black text-purple-300">
                {currency} {parsedPayload.debtAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setParsedPayload(null)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
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
