import React from "react";
import { 
  X, Mic, ShoppingBag, Sun, Users, BookOpen, Layers, 
  ArrowRight, Sparkles, FileText, Receipt, ArrowLeftRight, DollarSign,
  Truck, Camera
} from "lucide-react";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickDeni?: () => void;
}

export default function QuickCreateModal({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenQuickSale,
  onOpenQuickPurchase,
  onOpenQuickDeni
}: QuickCreateModalProps) {
  if (!isOpen) return null;

  const quickActions = [
    {
      id: "sale",
      title: "Speak or Log a Sale",
      desc: "Fast Cash, Till M-Pesa, or hands-free voice transaction at the counter",
      icon: <Mic className="text-emerald-600" size={20} />,
      badge: "VCR Voice",
      bg: "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200",
      action: () => {
        onClose();
        if (onOpenQuickSale) onOpenQuickSale();
        else onNavigateTab("voice_ledger");
      }
    },
    {
      id: "purchase",
      title: "Log Inbound Cargo & Lots of Goods",
      desc: "Record supplier batches with multiple goods, quantities, and wholesale costs",
      icon: <ShoppingBag className="text-blue-600" size={20} />,
      badge: "Inbound Cargo",
      bg: "bg-blue-50 hover:bg-blue-100/70 border-blue-200",
      action: () => {
        onClose();
        if (onOpenQuickPurchase) onOpenQuickPurchase();
        else onNavigateTab("purchases");
      }
    },
    {
      id: "supplier",
      title: "Register Supplier (Phone & National ID)",
      desc: "Capture counterparty National ID and phone number for agency cash deposits",
      icon: <Truck className="text-cyan-600" size={20} />,
      badge: "Suppliers",
      bg: "bg-cyan-50 hover:bg-cyan-100/70 border-cyan-200",
      action: () => {
        onClose();
        onNavigateTab("suppliers");
      }
    },
    {
      id: "deni",
      title: "Record Customer Deni",
      desc: "Write down neighbor credit (Khata), phone number, and agreed repayment date",
      icon: <BookOpen className="text-purple-600" size={20} />,
      badge: "Customer Khata",
      bg: "bg-purple-50 hover:bg-purple-100/70 border-purple-200",
      action: () => {
        onClose();
        if (onOpenQuickDeni) onOpenQuickDeni();
        else onNavigateTab("customer_deni");
      }
    },
    {
      id: "float",
      title: "05:57 AM Morning Float Count",
      desc: "Count physical cash notes & coins to lock drawer before opening the shop doors",
      icon: <Sun className="text-amber-600" size={20} />,
      badge: "Dawn Lock",
      bg: "bg-amber-50 hover:bg-amber-100/70 border-amber-200",
      action: () => {
        onClose();
        onNavigateTab("dawn_lock");
      }
    },
    {
      id: "stock",
      title: "Add New Product SKU",
      desc: "Register a barcode, break-bulk pack size, wholesale cost, and retail price",
      icon: <Layers className="text-cyan-600" size={20} />,
      badge: "Stock Vault",
      bg: "bg-cyan-50 hover:bg-cyan-100/70 border-cyan-200",
      action: () => {
        onClose();
        onNavigateTab("stock_vault");
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Create New Entry
            </h3>
            <p className="text-xs text-slate-500">
              Select a quick duka operation to record into your live ledgers
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIST OF ACTIONS */}
        <div className="p-4 space-y-2.5 max-h-[75vh] overflow-y-auto">
          {quickActions.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer group ${item.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/80 text-slate-600 rounded border border-slate-200/60 font-semibold">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <ArrowRight size={15} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
