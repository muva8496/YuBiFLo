import React, { useState } from "react";
import { 
  ArrowLeft, Hammer, Wrench, Clock, CheckCircle2, AlertTriangle, 
  Sparkles, Layers, Database, ShieldCheck, ArrowRight, Store, 
  Send, Users, HelpCircle, HardHat, FileText, Check
} from "lucide-react";
import { Blueprint } from "../types/alacio";

interface TemplateInDevelopmentViewProps {
  blueprint: Blueprint;
  onBackToLanding: () => void;
  onLaunchAlacioPilot: () => void;
}

export default function TemplateInDevelopmentView({
  blueprint,
  onBackToLanding,
  onLaunchAlacioPilot
}: TemplateInDevelopmentViewProps) {
  const [merchantName, setMerchantName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [locationCity, setLocationCity] = useState("Nairobi");
  const [submittedWaitlist, setSubmittedWaitlist] = useState(false);

  // Roadmap details tailored to each industry
  const getRoadmapForBlueprint = (id: string) => {
    switch (id) {
      case "wholesale_distribution":
        return {
          expectedDelivery: "Sprint 4 (In Progress)",
          progressPercent: 68,
          modules: [
            { name: "Pallet & Carton Broken-Bulk Math", status: "COMPLETED" },
            { name: "Multi-Truck Route Delivery Manifests", status: "COMPLETED" },
            { name: "Driver Cash vs M-Pesa Till In-Route Audit", status: "IN_PROGRESS" },
            { name: "Sub-Distributor 30-Day Credit Aging Ledgers", status: "UPCOMING" }
          ],
          whyDifferent: "Wholesale businesses sell in bulk cartons to other retailers, requiring route manifest tracking and multi-tier distributor pricing rather than single-item consumer counter transactions."
        };
      case "community_pharmacy":
        return {
          expectedDelivery: "Regulatory Sandbox Review",
          progressPercent: 60,
          modules: [
            { name: "First-Expired, First-Out (FEFO) Shelf Dispatching", status: "COMPLETED" },
            { name: "Batch Expiry & Poison Register Log", status: "COMPLETED" },
            { name: "PPB (Pharmacy & Poisons Board) Prescription Trail", status: "IN_PROGRESS" },
            { name: "Controlled Dispensing Cold-Chain Ledger", status: "UPCOMING" }
          ],
          whyDifferent: "Pharmacies require strict batch expiration auditing (FEFO) and regulatory compliance with the Kenya Pharmacy and Poisons Board, preventing standard non-regulated retail schemas."
        };
      case "hardware_construction":
        return {
          expectedDelivery: "Sprint 4 (In Progress)",
          progressPercent: 72,
          modules: [
            { name: "Broken-Bulk Timber (Running Feet) & Nails (Kg)", status: "COMPLETED" },
            { name: "Contractor Project Accounts & Credit Ceilings", status: "COMPLETED" },
            { name: "Sand & Ballast Lorry Trip Verification", status: "IN_PROGRESS" },
            { name: "Bamburi Cement & Steel Rod Dynamic Pricing", status: "UPCOMING" }
          ],
          whyDifferent: "Hardware stores sell materials by running feet, weight, and cubic meters with complex contractor milestone credit, which requires custom dimensional math rather than packaged grocery sales."
        };
      default:
        return {
          expectedDelivery: "In Active Engineering",
          progressPercent: 65,
          modules: [
            { name: "Industry Taxonomy & Schema", status: "COMPLETED" },
            { name: "Core Ledger Architecture", status: "IN_PROGRESS" },
            { name: "Domain-Specific Reconciliation", status: "IN_PROGRESS" },
            { name: "Mobile Pilot Sandbox", status: "UPCOMING" }
          ],
          whyDifferent: "Each industry template has dedicated math engines tailored to its supply chain and business model."
        };
    }
  };

  const roadmap = getRoadmapForBlueprint(blueprint.id);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || !phoneNumber) return;
    setSubmittedWaitlist(true);
  };

  return (
    <div className="min-h-screen bg-[#070e0b] text-slate-100 font-sans p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* TOP NAVIGATION BREADCRUMB */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>&larr; Back to YuBiFlo Blueprints &amp; Templates</span>
        </button>

        <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
          <HardHat size={12} className="animate-bounce" />
          Template Under Construction
        </span>
      </div>

      {/* HERO BANNER: UNDER CONSTRUCTION */}
      <div className="bg-[#0e1713] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Hammer size={22} />
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Industry Blueprint In Active Engineering
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
              {blueprint.name}
            </h1>
            <p className="text-xs sm:text-sm font-mono text-emerald-400">
              Sector: {blueprint.industry} &bull; {blueprint.items_seed_count} Seed Stock Items Defined
            </p>
          </div>

          <div className="bg-[#060c09] border border-slate-800 rounded-2xl p-4 text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Development Status</span>
            <span className="text-sm font-bold text-amber-400 font-mono block mt-0.5">
              {roadmap.expectedDelivery}
            </span>
            <div className="w-36 bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${roadmap.progressPercent}%` }} 
              />
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1 block">
              {roadmap.progressPercent}% Engineered
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
          {blueprint.description}
        </p>

        {/* IMPORTANT ARCHITECTURAL EXPLANATION */}
        <div className="p-4 bg-[#070e0a] border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white font-serif">
              <Store size={15} className="text-emerald-400" />
              <span>Looking for the Live Operating Demonstration?</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-2xl">
              Our <strong>Retail Duka &amp; FMCG (Direct-to-Consumer)</strong> blueprint is currently live in production for our verified client pilot. 
              The <em>{blueprint.name}</em> template you selected is being tailored for its own unique industry workflows.
            </p>
          </div>

          <button
            onClick={onLaunchAlacioPilot}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0 font-mono"
          >
            <span>Launch Retail B2C Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ROADMAP & TAILORED DOMAIN MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: WHAT WE ARE BUILDING */}
        <div className="bg-[#0e1713] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wrench size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Engineering Pipeline for {blueprint.name}
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{roadmap.whyDifferent}"
          </p>

          <div className="space-y-2.5 pt-2">
            {roadmap.modules.map((mod, idx) => (
              <div 
                key={idx}
                className="p-3 bg-[#060c09] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
              >
                <span className="text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {mod.name}
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  mod.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : mod.status === "IN_PROGRESS"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {mod.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: EARLY PILOT ACCESS WAITLIST FORM */}
        <div className="bg-[#0e1713] border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Request Early Pilot Sandbox Access
              </h3>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Are you operating a {blueprint.industry.toLowerCase()} business in Kenya? Register to be onboarded when this template's pilot opens.
            </p>

            {submittedWaitlist ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-xs space-y-2 mt-4 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-400 font-mono">
                  <CheckCircle2 size={16} /> Priority Slot Registered!
                </div>
                <p className="text-slate-300">
                  Thank you, <strong>{merchantName}</strong> ({businessName || "Your business"}). 
                  We have added <strong>{phoneNumber}</strong> ({locationCity}) to the private beta for the <strong>{blueprint.name}</strong> blueprint.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3 mt-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px] uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. John Kamau / Sarah Mutua"
                    className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[10px] uppercase">Business / Shop Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Hardware Ltd"
                      className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[10px] uppercase">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-[10px] uppercase">Location / Market</label>
                  <input
                    type="text"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    placeholder="e.g. Nairobi Gikomba / Machakos / Eldoret"
                    className="w-full bg-[#060c09] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow mt-2"
                >
                  <Send size={14} /> Request Pilot Sandbox Slot
                </button>
              </form>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
            Zero commitment &bull; Free sandbox onboarding when ready
          </div>
        </div>
      </div>

    </div>
  );
}
