import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import adminDbRouter from "./src/services/adminDbApi";
import coreEngineRouter from "./src/services/coreEngineApi";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Shared Gemini SDK client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "YuBiFlo", timestamp: new Date().toISOString() });
  });

  // Admin Database Persistence & Storage API
  app.use("/api/db", adminDbRouter);

  // YuBiFlo Core Engine APIs (Dashboard, Restock Triggers, Product Creation, Sales Ledger)
  app.use("/api/v1", coreEngineRouter);

  // Gemini Multi-Receipt & Unsorted Ingestion Endpoint
  app.post("/api/gemini/parse-receipts", async (req, res) => {
    try {
      const { textContent, imageBase64, mimeType = "image/jpeg" } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured.",
        });
      }

      const prompt = `You are YuBiFlo's expert African MSME Receipt & Supply Ingestion OCR specialist.
You process messy, unsorted, multi-receipt supplier invoices, handwritten shopkeeper chits, wholesale delivery notes (e.g. Twiga, Khetias, Naivas wholesale, local distributor, market bulk supplies).

Extract all line items as distinct supply purchases. If unit selling price is missing or not stated on the wholesale receipt, provide a sensible default retail markup (typically 20% to 35% above unit cost for African kiosks / dukas / mini-marts).
Make sure dates are ISO formatted YYYY-MM-DD or closest approximation.
For currencies, detect KSh (KES), NGN, GHS, UGX, TZS, ZAR or default to KSh.

Raw merchant receipt text or query notes:
${textContent || "Please extract items from the provided receipt image."}`;

      const contents: any[] = [];
      if (imageBase64) {
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
          },
        });
      }
      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: imageBase64 ? { parts: contents } : prompt,
        config: {
          systemInstruction:
            "You are an African retail supply chain OCR auditor. Return clean, strictly formatted JSON with no markdown wrapping.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              receiptCount: { type: Type.INTEGER },
              currency: { type: Type.STRING },
              extractedReceipts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    receiptId: { type: Type.STRING },
                    supplierName: { type: Type.STRING },
                    receiptDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                    notes: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          itemName: { type: Type.STRING },
                          category: { type: Type.STRING },
                          qtyPurchased: { type: Type.NUMBER },
                          unitOfMeasure: { type: Type.STRING, description: "e.g. units, crates, bags, kg, packets, bales" },
                          totalCost: { type: Type.NUMBER },
                          unitCostPrice: { type: Type.NUMBER },
                          suggestedUnitSellingPrice: { type: Type.NUMBER },
                        },
                        required: ["itemName", "qtyPurchased", "totalCost", "unitCostPrice", "suggestedUnitSellingPrice"],
                      },
                    },
                  },
                  required: ["receiptDate", "supplierName", "items"],
                },
              },
              summaryInsights: { type: Type.STRING },
            },
            required: ["extractedReceipts", "currency"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error parsing receipts with Gemini:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process receipts with AI",
      });
    }
  });

  // Gemini Leakage Detective & Reconcile AI Advisor
  app.post("/api/gemini/analyze-leakage", async (req, res) => {
    try {
      const { reconciliationData, itemsData, velocityData } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured.",
        });
      }

      const prompt = `You are YuBiFlo's AI Leakage Detective & Micro-Retail CFO for African retail kiosks, dukas, agrovets, and shops.
Analyze the following reconciliation gap and supply-driven velocity state:

Reconciliation details:
${JSON.stringify(reconciliationData, null, 2)}

Active Inventory & Velocity:
${JSON.stringify(itemsData, null, 2)}
${velocityData ? `Velocity summary: ${JSON.stringify(velocityData, null, 2)}` : ""}

Provide:
1. Diagnosis of whether the discrepancy is caused by: Unrecorded informal customer credit ('deni'), cash drawer shrinkage / change errors, unlogged personal merchant consumption (kadogo taking bread/milk), unrecorded supplier return, or M-Pesa till withdrawal fee mismatches.
2. 3 High-Impact Action Steps for the merchant today.
3. Fast restock strategy to protect working capital.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "Provide insightful, highly practical MSME advice for shopkeepers in Africa. Return structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: { type: Type.STRING },
              leakageLikelihood: { type: Type.STRING, description: "HIGH, MEDIUM, LOW, or NONE" },
              probableCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              workingCapitalAdvice: { type: Type.STRING },
              deniRiskAssessment: { type: Type.STRING },
            },
            required: ["diagnosis", "leakageLikelihood", "probableCauses", "actionSteps"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Error in analyze-leakage:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to analyze leakage",
      });
    }
  });

  // Vite middleware for development vs Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`YuBiFlo server running on http://localhost:${PORT}`);
  });
}

startServer();
