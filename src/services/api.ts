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
}
