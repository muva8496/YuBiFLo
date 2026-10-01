import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, UserCheck, X, AlertCircle } from "lucide-react";
import { Customer } from "../types";

export interface SearchableCustomerPickerProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelect: (customer: Customer) => void;
  onClear?: () => void;
  currency?: string;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
}

export const SearchableCustomerPicker: React.FC<SearchableCustomerPickerProps> = ({
  customers,
  selectedCustomerId,
  onSelect,
  onClear,
  currency = "KSh",
  placeholder = "Type customer name (e.g. M, L, J, phone, or ID)...",
  id,
  autoFocus = false,
}) => {
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const [inputValue, setInputValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isTyping, setIsTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // When selected customer changes externally, update state
  useEffect(() => {
    if (!isTyping) {
      if (selectedCustomer) {
        setInputValue(selectedCustomer.name);
      } else {
        setInputValue("");
      }
    }
  }, [selectedCustomerId, selectedCustomer, isTyping]);

  // Click outside to dismiss popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        if (selectedCustomer) {
          setInputValue(selectedCustomer.name);
        } else {
          setInputValue("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedCustomer]);

  // Filter and prioritize:
  // When user starts typing, customers whose names or words start with that letter appear first!
  const filteredCustomers = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      // If empty, DO NOT show dropdown by default!
      return isOpen && !isTyping ? customers.slice(0, 30) : [];
    }

    const startsWithName: Customer[] = [];
    const wordStartsWith: Customer[] = [];
    const idOrPhoneMatches: Customer[] = [];
    const containsMatches: Customer[] = [];

    for (const c of customers) {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const natId = (c.national_id || "").toLowerCase();
      const aliasStr = (c.aliases || []).join(" ").toLowerCase();
      const cat = (c.customer_type || "").toLowerCase();

      if (name.startsWith(q)) {
        startsWithName.push(c);
      } else {
        const words = name.split(/[\s-]+/);
        if (words.some((w) => w.startsWith(q))) {
          wordStartsWith.push(c);
        } else if (natId.startsWith(q) || phone.includes(q)) {
          idOrPhoneMatches.push(c);
        } else if (name.includes(q) || aliasStr.includes(q) || cat.includes(q)) {
          containsMatches.push(c);
        }
      }
    }

    return [...startsWithName, ...wordStartsWith, ...idOrPhoneMatches, ...containsMatches];
  }, [customers, inputValue, isOpen, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsTyping(true);
    setActiveIndex(0);

    if (val.trim().length > 0) {
      // Instant typeahead suggestions pop up as user keys in
      setIsOpen(true);
    } else {
      // When empty, keep box empty and close the drop down!
      setIsOpen(false);
      if (selectedCustomerId && onClear) {
        onClear();
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setInputValue(customer.name);
    setIsTyping(false);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    setIsTyping(false);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredCustomers.length === 0) {
      if (e.key === "ArrowDown" && inputValue.trim()) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? filteredCustomers[activeIndex] : filteredCustomers[0];
      if (target) {
        handleSelectCustomer(target);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to visually highlight matched substring
  const renderHighlightedText = (text: string, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text;

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + q.length);
    const after = text.substring(idx + q.length);

    return (
      <>
        {before}
        <span className="text-cyan-400 font-bold bg-cyan-500/20 px-0.5 rounded">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="relative w-full space-y-2" ref={containerRef} id={id}>
      {/* Typeable Input Bar */}
      <div
        className={`relative flex items-center transition-all rounded-xl border bg-slate-900/90 ${
          isOpen
            ? "border-cyan-500 ring-1 ring-cyan-500/40 shadow-sm"
            : "border-slate-700 hover:border-slate-600 focus-within:border-cyan-500"
        } pl-3 pr-2 py-2`}
      >
        <UserCheck
          className={`w-4 h-4 mr-2.5 shrink-0 pointer-events-none ${
            selectedCustomer ? "text-cyan-400" : "text-slate-500"
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 font-medium focus:outline-none min-w-0 truncate"
        />

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {(inputValue || selectedCustomer) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Clear customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="Toggle customer list"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Active Selected Customer Preview Card */}
      {selectedCustomer && !isOpen && (
        <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between gap-3 shadow-inner animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {selectedCustomer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.national_id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-700">
                    ID: {selectedCustomer.national_id}
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold uppercase">
                  {selectedCustomer.customer_type.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{selectedCustomer.phone || "No phone"}</span>
                <span>•</span>
                <span>
                  Credit Limit: {currency} {selectedCustomer.credit_limit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Current Debt</span>
            <span
              className={`text-xs font-mono font-bold ${
                selectedCustomer.outstanding_credit_deni > 0
                  ? "text-rose-400"
                  : "text-emerald-400"
              }`}
            >
              {currency} {selectedCustomer.outstanding_credit_deni.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Floating Suggestions Popover (Only opens when user starts typing) */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0c1322] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden p-2 min-w-[280px] max-w-full animate-fadeIn"
        >
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <p>No customer found matching "{inputValue}".</p>
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  setIsTyping(false);
                  setIsOpen(false);
                }}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {inputValue.trim() && (
                <div className="px-2 py-1 text-[10px] text-slate-400 border-b border-slate-800 mb-1.5 flex items-center justify-between font-mono">
                  <span>
                    Matching "{inputValue.trim()}" ({filteredCustomers.length} found)
                  </span>
                  <span className="text-cyan-400">Customers starting with '{inputValue.trim()}' first</span>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredCustomers.map((c, index) => {
                  const isSelected = c.id === selectedCustomerId;
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isSelected
                          ? "bg-cyan-950/60 border-cyan-500/70 text-white shadow-sm"
                          : isActive
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-slate-900/40 hover:bg-slate-800/70 border-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? "bg-cyan-500 text-slate-950 font-black"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-white truncate">
                              {renderHighlightedText(c.name, inputValue)}
                            </span>
                            {c.national_id && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                                ID: {renderHighlightedText(c.national_id, inputValue)}
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                              {c.customer_type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {renderHighlightedText(c.phone || "No phone", inputValue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">Balance</span>
                          <span
                            className={`text-[11px] font-mono font-bold ${
                              c.outstanding_credit_deni > 0
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {currency} {c.outstanding_credit_deni.toLocaleString()}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
