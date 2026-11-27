import React, { useState } from "react";
import {
  Building2,
  ArrowRight,
  Plus,
  X,
  Activity,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Crown
} from "lucide-react";
import type { UserAccount } from "../services/accountManagementService";
import type { UserProfile } from "../services/authSessionService";

interface BusinessChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  accounts: UserAccount[];
  activeAccountId: string;
  isPlatformOwner: boolean;
  onSelectBusiness: (accountId: string) => void;
  onCreateBusiness: (
    businessName: string,
    businessType: string,
    options?: { proprietorName?: string }
  ) => void;
  onOpenAdminBackend?: () => void;
  onExploreDemo?: () => void;
  onSignOut?: () => void;
}

function formatRelativeDate(iso?: string): string {
  if (!iso) return "Ready";
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "Ready";
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 2) return "Active recently";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays <= 30) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function BusinessChooserModal({
  isOpen,
  onClose,
  user,
  accounts,
  activeAccountId,
  isPlatformOwner,
  onSelectBusiness,
  onCreateBusiness,
  onOpenAdminBackend,
  onExploreDemo,
  onSignOut
}: BusinessChooserModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizType, setNewBizType] = useState("Retail / Duka");
  const [newProprietor, setNewProprietor] = useState("");

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    onCreateBusiness(newBizName.trim(), newBizType, {
      proprietorName: newProprietor.trim() || user?.firstName || "Owner"
    });
    setNewBizName("");
    setNewProprietor("");
    setShowCreateForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#081221]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#F8FBFF] border border-[#C8D9EA] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-[#0B1B32] my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#DCE7F3] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1A56DB] uppercase tracking-wider">
              <Building2 size={14} />
              <span>Managed Businesses</span>
              {isPlatformOwner && (
                <span className="text-[#996515] font-semibold">· Site Owner Session</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#0B1B32] tracking-tight">
              Choose which business to open
            </h2>
            <p className="text-xs text-[#475569]">
              Signed in as <strong className="text-[#0B1B32]">{user?.email || "owner"}</strong>. Select a workspace below instead of jumping straight into a single dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Close chooser"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Backend Spotlight Banner (Site Owner Only) */}
        {isPlatformOwner && onOpenAdminBackend && (
          <div className="mx-6 mt-5 p-4 rounded-2xl bg-[#0B1B32] text-white border border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#F5D061] uppercase tracking-wider">
                <Activity size={13} />
                <span>Platform Owner Backend</span>
              </div>
              <div className="text-sm font-bold text-white">
                View Signed-Up Businesses &amp; Site Usage Performance
              </div>
              <p className="text-[11px] text-slate-300">
                Inspect signup growth, active modules, sync latency &amp; health scores — with zero access to private merchant ledgers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminBackend();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5D061] to-[#E5B842] hover:from-[#FFE082] hover:to-[#F5D061] text-[#0B1B32] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition shadow-sm"
            >
              <span>Open Admin Backend</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Managed Businesses List */}
        <div className="p-6 space-y-3 max-h-[52vh] overflow-y-auto">
          {accounts.map((acc) => {
            const isClientManaged =
              acc.role === "MANAGER" || acc.businessName.toLowerCase().includes("alacio");
            const isLastSelected = acc.id === activeAccountId;

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  onSelectBusiness(acc.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl bg-white border transition flex items-center justify-between gap-4 cursor-pointer group ${
                  isLastSelected
                    ? "border-[#1A56DB]/50 hover:border-[#1A56DB] shadow-xs"
                    : "border-[#D8E4F0] hover:border-[#1A56DB] hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-black text-base shrink-0 ${
                      isClientManaged
                        ? "bg-[#EBF3FC] text-[#1A56DB] border border-[#C8D9EA]"
                        : "bg-[#FDF5E2] text-[#996515] border border-[#E6CF8B]"
                    }`}
                  >
                    {acc.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-base text-[#0B1B32] truncate">
                        {acc.businessName}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#475569] inline-flex items-center gap-1">
                        {isClientManaged ? (
                          <>
                            <UserCheck size={11} className="text-[#1A56DB]" />
                            <span>Client ({acc.proprietorName || "Rose"}) &middot; Managed</span>
                          </>
                        ) : (
                          <>
                            <Crown size={11} className="text-[#C8962E]" />
                            <span>Owner ({acc.proprietorName || "Direct"})</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] flex items-center gap-2 flex-wrap">
                      <span>{acc.businessType}</span>
                      <span>&middot;</span>
                      <span className="font-mono text-[11px]">
                        Last active: {formatRelativeDate(acc.lastAccessedAt)}
                      </span>
                      {isLastSelected && (
                        <>
                          <span>&middot;</span>
                          <span className="text-[#1A56DB] font-semibold text-[11px]">Last opened</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F0F6FC] group-hover:bg-[#1A56DB] text-[#0B1B32] group-hover:text-white font-semibold text-xs transition">
                  <span>Open</span>
                  <ArrowRight size={13} />
                </div>
              </button>
            );
          })}

          {accounts.length === 0 && (
            <div className="p-6 text-center bg-white rounded-2xl border border-[#DCE7F3] text-xs text-[#64748B]">
              No business workspaces configured yet. Create your first business below.
            </div>
          )}

          {/* Create New Business Inline Form */}
          {showCreateForm ? (
            <form
              onSubmit={handleCreateSubmit}
              className="p-4 rounded-2xl bg-white border border-[#1A56DB]/40 space-y-3 mt-2"
            >
              <div className="text-xs font-bold text-[#0B1B32]">Add a New Managed Business</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Neema Provision Store"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1A56DB]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Proprietor Name
                  </label>
                  <input
                    type="text"
                    value={newProprietor}
                    onChange={(e) => setNewProprietor(e.target.value)}
                    placeholder="e.g. Owner / Manager"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1A56DB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Business Type
                </label>
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#1A56DB]"
                >
                  <option value="Retail / Duka">Retail / Duka (FMCG)</option>
                  <option value="Open Eatery & Roadside Kiosk">Open Eatery &amp; Roadside Kiosk</option>
                  <option value="Wholesale & Cargo Depot">Wholesale &amp; Cargo Depot</option>
                  <option value="Hardware & Building Supplies">Hardware &amp; Building Supplies</option>
                  <option value="Pharmacy & Chemist">Pharmacy &amp; Chemist</option>
                  <option value="Agrovet & Farm Inputs">Agrovet &amp; Farm Inputs</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Create &amp; Open
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-[#9BB6D3] hover:border-[#1A56DB] hover:bg-white text-[#1A56DB] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Another Business to Manage</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#DCE7F3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#64748B]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Each workspace stays isolated in its own encrypted vault.</span>
          </div>

          <div className="flex items-center gap-3">
            {onExploreDemo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreDemo();
                }}
                className="text-xs font-semibold text-[#0B1B32] hover:text-[#1A56DB] flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={13} className="text-[#C8962E]" />
                <span>Explore Public Demo</span>
              </button>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
