import React from "react";
import { X, FileText, CheckCircle2, Shield, ArrowRight, Lock, KeyRound } from "lucide-react";

interface PrdViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWorkspace: () => void;
}

export default function PrdViewerModal({
  isOpen,
  onClose,
  onLaunchWorkspace
}: PrdViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e4e4e7] text-[#222222] overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#000000] text-white flex items-center justify-center shadow-xs">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B8860B] bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#EADBBD]">
                  OFFICIAL SPECIFICATION
                </span>
                <span className="text-xs text-[#666666]">v2.4 Approved</span>
              </div>
              <h2 className="text-xl font-serif font-black text-[#000000]">
                YuBiFLo Product Requirements Document (PRD)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable PRD Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs sm:text-sm text-[#444444] leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-[#000000] border-b border-[#e5e7eb] pb-1">
              1. Executive Summary &amp; The &ldquo;Business Is A Flower&rdquo; Metaphor
            </h3>
            <p>
              YuBiFLo operates on a core organic metaphor: <strong>Your Business Is A Flower</strong>. Micro-merchants in emerging markets rarely fail because of lack of grit—they fail due to <em>cash drift and operational blindness</em>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7]">
                <strong className="text-[#000000] block mb-1">Soil &amp; Roots</strong>
                <span>The morning till float, M-Pesa balances, and supplier trust that anchor the shop.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7]">
                <strong className="text-[#000000] block mb-1">The 5 Blooming Petals</strong>
                <span>Profit, Cash &amp; Float, Debts (Deni), Shelf Stock, and Supplier Invoices.</span>
              </div>
            </div>
          </section>

          {/* Section 2: How a Client Moves in the App */}
          <section className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-[#000000] border-b border-[#e5e7eb] pb-1">
              2. How a Client Moves in the App (End-to-End User Journey)
            </h3>
            <p>
              The journey is engineered to match the natural rhythm of an East African retail shopkeeper without requiring typing or desks:
            </p>

            <div className="space-y-3 font-sans">
              
              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">1</span>
                  <strong className="text-base font-serif text-[#000000]">Landing &amp; Discovery</strong>
                </div>
                <p className="text-xs text-[#555555]">
                  The merchant visits YuBiFLo, views the Business Bloom signature graphic, watches the real-time VCR ticker convert heard sales into ledger items, and selects their specific trade (Duka, Hardware, or Wholesale).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#B8860B] text-white flex items-center justify-center font-bold text-xs">2</span>
                  <strong className="text-base font-serif text-[#996515]">Passcode &ldquo;8496&rdquo; Gated Security</strong>
                </div>
                <p className="text-xs text-[#555555]">
                  When opening the client workspace, an isolated security modal prompts for passcode <strong>8496</strong>. This prevents public data leakage and ensures zero exposure of customer debts or margins.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">3</span>
                  <strong className="text-base font-serif text-[#000000]">Dawn Float Lock (05:57 AM)</strong>
                </div>
                <p className="text-xs text-[#555555]">
                  Before the metal counter shutters lift, the shopkeeper counts drawer coins/notes and checks the M-Pesa till. Tapping &ldquo;Lock Dawn Baseline&rdquo; stamps the opening balance so all later sales belong strictly to today.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">4</span>
                  <strong className="text-base font-serif text-[#000000]">Midday Counter Selling (VCR Voice Cash Register)</strong>
                </div>
                <p className="text-xs text-[#555555]">
                  During fast counter rushes, the owner speaks sales naturally (&ldquo;Sold 2 milk, 1 bread cash 200&rdquo;). VCR auto-deducts inventory, records till cash, and discards audio immediately. Customer credit (Deni) is logged with 1-tap WhatsApp reminder capabilities.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">5</span>
                  <strong className="text-base font-serif text-[#000000]">Evening Cash Reconciliation &amp; Bloom Score</strong>
                </div>
                <p className="text-xs text-[#555555]">
                  At night, the merchant closes shutters and reconciles the drawer. Any unexplained difference presents two simple chips: <em>Personal (Drawing)</em> vs <em>Business (Expense)</em>. The Business Bloom score updates to reflect clean trading health.
                </p>
              </div>

            </div>
          </section>

          {/* Section 3: Architecture & Privacy */}
          <section className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-[#000000] border-b border-[#e5e7eb] pb-1">
              3. Privacy, VCR Audio Discard &amp; Kenya Data Protection
            </h3>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Zero Audio Storage:</strong> Spoken audio is processed in memory to extract item names and numbers, and deleted immediately. We keep the numbers, not the conversations.</li>
              <li><strong>Tenant Cryptographic Isolation:</strong> Each merchant operates in a dedicated, passcode-protected vault.</li>
              <li><strong>Offline Persistence:</strong> Operates 100% offline via local storage and standalone exportable PWA.</li>
            </ul>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e5e7eb] bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#666666]">
            <Lock size={14} className="text-[#000000]" />
            <span>Passcode: <strong>8496</strong> required for client workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#444444] font-semibold text-xs transition"
            >
              Close Document
            </button>
            <button
              onClick={() => {
                onClose();
                onLaunchWorkspace();
              }}
              className="px-5 py-2 rounded-full bg-[#000000] hover:bg-[#171717] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <span>Enter Workspace</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
