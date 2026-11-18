import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  RefreshCw,
  Volume2,
  ShieldAlert,
  Clock
} from "lucide-react";
import {
  VoiceShiftRecorderEngine,
  AcousticTelemetry,
  formatShiftDuration,
  MAX_SHIFT_DURATION_SECONDS
} from "../services/voiceShiftRecorderEngine";
import { KenyanDialectEngine } from "../services/kenyanDialectEngine";
import { GeminiApiService } from "../services/api";

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
  inventory?: Array<{ name: string; unit_type?: string; unit_retail?: number; unit_cost?: number }>;
  onLogTransaction?: (payload: VoiceTransactionPayload) => void;
}

export default function VoiceLedger({
  currency = "KSh",
  inventory = [],
  onLogTransaction
}: VoiceLedgerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<VoiceTransactionPayload | null>(null);
  const [filteredNotice, setFilteredNotice] = useState<string | null>(null);
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

  const evaluateUtteranceOrAudio = async (opts: {
    text?: string;
    audioBase64?: string;
    mimeType?: string;
  }) => {
    const cleanText = (opts.text || "").trim();
    if (!cleanText && !opts.audioBase64) return;

    setIsProcessing(true);
    setFilteredNotice(null);

    try {
      // Try server-side Gemini commercial intent + TikTok/Music filter first
      const aiRes = await GeminiApiService.parseVoiceSegment({
        transcript: cleanText || undefined,
        audioBase64: opts.audioBase64,
        mimeType: opts.mimeType,
        inventoryItems: inventory,
        strictBuyIntentFilter: true,
        ignoreMediaAndTikTok: true
      });

      if (aiRes.success && aiRes.data) {
        const d = aiRes.data;
        if (d.transcript) setTranscript(d.transcript);

        if (!d.isCommercialTransaction || d.intentType === "NONE") {
          setFilteredNotice(
            d.rejectionReason ||
              `Filtered (${d.classification}): Non-buying speech / music / TikTok ignored.`
          );
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
      // Fallback below
    }

    if (cleanText) {
      const localEval = KenyanDialectEngine.evaluateCommercialUtterance(cleanText, inventory, {
        strictBuyIntentFilter: true,
        ignoreMediaAndTikTok: true
      });

      if (!localEval.isCommercialTransaction) {
        setFilteredNotice(
          localEval.rejectionReason || "Filtered non-buying chatter / media audio."
        );
        setIsProcessing(false);
        return;
      }

      setParsedPayload({
        intent: localEval.intentType === "SUPPLIER_DELIVERY" ? "RESTOCK" : "SALE",
        customer: localEval.counterparty || "Walk-in Customer",
        items: localEval.items.map((it) => ({
          name: it.itemName,
          qty: it.quantity,
          unit: it.unit,
          subtotal: it.subtotal
        })),
        cashPaid: localEval.cashPaid,
        mpesaPaid: localEval.mpesaPaid,
        debtAmount: localEval.debtAmount,
        total: localEval.totalAmount
      });
    }

    setIsProcessing(false);
  };

  const toggle24HourListening = async () => {
    if (isRecording) {
      engineRef.current?.stop("24-hour VCR stopped by user.");
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
          void evaluateUtteranceOrAudio({ text: txt });
        },
        onSpeechAudioSegment: (audioBase64, mimeType) => {
          void evaluateUtteranceOrAudio({ audioBase64, mimeType });
        },
        onError: (msg) => {
          setFilteredNotice(msg);
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
    if (started) {
      setIsRecording(true);
    }
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
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Volume2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              YuBiFlo 24h Voice Ledger
              <span className="text-[11px] font-mono text-emerald-400">
                24-Hour Shift · Music &amp; TikTok Filter
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Continuous counter recorder with auto-renewing capture and background media filtering.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggle24HourListening}
          className={`relative px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer flex items-center gap-2 shrink-0 ${
            isRecording
              ? "bg-red-500 text-white shadow-red-500/30"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
          }`}
          title="Start or stop 24-hour continuous Voice Ledger"
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isRecording ? "Stop 24h Shift" : "Start 24h Mic"}</span>
        </button>
      </div>

      {/* LIVE 24H TIMER & GATE TELEMETRY */}
      {isRecording && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#0a0d12] border border-slate-800 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-2 text-emerald-400">
            <Clock size={14} />
            <span>
              Shift: {formatShiftDuration(telemetry.elapsedSeconds)} / 24:00:00
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Gate:{" "}
            <strong
              className={
                telemetry.gateStatus === "SPEECH_ACTIVE"
                  ? "text-emerald-400"
                  : telemetry.gateStatus === "MUSIC_OR_MEDIA_SUPPRESSED"
                  ? "text-amber-400"
                  : "text-slate-300"
              }
            >
              {telemetry.gateStatus === "SPEECH_ACTIVE"
                ? "Speech Active"
                : telemetry.gateStatus === "MUSIC_OR_MEDIA_SUPPRESSED"
                ? "Music/Media Suppressed"
                : "Standby"}
            </strong>{" "}
            · Auto-Renewals: {telemetry.autoRenewals} · Blocked Windows:{" "}
            {telemetry.discardedMusicOrSilentSegments}
          </div>
        </div>
      )}

      {/* SPOKEN TRANSCRIPT PREVIEW */}
      <div className="p-3.5 bg-[#0a0d12] border border-slate-800 rounded-xl min-h-[50px] flex items-center justify-between text-xs">
        <div className="text-slate-300 font-mono">
          {isRecording && !transcript && (
            <span className="text-emerald-400">
              24-Hour shift listening (Sheng / Swahili / Kikuyu / Kamba / English)...
            </span>
          )}
          {!isRecording && !transcript && (
            <span className="text-slate-500 italic">
              Tap &ldquo;Start 24h Mic&rdquo; for continuous shop counter capture with automatic music and TikTok filtering.
            </span>
          )}
          {transcript && <span>&ldquo;{transcript}&rdquo;</span>}
        </div>
        {isProcessing && <RefreshCw size={14} className="text-emerald-400 animate-spin shrink-0" />}
      </div>

      {/* FILTERED OUT NOTICE (MUSIC / TIKTOK / CHATTER) */}
      {filteredNotice && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2">
          <ShieldAlert size={15} className="text-amber-400 shrink-0" />
          <span>{filteredNotice}</span>
        </div>
      )}

      {/* AI PARSED CARD */}
      {parsedPayload && (
        <div className="bg-[#151c27] border border-emerald-500/30 rounded-xl p-4 space-y-4">
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
              <div
                key={idx}
                className="flex justify-between items-center bg-[#0e1218] p-2 rounded border border-slate-800 font-mono tabular-nums"
              >
                <span className="text-slate-200">
                  {it.qty} {it.unit} - {it.name}
                </span>
                <span className="font-bold text-white">
                  {currency} {it.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono tabular-nums">
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-slate-500 block">Total Sale</span>
              <span className="font-bold text-white">
                {currency} {parsedPayload.total.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-emerald-400 block">Paid</span>
              <span className="font-bold text-emerald-400">
                {currency} {(parsedPayload.cashPaid + parsedPayload.mpesaPaid).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0a0d12] p-2 rounded">
              <span className="text-[10px] text-red-400 block">Logged Deni</span>
              <span className="font-bold text-red-400">
                {currency} {parsedPayload.debtAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setParsedPayload(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
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
