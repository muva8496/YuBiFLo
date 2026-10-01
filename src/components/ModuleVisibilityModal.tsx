import React from "react";
import {
  Sliders,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Shield,
  LayoutDashboard,
  Clock,
  Boxes,
  Users,
  Scale,
  Compass,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  DollarSign,
  Database,
  X,
  Zap,
} from "lucide-react";
import { ALL_MODULE_DEFINITIONS, DEFAULT_VISIBLE_MODULE_IDS, AppStorage } from "../services/storage";

interface ModuleVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleModuleIds: string[];
  onUpdateVisibleModules: (ids: string[]) => void;
  isAdmin: boolean;
  onOpenAdminAuth: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  morning_float: Clock,
  stock: Boxes,
  people: Users,
  reconcile: Scale,
  analytics: Compass,
  sales: TrendingUp,
  money_out: ArrowUpRight,
  restock: RefreshCw,
  ingestion: Receipt,
  cashflow: DollarSign,
  schema: Database,
};

export const ModuleVisibilityModal: React.FC<ModuleVisibilityModalProps> = ({
  isOpen,
  onClose,
  visibleModuleIds,
  onUpdateVisibleModules,
  isAdmin,
  onOpenAdminAuth,
}) => {
  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    // If it's schema and user is not admin, open admin auth
    if (id === "schema" && !isAdmin) {
      onOpenAdminAuth();
      return;
    }

    if (visibleModuleIds.includes(id)) {
      // Must keep at least 1 module
      if (visibleModuleIds.length <= 1) return;
      const updated = visibleModuleIds.filter((m) => m !== id);
      onUpdateVisibleModules(updated);
      AppStorage.saveVisibleModules(updated);
    } else {
      const updated = [...visibleModuleIds, id];
      onUpdateVisibleModules(updated);
      AppStorage.saveVisibleModules(updated);
    }
  };

  const handleApplyPreset = (preset: "essential" | "standard" | "all") => {
    let ids: string[];
    if (preset === "essential") {
      // 4 essential modules
      ids = ["dashboard", "morning_float", "stock", "people"];
    } else if (preset === "standard") {
      // 6 core modules
      ids = [...DEFAULT_VISIBLE_MODULE_IDS];
    } else {
      // All operational modules (+ schema if admin)
      ids = ALL_MODULE_DEFINITIONS.filter((m) => !m.adminOnly || isAdmin).map((m) => m.id);
    }
    onUpdateVisibleModules(ids);
    AppStorage.saveVisibleModules(ids);
  };

  const coreDailyModules = ALL_MODULE_DEFINITIONS.filter((m) => m.category === "CORE_DAILY");
  const operationsModules = ALL_MODULE_DEFINITIONS.filter((m) => m.category === "OPERATIONS");
  const adminModules = ALL_MODULE_DEFINITIONS.filter((m) => m.category === "ADMIN_ONLY");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#121214] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Panga Modules (Appear & Disappear)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold">
                  {visibleModuleIds.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Reduce clutter by toggling modules on or off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset("essential")}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-600 transition-colors"
          >
            ⚡ Minimal (4 Core)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("standard")}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors"
          >
            📦 Standard Retail (6 Core)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("all")}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-600 transition-colors"
          >
            🌐 Expand All
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("standard")}
            className="ml-auto text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            title="Reset to default 6 core modules"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Module List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Group 1: Core Daily Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                1. Core Daily Modules (Essential)
              </span>
              <span className="text-[10px] text-slate-500">Fast 1-tap workflows</span>
            </div>
            <div className="space-y-1.5">
              {coreDailyModules.map((module) => {
                const Icon = ICON_MAP[module.id] || LayoutDashboard;
                const isVisible = visibleModuleIds.includes(module.id);
                return (
                  <div
                    key={module.id}
                    onClick={() => handleToggle(module.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isVisible
                        ? "bg-slate-900/80 border-slate-700 hover:border-slate-600 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          isVisible ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold leading-tight truncate">{module.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {module.shengLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{module.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ml-2 transition-colors ${
                        isVisible
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Operational & Advanced Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                2. Operational & Deep Dive Modules
              </span>
              <span className="text-[10px] text-slate-500">Detailed ledgers & OCR tools</span>
            </div>
            <div className="space-y-1.5">
              {operationsModules.map((module) => {
                const Icon = ICON_MAP[module.id] || LayoutDashboard;
                const isVisible = visibleModuleIds.includes(module.id);
                return (
                  <div
                    key={module.id}
                    onClick={() => handleToggle(module.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isVisible
                        ? "bg-slate-900/80 border-slate-700 hover:border-slate-600 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          isVisible ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold leading-tight truncate">{module.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {module.shengLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{module.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ml-2 transition-colors ${
                        isVisible
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 3: Admin Only Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> 3. Admin Only Modules
              </span>
              <span className="text-[10px] text-slate-500">Restricted schema access</span>
            </div>
            <div className="space-y-1.5">
              {adminModules.map((module) => {
                const Icon = ICON_MAP[module.id] || Database;
                const isVisible = visibleModuleIds.includes(module.id);
                return (
                  <div
                    key={module.id}
                    onClick={() => handleToggle(module.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isVisible
                        ? "bg-slate-900/80 border-rose-500/40 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          isVisible ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold leading-tight truncate">{module.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 font-mono font-bold border border-rose-900/40">
                            ADMIN ONLY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {isAdmin ? module.desc : "Requires Admin PIN unlock (2031) to view or toggle"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ml-2 transition-colors ${
                        !isAdmin
                          ? "bg-slate-800 text-amber-400 border border-slate-700 hover:bg-slate-700"
                          : isVisible
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {!isAdmin ? (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          <span>Unlock PIN</span>
                        </>
                      ) : isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Changes save automatically and update the navigation bar immediately.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
