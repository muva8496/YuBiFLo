import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Tag,
  ChevronRight,
  ExternalLink,
  Layers,
  FileCode,
} from "lucide-react";
import {
  EnterpriseDoc,
  YUBIFLO_BRD,
  YUBIFLO_PRD,
  generateMarkdownDoc,
  generatePrintableHtml,
  triggerFileDownload,
} from "../services/documentationData";

interface AdminDocsViewerProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const AdminDocsViewer: React.FC<AdminDocsViewerProps> = ({ isModal = false, onClose }) => {
  const [selectedDocId, setSelectedDocId] = useState<"BRD" | "PRD">("BRD");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("all");

  const currentDoc: EnterpriseDoc = selectedDocId === "BRD" ? YUBIFLO_BRD : YUBIFLO_PRD;

  const handleCopyMarkdown = () => {
    const md = generateMarkdownDoc(currentDoc);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownDoc(currentDoc);
    triggerFileDownload(
      `YuBiFLo_${currentDoc.docId}_${currentDoc.version.replace(/\./g, "_")}.md`,
      md,
      "text/markdown;charset=utf-8"
    );
  };

  const handleDownloadTxt = () => {
    const txt = generateMarkdownDoc(currentDoc);
    triggerFileDownload(
      `YuBiFLo_${currentDoc.docId}_${currentDoc.version.replace(/\./g, "_")}.txt`,
      txt,
      "text/plain;charset=utf-8"
    );
  };

  const handlePrintPdf = () => {
    const html = generatePrintableHtml(currentDoc);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  // Filter sections by search query or active section
  const filteredSections = currentDoc.sections.filter((sec) => {
    const matchesSearch =
      searchQuery === "" ||
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSection = activeSectionId === "all" || sec.id === activeSectionId;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Header & Switcher Banner */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold font-display text-white">Enterprise Specifications Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Confidential • Ready for Download
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official Business Requirements Document (BRD) & Product Requirements Document (PRD) for YuBiFLo SaaS.
            </p>
          </div>
        </div>

        {/* Global Export & Download Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            title="Download formatted Markdown (.md) file"
          >
            <Download className="w-4 h-4" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
            title="Download Plain Text (.txt) file"
          >
            <FileCode className="w-4 h-4" />
            <span>Download .TXT</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
              copied
                ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="Copy complete document markdown to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied Markdown!" : "Copy MD"}</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Document Selector & Meta Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BRD Tab Card */}
        <div
          onClick={() => {
            setSelectedDocId("BRD");
            setActiveSectionId("all");
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedDocId === "BRD"
              ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/50"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider ${
                  selectedDocId === "BRD"
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                BRD
              </span>
              <h3 className="text-sm font-bold text-white">Business Requirements Document</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {YUBIFLO_BRD.version}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Market opportunity, East African MSME retail pain points, turnover accounting model, SaaS pricing, and financial compliance.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{YUBIFLO_BRD.sections.length} Core Sections</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              View & Download <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* PRD Tab Card */}
        <div
          onClick={() => {
            setSelectedDocId("PRD");
            setActiveSectionId("all");
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedDocId === "PRD"
              ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/50"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider ${
                  selectedDocId === "PRD"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                PRD
              </span>
              <h3 className="text-sm font-bold text-white">Product Requirements Document</h3>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 font-bold">
              {YUBIFLO_PRD.version}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Technical architecture, module specifications, double-entry mathematical models, data schemas, and security controls.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{YUBIFLO_PRD.sections.length} Technical Sections</span>
            <span className="text-indigo-400 font-semibold flex items-center gap-1">
              View & Download <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Document Content Area with Sidebar Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Table of Contents & Search */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in document..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Table of Contents */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Table of Contents</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentDoc.sections.length} chapters
              </span>
            </h4>

            <button
              type="button"
              onClick={() => setActiveSectionId("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                activeSectionId === "all"
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span>Full Document View</span>
              <Layers className="w-3.5 h-3.5 opacity-60" />
            </button>

            <div className="space-y-1 pt-1">
              {currentDoc.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                    activeSectionId === sec.id
                      ? "bg-slate-800 text-white font-bold border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                    {sec.number}
                  </span>
                  <span className="truncate">{sec.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Meta Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
              Document Metadata
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <p>
                Author: <strong className="text-slate-200">{currentDoc.author}</strong>
              </p>
              <p>
                Status:{" "}
                <strong className="text-emerald-400 font-mono font-bold">
                  {currentDoc.status}
                </strong>
              </p>
              <p>
                Updated: <strong className="text-slate-200">{currentDoc.lastUpdated}</strong>
              </p>
              <p>
                Organization: <strong className="text-slate-200">{currentDoc.organization}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Right Main Document Reader */}
        <div className="lg:col-span-3 space-y-6">
          {/* Document Header Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-emerald-400 tracking-wider">
                  YuBiFLo Enterprise SaaS Documentation
                </span>
                <h1 className="text-xl font-black text-white">{currentDoc.title}</h1>
                <p className="text-xs text-slate-400">{currentDoc.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-mono font-bold">
                  {currentDoc.version}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
              <strong>Executive Summary:</strong> {currentDoc.summary}
            </div>
          </div>

          {/* Render Sections */}
          <div className="space-y-6">
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                      {sec.number}
                    </span>
                    <h3 className="text-base font-bold text-white">{sec.title}</h3>
                  </div>

                  {sec.tags && (
                    <div className="flex items-center gap-1.5">
                      {sec.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content formatted with clean readability */}
                <div className="text-xs text-slate-300 leading-relaxed space-y-3 prose prose-invert max-w-none">
                  {sec.content.split("\n\n").map((paragraph, pIdx) => {
                    // Check if markdown table
                    if (paragraph.includes("|") && paragraph.includes("---")) {
                      const rows = paragraph.trim().split("\n");
                      const headerCells = rows[0]
                        .split("|")
                        .map((c) => c.trim())
                        .filter(Boolean);
                      const dataRows = rows.slice(2).map((r) =>
                        r
                          .split("|")
                          .map((c) => c.trim())
                          .filter(Boolean)
                      );

                      return (
                        <div
                          key={pIdx}
                          className="overflow-x-auto my-3 rounded-xl border border-slate-800"
                        >
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                                {headerCells.map((hc, hIdx) => (
                                  <th key={hIdx} className="p-3">
                                    {hc}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                              {dataRows.map((dr, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-950/40">
                                  {dr.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-3 text-slate-200">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    // Check if code block
                    if (paragraph.startsWith("```")) {
                      const codeContent = paragraph.replace(/```[a-z]*/g, "").trim();
                      return (
                        <pre
                          key={pIdx}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto"
                        >
                          <code>{codeContent}</code>
                        </pre>
                      );
                    }

                    // Subheaders
                    if (paragraph.startsWith("### ")) {
                      return (
                        <h4
                          key={pIdx}
                          className="text-sm font-bold text-emerald-300 pt-2 border-b border-slate-800/40 pb-1"
                        >
                          {paragraph.replace("### ", "")}
                        </h4>
                      );
                    }

                    // Lists
                    if (paragraph.startsWith("- ") || paragraph.startsWith("1. ")) {
                      const items = paragraph.split("\n");
                      return (
                        <ul key={pIdx} className="space-y-1.5 pl-2">
                          {items.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item
                                    .replace(/^[-*]|\d+\.\s*/, "")
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>'),
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // Normal paragraph
                    return (
                      <p
                        key={pIdx}
                        dangerouslySetInnerHTML={{
                          __html: paragraph.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-white">$1</strong>'
                          ),
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-sm font-bold text-slate-300">
                  No matching chapters found for "{searchQuery}"
                </p>
                <p className="text-xs text-slate-500">
                  Try searching for keywords like "Restock", "Deni", "Pricing", "T-Accounts", or clear search.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
