import React, { useState, useEffect } from "react";
import { Calendar, Clock, Sparkles, CheckCircle2, History } from "lucide-react";

interface EvidentialDatePickerProps {
  label?: string;
  sublabel?: string;
  value: string; // ISO string or YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (isoString: string) => void;
  required?: boolean;
  id?: string;
  compact?: boolean;
  accentColor?: "emerald" | "cyan" | "indigo" | "amber" | "rose";
}

export const EvidentialDatePicker: React.FC<EvidentialDatePickerProps> = ({
  label = "Transaction & Evidential Date",
  sublabel = "Vital for accurate cashflow, velocity, and business growth auditing",
  value,
  onChange,
  required = true,
  id = "evidential-date-picker",
  compact = false,
  accentColor = "emerald",
}) => {
  // Convert value to a valid date object
  const parseToValidDate = (val: string): Date => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const currentDate = parseToValidDate(value);

  // Format helper for YYYY-MM-DD and HH:mm
  const toDateInputVal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toTimeInputVal = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const [datePart, setDatePart] = useState<string>(toDateInputVal(currentDate));
  const [timePart, setTimePart] = useState<string>(toTimeInputVal(currentDate));
  const [activePreset, setActivePreset] = useState<"TODAY" | "YESTERDAY" | "2DAYS" | "CUSTOM">("TODAY");

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const d = parseToValidDate(value);
      const newDatePart = toDateInputVal(d);
      const newTimePart = toTimeInputVal(d);
      setDatePart(newDatePart);
      setTimePart(newTimePart);

      const todayStr = toDateInputVal(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toDateInputVal(yesterday);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysStr = toDateInputVal(twoDaysAgo);

      if (newDatePart === todayStr) {
        setActivePreset("TODAY");
      } else if (newDatePart === yesterdayStr) {
        setActivePreset("YESTERDAY");
      } else if (newDatePart === twoDaysStr) {
        setActivePreset("2DAYS");
      } else {
        setActivePreset("CUSTOM");
      }
    }
  }, [value]);

  const emitCombinedDate = (dStr: string, tStr: string) => {
    try {
      const [y, m, d] = dStr.split("-").map(Number);
      const [h, min] = tStr.split(":").map(Number);
      const combined = new Date(y, m - 1, d, h || 0, min || 0, 0);
      onChange(combined.toISOString());
    } catch {
      onChange(new Date().toISOString());
    }
  };

  const handleDateChange = (newDate: string) => {
    setDatePart(newDate);
    setActivePreset("CUSTOM");
    emitCombinedDate(newDate, timePart);
  };

  const handleTimeChange = (newTime: string) => {
    setTimePart(newTime);
    emitCombinedDate(datePart, newTime);
  };

  const handleSetPreset = (preset: "TODAY" | "YESTERDAY" | "2DAYS") => {
    const target = new Date();
    if (preset === "YESTERDAY") {
      target.setDate(target.getDate() - 1);
    } else if (preset === "2DAYS") {
      target.setDate(target.getDate() - 2);
    }
    const dStr = toDateInputVal(target);
    const tStr = toTimeInputVal(target);
    setDatePart(dStr);
    setTimePart(tStr);
    setActivePreset(preset);
    emitCombinedDate(dStr, tStr);
  };

  // Formatted human preview
  const formattedPreview = (() => {
    try {
      const [y, m, d] = datePart.split("-").map(Number);
      const [h, min] = timePart.split(":").map(Number);
      const dt = new Date(y, m - 1, d, h || 0, min || 0);
      return dt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return datePart;
    }
  })();

  const colorStyles = {
    emerald: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20",
      accent: "text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      btnActive: "bg-emerald-600 text-white font-bold shadow-sm",
    },
    cyan: {
      border: "border-cyan-500/40",
      bg: "bg-cyan-950/20",
      accent: "text-cyan-400",
      badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
      btnActive: "bg-cyan-600 text-white font-bold shadow-sm",
    },
    indigo: {
      border: "border-indigo-500/40",
      bg: "bg-indigo-950/20",
      accent: "text-indigo-400",
      badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
      btnActive: "bg-indigo-600 text-white font-bold shadow-sm",
    },
    amber: {
      border: "border-amber-500/40",
      bg: "bg-amber-950/20",
      accent: "text-amber-400",
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      btnActive: "bg-amber-600 text-slate-950 font-bold shadow-sm",
    },
    rose: {
      border: "border-rose-500/40",
      bg: "bg-rose-950/20",
      accent: "text-rose-400",
      badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
      btnActive: "bg-rose-600 text-white font-bold shadow-sm",
    },
  }[accentColor];

  return (
    <div id={id} className={`rounded-xl border ${colorStyles.border} ${colorStyles.bg} p-3 space-y-2.5`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className={`text-xs font-bold text-slate-200 flex items-center gap-1.5`}>
            <Calendar className={`w-3.5 h-3.5 ${colorStyles.accent}`} />
            <span>{label} {required && <span className="text-rose-400">*</span>}</span>
          </label>
          {sublabel && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {sublabel}
            </p>
          )}
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleSetPreset("TODAY")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              activePreset === "TODAY"
                ? colorStyles.btnActive
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset("YESTERDAY")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              activePreset === "YESTERDAY"
                ? colorStyles.btnActive
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset("2DAYS")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              activePreset === "2DAYS"
                ? colorStyles.btnActive
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            2 Days Ago
          </button>
        </div>
      </div>

      {/* Date & Time Picker Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        {/* Date Input */}
        <div className="sm:col-span-7 relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <input
            type="date"
            value={datePart}
            onChange={(e) => handleDateChange(e.target.value)}
            required={required}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none transition-all"
          />
        </div>

        {/* Time Input */}
        <div className="sm:col-span-5 relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none text-slate-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <input
            type="time"
            value={timePart}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Evidential Audit Stamp Bar */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-400 font-mono">
        <span className="flex items-center gap-1 truncate">
          <CheckCircle2 className={`w-3 h-3 ${colorStyles.accent} shrink-0`} />
          <span className="text-slate-300 font-medium">Record Stamp:</span>
          <span className="text-white font-semibold">{formattedPreview}</span>
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 hidden sm:inline">
          Evidential Audit Verified
        </span>
      </div>
    </div>
  );
};
