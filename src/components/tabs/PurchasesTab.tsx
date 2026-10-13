import React, { useState } from "react";
import { 
  ShoppingBag, Plus, Truck, Calendar, DollarSign, CheckCircle2, 
  Layers, ArrowUpRight, Search, Filter, AlertCircle, RefreshCw
} from "lucide-react";
import { AlacioMasterState } from "../../types/alacio";

interface PurchasesTabProps {
  state: AlacioMasterState;
  onLogPurchase?: (purchase: {
    supplier: string;
    items: string;
    amount: number;
    payment_channel: "CASH" | "MPESA" | "SUPPLIER_CREDIT";
    date: string;
    notes?: string;
  }) => void;
}

export default function PurchasesTab({ state, onLogPurchase }: PurchasesTabProps) {
  const { currency, inventory = [], suppliers = [], payouts = [] } = state;

  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.name || "Brookside Dairy");
  const [itemsSummary, setItemsSummary] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [paymentChannel, setPaymentChannel] = useState<"CASH" | "MPESA" | "SUPPLIER_CREDIT">("MPESA");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Derive purchases from payouts and state
  const supplierPurchases = payouts.filter(p => p.type === "SUPPLIER_PAYOUT");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseAmount);
    if (!amount || amount <= 0) return;

    if (onLogPurchase) {
      onLogPurchase({
        supplier: selectedSupplier,
        items: itemsSummary || "Assorted Retail Stock",
        amount,
        payment_channel: paymentChannel,
        date: purchaseDate,
        notes
      });
    }

    setSuccessNote(`Logged purchase of ${currency} ${amount.toLocaleString()} from ${selectedSupplier}`);
    setIsAddingPurchase(false);
    setPurchaseAmount("");
    setItemsSummary("");
    setNotes("");
    setTimeout(() => setSuccessNote(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans text-[#E2ECF3]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182C40] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <ShoppingBag className="text-cyan-400" size={22} /> Purchases &amp; Inbound Cargo
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E3A5F] text-[#38BDF8] border border-[#2D5577]">
              Restock Ledgers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Log inventory restocks and wholesale deliveries. Each new batch arrives as evidence previous stock cleared.
          </p>
        </div>

        <button
          onClick={() => setIsAddingPurchase(true)}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-2 self-start cursor-pointer shadow-lg shadow-blue-900/30"
        >
          <Plus size={15} /> Add Purchase
        </button>
      </div>

      {successNote && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* QUICK LOG MODAL */}
      {isAddingPurchase && (
        <div className="bg-[#0E1A29] border-2 border-[#1E3A5F] rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Plus size={16} className="text-cyan-400" /> Record Inbound Purchase
            </h3>
            <button onClick={() => setIsAddingPurchase(false)} className="text-slate-400 hover:text-white text-xs font-mono">
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Supplier / Distributor</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                  <option value="Broadway Bakeries">Broadway Bakeries</option>
                  <option value="Brookside Dairy">Brookside Dairy</option>
                  <option value="Unga Millers Ltd">Unga Millers Ltd</option>
                  <option value="General Wholesaler">General Wholesaler</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Total Cost Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="e.g. 4200"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Items Included</label>
                <input
                  type="text"
                  required
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="e.g. 2 Crates Milk (48 pkts), 20 Loaves Bread"
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Payment Channel</label>
                <select
                  value={paymentChannel}
                  onChange={(e) => setPaymentChannel(e.target.value as any)}
                  className="w-full bg-[#080D15] border border-[#182C40] rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="MPESA">M-Pesa Buy Goods / Till</option>
                  <option value="CASH">Cash Drawer Outflow</option>
                  <option value="SUPPLIER_CREDIT">Supplier Credit (Pay Later)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#182C40]">
              <button
                type="button"
                onClick={() => setIsAddingPurchase(false)}
                className="px-3.5 py-2 bg-[#132337] hover:bg-[#1C324E] text-slate-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono"
              >
                Save Purchase &amp; Update Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PURCHASES LIST */}
      <div className="bg-[#0E1A29] border border-[#182C40] rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#182C40] pb-2">
          <span className="text-xs font-bold text-white font-mono uppercase">
            Recent Purchases &amp; Deliveries ({supplierPurchases.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Total Logged: {currency} {supplierPurchases.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </span>
        </div>

        {supplierPurchases.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <ShoppingBag size={28} className="text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No purchases recorded yet.</p>
            <button
              onClick={() => setIsAddingPurchase(true)}
              className="text-xs text-[#38BDF8] hover:underline font-mono"
            >
              Add your first purchase to build your supply history &rarr;
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#182C40]/60">
            {supplierPurchases.map((purchase) => (
              <div key={purchase.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="text-white font-bold">{purchase.notes || "Supplier Delivery"}</div>
                  <div className="text-[10px] text-slate-400">
                    Channel: {purchase.payment_channel.replace("_", " ")} &bull; {purchase.date}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-400">
                    -{currency} {purchase.amount.toLocaleString()}
                  </span>
                  <span className="text-[9px] block text-slate-500">Paid Inbound</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
