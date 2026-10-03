import React, { useState } from "react";
import { 
  X, BarChart2, ShieldCheck, RefreshCw, Check, Plus, 
  Trash2, Phone, MapPin, Search, ArrowUpDown, Filter, Sparkles
} from "lucide-react";
import { 
  BusinessBlueprintConfig, 
  BusinessWaitlistRequest, 
  BlueprintStatus,
  saveBlueprintsConfig,
  DEFAULT_BLUEPRINTS_CONFIG
} from "../services/alacioStorage";

interface AdminDemandRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprints: BusinessBlueprintConfig[];
  requests: BusinessWaitlistRequest[];
  onUpdateBlueprints: (updated: BusinessBlueprintConfig[]) => void;
}

export default function AdminDemandRadarModal({
  isOpen,
  onClose,
  blueprints,
  requests,
  onUpdateBlueprints
}: AdminDemandRadarModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newBizName, setNewBizName] = useState("");
  const [newBizStatus, setNewBizStatus] = useState<BlueprintStatus>("request");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Calculate count of requests per business type, sorted high to low
  const countsByBusinessType: Record<string, number> = {};
  requests.forEach((req) => {
    const key = req.businessType.trim() || "Uncategorized";
    countsByBusinessType[key] = (countsByBusinessType[key] || 0) + 1;
  });

  const sortedDemand = Object.entries(countsByBusinessType)
    .map(([type, count]) => {
      // Find matching blueprint if any
      const matchingBp = blueprints.find(
        (b) => b.name.toLowerCase().includes(type.toLowerCase()) || type.toLowerCase().includes(b.name.toLowerCase())
      );
      return {
        businessType: type,
        count,
        status: matchingBp ? matchingBp.status : "request"
      };
    })
    .sort((a, b) => b.count - a.count);

  const maxCount = sortedDemand[0]?.count || 1;

  // Update a blueprint status without code changes
  const handleStatusChange = (id: string, newStatus: BlueprintStatus) => {
    const updated = blueprints.map((bp) => {
      if (bp.id === id) {
        return { ...bp, status: newStatus };
      }
      return bp;
    });
    onUpdateBlueprints(updated);
    saveBlueprintsConfig(updated);
    setSavedNote(`Updated status to "${newStatus}"! Saved to persistence.`);
    setTimeout(() => setSavedNote(null), 3500);
  };

  // Add custom new business type
  const handleAddNewBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const newBp: BusinessBlueprintConfig = {
      id: `bp_custom_${Date.now()}`,
      name: newBizName.trim(),
      status: newBizStatus,
      description: "Custom owner-requested industry blueprint.",
      tagline: "Requested by shop owners"
    };

    const updated = [...blueprints, newBp];
    onUpdateBlueprints(updated);
    saveBlueprintsConfig(updated);
    setNewBizName("");
    setIsAddingNew(false);
    setSavedNote(`Added "${newBp.name}" to blueprints list.`);
    setTimeout(() => setSavedNote(null), 3500);
  };

  // Reset to default list
  const handleResetToDefaults = () => {
    if (confirm("Reset blueprints list to defaults?")) {
      onUpdateBlueprints(DEFAULT_BLUEPRINTS_CONFIG);
      saveBlueprintsConfig(DEFAULT_BLUEPRINTS_CONFIG);
      setSavedNote("Reset to default blueprints config.");
      setTimeout(() => setSavedNote(null), 3500);
    }
  };

  // Filtered requests list
  const filteredRequests = requests.filter((r) => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-[#0a1410] border-2 border-emerald-500/50 w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-6 text-xs font-sans shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono">
                <BarChart2 size={18} />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
                Demand Radar &amp; Blueprint Config (Admin View)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live owner requests count sorted high to low. Edit blueprint statuses directly to update cards without code changes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer transition"
          >
            <X size={20} />
          </button>
        </div>

        {savedNote && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>{savedNote}</span>
          </div>
        )}

        {/* METRICS SUMMARY ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#060c09] border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Requests Received</span>
            <strong className="text-2xl text-emerald-400 font-serif font-black">{requests.length}</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">From shop owners across Kenya</span>
          </div>

          <div className="p-4 bg-[#060c09] border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Top Requested Category</span>
            <strong className="text-xl text-amber-400 font-serif font-bold truncate block">
              {sortedDemand[0]?.businessType || "Hardware"}
            </strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {sortedDemand[0]?.count || 0} owner submissions
            </span>
          </div>

          <div className="p-4 bg-[#060c09] border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Configured Blueprints</span>
            <strong className="text-2xl text-white font-serif font-bold">{blueprints.length}</strong>
            <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
              {blueprints.filter(b => b.status === "live").length} Live &bull; {blueprints.filter(b => b.status === "next").length} Next
            </span>
          </div>
        </div>

        {/* SECTION 1: COUNT OF REQUESTS PER BUSINESS TYPE (SORTED HIGH TO LOW) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-amber-400" /> Requests Per Business Type (High &rarr; Low)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Sorted by demand frequency
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sortedDemand.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 bg-[#060c09] border border-slate-800/90 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 truncate flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 w-4">#{idx + 1}</span>
                    {item.businessType}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {item.count} {item.count === 1 ? "request" : "requests"}
                    </span>
                  </div>
                </div>

                {/* Demand Bar */}
                <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(12, (item.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: ADMIN EDITABLE BLUEPRINT STATUS CONFIG */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Blueprint Status Manager
              </span>
              <p className="text-[11px] text-slate-400">
                Change status of any card on the landing page instantly without code updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="px-3 py-1.5 bg-[#0f2117] hover:bg-[#152e20] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Business
              </button>
              <button
                onClick={handleResetToDefaults}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-mono cursor-pointer"
                title="Reset to 13 default blueprints"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* ADD NEW BUSINESS FORM */}
          {isAddingNew && (
            <form onSubmit={handleAddNewBusiness} className="p-3 bg-[#060c09] border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold block">Add New Industry Blueprint:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Chemist, Bookshop, Cyber"
                  className="sm:col-span-2 bg-[#0a1510] border border-slate-700 rounded-lg p-2 text-white"
                />
                <select
                  value={newBizStatus}
                  onChange={(e: any) => setNewBizStatus(e.target.value)}
                  className="bg-[#0a1510] border border-slate-700 rounded-lg p-2 text-white font-bold"
                >
                  <option value="live">Available now (live)</option>
                  <option value="next">Coming next (next)</option>
                  <option value="soon">Coming soon (soon)</option>
                  <option value="request">Tell us you need this (request)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Save Business
                </button>
              </div>
            </form>
          )}

          {/* BLUEPRINTS STATUS EDIT TABLE */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060c09] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Business Name</th>
                  <th className="p-2.5">Status (Landing Page)</th>
                  <th className="p-2.5 text-right">Card Button Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#070e0a]">
                {blueprints.map((bp) => (
                  <tr key={bp.id} className="hover:bg-[#0c1611]">
                    <td className="p-2.5 font-bold text-white">{bp.name}</td>
                    <td className="p-2.5">
                      <select
                        value={bp.status}
                        onChange={(e: any) => handleStatusChange(bp.id, e.target.value)}
                        className={`rounded px-2 py-1 text-[11px] font-bold border cursor-pointer focus:outline-none ${
                          bp.status === "live"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : bp.status === "next"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : bp.status === "soon"
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        <option value="live">Available now (live)</option>
                        <option value="next">Coming next (next)</option>
                        <option value="soon">Coming soon (soon)</option>
                        <option value="request">Tell us you need this (request)</option>
                      </select>
                    </td>
                    <td className="p-2.5 text-right text-slate-400 text-[11px]">
                      {bp.status === "live" && "Start free with VCR"}
                      {bp.status === "next" && "Join the waitlist"}
                      {bp.status === "soon" && "Join the waitlist"}
                      {bp.status === "request" && "Request this app"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: COMPLETE OWNER REQUESTS LOG */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Owner Submissions ({filteredRequests.length})
            </span>

            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, town, business..."
                className="w-full bg-[#060c09] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060c09] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Owner Name</th>
                  <th className="p-2.5">Business Type</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Phone / Contact</th>
                  <th className="p-2.5 text-right">Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#070e0a]">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#0c1611]">
                    <td className="p-2.5 font-bold text-white">{req.name}</td>
                    <td className="p-2.5 text-amber-300 font-semibold">{req.businessType}</td>
                    <td className="p-2.5 text-slate-300">{req.location}</td>
                    <td className="p-2.5 text-slate-400">{req.phone}</td>
                    <td className="p-2.5 text-right">
                      {req.consent ? (
                        <span className="text-emerald-400 font-bold">✓ Consented</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Close Admin View
          </button>
        </div>

      </div>
    </div>
  );
}
