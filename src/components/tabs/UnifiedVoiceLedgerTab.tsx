import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Check,
  Play,
  RefreshCw,
  Trash2,
  Plus,
  Languages,
  Headphones,
  Calendar,
  Hourglass,
  Globe,
  Clock,
  SlidersHorizontal,
  Ban
} from "lucide-react";
import {
  AlacioMasterState,
  SalesLedgerItem,
  VoiceTrainingProfile,
  VoiceFilteredEvent,
  VoiceCustomAlias
} from "../../types/alacio";
import { VoiceTransactionPayload } from "../VoiceLedger";
import { VoiceDraftRecord } from "./PendingDraftsQueueTab";
import {
  KenyanLanguage,
  KENYAN_DIALECT_DICTIONARIES,
  VORACIOUS_TRAINING_CORPUS,
  KenyanDialectEngine
} from "../../services/kenyanDialectEngine";
import {
  VoiceShiftRecorderEngine,
  AcousticTelemetry,
  formatShiftDuration,
  MAX_SHIFT_DURATION_SECONDS
} from "../../services/voiceShiftRecorderEngine";
import { GeminiApiService } from "../../services/api";

interface UnifiedVoiceLedgerTabProps {
  state: AlacioMasterState;
  onCommitTransaction: (payload: VoiceTransactionPayload) => void;
  onCommitParsedSale: (salesRecord: SalesLedgerItem, itemName: string, qty: number, isCollected: boolean) => void;
  onApproveDraft: (draft: VoiceDraftRecord) => void;
  lastLoggedMessage: string | null;
  customerConsent?: boolean;
  onToggleConsent?: (val: boolean) => void;
  onUpdateVoiceTraining?: (profile: VoiceTrainingProfile) => void;
  isDemo?: boolean;
}

export type VoiceHubMode = "mic_vcr" | "ambient_muva" | "dialect_studio";

const DEFAULT_TRAINING_PROFILE: VoiceTrainingProfile = {
  maxShiftHours: 24,
  strictBuyIntentFilter: true,
  ignoreMediaAndTikTok: true,
  sensitivity: "STRICT",
  customAliases: [
    {
      id: "alias_default_1",
      spokenPhrase: "boflo",
      mappedItemName: "Broadways White Bread 400g",
      intentHint: "SALE",
      createdAt: "System Pretrained"
    },
    {
      id: "alias_default_2",
      spokenPhrase: "weka kwa kitabu",
      mappedItemName: "Customer Deni",
      intentHint: "CREDIT",
      createdAt: "System Pretrained"
    }
  ],
  ignoredPhrases: [
    "like and subscribe",
    "follow for part 2",
    "mambo vipi",
    "baridi sana leo"
  ],
  filteredNoiseLog: []
};

export default function UnifiedVoiceLedgerTab({
  state,
  onCommitTransaction,
  onCommitParsedSale,
  onApproveDraft,
  lastLoggedMessage,
  customerConsent = true,
  onToggleConsent,
  onUpdateVoiceTraining,
  isDemo = false
}: UnifiedVoiceLedgerTabProps) {
  const { currency, inventory } = state;

  // Active Hub Sub-Mode
  const [activeMode, setActiveMode] = useState<VoiceHubMode>("mic_vcr");

  // Training Profile (synced cleanly with AlacioMasterState)
  const [trainingProfile, setTrainingProfile] = useState<VoiceTrainingProfile>(
    () => state.voiceTrainingProfile || DEFAULT_TRAINING_PROFILE
  );

  useEffect(() => {
    if (state.voiceTrainingProfile) {
      setTrainingProfile(state.voiceTrainingProfile);
    }
  }, [state.voiceTrainingProfile]);

  const persistTrainingProfile = (updater: (prev: VoiceTrainingProfile) => VoiceTrainingProfile) => {
    setTrainingProfile((prev) => {
      const next = updater(prev);
      onUpdateVoiceTraining?.(next);
      return next;
    });
  };

  // Continuous 24-Hour Shift Recorder State
  const [is24hShiftRunning, setIs24hShiftRunning] = useState(false);
  const [activeShiftSource, setActiveShiftSource] = useState<"VCR" | "MUVA_24H">("VCR");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedIntentResult, setParsedIntentResult] = useState<any>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [filterAlert, setFilterAlert] = useState<string | null>(null);
  const [salesDate, setSalesDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
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
  const latestStateRef = useRef({ inventory, trainingProfile, activeShiftSource });
  latestStateRef.current = { inventory, trainingProfile, activeShiftSource };

  useEffect(() => {
    engineRef.current?.updateOptions({
      enableHardwareAec: trainingProfile.ignoreMediaAndTikTok,
      enableVocalBandpass: trainingProfile.ignoreMediaAndTikTok,
      ignoreMusicAndMedia: trainingProfile.ignoreMediaAndTikTok,
      maxShiftSeconds: (trainingProfile.maxShiftHours || 24) * 3600
    });
  }, [trainingProfile]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop("Component unmounted.");
    };
  }, []);

  // Dialect & Training inputs
  const [selectedLanguage, setSelectedLanguage] = useState<KenyanLanguage>("KIKUYU");
  const [newAliasPhrase, setNewAliasPhrase] = useState("");
  const [newAliasTarget, setNewAliasTarget] = useState(
    inventory[0]?.name || "Brookside Fresh Milk 500ml"
  );
  const [newIgnoredPhrase, setNewIgnoredPhrase] = useState("");
  const [manualTrainSentence, setManualTrainSentence] = useState("");

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
        items: [{ item_name: "Mumias Sugar", quantity: 1, unit: "quarter-kg", price: 40 }],
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

  const [draftFilter, setDraftFilter] = useState<
    "ALL" | "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT"
  >("ALL");

  const showSuccess = (msg: string) => {
    setSuccessNote(msg);
    setTimeout(() => setSuccessNote(null), 5000);
  };

  const logFilteredNoiseEvent = (
    snippet: string,
    category: VoiceFilteredEvent["category"],
    reason: string,
    sourceMode: "VCR" | "MUVA_24H"
  ) => {
    const cleanSnippet = snippet.trim() || "(Audio window suppressed)";
    const ev: VoiceFilteredEvent = {
      id: `flt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      snippet: cleanSnippet,
      category,
      reason,
      sourceMode
    };
    persistTrainingProfile((prev) => ({
      ...prev,
      filteredNoiseLog: [ev, ...(prev.filteredNoiseLog || [])].slice(0, 40)
    }));
    setFilterAlert(`${reason} — Filtered out cleanly (not logged as a sale).`);
    setTimeout(() => setFilterAlert(null), 5000);
  };

  /**
   * Core Dual-Pipeline Commercial Evaluator (Audio Blob + Text Utterance):
   * Sends to server-side Gemini Acoustic Filter (/api/gemini/voice-parse) with catalog + training context,
   * and falls back deterministically to KenyanDialectEngine.evaluateCommercialUtterance if offline/demo.
   */
  const evaluateSpeechOrAudio = async (params: {
    text?: string;
    audioBase64?: string;
    mimeType?: string;
    autoQueueToDrafts?: boolean;
    sourceMode?: "VCR" | "MUVA_24H";
    bypassFilter?: boolean;
  }) => {
    const cleanText = (params.text || "").trim();
    if (!cleanText && !params.audioBase64) return;

    const { inventory: liveInv, trainingProfile: liveProfile, activeShiftSource: shiftSrc } =
      latestStateRef.current;
    const modeSource = params.sourceMode || shiftSrc;
    const effectiveStrict = params.bypassFilter ? false : liveProfile.strictBuyIntentFilter;
    const effectiveIgnoreMedia = params.bypassFilter ? false : liveProfile.ignoreMediaAndTikTok;

    // Pre-screen fast local obvious music/TikTok/chatter before spending server bandwidth
    if (cleanText && !params.audioBase64 && !params.bypassFilter) {
      const preCheck = KenyanDialectEngine.evaluateCommercialUtterance(cleanText, liveInv, {
        strictBuyIntentFilter: effectiveStrict,
        ignoreMediaAndTikTok: effectiveIgnoreMedia,
        customAliases: liveProfile.customAliases,
        ignoredPhrases: liveProfile.ignoredPhrases
      });
      if (!preCheck.isCommercialTransaction && preCheck.rejectionCategory) {
        logFilteredNoiseEvent(
          cleanText,
          preCheck.rejectionCategory,
          preCheck.rejectionReason || "Non-buying audio/media blocked",
          modeSource
        );
        return;
      }
    }

    setIsProcessing(true);

    const buildFromResult = (data: {
      isCommercialTransaction: boolean;
      classification: string;
      rejectionReason?: string;
      transcript: string;
      intentType: string;
      items: Array<{ itemName: string; quantity: number; unit: string; unitPrice?: number; subtotal?: number }>;
      totalAmount: number;
      amountPaid?: number;
      changeGiven?: number;
      paymentMethod: string;
      counterparty: string;
      isCollected?: boolean;
    }) => {
      if (!data.isCommercialTransaction || data.intentType === "NONE") {
        const cat: VoiceFilteredEvent["category"] =
          data.classification === "REJECTED_MEDIA"
            ? "TIKTOK_OR_MEDIA"
            : data.classification === "REJECTED_INQUIRY"
            ? "PRICE_INQUIRY"
            : "CASUAL_CHATTER";
        logFilteredNoiseEvent(
          data.transcript || cleanText || "(Ambient audio clip)",
          cat,
          data.rejectionReason || "Filtered background music / TikTok / non-buying speech",
          modeSource
        );
        return;
      }

      const structured = {
        intentType: data.intentType,
        raw: data.transcript || cleanText,
        supplierName:
          data.intentType === "SUPPLIER_DELIVERY"
            ? data.counterparty || "Wholesale Distributor"
            : undefined,
        customerName:
          data.intentType !== "SUPPLIER_DELIVERY"
            ? data.counterparty || "Walk-in Customer"
            : undefined,
        items: (data.items || []).map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity || 1,
          unit: i.unit || "pcs",
          price: i.unitPrice || i.subtotal || 0
        })),
        totalAmount: Number(data.totalAmount) || 0,
        amountPaid: Number(data.amountPaid ?? data.totalAmount) || 0,
        changeGiven: Number(data.changeGiven) || 0,
        paymentMethod: data.paymentMethod || "CASH",
        counterparty: data.counterparty || "Walk-in Customer",
        isCollected: data.isCollected ?? data.intentType !== "ADVANCE_PAYMENT"
      };

      // In 24-Hour Continuous Shift / Ambient Muva mode, auto-stage valid transactions into Pending Drafts
      if (params.autoQueueToDrafts) {
        const mappedIntent: VoiceDraftRecord["intent_type"] =
          structured.intentType === "SUPPLIER_DELIVERY"
            ? "SUPPLIER_DELIVERY"
            : structured.intentType === "CREDIT_RECORD"
            ? "CREDIT_RECORD"
            : "ADVANCE_PAYMENT";

        const queued: VoiceDraftRecord = {
          id: `vd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          merchant_id: state.user_email || "yubiflo_shop",
          intent_type: mappedIntent,
          raw_transcript: structured.raw,
          payload: {
            customer_name: structured.customerName || structured.counterparty,
            supplier_name: structured.supplierName,
            items: structured.items.map((it) => ({
              item_name: it.itemName,
              quantity: it.quantity,
              unit: it.unit,
              price: it.price
            })),
            amount_paid: structured.amountPaid,
            change_given: structured.changeGiven,
            amount_owed:
              mappedIntent === "CREDIT_RECORD" ? structured.totalAmount : 0,
            total_cost: structured.totalAmount,
            payment_mode: structured.paymentMethod,
            is_collected: structured.isCollected
          },
          total_amount: structured.totalAmount,
          status: "PENDING",
          created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setDrafts((prev) => [queued, ...prev]);
        setTranscript(structured.raw);
        setParsedIntentResult(structured);
        showSuccess(
          `Captured valid ${mappedIntent.replace("_", " ")} (${currency} ${structured.totalAmount.toLocaleString()}) -> staged to queue.`
        );
      } else {
        setParsedIntentResult(structured);
        showSuccess("Speech verified! Matched against shop inventory & trained aliases.");
      }
    };

    try {
      if (!isDemo) {
        const aiRes = await GeminiApiService.parseVoiceSegment({
          transcript: cleanText || undefined,
          audioBase64: params.audioBase64,
          mimeType: params.mimeType,
          inventoryItems: liveInv.slice(0, 60).map((it) => ({
            name: it.name,
            unit_type: it.unit_type,
            unit_retail: it.unit_retail,
            unit_cost: it.unit_cost
          })),
          customAliases: liveProfile.customAliases.map((a) => ({
            spokenPhrase: a.spokenPhrase,
            mappedItemName: a.mappedItemName,
            intentHint: a.intentHint
          })),
          ignoredPhrases: liveProfile.ignoredPhrases,
          strictBuyIntentFilter: effectiveStrict,
          ignoreMediaAndTikTok: effectiveIgnoreMedia
        });

        if (aiRes.success && aiRes.data) {
          buildFromResult({
            isCommercialTransaction: aiRes.data.isCommercialTransaction,
            classification: aiRes.data.classification,
            rejectionReason: aiRes.data.rejectionReason,
            transcript: aiRes.data.transcript || cleanText,
            intentType: aiRes.data.intentType,
            items: aiRes.data.items || [],
            totalAmount: aiRes.data.totalAmount,
            amountPaid: aiRes.data.amountPaid,
            changeGiven: aiRes.data.changeGiven,
            paymentMethod: aiRes.data.paymentMethod,
            counterparty: aiRes.data.customerOrSupplier || "Walk-in Customer",
            isCollected: aiRes.data.isCollected
          });
          setIsProcessing(false);
          return;
        }
      }
    } catch {
      // Fallback smoothly below
    }

    if (cleanText) {
      const fallback = KenyanDialectEngine.evaluateCommercialUtterance(cleanText, liveInv, {
        strictBuyIntentFilter: effectiveStrict,
        ignoreMediaAndTikTok: effectiveIgnoreMedia,
        customAliases: liveProfile.customAliases,
        ignoredPhrases: liveProfile.ignoredPhrases
      });
      buildFromResult({
        isCommercialTransaction: fallback.isCommercialTransaction,
        classification: fallback.classification,
        rejectionReason: fallback.rejectionReason,
        transcript: cleanText,
        intentType: fallback.intentType,
        items: fallback.items,
        totalAmount: fallback.totalAmount,
        amountPaid: fallback.amountPaid,
        changeGiven: fallback.changeGiven,
        paymentMethod: fallback.paymentMethod,
        counterparty: fallback.counterparty,
        isCollected: fallback.isCollected
      });
    }

    setIsProcessing(false);
  };

  /**
   * Starts/Stops the real 24-Hour Continuous Shift Recorder (Works across both VCR and Ambient Muva)
   */
  const start24HourShift = async (sourceMode: "VCR" | "MUVA_24H") => {
    setActiveShiftSource(sourceMode);

    if (is24hShiftRunning) {
      engineRef.current?.stop("24-Hour Voice Ledger shift stopped.");
      setIs24hShiftRunning(false);
      return;
    }

    setParsedIntentResult(null);
    setInterimTranscript("");

    if (isDemo) {
      // Interactive sandbox: run simulated counter conversation without browser mic permission
      setIs24hShiftRunning(true);
      const demoSamples = [
        "Nimeuza maziwa mawili na mkate moja cash 185",
        "TikTok sound: Follow for part 2, like and subscribe! Amapiano remix",
        "Mama Brayo amechukua sukari kilo moja na maziwa weka kwa deni",
        "Sasa bro, leo baridi sana, mambo vipi?",
        "Customer amelipa unga Jogoo mbili na mafuta Salit mpesa 540"
      ];
      const chosen = demoSamples[Math.floor(Math.random() * demoSamples.length)];
      setTimeout(() => {
        setIs24hShiftRunning(false);
        setTranscript(chosen);
        void evaluateSpeechOrAudio({
          text: chosen,
          autoQueueToDrafts: sourceMode === "MUVA_24H",
          sourceMode
        });
      }, 900);
      return;
    }

    const shiftSeconds = (trainingProfile.maxShiftHours || 24) * 3600;
    const engine = new VoiceShiftRecorderEngine(
      {
        onTelemetry: (t) => setTelemetry(t),
        onInterimTranscript: (txt) => setInterimTranscript(txt),
        onFinalUtterance: (txt) => {
          setInterimTranscript("");
          setTranscript(txt);
          void evaluateSpeechOrAudio({
            text: txt,
            autoQueueToDrafts: true,
            sourceMode: latestStateRef.current.activeShiftSource
          });
        },
        onSpeechAudioSegment: (audioBase64, mimeType) => {
          void evaluateSpeechOrAudio({
            audioBase64,
            mimeType,
            autoQueueToDrafts: true,
            sourceMode: latestStateRef.current.activeShiftSource
          });
        },
        onStatusMessage: (msg) => showSuccess(msg),
        onError: (errMsg) => {
          setFilterAlert(errMsg);
          setIs24hShiftRunning(false);
        }
      },
      {
        language: "en-KE",
        enableHardwareAec: trainingProfile.ignoreMediaAndTikTok,
        enableVocalBandpass: trainingProfile.ignoreMediaAndTikTok,
        ignoreMusicAndMedia: trainingProfile.ignoreMediaAndTikTok,
        maxShiftSeconds: shiftSeconds,
        segmentDurationMs: 12000
      }
    );

    engineRef.current = engine;
    const ok = await engine.start();
    if (ok) {
      setIs24hShiftRunning(true);
    }
  };

  // 1-Click quick test phrases (valid sales & noise distractors)
  const handleTestPhrase = (phrase: string) => {
    setTranscript(phrase);
    void evaluateSpeechOrAudio({
      text: phrase,
      autoQueueToDrafts: false,
      sourceMode: activeMode === "ambient_muva" ? "MUVA_24H" : "VCR"
    });
  };

  // Stage extracted intent into Pending Drafts
  const handleQueueAsDraft = () => {
    if (!parsedIntentResult) return;

    const newDraft: VoiceDraftRecord = {
      id: `vd_${Date.now()}`,
      merchant_id: state.user_email || "yubiflo_shop",
      intent_type:
        parsedIntentResult.intentType === "SUPPLIER_DELIVERY"
          ? "SUPPLIER_DELIVERY"
          : parsedIntentResult.intentType === "CREDIT_RECORD"
          ? "CREDIT_RECORD"
          : "ADVANCE_PAYMENT",
      raw_transcript: parsedIntentResult.raw,
      payload: {
        customer_name: parsedIntentResult.customerName || parsedIntentResult.counterparty,
        supplier_name: parsedIntentResult.supplierName,
        items: parsedIntentResult.items.map((it: any) => ({
          item_name: it.itemName,
          quantity: it.quantity,
          unit: it.unit,
          price: it.price
        })),
        amount_paid: parsedIntentResult.amountPaid,
        change_given: parsedIntentResult.changeGiven,
        amount_owed: parsedIntentResult.totalAmount,
        total_cost: parsedIntentResult.totalAmount,
        payment_mode: parsedIntentResult.paymentMethod
      },
      total_amount: parsedIntentResult.totalAmount,
      status: "PENDING",
      created_at: "Just now"
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setParsedIntentResult(null);
    setTranscript("");
    showSuccess("Transaction queued into Pending Voice Drafts for 1-tap review!");
  };

  // Direct commit to active shop ledger
  const handleDirectCommit = () => {
    if (!parsedIntentResult) return;

    if (parsedIntentResult.intentType === "SUPPLIER_DELIVERY") {
      onApproveDraft({
        id: `vd_${Date.now()}`,
        merchant_id: state.user_email || "yubiflo_shop",
        intent_type: "SUPPLIER_DELIVERY",
        raw_transcript: parsedIntentResult.raw,
        payload: {
          supplier_name: parsedIntentResult.supplierName || "Wholesale Supplier",
          items: parsedIntentResult.items.map((i: any) => ({
            item_name: i.itemName,
            quantity: i.quantity,
            unit: i.unit
          })),
          payment_mode: parsedIntentResult.paymentMethod,
          total_cost: parsedIntentResult.totalAmount
        },
        total_amount: parsedIntentResult.totalAmount,
        status: "APPROVED",
        created_at: "Just now"
      });
    } else if (parsedIntentResult.intentType === "CREDIT_RECORD") {
      onCommitTransaction({
        intent: "CREDIT",
        customer: parsedIntentResult.customerName || parsedIntentResult.counterparty || "Debtor Customer",
        items: parsedIntentResult.items.map((i: any) => ({
          name: i.itemName,
          qty: i.quantity || 1,
          unit: i.unit || "pcs",
          subtotal: (i.price || parsedIntentResult.totalAmount) * (i.quantity || 1)
        })),
        cashPaid: 0,
        mpesaPaid: 0,
        debtAmount: parsedIntentResult.totalAmount,
        total: parsedIntentResult.totalAmount
      });
    } else {
      const firstItem = parsedIntentResult.items[0];
      const salesItem: SalesLedgerItem = {
        id: `vs_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: salesDate,
        customer_name: parsedIntentResult.customerName || "Walk-in Customer",
        items_summary: parsedIntentResult.items
          .map((i: any) => `${i.quantity}x ${i.itemName}`)
          .join(", "),
        total_amount: parsedIntentResult.totalAmount,
        cash_paid: parsedIntentResult.paymentMethod === "MPESA" ? 0 : parsedIntentResult.totalAmount,
        mpesa_paid: parsedIntentResult.paymentMethod === "MPESA" ? parsedIntentResult.totalAmount : 0,
        debt_amount: 0,
        payment_method: parsedIntentResult.paymentMethod === "MPESA" ? "MPESA" : "CASH"
      };
      onCommitParsedSale(
        salesItem,
        firstItem?.itemName || "Fresh Milk 500ml",
        firstItem?.quantity || 1,
        parsedIntentResult.isCollected ?? true
      );
    }

    setParsedIntentResult(null);
    setTranscript("");
    showSuccess(
      `Committed ${currency} ${parsedIntentResult.totalAmount.toLocaleString()} directly into active shop ledgers!`
    );
  };

  // Approve queued draft
  const handleApproveQueueItem = (draft: VoiceDraftRecord) => {
    if (draft.intent_type === "CREDIT_RECORD") {
      onCommitTransaction({
        intent: "CREDIT",
        customer: draft.payload.customer_name || "Debtor Customer",
        items: (draft.payload.items || []).map((it: any) => ({
          name: it.item_name || it.name,
          qty: it.quantity || 1,
          unit: it.unit || "pcs",
          subtotal: draft.total_amount
        })),
        cashPaid: 0,
        mpesaPaid: 0,
        debtAmount: draft.payload.amount_owed ?? draft.total_amount,
        total: draft.total_amount
      });
    } else if (draft.intent_type === "ADVANCE_PAYMENT") {
      const firstItem = draft.payload.items?.[0];
      const netTotal = draft.payload.net_retained ?? draft.total_amount;
      onCommitParsedSale(
        {
          id: `vs_draft_${Date.now()}`,
          date: salesDate,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          customer_name: draft.payload.customer_name || "Cash Customer",
          items_summary: (draft.payload.items || [])
            .map((i: any) => `${i.quantity}x ${i.item_name}`)
            .join(", "),
          total_amount: netTotal,
          cash_paid: draft.payload.payment_mode === "MPESA" ? 0 : netTotal,
          mpesa_paid: draft.payload.payment_mode === "MPESA" ? netTotal : 0,
          debt_amount: 0,
          payment_method: draft.payload.payment_mode === "MPESA" ? "MPESA" : "CASH"
        },
        firstItem?.item_name || "Counter Item",
        firstItem?.quantity || 1,
        draft.payload.is_collected ?? true
      );
    } else {
      onApproveDraft(draft);
    }

    setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: "APPROVED" } : d)));
    showSuccess(`Draft "${draft.raw_transcript}" approved & calibrated into inventory/ledgers!`);
  };

  // Teach filter to ignore a false-positive draft
  const handleTeachIgnoreFromDraft = (draft: VoiceDraftRecord) => {
    const cleanPhrase = draft.raw_transcript.trim();
    persistTrainingProfile((prev) => ({
      ...prev,
      ignoredPhrases: Array.from(new Set([...(prev.ignoredPhrases || []), cleanPhrase]))
    }));
    setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: "DISMISSED" } : d)));
    showSuccess(`Trained filter: "${cleanPhrase}" will be ignored automatically next time.`);
  };

  // Teach filter that a blocked noise item was actually a valid sale
  const handlePromoteBlockedEvent = (ev: VoiceFilteredEvent) => {
    persistTrainingProfile((prev) => ({
      ...prev,
      filteredNoiseLog: (prev.filteredNoiseLog || []).map((item) =>
        item.id === ev.id ? { ...item, promotedToSale: true } : item
      )
    }));
    setTranscript(ev.snippet);
    void evaluateSpeechOrAudio({
      text: ev.snippet,
      bypassFilter: true,
      autoQueueToDrafts: false,
      sourceMode: ev.sourceMode
    });
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasPhrase.trim() || !newAliasTarget.trim()) return;
    const item: VoiceCustomAlias = {
      id: `alias_${Date.now()}`,
      spokenPhrase: newAliasPhrase.trim(),
      mappedItemName: newAliasTarget.trim(),
      intentHint: "SALE",
      createdAt: new Date().toLocaleDateString()
    };
    persistTrainingProfile((prev) => ({
      ...prev,
      customAliases: [item, ...(prev.customAliases || [])]
    }));
    setNewAliasPhrase("");
    showSuccess(`Trained alias: "${item.spokenPhrase}" -> ${item.mappedItemName}`);
  };

  const handleAddIgnoredPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgnoredPhrase.trim()) return;
    const phrase = newIgnoredPhrase.trim();
    persistTrainingProfile((prev) => ({
      ...prev,
      ignoredPhrases: Array.from(new Set([phrase, ...(prev.ignoredPhrases || [])]))
    }));
    setNewIgnoredPhrase("");
    showSuccess(`Added "${phrase}" to background noise / TikTok ignore list.`);
  };

  const activeDialectSamples = VORACIOUS_TRAINING_CORPUS.filter(
    (s) => s.language === selectedLanguage
  );
  const activeDict = KENYAN_DIALECT_DICTIONARIES[selectedLanguage];
  const pendingCount = drafts.filter((d) => d.status === "PENDING").length;
  const filteredNoiseLog = trainingProfile.filteredNoiseLog || [];
  const filteredDrafts = drafts.filter((d) =>
    draftFilter === "ALL" ? true : d.intent_type === draftFilter
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. HEADER: UNIFIED 24H VOICE HUB & MODE SELECTOR */}
      <div className="border-b border-slate-800 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-serif">
              <Mic className="text-emerald-400" size={24} /> 24-Hour Voice Ledger &amp; Noise Filter
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              24h Non-Stop Shift · Music &amp; TikTok Suppression
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous 24-hour counter recording without 5-minute timeouts. Filters out TikTok videos, radio music, and casual chatter so only real purchases reach your ledger.
          </p>
        </div>

        {/* MODE SELECTOR */}
        <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded-2xl border border-slate-800 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode("mic_vcr")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === "mic_vcr"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic size={13} />
            <span>Live Counter VCR (24h)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("ambient_muva")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === "ambient_muva"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Headphones size={13} />
            <span>Ambient 24h (Muva)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("dialect_studio")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === "dialect_studio"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Languages size={13} />
            <span>Train &amp; 5 Dialects</span>
          </button>
        </div>
      </div>

      {lastLoggedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{lastLoggedMessage}</span>
        </div>
      )}

      {successNote && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {filterAlert && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-2xl text-xs flex items-center gap-2 font-mono">
          <Ban size={16} className="text-amber-400 shrink-0" />
          <span>{filterAlert}</span>
        </div>
      )}

      {/* 2. SHARED 24-HOUR SHIFT WATCHDOG & ACOUSTIC GATE BAR */}
      <div className="bg-[#0e1217] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono tabular-nums">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Clock size={14} className="text-emerald-400" />
              24h Shift Window:
              <strong className={is24hShiftRunning ? "text-emerald-400" : "text-slate-300"}>
                {formatShiftDuration(telemetry.elapsedSeconds)} / 24:00:00
              </strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Auto-Heal Renewals: <strong className="text-cyan-300">{telemetry.autoRenewals}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Speech Clips: <strong className="text-emerald-300">{telemetry.capturedSegments}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Blocked Noise/Media:{" "}
              <strong className="text-amber-300">
                {telemetry.discardedMusicOrSilentSegments + filteredNoiseLog.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={trainingProfile.ignoreMediaAndTikTok}
                onChange={(e) =>
                  persistTrainingProfile((prev) => ({
                    ...prev,
                    ignoreMediaAndTikTok: e.target.checked
                  }))
                }
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>Filter Music &amp; TikTok</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={trainingProfile.strictBuyIntentFilter}
                onChange={(e) =>
                  persistTrainingProfile((prev) => ({
                    ...prev,
                    strictBuyIntentFilter: e.target.checked
                  }))
                }
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span>Only Real Purchases</span>
            </label>
          </div>
        </div>

        {/* Live Acoustic Gate & Vocal Clarity Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-3 py-2 bg-[#07090c] rounded-xl border border-slate-800/80">
            <span className="text-slate-500">Gate State</span>
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
                ? "Music Blocked"
                : is24hShiftRunning
                ? "Standby Gate"
                : "Stopped"}
            </strong>
          </div>

          <div className="px-3 py-2 bg-[#07090c] rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Vocal Clarity</span>
              <span className="text-emerald-400 font-bold">{telemetry.vocalClarityScore}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-150"
                style={{ width: `${telemetry.vocalClarityScore}%` }}
              />
            </div>
          </div>

          <div className="px-3 py-2 bg-[#07090c] rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Music / Bass Reject</span>
              <span className="text-amber-300 font-bold">{telemetry.musicSuppressionScore}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${telemetry.musicSuppressionScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-[#07090c] rounded-xl border border-slate-800/80">
            <span className="text-slate-500">Wake Lock &amp; AEC</span>
            <strong className="text-cyan-300">
              {telemetry.hardwareAecEnabled ? "AEC On" : "AEC Off"} ·{" "}
              {telemetry.wakeLockActive ? "Awake" : "Std"}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. AUDIO CAPTURE CONSOLE */}
      <div className="bg-[#121214] border border-emerald-950 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* CONSENT TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">
              Consented 24h Counter Capture
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              Silent &amp; music-only windows discarded in RAM immediately
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={localConsent}
              onChange={(e) => {
                setLocalConsent(e.target.checked);
                onToggleConsent?.(e.target.checked);
              }}
              className="rounded accent-emerald-500 cursor-pointer"
            />
            <span className="text-[11px]">Notice Displayed to Customers</span>
          </label>
        </div>

        {/* MODE A: LIVE COUNTER MIC (VCR 24H) */}
        {activeMode === "mic_vcr" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#09090b] border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => void start24HourShift("VCR")}
                className={`px-5 py-4 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl shrink-0 min-w-[126px] ${
                  is24hShiftRunning
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                }`}
              >
                {is24hShiftRunning ? <MicOff size={26} /> : <Mic size={26} />}
                <span className="text-[10px] font-mono font-bold mt-1.5 uppercase whitespace-nowrap">
                  {is24hShiftRunning
                    ? "Stop 24h Shift"
                    : isDemo
                    ? "Simulate Capture"
                    : "Start 24h Shift"}
                </span>
              </button>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                    {isDemo
                      ? is24hShiftRunning
                        ? "Voice Simulator: Running counter dialogue test..."
                        : "Voice Simulator & 24h Filter Test:"
                      : is24hShiftRunning
                      ? `24h Continuous Shift Active (${formatShiftDuration(telemetry.elapsedSeconds)} elapsed)`
                      : "Start 24-hour shift or type/test a counter phrase:"}
                  </span>
                  {isProcessing && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Filtering &amp; Parsing...
                    </span>
                  )}
                </div>

                <div className="min-h-[50px] p-3 bg-[#0c0c0e] border border-emerald-950 rounded-xl text-xs text-white font-mono flex items-center">
                  {interimTranscript ? (
                    <span className="text-emerald-300 italic">{interimTranscript}...</span>
                  ) : transcript ? (
                    <span>&ldquo;{transcript}&rdquo;</span>
                  ) : (
                    <span className="text-slate-500 italic">
                      &ldquo;Nimeuza maziwa mawili na mkate moja cash 185...&rdquo; (TikTok/music audio is auto-filtered)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK-TEST CHIPS INCLUDING TIKTOK/MUSIC REJECTION TESTS */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" /> Test Valid Counter Sales vs. Music &amp; TikTok Filtering:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleTestPhrase("Nimeuza maziwa mawili na mkate moja cash mia moja na themanini na tano")
                  }
                  className="p-2.5 bg-[#121214] hover:bg-[#18181b] border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-emerald-400 font-bold block text-[11px]">Valid Sale (Cash)</span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    &ldquo;2 maziwa + 1 mkate cash 185&rdquo;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTestPhrase("Kamau amechukua sukari robo deni nitaandika kwa kitabu")
                  }
                  className="p-2.5 bg-[#121214] hover:bg-[#18181b] border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-amber-400 font-bold block text-[11px]">Valid Debtor Sale</span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    &ldquo;Kamau sukari robo deni&rdquo;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTestPhrase(
                      "TikTok trending sound! Follow for part 2, like and subscribe, Amapiano dj remix yeah yeah"
                    )
                  }
                  className="p-2.5 bg-[#121214] hover:bg-[#18181b] border border-amber-500/30 hover:border-amber-400 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-amber-300 font-bold block text-[11px]">
                    Filter Test: TikTok / Music
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    Should block — NOT a purchase
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTestPhrase("Sasa bro, leo baridi sana, mambo vipi morio?")
                  }
                  className="p-2.5 bg-[#121214] hover:bg-[#18181b] border border-rose-500/30 hover:border-rose-400 rounded-xl text-left transition cursor-pointer text-slate-300"
                >
                  <span className="text-rose-300 font-bold block text-[11px]">
                    Filter Test: Casual Chatter
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    Should ignore non-buying greeting
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: AMBIENT 24H HANDS-FREE (MUVA) */}
        {activeMode === "ambient_muva" && (
          <div className="space-y-4">
            <div className="p-4 bg-[#09090b] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Radio
                    size={16}
                    className={is24hShiftRunning ? "text-emerald-400" : "text-slate-500"}
                  />
                  <span className="text-sm font-bold text-white font-serif">
                    Muva 24-Hour Hands-Free Ambient Shift
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    AEC · Vocal Bandpass · 24h Auto-Heal
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Designed for full 24-hour counter shifts while you listen to music, play TikTok videos, or talk with neighbors. Only genuine customer purchases, debtor requests, or supplier drops are staged below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void start24HourShift("MUVA_24H")}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer shadow-lg shrink-0 whitespace-nowrap ${
                  is24hShiftRunning
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                }`}
              >
                {is24hShiftRunning ? "Stop 24h Ambient Shift" : "Start 24h Ambient Shift"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
              <div className="p-3 bg-[#0c0c0e] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Max Uninterrupted Duration</span>
                <span className="text-emerald-400 font-bold">24 Hours (No 5m Cap)</span>
              </div>
              <div className="p-3 bg-[#0c0c0e] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Echo &amp; TikTok Canceller</span>
                <span className="text-emerald-400 font-bold">
                  {trainingProfile.ignoreMediaAndTikTok ? "AEC + 110Hz HPF Active" : "Bypassed"}
                </span>
              </div>
              <div className="p-3 bg-[#0c0c0e] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Audio Memory Management</span>
                <span className="text-slate-200 font-bold">12s Rolling Segments</span>
              </div>
              <div className="p-3 bg-[#0c0c0e] border border-slate-800 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Filtered Non-Buyers</span>
                <span className="text-amber-400 font-bold">
                  {filteredNoiseLog.length} Logged Blocks
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODE C: TRAIN RECORDER & 5 DIALECT STUDIO */}
        {activeMode === "dialect_studio" && (
          <div className="space-y-5">
            {/* SHOPKEEPER TRAINING LAB */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Train Custom Shop Nicknames / Aliases */}
              <form
                onSubmit={handleAddAlias}
                className="p-4 bg-[#09090b] border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <SlidersHorizontal size={14} className="text-emerald-400" />
                  <span>Train Custom Shop Words &amp; Item Nicknames</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Teach the recorder local customer slang or abbreviations so every spoken order maps to your exact shelf stock item.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAliasPhrase}
                    onChange={(e) => setNewAliasPhrase(e.target.value)}
                    placeholder="Spoken slang (e.g. boflo, njugu)"
                    className="bg-[#121216] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                  <select
                    value={newAliasTarget}
                    onChange={(e) => setNewAliasTarget(e.target.value)}
                    className="bg-[#121216] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {inventory.map((it) => (
                      <option key={it.id} value={it.name}>
                        {it.name} ({currency} {it.unit_retail})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} /> Save Trained Item Alias
                </button>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {trainingProfile.customAliases.map((al) => (
                    <div
                      key={al.id}
                      className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#12161c] border border-slate-800 text-slate-200"
                    >
                      <span>
                        &ldquo;{al.spokenPhrase}&rdquo; &rarr; <strong className="text-emerald-400">{al.mappedItemName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          persistTrainingProfile((prev) => ({
                            ...prev,
                            customAliases: prev.customAliases.filter((x) => x.id !== al.id)
                          }))
                        }
                        className="text-slate-500 hover:text-red-400 cursor-pointer"
                        title="Remove alias"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </form>

              {/* Train Music / TikTok / Chatter Ignore Phrases */}
              <form
                onSubmit={handleAddIgnoredPhrase}
                className="p-4 bg-[#09090b] border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <Ban size={14} className="text-amber-400" />
                  <span>Train Phrases &amp; Media Sounds to Ignore</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Add TikTok catchphrases, radio jingles, song lyrics, or counter banter you never want logged as a shop transaction.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIgnoredPhrase}
                    onChange={(e) => setNewIgnoredPhrase(e.target.value)}
                    placeholder="e.g. classic 105, amen, part 2, habari..."
                    className="flex-1 bg-[#121216] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    Ignore Rule
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {trainingProfile.ignoredPhrases.map((ph) => (
                    <div
                      key={ph}
                      className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#16130d] border border-amber-500/20 text-amber-200"
                    >
                      <span>&ldquo;{ph}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() =>
                          persistTrainingProfile((prev) => ({
                            ...prev,
                            ignoredPhrases: prev.ignoredPhrases.filter((x) => x !== ph)
                          }))
                        }
                        className="text-amber-400/70 hover:text-red-400 cursor-pointer"
                        title="Remove ignore rule"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            {/* Interactive Training Sentence Sandbox */}
            <div className="p-4 bg-[#09090b] border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                Test Custom Sentence Against Trained Filter:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualTrainSentence}
                  onChange={(e) => setManualTrainSentence(e.target.value)}
                  placeholder="Type a sentence (real sale, Kikuyu/Sheng phrase, or TikTok/music quote) to verify classification..."
                  className="flex-1 bg-[#121216] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!manualTrainSentence.trim()) return;
                    handleTestPhrase(manualTrainSentence.trim());
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                >
                  Test Filter
                </button>
              </div>
            </div>

            {/* 5 KENYAN DIALECT BENCHMARKS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-400" /> 5 Kenyan Dialect Models:
              </span>

              <div className="flex flex-wrap gap-1.5">
                {(["KIKUYU", "KAMBA", "SWAHILI", "ENGLISH", "SHENG"] as KenyanLanguage[]).map(
                  (lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                        selectedLanguage === lang
                          ? "bg-emerald-500 text-slate-950 shadow"
                          : "bg-[#09090b] text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {KENYAN_DIALECT_DICTIONARIES[lang].name}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeDialectSamples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleTestPhrase(sample.spokenPhrase)}
                  className="p-2.5 bg-[#09090b] hover:bg-[#0d1a13] border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition cursor-pointer text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-mono font-bold group-hover:text-emerald-300">
                      &ldquo;{sample.spokenPhrase}&rdquo;
                    </span>
                    <Play
                      size={12}
                      className="text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {activeDict.name} &rarr; {sample.englishTranslation}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EXTRACTED LIVE RESULT PREVIEW CARD */}
        {parsedIntentResult && (
          <div className="p-4 bg-[#09090b] border border-emerald-500/50 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase text-emerald-300 font-bold">
                  {parsedIntentResult.intentType}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-white font-mono font-bold">
                  &ldquo;{parsedIntentResult.raw}&rdquo;
                </span>
              </div>
              <strong className="text-emerald-400 font-mono text-base tabular-nums">
                {currency} {Number(parsedIntentResult.totalAmount || 0).toLocaleString()}
              </strong>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Product / Items</span>
                <span className="text-white font-bold">
                  {parsedIntentResult.items
                    .map((i: any) => `${i.quantity} ${i.unit || ""} ${i.itemName}`)
                    .join(", ")}
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
                <span className="text-slate-300 font-bold tabular-nums">
                  {currency} {parsedIntentResult.changeGiven || 0}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#141824] rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-300 text-[11px] flex items-center gap-1.5 font-bold">
                <Calendar size={13} className="text-emerald-400" />
                Transaction Operating Date:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSalesDate(new Date().toISOString().slice(0, 10))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                    salesDate === new Date().toISOString().slice(0, 10)
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-[#1e2433] text-slate-300 border-slate-700"
                  }`}
                >
                  Today
                </button>
                <input
                  type="date"
                  value={salesDate}
                  onChange={(e) => setSalesDate(e.target.value)}
                  className="bg-[#0b0e14] border border-slate-700 rounded px-2 py-0.5 text-[10px] text-white font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleQueueAsDraft}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Hourglass size={13} className="text-amber-400" />
                <span>Stage to Pending Queue</span>
              </button>
              <button
                type="button"
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

      {/* 4. PENDING VOICE DRAFTS QUEUE */}
      <div className="bg-[#121214] border border-emerald-950 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              <Radio className="text-amber-400" size={18} /> Pending Voice Drafts Queue ·{" "}
              <span className="text-sm font-mono text-amber-300 tabular-nums">
                {pendingCount} awaiting
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Only verified commercial intents land here. Teach the recorder by dismissing chatter or approving valid sales.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono self-start sm:self-auto">
            {(
              [
                { id: "ALL", label: `All (${drafts.length})` },
                { id: "SUPPLIER_DELIVERY", label: "Suppliers" },
                { id: "CREDIT_RECORD", label: "Deni Book" },
                { id: "ADVANCE_PAYMENT", label: "Cash & Change" }
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setDraftFilter(btn.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  draftFilter === btn.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-1">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500/60 mb-2" />
            <p>No voice drafts in this category.</p>
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
                      ? "bg-zinc-900 border-zinc-700 opacity-75"
                      : draft.status === "DISMISSED"
                      ? "bg-[#0c0c0c] border-slate-900 opacity-40"
                      : "bg-[#121214] border-slate-800 hover:border-slate-700 shadow-lg"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span
                        className={`font-mono font-bold ${
                          draft.intent_type === "SUPPLIER_DELIVERY"
                            ? "text-cyan-300"
                            : draft.intent_type === "CREDIT_RECORD"
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {draft.intent_type === "SUPPLIER_DELIVERY"
                          ? "Wholesale Restock"
                          : draft.intent_type === "CREDIT_RECORD"
                          ? "Customer Deni"
                          : "Cash & Change"}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-serif font-bold text-white italic">
                        &ldquo;{draft.raw_transcript}&rdquo;
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                      <strong className="text-amber-400 text-sm">
                        {currency} {draft.total_amount.toLocaleString()}
                      </strong>
                      <span className="text-[11px] text-slate-500">{draft.created_at}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Counterparty</span>
                      <strong className="text-white">
                        {draft.payload.customer_name || draft.payload.supplier_name || "Walk-in"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Action Items</span>
                      <span className="text-emerald-400 font-bold">
                        {draft.payload.items
                          ?.map((i: any) => `${i.quantity} ${i.unit || ""} ${i.item_name}`)
                          .join(", ") || "General sale"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Payment Channel</span>
                      <span className="text-cyan-400">{draft.payload.payment_mode || "CASH"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Status</span>
                      <span
                        className={`font-bold ${
                          isApproved
                            ? "text-emerald-400"
                            : draft.status === "DISMISSED"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {draft.status}
                      </span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleTeachIgnoreFromDraft(draft)}
                        className="px-3 py-1.5 text-amber-300 hover:bg-amber-500/10 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1"
                        title="Teach recorder that phrases like this are music/chatter, not sales"
                      >
                        <Ban size={12} />
                        <span>Teach: Ignore Similar Chatter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDrafts((prev) =>
                            prev.map((d) => (d.id === draft.id ? { ...d, status: "DISMISSED" } : d))
                          )
                        }
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>Dismiss</span>
                      </button>

                      <button
                        type="button"
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

      {/* 5. FILTERED OUT MUSIC / TIKTOK / NON-BUYING AUDIT LOG */}
      {filteredNoiseLog.length > 0 && (
        <div className="bg-[#0e1014] border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white font-serif">
                Blocked Music, TikTok &amp; Non-Buyer Audio ({filteredNoiseLog.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                persistTrainingProfile((prev) => ({ ...prev, filteredNoiseLog: [] }))
              }
              className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredNoiseLog.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#07090c] border border-slate-800/80 text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-amber-300 font-bold">{ev.category}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{ev.timestamp}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{ev.reason}</span>
                  </div>
                  <div className="text-slate-300 italic">&ldquo;{ev.snippet}&rdquo;</div>
                </div>

                {!ev.promotedToSale ? (
                  <button
                    type="button"
                    onClick={() => handlePromoteBlockedEvent(ev)}
                    className="px-3 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
                  >
                    Teach: Actually a Sale
                  </button>
                ) : (
                  <span className="text-emerald-400 text-[11px] font-bold shrink-0">
                    Promoted to Evaluation
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
