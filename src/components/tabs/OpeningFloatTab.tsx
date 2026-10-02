import React, { useState } from "react";
import { Clock, Check, RefreshCw, Coins, ShieldCheck, CheckCircle2 } from "lucide-react";
import { FloatDenomination } from "../../types/alacio";

interface OpeningFloatTabProps {
  currency: string;
  denominations: FloatDenomination[];
  onUpdateDenominations: (updated: FloatDenomination[]) => void;
}

export default function OpeningFloatTab({ currency, denominations, onUpdateDenominations }: OpeningFloatTabProps) {
  const [localDenoms, setLocalDenoms] = useState<FloatDenomination[]>(denominations);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCountChange = (index: number, val: string) => {
    const parsed = parseInt(val) || 0;
    const next = [...localDenoms];
    next[index] = { ...next[index], count: Math.max(0, parsed) };
    setLocalDenoms(next);
  };

  const handleIncrement = (index: number, delta: number) => {
    const next = [...localDenoms];
    next[index] = { ...next[index], count: Math.max(0, next[index].count + delta) };
    setLocalDenoms(next);
  };

  const totalCalculated = localDenoms.reduce((acc, d) => acc + d.value * d.count, 0);

  const handleSave = () => {
    onUpdateDenominations(localDenoms);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetToStandardAlacio = () => {
    // 2*200 + 1*100 + 2*50 + 2*20 + 1*10 + 1*5 = 655 KSh
    const standard: FloatDenomination[] = [
      { value: 1000, type: "note", label: "1000 Note", count: 0 },
      { value: 500, type: "note", label: "500 Note", count: 0 },
      { value: 200, type: "note", label: "200 Note", count: 2 },
      { value: 100, type: "note", label: "100 Note", count: 1 },
      { value: 50, type: "note", label: "50 Note", count: 2 },
      { value: 40, type: "coin", label: "40 Coin", count: 0 },
      { value: 20, type: "coin", label: "20 Coin", count: 2 },
      { value: 10, type: "coin", label: "10 Coin", count: 1 },
      { value: 5, type: "coin", label: "5 Coin", count: 1 },
      { value: 1, type: "coin", label: "1 Coin", count: 0 }
    ];
    setLocalDenoms(standard);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-amber-400" size={22} /> 05:57 AM Opening Float Verification
          </h2>
          <p className="text-xs text-slate-400">
            Audit denominations before turning the key. Prevents blending morning change capital with daily operational revenue.
          </p>
        </div>
        <button
          onClick={handleResetToStandardAlacio}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Reset to Alacio Standard (KSh 655)
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-mono">Opening float count sealed! KSh {totalCalculated.toLocaleString()} locked into register memory.</span>
        </div>
      )}

      {/* FLOAT SUMMARY CARD */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs font-mono uppercase text-slate-400 font-bold block">Verified Morning Float Sum</span>
          <div className="text-4xl font-black font-mono text-amber-400 mt-1">
            {currency} {totalCalculated.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalCalculated === 655 ? "✓ Matches verified Alacio benchmark (KSh 655)" : "Custom morning change allocation"}
          </span>
        </div>

        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <ShieldCheck size={16} /> Seal &amp; Save Opening Float
        </button>
      </div>

      {/* DENOMINATIONS TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#161d29] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Denomination</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold text-center">Unit Count</th>
              <th className="py-3 px-4 font-semibold text-right">Subtotal Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {localDenoms.map((d, idx) => (
              <tr key={d.value} className="hover:bg-slate-800/20 transition">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <Coins size={14} className={d.type === "note" ? "text-emerald-400" : "text-amber-400"} />
                  {currency} {d.value}
                </td>
                <td className="py-3 px-4 uppercase text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold ${d.type === "note" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {d.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleIncrement(idx, -1)}
                      className="w-7 h-7 bg-[#0a0d12] hover:bg-slate-800 text-slate-300 rounded border border-slate-700 flex items-center justify-center text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={d.count}
                      onChange={(e) => handleCountChange(idx, e.target.value)}
                      className="w-16 bg-[#0a0d12] border border-slate-700 rounded text-center py-1 text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleIncrement(idx, 1)}
                      className="w-7 h-7 bg-[#0a0d12] hover:bg-slate-800 text-slate-300 rounded border border-slate-700 flex items-center justify-center text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-200">
                  {currency} {(d.value * d.count).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#161d29] border-t border-slate-700 text-white font-bold">
            <tr>
              <td colSpan={3} className="py-3.5 px-4 uppercase text-[11px] text-slate-400">Total Morning Float Verified</td>
              <td className="py-3.5 px-4 text-right text-base text-amber-400">
                {currency} {totalCalculated.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
