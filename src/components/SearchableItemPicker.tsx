import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Package, X, AlertTriangle } from "lucide-react";
import { InventoryItem } from "../types";

export interface SearchableItemPickerProps {
  items: InventoryItem[];
  selectedItemId: string;
  onSelect: (item: InventoryItem) => void;
  onClear?: () => void;
  currency?: string;
  placeholder?: string;
  showPrice?: "cost" | "selling" | "both" | "none";
  compact?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export const SearchableItemPicker: React.FC<SearchableItemPickerProps> = ({
  items,
  selectedItemId,
  onSelect,
  onClear,
  currency = "KSh",
  placeholder = "Type product name (e.g. S, M, T)...",
  showPrice = "selling",
  compact = false,
  id,
  autoFocus = false,
}) => {
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId]
  );

  const [inputValue, setInputValue] = useState<string>(selectedItem ? selectedItem.name : "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isTyping, setIsTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external selectedItemId change when not actively typing
  useEffect(() => {
    if (!isTyping) {
      if (selectedItem) {
        setInputValue(selectedItem.name);
      } else {
        setInputValue("");
      }
    }
  }, [selectedItemId, selectedItem, isTyping]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        // If user stopped typing without selecting and had a valid selection, restore name
        if (selectedItem) {
          setInputValue(selectedItem.name);
        } else {
          setInputValue("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedItem]);

  // Filter and sort items:
  // When user starts typing, products starting with that letter/query are prioritized at the very top!
  const filteredItems = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      // If empty, only show all items if user deliberately opened via the chevron
      return isOpen && !isTyping ? items.slice(0, 40) : [];
    }

    const startsWithName: InventoryItem[] = [];
    const wordStartsWith: InventoryItem[] = [];
    const startsWithSku: InventoryItem[] = [];
    const containsMatches: InventoryItem[] = [];

    for (const item of items) {
      const name = (item.name || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();

      if (name.startsWith(q)) {
        startsWithName.push(item);
      } else if (sku.startsWith(q)) {
        startsWithSku.push(item);
      } else {
        const words = name.split(/[\s-]+/);
        if (words.some((w) => w.startsWith(q))) {
          wordStartsWith.push(item);
        } else if (name.includes(q) || cat.includes(q) || sku.includes(q)) {
          containsMatches.push(item);
        }
      }
    }

    return [...startsWithName, ...wordStartsWith, ...startsWithSku, ...containsMatches];
  }, [items, inputValue, isOpen, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsTyping(true);
    setActiveIndex(0);

    if (val.trim().length > 0) {
      // As user keys in, suggestions show up immediately
      setIsOpen(true);
    } else {
      // When empty, keep box empty and close the drop down!
      setIsOpen(false);
      if (selectedItemId && onClear) {
        onClear();
      }
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    onSelect(item);
    setInputValue(item.name);
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
    if (!isOpen || filteredItems.length === 0) {
      if (e.key === "ArrowDown" && inputValue.trim()) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? filteredItems[activeIndex] : filteredItems[0];
      if (target) {
        handleSelectItem(target);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to visually highlight matched query in item name
  const renderHighlightedName = (name: string, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return name;
    const lower = name.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return name;

    const before = name.substring(0, idx);
    const match = name.substring(idx, idx + q.length);
    const after = name.substring(idx + q.length);

    return (
      <>
        {before}
        <span className="text-emerald-400 font-bold bg-emerald-500/20 px-0.5 rounded">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {/* Typeable Input Container */}
      <div
        className={`relative flex items-center transition-all rounded-lg border bg-slate-950 ${
          compact ? "p-1 text-xs" : "p-1.5 text-xs"
        } ${
          isOpen
            ? "border-emerald-500 ring-1 ring-emerald-500/50 shadow-sm"
            : "border-slate-700/80 hover:border-slate-600 focus-within:border-emerald-500"
        }`}
      >
        {/* Left Icon */}
        <div className="pl-1 pr-1.5 flex items-center shrink-0 pointer-events-none">
          <Package
            className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${
              selectedItem ? "text-emerald-400" : "text-slate-500"
            }`}
          />
        </div>

        {/* Direct Text Input for Keying In Products */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Only open if there is text already typed
            if (inputValue.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-white placeholder-slate-500 font-medium focus:outline-none min-w-0 pr-1 truncate"
        />

        {/* Right Info: Selected Item Price Badge + Clear Button */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedItem && !isTyping && (
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="hidden sm:inline text-slate-400">
                ({selectedItem.unit_of_measure})
              </span>
              {showPrice === "selling" && (
                <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/20">
                  {currency} {selectedItem.unit_selling_price}
                </span>
              )}
              {showPrice === "cost" && (
                <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/20">
                  Cost: {currency} {selectedItem.unit_cost_price}
                </span>
              )}
            </div>
          )}

          {/* Quick Clear 'X' Button when box has value or item is selected */}
          {(inputValue || selectedItem) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Clear product"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Optional manual chevron toggle */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="Toggle catalog list"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Typeahead Suggestions Popover */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0f172a] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden p-1.5 min-w-[280px] max-w-full animate-fadeIn"
        >
          {filteredItems.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              {inputValue.trim() ? (
                <span>No products start with or match "{inputValue}"</span>
              ) : (
                <span>Start typing a letter to see products...</span>
              )}
            </div>
          ) : (
            <>
              {inputValue.trim() && (
                <div className="px-2 py-1 text-[10px] text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between font-mono">
                  <span>
                    Matching "{inputValue.trim()}" ({filteredItems.length} found)
                  </span>
                  <span className="text-emerald-400">Products starting with '{inputValue.trim()}' first</span>
                </div>
              )}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredItems.map((item, index) => {
                  const isSelected = item.id === selectedItemId;
                  const isActive = index === activeIndex;
                  const isLowStock = item.current_stock_qty <= (item.reorder_level || 5);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-950/60 border-emerald-500/60 text-white shadow-sm"
                          : isActive
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-slate-900/40 hover:bg-slate-800/70 border-transparent text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-white truncate">
                            {renderHighlightedName(item.name, inputValue)}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {item.unit_of_measure}
                          </span>
                          {item.category && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-300">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span
                            className={
                              isLowStock
                                ? "text-amber-400 flex items-center gap-0.5"
                                : "text-slate-400"
                            }
                          >
                            {isLowStock && (
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            )}
                            Stock: {item.current_stock_qty}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-300 font-bold">
                            Selling: {currency} {item.unit_selling_price}
                          </span>
                          {item.unit_cost_price > 0 && (
                            <>
                              <span>•</span>
                              <span>Cost: {currency} {item.unit_cost_price}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
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
