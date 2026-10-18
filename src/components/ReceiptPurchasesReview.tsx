import React, { useState } from "react";
import { 
  Check, 
  X, 
  Plus, 
  Sparkles
} from "lucide-react";

export interface ReceiptPurchasesReviewPayload {
  meta: {
    supplierName: string;
    invoiceNumber: string;
    receiptDate: string;
    paymentMode: string;
    ocrConfidence: number;
    photoUrl: string;
  };
  approvedItems: Array<{
    name: string;
    category: string;
    receivedQty: number;
    unitType: string;
    unitCost: number;
    unitRetail: number;
    lineTotalCost: number;
    expectedMargin: number;
  }>;
  totalCost: number;
  totalRetailValue: number;
}

export interface ReceiptPurchasesReviewProps {
  onIngestToInventory?: (payload: ReceiptPurchasesReviewPayload) => void;
}

export default function ReceiptPurchasesReview({ onIngestToInventory }: ReceiptPurchasesReviewProps) {
  // 1. Initial Deciphered State (Mocking the OCR output from AGS Limited)
  const [receiptMeta, setReceiptMeta] = useState({
    supplierName: "AGS LIMITED",
    invoiceNumber: "INV-270055801",
    receiptDate: "18/10/2026",
    paymentMode: "CASH",
    ocrConfidence: 99,
    photoUrl: "https://images.unsplash.com/photo-1554415707-9e4466b88738?auto=format&fit=crop&q=80&w=600"
  });

  const [items, setItems] = useState([
    {
      id: "item_001",
      approved: true,
      title: "Msosi Maize Meal 2kg",
      bulkLabel: "3 Bales",
      receiptRawLine: "MSOSI MAIZE MEAL 2KG • QTY: 3.00 BALES • RATE: 1190.00 • TOTAL: 3570",
      totalRetailQty: 36,
      unitName: "Packets (2kg)",
      lineCost: 3570,
      derivedUnitWholesale: 99.17,
      shelfRetail: 120
    }
  ]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle line item adjustments
  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated: any = { ...item, [field]: value };
      
      // Recalculate derived wholesale cost if qty or line cost changes
      if (field === "totalRetailQty" || field === "lineCost") {
        const qty = field === "totalRetailQty" ? parseFloat(String(value)) || 1 : Number(item.totalRetailQty) || 1;
        const cost = field === "lineCost" ? parseFloat(String(value)) || 0 : Number(item.lineCost) || 0;
        updated.derivedUnitWholesale = parseFloat((cost / qty).toFixed(2));
      }
      return updated;
    }));
  };

  // Toggle approval
  const toggleApprove = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, approved: !it.approved } : it));
  };

  // Global calculations
  const approvedItems = items.filter(i => i.approved);
  const totalApprovedCost = approvedItems.reduce((acc, curr) => acc + (parseFloat(String(curr.lineCost)) || 0), 0);
  const totalRetailShelfValue = approvedItems.reduce((acc, curr) => acc + ((parseFloat(String(curr.shelfRetail)) || 0) * (parseFloat(String(curr.totalRetailQty)) || 0)), 0);
  const batchGrossMargin = totalRetailShelfValue - totalApprovedCost;
  const batchMarginPct = totalApprovedCost > 0 ? ((batchGrossMargin / totalApprovedCost) * 100).toFixed(1) : "0";

  // Final Ingestion Action
  const handleApproveAndIngest = () => {
    const payload: ReceiptPurchasesReviewPayload = {
      meta: receiptMeta,
      approvedItems: approvedItems.map(i => ({
        name: i.title,
        category: "Flour",
        receivedQty: Number(i.totalRetailQty) || 0,
        unitType: i.unitName,
        unitCost: Number(i.derivedUnitWholesale) || 0,
        unitRetail: Number(i.shelfRetail) || 0,
        lineTotalCost: Number(i.lineCost) || 0,
        expectedMargin: (Number(i.shelfRetail) || 0) - (Number(i.derivedUnitWholesale) || 0)
      })),
      totalCost: totalApprovedCost,
      totalRetailValue: totalRetailShelfValue
    };

    if (onIngestToInventory) {
      onIngestToInventory(payload);
    }
    setStatusMessage(`Successfully ingested ${approvedItems.length} goods into YuBiFlo active inventory! Total: KSh ${totalApprovedCost.toLocaleString()}`);
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 rounded-2xl border border-slate-200 p-6 font-sans shadow-lg space-y-6">
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. TOP STATUS BAR & GLOBAL ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold tracking-wider uppercase rounded-md">
            Receipt Under Review
          </span>
          <span className="text-xs font-semibold text-slate-500">
            • {approvedItems.length} of {items.length} Goods Approved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setItems(prev => [
                ...prev,
                {
                  id: `item_${Date.now()}`,
                  approved: true,
                  title: "New Receipt Item",
                  bulkLabel: "1 Pack",
                  receiptRawLine: "MANUAL LINE ITEM ENTRY",
                  totalRetailQty: 12,
                  unitName: "Packets",
                  lineCost: 1200,
                  derivedUnitWholesale: 100,
                  shelfRetail: 125
                }
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition"
          >
            <Plus size={14} /> Add Good
          </button>
          <button 
            type="button"
            onClick={() => setItems(prev => prev.map(i => ({ ...i, approved: true })))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <Check size={14} /> Approve All
          </button>
          <button 
            type="button"
            onClick={() => setItems(prev => prev.map(i => ({ ...i, approved: false })))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <X size={14} /> Exclude All
          </button>
        </div>
      </div>

      {/* 2. RECEIPT METADATA GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Supplier Name
          </label>
          <input 
            type="text"
            value={receiptMeta.supplierName}
            onChange={(e) => setReceiptMeta({ ...receiptMeta, supplierName: e.target.value })}
            className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Receipt / Invoice #
          </label>
          <input 
            type="text"
            value={receiptMeta.invoiceNumber}
            onChange={(e) => setReceiptMeta({ ...receiptMeta, invoiceNumber: e.target.value })}
            className="w-full font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Receipt Date
          </label>
          <input 
            type="text"
            value={receiptMeta.receiptDate}
            onChange={(e) => setReceiptMeta({ ...receiptMeta, receiptDate: e.target.value })}
            className="w-full font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Payment Mode
          </label>
          <select 
            value={receiptMeta.paymentMode}
            onChange={(e) => setReceiptMeta({ ...receiptMeta, paymentMode: e.target.value })}
            className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-blue-500 cursor-pointer"
          >
            <option value="CASH">CASH</option>
            <option value="MPESA">M-PESA</option>
            <option value="CREDIT">SUPPLIER CREDIT</option>
          </select>
        </div>
      </div>

      {/* 3. TWO-COLUMN REVIEW: PHOTO ON LEFT, DECIPHERED FORM ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: RECEIPT PHOTO & CONFIDENCE */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 space-y-3" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 uppercase text-[11px]">Physical Receipt Photo</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              OCR Confidence: {receiptMeta.ocrConfidence}%
            </span>
          </div>

          <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white group aspect-[3/4]" style={{ backgroundColor: "#ffffff" }}>
            <img 
              src={receiptMeta.photoUrl} 
              alt="Uploaded physical slip" 
              className="w-full h-full object-contain object-center bg-white group-hover:scale-105 transition duration-300"
              style={{ backgroundColor: "#ffffff" }}
            />
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded">
              Payment: {receiptMeta.paymentMode}
            </div>
          </div>

          <button 
            type="button" 
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition text-center"
          >
            Change Photo
          </button>
        </div>

        {/* RIGHT COLUMN: DECIPHERED LINE ITEMS & BREAK-BULK CONVERSIONS */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" /> Approve &amp; Ensure Correct Details for Each Good:
            </span>
            <span className="font-mono font-bold text-slate-700">
              Approved Total: <strong className="text-slate-900">KSh {totalApprovedCost.toLocaleString()}</strong>
            </span>
          </div>

          {/* ITEM CARD (REPRESENTING THE DECIPHERED GOODS) */}
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`p-5 rounded-xl border transition-all space-y-4 ${
                item.approved 
                  ? "bg-white border-blue-200 shadow-sm" 
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              {/* ITEM TOP BAR */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleApprove(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      item.approved 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                    }`}
                  >
                    {item.approved ? <Check size={14} /> : null} {item.approved ? "Approved ✓" : "Excluded"}
                  </button>

                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      {item.title} ({item.bulkLabel})
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Receipt Line: {item.receiptRawLine}
                    </p>
                  </div>
                </div>

                {/* BREAK-BULK MATH DERIVATION CALLOUT */}
                <div className="hidden sm:block text-right bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg text-[11px] font-mono leading-tight">
                  <span className="text-blue-600 font-bold block mb-0.5">Derived Wholesale:</span>
                  <span className="text-slate-700">
                    KSh {item.lineCost} ÷ {item.totalRetailQty} = <strong className="text-blue-700 font-bold">KSh {item.derivedUnitWholesale}/unit</strong>
                  </span>
                </div>
              </div>

              {/* INPUT FIELDS: BREAKING BALES INTO PACKETS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Packets / Qty &amp; Unit
                  </label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      value={item.totalRetailQty}
                      onChange={(e) => updateItem(item.id, "totalRetailQty", e.target.value)}
                      className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-md font-mono font-bold text-slate-800"
                    />
                    <input 
                      type="text"
                      value={item.unitName}
                      onChange={(e) => updateItem(item.id, "unitName", e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Receipt Line Cost (KSh) *
                  </label>
                  <input 
                    type="number"
                    value={item.lineCost}
                    onChange={(e) => updateItem(item.id, "lineCost", e.target.value)}
                    className="w-full p-2 bg-amber-50/50 border border-amber-300 rounded-md font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    Derived Unit Wholesale (KSh)
                  </label>
                  <input 
                    type="text"
                    readOnly
                    value={item.derivedUnitWholesale}
                    className="w-full p-2 bg-blue-50/40 border border-blue-200 rounded-md font-mono font-black text-blue-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Shelf Retail (KSh)
                  </label>
                  <input 
                    type="number"
                    value={item.shelfRetail}
                    onChange={(e) => updateItem(item.id, "shelfRetail", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* 4. FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Approved Items</span>
              <span className="text-sm font-bold text-slate-800">{approvedItems.length} Products</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Total Approved Cost</span>
              <span className="text-sm font-black text-slate-900">KSh {totalApprovedCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Retail Shelf Value</span>
              <span className="text-sm font-black text-blue-600">KSh {totalRetailShelfValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Batch Margin</span>
              <span className="text-sm font-black text-emerald-600">+KSh {batchGrossMargin.toLocaleString()} ({batchMarginPct}%)</span>
            </div>
          </div>

          {/* 5. BOTTOM SUBMIT & REJECT ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <button 
              type="button"
              className="text-xs font-bold text-red-600 hover:text-red-700 p-2 transition flex items-center gap-1"
            >
              <X size={15} /> Reject Receipt &amp; Save to Database
            </button>

            <button 
              type="button"
              onClick={handleApproveAndIngest}
              disabled={approvedItems.length === 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
            >
              <Check size={16} /> Approve &amp; Ingest to Database ({approvedItems.length} Goods → KSh {totalApprovedCost.toLocaleString()})
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
