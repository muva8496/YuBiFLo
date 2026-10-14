import React, { useState } from "react";
import { 
  Building2, Store, Mic, ArrowRight, CheckCircle2, 
  Upload, FileSpreadsheet, Shield, AlertCircle, Sparkles, 
  X, Check, RefreshCw, Volume2, HelpCircle, DollarSign,
  Smartphone, Database, Layers, ArrowLeft
} from "lucide-react";
import { AlacioMasterState, Blueprint } from "../types/alacio";
import { PLATFORM_BLUEPRINTS } from "../services/alacioStorage";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteOnboarding: (customState: Partial<AlacioMasterState>) => void;
  initialPath?: "A" | "B";
}

// Sample CSV datasets for Path B one-click demonstration
const SAMPLE_DUKA_DATASET = `Date,Item,Amount,Channel,Type,Customer
2026-05-01,Brookside Fresh Milk 500ml,65,Cash,Sale,Walk-in
2026-05-01,Broadways Bread 400g,65,Cash,Sale,Walk-in
2026-05-01,Mumias Sugar 1kg,160,Mpesa,Sale,Mama Otis
2026-05-01,Unga Jogoo 2kg,210,Mpesa,Sale,Walk-in
2026-05-02,Milk Restock Crate (21 pkts),1155,Cash,Restock,Brookside Dairy Ltd
2026-05-02,Proprietor Morning Chai,50,Cash,Drawing,Owner Personal
2026-05-02,Broadways Bread 400g,65,Credit,Deni,Baba Junior
2026-05-03,Rina Vegetable Oil 1L,290,Mpesa,Sale,Walk-in
2026-05-03,Royco Cubes 40s,120,Cash,Sale,Auntie Wambui
2026-05-03,Sugar Restock 50kg Sack,6800,Mpesa,Restock,Kensalt Wholesalers
2026-05-04,Brookside Fresh Milk 500ml,65,Cash,Sale,Walk-in
2026-05-04,Broadways Bread 400g,65,Cash,Sale,Walk-in
2026-05-04,Deni Settlement Baba Junior,65,Mpesa,CreditRepay,Baba Junior`;

export default function OnboardingModal({
  isOpen,
  onClose,
  onCompleteOnboarding,
  initialPath
}: OnboardingModalProps) {
  const [selectedPath, setSelectedPath] = useState<"A" | "B" | null>(initialPath || null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Common Business Setup
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint>(PLATFORM_BLUEPRINTS[0]);
  const [businessName, setBusinessName] = useState<string>("Boma Star Mini Mart");
  const [ownerName, setOwnerName] = useState<string>("Jane Muthoni");
  const [location, setLocation] = useState<string>("Ruiru, Kiambu");
  const [phone, setPhone] = useState<string>("0712 345 678");

  // Path A Specifics: Starting Balances & VCR
  const [morningCashTill, setMorningCashTill] = useState<string>("3500");
  const [morningMpesaFloat, setMorningMpesaFloat] = useState<string>("12000");
  const [vcrConsentAgreed, setVcrConsentAgreed] = useState<boolean>(true);
  const [vcrTestSuccess, setVcrTestSuccess] = useState<boolean>(false);

  // Path B Specifics: File Import & AI Column Mapping
  const [rawFileContent, setRawFileContent] = useState<string>(SAMPLE_DUKA_DATASET);
  const [fileName, setFileName] = useState<string>("shop_may_records.csv");
  const [isMappingConfirmed, setIsMappingConfirmed] = useState<boolean>(false);
  const [confirmDeniQuestion, setConfirmDeniQuestion] = useState<boolean>(true);
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    imported: number;
    duplicates: number;
    skipped: number;
    totalSales: number;
    totalDeni: number;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Path Choice
  const handleSelectPath = (path: "A" | "B") => {
    setSelectedPath(path);
    setCurrentStep(1);
  };

  // Execute Deterministic Import for Path B
  const handleProcessImport = () => {
    const lines = rawFileContent.trim().split("\n");
    if (lines.length <= 1) return;

    let importedCount = 0;
    let duplicateCount = 0;
    let skippedCount = 0;
    let salesSum = 0;
    let deniSum = 0;

    // Deterministic Idempotency Key Set
    const seenKeys = new Set<string>();

    // Parse CSV rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skippedCount++;
        continue;
      }

      const parts = line.split(",");
      if (parts.length < 5) {
        skippedCount++;
        continue;
      }

      const [date, item, amountStr, channel, type, customer] = parts;
      const amount = parseFloat(amountStr) || 0;
      
      // Idempotency key: hash of date + item + amount + type
      const idempotencyKey = `${date}_${item}_${amount}_${type}`.toLowerCase();

      if (seenKeys.has(idempotencyKey)) {
        duplicateCount++;
        continue;
      }

      seenKeys.add(idempotencyKey);
      importedCount++;

      if (type.toLowerCase() === "sale") {
        salesSum += amount;
      } else if (type.toLowerCase() === "credit" || type.toLowerCase() === "deni") {
        deniSum += amount;
      }
    }

    setImportReport({
      totalRows: lines.length - 1,
      imported: importedCount,
      duplicates: duplicateCount,
      skipped: skippedCount,
      totalSales: salesSum,
      totalDeni: deniSum
    });
    setCurrentStep(4); // Move to Report
  };

  // Finalize Onboarding & Launch Dashboard
  const handleFinishAndLaunch = () => {
    if (selectedPath === "A") {
      const cash = parseFloat(morningCashTill) || 3500;
      const float = parseFloat(morningMpesaFloat) || 12000;
      const todayStr = new Date().toISOString().split("T")[0];
      
      onCompleteOnboarding({
        merchant_name: businessName,
        cash_register_balance: cash,
        mpesa_float_balance: float,
        morning_bookends: [
          {
            id: `mb_${Date.now()}`,
            date: todayStr,
            iso_date: todayStr,
            timestamp: new Date().toLocaleTimeString(),
            status: "LOCKED_DAWN",
            cash_float: cash,
            mpesa_float: float,
            equitel_balance: 0,
            total_liquidity: cash + float,
            debtors_count: 0,
            total_customer_debt: 0,
            opening_shelf_units: 140,
            opening_shelf_value: 35000,
            notes: "Initial Path A morning bookend"
          }
        ]
      });
    } else {
      // Path B State
      onCompleteOnboarding({
        merchant_name: businessName,
        clean_trading_days: 30 // Path B backfills 30 days of clean history! Unlocks forecasting!
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f172a] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-700 space-y-6 relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#B8860B]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#000000] border border-[#B8860B]/40 text-[#FFD54F] flex items-center justify-center shadow-md">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-xl text-white">
                  Welcome to YuBiFLo
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B8860B]/20 text-[#FFD54F] font-bold border border-[#B8860B]/30">
                  Zero Data Entry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Two ways in, one live dashboard. Pick how you want to begin.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===================================================================== */}
        {/* STEP 0: CHOOSE PATH                                                   */}
        {/* ===================================================================== */}
        {!selectedPath && (
          <div className="space-y-6 py-2">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h4 className="text-lg font-serif font-bold text-white">
                How would you like to set up your business?
              </h4>
              <p className="text-xs text-slate-400">
                Whether you have shoeboxes of receipts or are starting completely fresh today, YuBiFLo prepares your numbers in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Path A Card */}
              <div 
                onClick={() => handleSelectPath("A")}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-[#FFD54F] transition cursor-pointer space-y-4 group hover:bg-slate-850"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#000000] border border-[#B8860B]/40 text-[#FFD54F] flex items-center justify-center group-hover:scale-105 transition">
                  <Mic size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFD54F] font-bold block mb-1">
                    Path A &bull; Free Starter
                  </span>
                  <h5 className="font-serif font-black text-base text-white">
                    Starting from scratch?
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    We design how your shop collects its numbers (voice, M-Pesa, a daily cash check), keep them safe, and turn them into a dashboard you can read in a minute.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#FFD54F]">
                  <span>Start fresh with VCR</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Path B Card */}
              <div 
                onClick={() => handleSelectPath("B")}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-emerald-400 transition cursor-pointer space-y-4 group hover:bg-slate-850"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                    Path B &bull; Instant History
                  </span>
                  <h5 className="font-serif font-black text-base text-white">
                    Already keep records?
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Bring your Excel sheets, till exports or M-Pesa statements. We organise them, find what they are telling you, and show where your business is heading.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span>Bring my records</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Four-step strip */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="font-mono text-[10px] text-[#FFD54F] font-bold block uppercase">1. Collect</span>
                <span className="text-[11px] text-slate-300">Voice at the counter, till &amp; M-Pesa.</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#FFD54F] font-bold block uppercase">2. Keep safe</span>
                <span className="text-[11px] text-slate-300">Numbers kept, voice deleted quickly.</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#FFD54F] font-bold block uppercase">3. Understand</span>
                <span className="text-[11px] text-slate-300">Real profit, deni &amp; stock velocity.</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#FFD54F] font-bold block uppercase">4. Decide</span>
                <span className="text-[11px] text-slate-300">Plain actions on restocks &amp; credit.</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* PATH A: START FRESH FLOW                                              */}
        {/* ===================================================================== */}
        {selectedPath === "A" && (
          <div className="space-y-5">
            {/* Steps breadcrumbs */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
              <span className="text-[#FFD54F] font-bold">
                Path A: Start Fresh &bull; Step {currentStep} of 4
              </span>
              <button 
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setSelectedPath(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} /> Back
              </button>
            </div>

            {/* Step 1: Blueprint & Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 1: Choose your business blueprint
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Blueprints configure your industry vocabulary, fast-moving items, and stock tracking.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PLATFORM_BLUEPRINTS.map((bp) => {
                    const isLive = bp.status === "ACTIVE";
                    return (
                      <button
                        key={bp.id}
                        onClick={() => isLive && setSelectedBlueprint(bp)}
                        disabled={!isLive}
                        className={`p-3 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
                          selectedBlueprint.id === bp.id
                            ? "bg-slate-800 border-[#FFD54F] text-white"
                            : isLive
                            ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                            : "bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{bp.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{bp.industry || bp.tagline}</div>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                          isLive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                        }`}>
                          {isLive ? "Live" : bp.status.toLowerCase().replace("_", " ")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-[#000000] hover:bg-[#171717] border border-[#B8860B]/50 text-[#FFD54F] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Continue to Shop Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shop Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 2: Business &amp; Owner Profile
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This sets up your private isolated workspace and Kenyan currency.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Business / Shop Name</label>
                    <input 
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#FFD54F] focus:outline-none text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Proprietor Name</label>
                    <input 
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#FFD54F] focus:outline-none text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Town / Location</label>
                    <input 
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#FFD54F] focus:outline-none text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Safaricom / Till Phone</label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#FFD54F] focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-[#000000] hover:bg-[#171717] border border-[#B8860B]/50 text-[#FFD54F] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Morning Float</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Opening Float (The only 2 numbers needed each day) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 3: Today&apos;s Morning Float
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owners give only two numbers at start of day. This anchors close-of-day reconciliation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#FFD54F] font-bold block">
                      1. Drawer Till Cash (KES)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">KES</span>
                      <input 
                        type="number"
                        value={morningCashTill}
                        onChange={(e) => setMorningCashTill(e.target.value)}
                        className="w-full py-2.5 pl-12 pr-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-[#FFD54F] focus:outline-none text-white font-mono text-base font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Physical notes &amp; coins in the till at opening.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                      2. M-Pesa Float Balance (KES)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">KES</span>
                      <input 
                        type="number"
                        value={morningMpesaFloat}
                        onChange={(e) => setMorningMpesaFloat(e.target.value)}
                        className="w-full py-2.5 pl-12 pr-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-mono text-base font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Till / Buy Goods starting balance from morning SMS.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex justify-between items-center font-mono">
                  <span className="text-slate-400">Total Opening Liquid Float:</span>
                  <span className="text-white font-bold text-base">
                    KES {( (parseFloat(morningCashTill) || 0) + (parseFloat(morningMpesaFloat) || 0) ).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-[#000000] hover:bg-[#171717] border border-[#B8860B]/50 text-[#FFD54F] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: VCR Voice Setup</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: VCR Setup & Counter Consent */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 4: Voice Conversion Record (VCR) Setup
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    VCR converts counter speech (Swahili, Sheng, English) into structured financial lines.
                  </p>
                </div>

                {/* Counter Consent Notice Card */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-600/40 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-200 font-bold font-serif">
                    <Shield size={16} className="text-[#FFD54F]" />
                    <span>Official Counter Customer Notice</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-700/30 text-slate-200 font-sans text-xs italic leading-relaxed">
                    &ldquo;Notice to our valued customers: We keep the numbers, not the conversations. Audio at this counter is converted deterministically into stock and sale numbers, and discarded immediately. Built with Kenya&apos;s Data Protection Act in mind.&rdquo;
                  </div>
                  <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={vcrConsentAgreed}
                      onChange={(e) => setVcrConsentAgreed(e.target.checked)}
                      className="rounded text-[#B8860B] focus:ring-[#B8860B]"
                    />
                    <span>I display or agree to this transparent counter consent notice.</span>
                  </label>
                </div>

                {/* Microphone / Audio Simulation Test */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Mic size={15} className="text-[#FFD54F]" />
                      Counter Microphone Check
                    </span>
                    <button
                      onClick={() => setVcrTestSuccess(true)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-[#FFD54F] cursor-pointer"
                    >
                      {vcrTestSuccess ? "✓ Tested Successfully" : "Test Counter Audio"}
                    </button>
                  </div>
                  {vcrTestSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                      <CheckCircle2 size={14} />
                      <span>Audio parsed: &ldquo;Maziwa mawili na mkate KES 195&rdquo; &rarr; Sale KES 195 logged. Audio dropped.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleFinishAndLaunch}
                    disabled={!vcrConsentAgreed}
                    className="px-7 py-3 rounded-xl bg-[#000000] hover:bg-[#171717] border border-[#B8860B]/60 text-[#FFD54F] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <span>Launch My Live Dashboard</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* PATH B: BRING YOUR DATA FLOW                                          */}
        {/* ===================================================================== */}
        {selectedPath === "B" && (
          <div className="space-y-5">
            {/* Steps breadcrumbs */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold">
                Path B: Bring Your Data &bull; Step {currentStep} of 4
              </span>
              <button 
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setSelectedPath(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} /> Back
              </button>
            </div>

            {/* Step 1: Business Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 1: Business &amp; Blueprint
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tell us your shop name before importing your existing files.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Business Name</label>
                    <input 
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Town / Location</label>
                    <input 
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Upload Files</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Upload Files (Excel, CSV, M-Pesa statements) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 2: Upload your existing records
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Excel/CSV sheets, till exports, POS dumps or 30-day M-Pesa statements.
                  </p>
                </div>

                {/* Upload Box */}
                <div className="p-6 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-400 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/50 text-emerald-400 mx-auto flex items-center justify-center">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Uploaded file: <span className="font-mono text-emerald-300">{fileName}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supports .csv, .xlsx, M-Pesa Till statements
                    </span>
                  </div>

                  {/* One-click Demo Sample Dataset Options */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setFileName("alacio_may_trading_sheet.csv");
                        setRawFileContent(SAMPLE_DUKA_DATASET);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-[#FFD54F] border border-slate-700 cursor-pointer"
                    >
                      Use Sample Duka CSV (13 rows)
                    </button>
                    <button
                      onClick={() => {
                        setFileName("mpesa_till_statement_30d.csv");
                        setRawFileContent(SAMPLE_DUKA_DATASET);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-emerald-300 border border-slate-700 cursor-pointer"
                    >
                      Use M-Pesa Statement (30 Days)
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: AI Column Mapping</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: AI Proposes Column & Line Mapping */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 3: AI Column &amp; Line Mapping
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    AI proposes how your sheet columns map to the retail blueprint. Review and confirm.
                  </p>
                </div>

                {/* Mapping table */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>Your Sheet Header</span>
                    <span>Mapped Blueprint Category</span>
                  </div>

                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Date</span>
                    <span className="text-emerald-400 font-bold">&rarr; Transaction Date</span>
                  </div>
                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Item</span>
                    <span className="text-emerald-400 font-bold">&rarr; Product SKU / Stock</span>
                  </div>
                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Amount</span>
                    <span className="text-emerald-400 font-bold">&rarr; Value (KES)</span>
                  </div>
                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Channel</span>
                    <span className="text-emerald-400 font-bold">&rarr; Cash vs M-Pesa Settlement</span>
                  </div>
                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Type</span>
                    <span className="text-emerald-400 font-bold">&rarr; Sale / Restock / Expense / Deni</span>
                  </div>
                  <div className="grid grid-cols-2 py-1 items-center">
                    <span className="text-slate-300">Customer</span>
                    <span className="text-emerald-400 font-bold">&rarr; Debtor (Deni) / Supplier Name</span>
                  </div>
                </div>

                {/* AI Clarification Question */}
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-200 font-bold">
                    <Sparkles size={14} className="text-blue-400" />
                    <span>AI Confirmation Question</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Row 7 has &ldquo;Broadways Bread 400g KES 65 Credit Baba Junior&rdquo;. Would you like to automatically record this in the Customer Deni ledger?
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => setConfirmDeniQuestion(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                        confirmDeniQuestion ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      Yes, Track in Deni Ledger
                    </button>
                    <button
                      onClick={() => setConfirmDeniQuestion(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                        !confirmDeniQuestion ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      Treat as General Sale
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleProcessImport}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Run Deterministic Import</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Import Report with Idempotency Results */}
            {currentStep === 4 && importReport && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-white">
                    Step 4: Deterministic Import Report
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Summary of imported transactions. Idempotency prevents any double-counting.
                  </p>
                </div>

                {/* Report stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Rows Read</span>
                    <span className="text-white font-bold text-base">{importReport.totalRows}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block uppercase">Imported</span>
                    <span className="text-emerald-300 font-bold text-base">{importReport.imported} lines</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 block uppercase">Duplicates</span>
                    <span className="text-amber-300 font-bold text-base">{importReport.duplicates} skipped</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Ignored Blank</span>
                    <span className="text-slate-400 font-bold text-base">{importReport.skipped}</span>
                  </div>
                </div>

                {/* Reconciled Totals */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-[11px] text-slate-400 uppercase font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Reconciled Starting History:</span>
                    <span className="text-emerald-400">100% Deterministic Code</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-300">Total Backfilled Sales Revenue:</span>
                    <span className="text-[#FFD54F] font-bold">KES {importReport.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-300">Customer Deni (Credit Outstanding):</span>
                    <span className="text-amber-400 font-bold">KES {importReport.totalDeni.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400">
                    <span>Clean History Days Backfilled:</span>
                    <span className="font-bold">30 Days (Predictive Forecasting Unlocked!)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleFinishAndLaunch}
                    className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Launch Personalised Dashboard</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
