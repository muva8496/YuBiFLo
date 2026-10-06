import React, { useState } from "react";
import { Zap, Plus, ArrowRight, CheckCircle2, CornerDownLeft, ShoppingBag, Calendar, Edit3 } from "lucide-react";
import { InventoryItem, SalesLedgerItem } from "../../types/alacio";

interface QuickDumpTabProps {
  currency: string;
  inventory: InventoryItem[];
  recentSales: SalesLedgerItem[];
  onQuickSale: (itemName: string, qty: number, amount: number, method: "CASH" | "MPESA", saleDate?: string) => void;
  onUpdateSaleDate?: (saleId: string, newDate: string, newTime?: string) => void;
}

export default function QuickDumpTab({ currency, inventory, recentSales, onQuickSale, onUpdateSaleDate }: QuickDumpTabProps) {
  const [rawText, setRawText] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "MPESA">("CASH");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [tempEditDate, setTempEditDate] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleRawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    // e.g. "Milk 2 cash 120" or "Unga 1 210"
    const text = rawText.trim();
    const parts = text.split(" ");
    let matchedItem = inventory[0];
    let qty = 1;
    let amount = 60;

    const query = parts[0].toLowerCase();
    const found = inventory.find((i) => i.name.toLowerCase().includes(query) || i.category.toLowerCase().includes(query));
    if (found) {
      matchedItem = found;
      amount = matchedItem.unit_retail;
    }

    // search for numbers
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 1) {
      if (numbers.length === 1) {
        qty = parseInt(numbers[0]);
        amount = qty * matchedItem.unit_retail;
      } else {
        qty = parseInt(numbers[0]);
        amount = parseInt(numbers[1]);
      }
    }

    onQuickSale(matchedItem.name, qty, amount, selectedMethod, saleDate);
    setSuccessToast(`Quick Dumped: ${qty}x ${matchedItem.name} for ${currency} ${amount} (${selectedMethod}) on ${saleDate}`);
    setTimeout(() => setSuccessToast(null), 4000);
    setRawText("");
  };

  const handleTapItem = (item: InventoryItem) => {
    onQuickSale(item.name, 1, item.unit_retail, selectedMethod, saleDate);
    setSuccessToast(`Quick Dumped: 1x ${item.name} for ${currency} ${item.unit_retail} (${selectedMethod}) on ${saleDate}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSaveSaleDate = (saleId: string) => {
    if (!tempEditDate) return;
    onUpdateSaleDate?.(saleId, tempEditDate);
    setEditingSaleId(null);
    setSuccessToast(`Sale date updated to ${tempEditDate}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="text-cyan-400" size={22} /> Quick Raw Dump (Speed Counter POS)
        </h2>
        <p className="text-xs text-slate-400">
          Zero-delay counter entry during rush hours. Type shorthand or tap frequent fast-movers to auto-deduct stock and log drawer money.
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-mono">{successToast}</span>
        </div>
      )}

      {/* RAW COMMAND LINE INPUT & EDITABLE TRANSACTION DATE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <span className="font-mono text-slate-400 font-semibold uppercase">Command Line Shorthand</span>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* EDITABLE SALE DATE SPACE */}
            <div className="flex items-center gap-1.5 bg-[#0a0d12] border border-amber-500/40 rounded-lg px-2 py-1">
              <Calendar size={13} className="text-amber-400" />
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">Date:</span>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="bg-transparent text-amber-200 text-xs font-mono font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setSaleDate(y.toISOString().slice(0, 10));
                }}
                className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[9px] font-mono font-bold"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setSaleDate(new Date().toISOString().slice(0, 10))}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono"
              >
                Today
              </button>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setSelectedMethod("CASH")}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  selectedMethod === "CASH" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                CASH
              </button>
              <button
                onClick={() => setSelectedMethod("MPESA")}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  selectedMethod === "MPESA" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                M-PESA
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleRawSubmit} className="flex gap-2">
          <input
            type="text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Type e.g: 'Milk 2 120' or 'Unga 1' or 'Bread 3 cash' & hit Enter..."
            className="flex-1 bg-[#0a0d12] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={!rawText.trim()}
            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs uppercase"
          >
            <span>Log Dump</span>
            <CornerDownLeft size={16} />
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
          <span className="text-slate-500">Quick examples:</span>
          <button onClick={() => setRawText("Milk 2 130")} className="hover:text-cyan-300 underline">Milk 2 130</button>
          <span>&bull;</span>
          <button onClick={() => setRawText("Bread 1 65")} className="hover:text-cyan-300 underline">Bread 1 65</button>
          <span>&bull;</span>
          <button onClick={() => setRawText("Unga 1 210")} className="hover:text-cyan-300 underline">Unga 1 210</button>
          <span>&bull;</span>
          <button onClick={() => setRawText("Sugar 1 160")} className="hover:text-cyan-300 underline">Sugar 1 160</button>
        </div>
      </div>

      {/* 1-TAP TOP FAST MOVERS GRID */}
      <div className="space-y-3">
        <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
          <ShoppingBag size={14} className="text-emerald-400" /> 1-Tap Fast-Movers (Instantly Records 1 Unit)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {inventory.slice(0, 12).map((item) => (
            <button
              key={item.id}
              onClick={() => handleTapItem(item)}
              className="p-3 bg-[#121822] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-24"
            >
              <div className="text-xs font-medium text-slate-200 line-clamp-2">{item.name}</div>
              <div className="flex justify-between items-baseline font-mono mt-1">
                <span className="text-[11px] font-bold text-emerald-400">{currency} {item.unit_retail}</span>
                <span className="text-[9px] text-slate-500">{item.current_stock} left</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RECENT SALES STREAM WITH EDITABLE DATES */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold">Recent Counter Stream</span>
          <span className="text-[10px] text-amber-400 font-mono font-medium flex items-center gap-1">
            <Calendar size={11} /> Click date badge or pencil to edit receipt date
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 font-mono text-xs">
          {recentSales.slice(0, 6).map((sale) => (
            <div key={sale.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium">{sale.items_summary}</span>
                <span className="text-[10px] text-slate-500">({sale.customer_name})</span>

                {/* Editable Date Badge / Input */}
                {editingSaleId === sale.id ? (
                  <div className="flex items-center gap-1 bg-[#0a0d12] border border-amber-500/60 rounded px-1.5 py-0.5">
                    <input
                      type="date"
                      value={tempEditDate}
                      onChange={(e) => setTempEditDate(e.target.value)}
                      className="bg-transparent text-amber-300 text-[10px] font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveSaleDate(sale.id)}
                      className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSaleId(null)}
                      className="text-slate-400 hover:text-slate-200 text-[9px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSaleId(sale.id);
                      setTempEditDate(sale.date || new Date().toISOString().slice(0, 10));
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:border-amber-400 text-[10px] font-mono cursor-pointer transition"
                    title="Click to edit transaction date"
                  >
                    <Calendar size={10} />
                    <span>{sale.date || sale.timestamp.slice(0, 10)}</span>
                    <Edit3 size={9} className="text-amber-400" />
                  </button>
                )}

                <span className="text-[10px] text-slate-500">{sale.timestamp}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  sale.payment_method === "CASH" ? "bg-emerald-500/10 text-emerald-400" : "bg-cyan-500/10 text-cyan-400"
                }`}>
                  {sale.payment_method}
                </span>
                <span className="text-white font-bold">{currency} {sale.total_amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
