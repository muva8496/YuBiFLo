import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Search,
  BookOpen,
  ChevronRight
} from "lucide-react";
import {
  CLIENT_ARTICLES,
  CLIENT_ARTICLE_CATEGORIES,
  ClientArticle,
  ClientArticleCategory
} from "../data/clientArticles";

interface ClientArticlesModalProps {
  isOpen: boolean;
  initialArticleId?: string | null;
  onClose: () => void;
  onTryInWorkspace?: (tabId?: string) => void;
}

export default function ClientArticlesModal({
  isOpen,
  initialArticleId = null,
  onClose,
  onTryInWorkspace
}: ClientArticlesModalProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialArticleId);
  const [selectedCategory, setSelectedCategory] = useState<"All" | ClientArticleCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedArticleId(initialArticleId || null);
    }
  }, [isOpen, initialArticleId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CLIENT_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeArticle: ClientArticle | null = useMemo(() => {
    if (!selectedArticleId) return null;
    return CLIENT_ARTICLES.find((a) => a.id === selectedArticleId) || null;
  }, [selectedArticleId]);

  const activeArticleIndex = activeArticle
    ? CLIENT_ARTICLES.findIndex((a) => a.id === activeArticle.id)
    : -1;
  const previousArticle =
    activeArticleIndex > 0 ? CLIENT_ARTICLES[activeArticleIndex - 1] : null;
  const nextArticle =
    activeArticleIndex >= 0 && activeArticleIndex < CLIENT_ARTICLES.length - 1
      ? CLIENT_ARTICLES[activeArticleIndex + 1]
      : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1B32]/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Client Articles and Guides"
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl border border-[#CBD5E1] shadow-2xl flex flex-col overflow-hidden text-[#0F1A24]">
        {/* MODAL TOP BAR */}
        <div className="px-5 sm:px-8 py-4 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {activeArticle ? (
              <button
                type="button"
                onClick={() => setSelectedArticleId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A56DB] hover:text-[#0B1B32] transition cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] px-2 -ml-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft size={15} />
                <span>All Articles</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen size={18} className="text-[#1A56DB] shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-serif font-bold text-base sm:text-lg text-[#0B1B32] truncate">
                    Client Reading Room
                  </h2>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-slate-500 whitespace-nowrap">
              {activeArticle
                ? `${activeArticle.category} · ${activeArticle.readTime}`
                : `${CLIENT_ARTICLES.length} practical guides for MSMEs`}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close articles reader"
              className="p-2 rounded-lg text-slate-500 hover:text-[#0B1B32] hover:bg-slate-200/60 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY SCROLL AREA */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8">
          {!activeArticle ? (
            /* =============================================================== */
            /* LIBRARY INDEX VIEW                                              */
            /* =============================================================== */
            <div className="space-y-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-medium text-[#996515]">
                  Resources · Client Guides
                </p>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#0B1B32] tracking-tight leading-tight [text-wrap:balance]">
                  Practical numbers guides for retail shops, eateries, and growing merchants
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Short, real-world reads built from daily counter operations across East Africa—covering morning float control, break-bulk pricing, customer credit discipline, and separating personal draws from stock money.
                </p>
              </div>

              {/* SEARCH & CATEGORY FILTERS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedCategory === "All"
                        ? "bg-[#0B1B32] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    All Guides ({CLIENT_ARTICLES.length})
                  </button>
                  {CLIENT_ARTICLE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedCategory === category
                          ? "bg-[#0B1B32] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="relative sm:w-60 shrink-0">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    aria-label="Search client articles"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-[#0B1B32] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                  />
                </div>
              </div>

              {/* ARTICLES LIST */}
              {filteredArticles.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    No articles matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#1A56DB] hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredArticles.map((article, index) => (
                    <article
                      key={article.id}
                      className="py-5 first:pt-2 last:pb-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedArticleId(article.id)}
                        className="w-full text-left flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer rounded-xl p-2 -mx-2 hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono tabular-nums text-[#996515] font-semibold">
                              0{index + 1}.
                            </span>
                            <span>{article.category}</span>
                            <span aria-hidden="true">&middot;</span>
                            <span>{article.readTime}</span>
                            <span aria-hidden="true">&middot;</span>
                            <span>{article.publishedAt}</span>
                          </div>

                          <h4 className="font-serif font-bold text-lg sm:text-xl text-[#0B1B32] group-hover:text-[#1A56DB] transition-colors leading-snug [text-wrap:balance]">
                            {article.title}
                          </h4>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            {article.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A56DB] whitespace-nowrap shrink-0 sm:pt-6">
                          <span>Read article</span>
                          <ChevronRight
                            size={15}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* =============================================================== */
            /* FULL ARTICLE READER VIEW                                        */
            /* =============================================================== */
            <article className="max-w-[68ch] mx-auto space-y-8">
              {/* Article Header */}
              <header className="space-y-4 border-b border-slate-200 pb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#996515]">
                    {activeArticle.category}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{activeArticle.readTime}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{activeArticle.publishedAt}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{activeArticle.author}</span>
                </div>

                <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#0B1B32] tracking-tight leading-[1.16] [text-wrap:balance]">
                  {activeArticle.title}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                  {activeArticle.subtitle}
                </p>
              </header>

              {/* Key Numbers Strip */}
              <section
                aria-label="Key figures at a glance"
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 sm:p-5 bg-[#F8FAFC]"
              >
                {activeArticle.keyNumbers.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <div className="text-xs font-medium text-slate-500">
                      {metric.label}
                    </div>
                    <div className="text-lg font-mono font-bold tabular-nums text-[#0B1B32]">
                      {metric.value}
                    </div>
                    <div className="text-xs text-slate-600 leading-snug">
                      {metric.note}
                    </div>
                  </div>
                ))}
              </section>

              {/* Article Sections */}
              <div className="space-y-7">
                {activeArticle.sections.map((section, idx) => (
                  <section key={idx} className="space-y-3.5">
                    <h2 className="font-serif font-bold text-xl text-[#0B1B32] tracking-tight">
                      {section.heading}
                    </h2>

                    {section.paragraphs.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-[15.5px] sm:text-base text-slate-700 leading-[1.72]"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.exampleTable && (
                      <div className="pt-2 overflow-x-auto">
                        <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                          <caption className="text-left text-xs text-slate-500 pb-2 font-medium">
                            {section.exampleTable.caption}
                          </caption>
                          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#0B1B32]">
                            <tr>
                              {section.exampleTable.headers.map((header) => (
                                <th
                                  key={header}
                                  className="py-2.5 px-3.5 font-semibold"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {section.exampleTable.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`py-2.5 px-3.5 ${
                                      cIdx === 1
                                        ? "font-mono tabular-nums font-semibold text-[#0B1B32]"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {/* Practical Next Step in Live Workspace */}
              {onTryInWorkspace && (
                <div className="border border-slate-200 rounded-xl p-5 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#0B1B32]">
                      Put this guide into practice
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {activeArticle.actionPrompt.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTryInWorkspace(activeArticle.actionPrompt.demoTab);
                    }}
                    className="px-4 py-2.5 rounded-full bg-[#0B1B32] hover:bg-[#1A56DB] text-white text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    <span>{activeArticle.actionPrompt.label}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Previous / Next Article Footer Navigation */}
              <nav
                aria-label="Article navigation"
                className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  {previousArticle && (
                    <button
                      type="button"
                      onClick={() => setSelectedArticleId(previousArticle.id)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-[#F8FAFC] transition cursor-pointer space-y-1"
                    >
                      <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                        <ArrowLeft size={13} />
                        <span>Previous guide</span>
                      </span>
                      <div className="text-sm font-serif font-bold text-[#0B1B32] line-clamp-1">
                        {previousArticle.title}
                      </div>
                    </button>
                  )}
                </div>

                <div>
                  {nextArticle && (
                    <button
                      type="button"
                      onClick={() => setSelectedArticleId(nextArticle.id)}
                      className="w-full text-left sm:text-right p-3 rounded-xl border border-slate-200 hover:bg-[#F8FAFC] transition cursor-pointer space-y-1"
                    >
                      <span className="text-xs text-slate-500 inline-flex items-center gap-1 sm:justify-end w-full">
                        <span>Next guide</span>
                        <ArrowRight size={13} />
                      </span>
                      <div className="text-sm font-serif font-bold text-[#0B1B32] line-clamp-1">
                        {nextArticle.title}
                      </div>
                    </button>
                  )}
                </div>
              </nav>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
