import { ExtractedReceipt } from "../types";

export interface AIReceiptParseResponse {
  success: boolean;
  data?: {
    receiptCount: number;
    currency: string;
    extractedReceipts: ExtractedReceipt[];
    summaryInsights?: string;
  };
  error?: string;
}

export interface AILeakageResponse {
  success: boolean;
  data?: {
    diagnosis: string;
    leakageLikelihood: "HIGH" | "MEDIUM" | "LOW" | "NONE";
    probableCauses: string[];
    actionSteps: string[];
    workingCapitalAdvice: string;
    deniRiskAssessment?: string;
  };
  error?: string;
}

export interface AIVoiceParseData {
  isCommercialTransaction: boolean;
  classification:
    | "VALID_SALE"
    | "VALID_CREDIT"
    | "VALID_RESTOCK"
    | "VALID_ADVANCE"
    | "REJECTED_MEDIA"
    | "REJECTED_CHATTER"
    | "REJECTED_INQUIRY";
  rejectionReason?: string;
  detectedLanguage?: "KIKUYU" | "KAMBA" | "SWAHILI" | "ENGLISH" | "SHENG";
  transcript: string;
  englishTranslation?: string;
  intentType: "CASH_SALE" | "CREDIT_RECORD" | "SUPPLIER_DELIVERY" | "ADVANCE_PAYMENT" | "NONE";
  customerOrSupplier?: string;
  paymentMethod: "CASH" | "MPESA" | "CREDIT";
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  amountPaid?: number;
  cashPaid?: number;
  mpesaPaid?: number;
  debtAmount?: number;
  changeGiven?: number;
  isCollected?: boolean;
  confidence?: number;
}

export interface AIVoiceParseResponse {
  success: boolean;
  data?: AIVoiceParseData;
  error?: string;
}

export class GeminiApiService {
  static async parseReceipts(payload: {
    textContent?: string;
    imageBase64?: string;
    mimeType?: string;
  }): Promise<AIReceiptParseResponse> {
    try {
      const res = await fetch("/api/gemini/parse-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn("API request failed:", err);
      return {
        success: false,
        error: err.message || "Failed to reach Gemini API",
      };
    }
  }

  static async analyzeLeakage(payload: {
    reconciliationData: any;
    itemsData: any;
    velocityData?: any;
  }): Promise<AILeakageResponse> {
    try {
      const res = await fetch("/api/gemini/analyze-leakage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn("API request failed:", err);
      return {
        success: false,
        error: err.message || "Failed to analyze leakage",
      };
    }
  }

  static async parseVoiceSegment(payload: {
    transcript?: string;
    audioBase64?: string;
    mimeType?: string;
    inventoryItems?: Array<{ name: string; unit_type?: string; unit_retail?: number; unit_cost?: number }>;
    customAliases?: Array<{ spokenPhrase: string; mappedItemName: string; intentHint?: string }>;
    ignoredPhrases?: string[];
    strictBuyIntentFilter?: boolean;
    ignoreMediaAndTikTok?: boolean;
  }): Promise<AIVoiceParseResponse> {
    try {
      const res = await fetch("/api/gemini/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Voice parser unreachable",
      };
    }
  }
}
