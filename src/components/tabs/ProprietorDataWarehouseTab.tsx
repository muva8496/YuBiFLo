import React, { useState, useMemo } from "react";
import { 
  Database, Server, ShieldCheck, Download, Upload, Trash2, 
  Edit3, Plus, Search, CheckCircle2, AlertTriangle, RefreshCw, 
  FileJson, Table, X, Check, Eye, HelpCircle, HardDrive, 
  Cloud, ArrowUpDown, Filter, ChevronRight
} from "lucide-react";
import { 
  AlacioMasterState, 
  CustomerDebtor, 
  SupplierProfile, 
  WarehouseBatch, 
  InventoryItem,
  MorningBookendRecord,
  PayoutOrDrawing,
  SalesLedgerItem
} from "../../types/alacio";

interface ProprietorDataWarehouseTabProps {
  state: AlacioMasterState;
  onUpdateRecord: (collectionKey: string, recordId: string | number, updatedRecord: any) => void;
  onDeleteRecord: (collectionKey: string, recordId: string | number) => void;
  onInsertRecord: (collectionKey: string, newRecord: any) => void;
  onRestoreFullState: (newState: AlacioMasterState) => void;
}

type CollectionType = 
  | "warehouse" 
  | "customers" 
  | "suppliers" 
  | "inventory" 
  | "morning_bookends" 
  | "reconciliations" 
  | "payouts" 
  | "salesLedger" 
  | "mpesaStatements";

interface TableMeta {
  key: CollectionType;
  label: string;
  icon: string;
  count: number;
  description: string;
  idField: string;
  displayField: string;
}

export default function ProprietorDataWarehouseTab({
  state,
  onUpdateRecord,
  onDeleteRecord,
  onInsertRecord,
  onRestoreFullState
}: ProprietorDataWarehouseTabProps) {
  const [activeTable, setActiveTable] = useState<CollectionType>("warehouse");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "info" | "warn"; text: string } | null>(null);

  // Edit record state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editJsonMode, setEditJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [editFormValues, setEditFormValues] = useState<Record<string, any>>({});

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string | number; summary: string } | null>(null);

  // Insert modal state
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [newRecordJson, setNewRecordJson] = useState("");

  // Guide toggle
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  const tables: TableMeta[] = [
    {
      key: "warehouse",
      label: "Warehouse & Bulk Batches",
      icon: "📦",
      count: state.warehouse?.length || 0,
      description: "Bulk wholesale inventory, batch numbers, storage bay locations, and wholesale costs.",
      idField: "id",
      displayField: "item_name"
    },
    {
      key: "customers",
      label: "Customers & Deni Accounts",
      icon: "👥",
      count: state.customers?.length || 0,
      description: "Counter debtors, Kenyan National IDs for agency banking deposits, and credit balances.",
      idField: "id",
      displayField: "name"
    },
    {
      key: "suppliers",
      label: "Suppliers & Distributors",
      icon: "🚚",
      count: state.suppliers?.length || 0,
      description: "Verified supplier profiles, rep drivers, National IDs, till accounts, and order totals.",
      idField: "id",
      displayField: "company"
    },
    {
      key: "inventory",
      label: "Active Retail Inventory",
      icon: "🏪",
      count: state.inventory?.length || 0,
      description: "Display shelf products, retail prices, buying costs, margins, and on-shelf quantities.",
      idField: "id",
      displayField: "name"
    },
    {
      key: "morning_bookends",
      label: "Morning Bookend Baselines",
      icon: "☀️",
      count: state.morning_bookends?.length || 0,
      description: "Dawn sealed baselines for cash drawer, M-Pesa float, Equitel line, and opening shelf valuation.",
      idField: "id",
      displayField: "timestamp"
    },
    {
      key: "reconciliations",
      label: "Evening Reconciliations",
      icon: "⚖️",
      count: state.reconciliations?.length || 0,
      description: "Night reverse audit logs, actual cash counted vs expected cash, and day variances.",
      idField: "id",
      displayField: "date"
    },
    {
      key: "payouts",
      label: "Payouts & Business Expenses",
      icon: "💰",
      count: state.payouts?.length || 0,
      description: "Cash drawer payouts, owner drawings, council fees, electricity tokens, and supplier payments.",
      idField: "id",
      displayField: "notes"
    },
    {
      key: "salesLedger",
      label: "Sales Ledger & Orders",
      icon: "🧾",
      count: state.salesLedger?.length || 0,
      description: "Itemized transactions, customer names, payment methods (Cash/M-Pesa/Split/Credit).",
      idField: "id",
      displayField: "customer_name"
    },
    {
      key: "mpesaStatements",
      label: "M-Pesa Statements",
      icon: "📱",
      count: state.mpesaStatements?.length || 0,
      description: "Raw statement imports, transaction codes, and Safaricom till reconciliation records.",
      idField: "id",
      displayField: "transId"
    }
  ];

  const currentTableMeta = tables.find((t) => t.key === activeTable) || tables[0];
  const currentCollection = (state[activeTable] as any[]) || [];

  const filteredCollection = useMemo(() => {
    if (!searchQuery.trim()) return currentCollection;
    const q = searchQuery.toLowerCase().trim();
    return currentCollection.filter((row) => {
      return JSON.stringify(row).toLowerCase().includes(q);
    });
  }, [currentCollection, searchQuery]);

  const showToast = (type: "success" | "info" | "warn", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Open Edit modal
  const handleOpenEdit = (row: any) => {
    setEditingRecord(row);
    setEditFormValues({ ...row });
    setRawJsonText(JSON.stringify(row, null, 2));
    setEditJsonMode(false);
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    let updatedObj: any;
    if (editJsonMode) {
      try {
        updatedObj = JSON.parse(rawJsonText);
      } catch (err: any) {
        showToast("warn", `Invalid JSON syntax: ${err.message}`);
        return;
      }
    } else {
      updatedObj = { ...editingRecord, ...editFormValues };
    }

    const id = editingRecord[currentTableMeta.idField] ?? editingRecord.id;
    onUpdateRecord(activeTable, id, updatedObj);
    setIsEditModalOpen(false);
    showToast("success", `Record (${id}) in ${currentTableMeta.label} updated directly. All data preserved.`);
  };

  // Open Delete modal
  const handleOpenDelete = (row: any) => {
    const id = row[currentTableMeta.idField] ?? row.id;
    const summary = row[currentTableMeta.displayField] || row.name || row.item_name || row.company || String(id);
    setRecordToDelete({ id, summary });
    setIsDeleteModalOpen(true);
  };

  // Execute Delete
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    onDeleteRecord(activeTable, recordToDelete.id);
    setIsDeleteModalOpen(false);
    showToast("info", `Record (${recordToDelete.id}: "${recordToDelete.summary}") deleted. Rest of dataset preserved.`);
    setRecordToDelete(null);
  };

  // Open Insert Modal
  const handleOpenInsert = () => {
    // Generate clean template for the active collection
    let template: any = {};
    if (activeTable === "warehouse") {
      template = {
        id: `wh_${Date.now()}`,
        item_id: Date.now(),
        item_name: "New Wholesale Item",
        category: "General",
        batch_number: `BN-${Date.now().toString().slice(-4)}`,
        supplier_name: "Local Wholesaler",
        supplier_national_id: "24810293",
        bulk_quantity: 20,
        unit_type: "bales",
        bulk_cost_per_unit: 150,
        total_batch_cost: 3000,
        storage_location: "Bay 1",
        reorder_threshold: 5,
        received_date: new Date().toISOString().slice(0, 10),
        expiry_date: "2027-12-31",
        status: "IN_STORAGE"
      };
    } else if (activeTable === "customers") {
      template = {
        id: `cust_${Date.now()}`,
        name: "Customer Name",
        phone: "07XX XXX XXX",
        national_id: "12345678",
        debt_balance: 0,
        credit_limit: 1500,
        last_transaction_date: new Date().toISOString().slice(0, 10),
        notes: "Registered Customer"
      };
    } else if (activeTable === "suppliers") {
      template = {
        id: `supp_${Date.now()}`,
        name: "Supplier Contact",
        company: "Supplier Company Name",
        driver_name: "Driver Rep",
        phone: "0722 XXX XXX",
        national_id: "22849103",
        category: "Dairy",
        total_orders_cost: 0,
        last_delivery_date: new Date().toISOString().slice(0, 10),
        payment_preference: "NATIONAL_ID_DEPOSIT",
        till_or_account: "889922",
        payment_terms: "Cash on Delivery"
      };
    } else if (activeTable === "inventory") {
      template = {
        id: Date.now(),
        name: "Product Name",
        category: "General",
        unit_type: "packets",
        unit_cost: 100,
        unit_retail: 120,
        current_stock: 10,
        opening_stock: 10,
        expected_margin: 20,
        total_shelf_value: 1200,
        velocity_badge: "FAST_MOVER"
      };
    } else {
      template = {
        id: `rec_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString()
      };
    }

    setNewRecordJson(JSON.stringify(template, null, 2));
    setIsInsertModalOpen(true);
  };

  const handleSaveInsert = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newRecordJson);
      onInsertRecord(activeTable, parsed);
      setIsInsertModalOpen(false);
      showToast("success", `New record successfully inserted into ${currentTableMeta.label}.`);
    } catch (err: any) {
      showToast("warn", `Invalid JSON format: ${err.message}`);
    }
  };

  // Export Full JSON Backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `yubiflo_proprietor_db_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("success", "Complete data warehouse backup downloaded to your computer.");
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          onRestoreFullState(parsed);
          showToast("success", "System state successfully restored from uploaded database file!");
        } else {
          showToast("warn", "Uploaded file did not contain a valid YuBiFlo state object.");
        }
      } catch (err: any) {
        showToast("warn", `Failed to parse JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      
      {/* PROPRIETOR HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Database size={18} />
            </div>
            <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              Proprietor Console // Root Data Terminal
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              Root Clearance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero fluff. Direct read, write, and delete clearance across all warehouse and shop datasets. Untouched records preserved unconditionally.
          </p>
        </div>

        {/* BACKUP & RESTORE ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 bg-[#0d1e16] hover:bg-[#122b1f] text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            title="Download full JSON snapshot for cold storage"
          >
            <Download size={14} /> Cold Backup (.json)
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-sm">
            <Upload size={14} /> Restore Snapshot
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in shadow-xl ${
          toastMsg.type === "success" 
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" 
            : toastMsg.type === "warn"
            ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
            : "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={toastMsg.type === "success" ? "text-emerald-400" : "text-amber-400"} />
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* PROPRIETOR ARCHITECTURE GUIDE: ANSWERS USER'S "HOW AM I ACCESSING THE DB AND DATA WAREHOUSE" QUESTION */}
      <div className="bg-[#0b1612] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Data Architecture &bull; Triple-Vector Sovereign Persistence
            </h3>
          </div>
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
          >
            {isGuideOpen ? "Collapse Specs" : "Expand Specs"}
          </button>
        </div>

        {isGuideOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 text-xs text-slate-300">
            <div className="p-3 bg-[#050c08] border border-emerald-950 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                <HardDrive size={14} /> 1. Synchronous Primary Storage
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Direct client-side persistence (LocalStorage &amp; IndexedDB). Zero latency. Total offline immunity. 
              </p>
            </div>

            <div className="p-3 bg-[#050c08] border border-emerald-950 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono">
                <Cloud size={14} /> 2. Real-Time Cloud Mirror
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Atomic replication to Google Cloud Firestore (<code className="text-cyan-300">ws_alacio_001</code>). Multi-device synchronization.
              </p>
            </div>

            <div className="p-3 bg-[#050c08] border border-emerald-950 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                <ShieldCheck size={14} /> 3. Root Direct Vector
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                You have unrestricted root access. Direct field editing and deletion. Atomic commits isolate target rows.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TABLE SELECTOR CHIPS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>DATA WAREHOUSE COLLECTIONS ({tables.length} Active Datasets)</span>
          <span>Total Records: {tables.reduce((acc, t) => acc + t.count, 0)} items</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tables.map((tbl) => {
            const isSelected = activeTable === tbl.key;
            return (
              <button
                key={tbl.key}
                onClick={() => {
                  setActiveTable(tbl.key);
                  setSearchQuery("");
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#102419] border-emerald-500 text-white shadow-md shadow-emerald-950"
                    : "bg-[#0b1310] border-slate-800 text-slate-400 hover:bg-[#0f1c16] hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base">{tbl.icon}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tbl.count}
                  </span>
                </div>
                <div className="mt-2">
                  <div className={`text-xs font-bold leading-tight ${isSelected ? "text-emerald-400" : "text-white"}`}>
                    {tbl.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE TABLE TOOLBAR & SEARCH */}
      <div className="bg-[#111113] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentTableMeta.icon}</span>
            <h3 className="text-sm font-bold text-white font-mono">
              Table: <span className="text-emerald-400">{currentTableMeta.label}</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {filteredCollection.length} of {currentCollection.length} records
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {currentTableMeta.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search in this table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#060c08] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleOpenInsert}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow"
          >
            <Plus size={14} /> + Insert Record
          </button>
        </div>
      </div>

      {/* TABLE DATA GRID */}
      <div className="bg-[#0a120f] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {filteredCollection.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
              {currentTableMeta.icon}
            </div>
            <p className="text-sm text-slate-400 font-mono">
              {searchQuery ? `No records found matching "${searchQuery}" in ${currentTableMeta.label}.` : `No records currently in ${currentTableMeta.label}.`}
            </p>
            <button
              onClick={handleOpenInsert}
              className="px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold cursor-pointer hover:bg-emerald-500/25 transition"
            >
              + Create First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050c08] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-semibold">Record ID</th>
                  <th className="py-3 px-4 font-semibold">Primary Label</th>
                  <th className="py-3 px-4 font-semibold">Key Fields &amp; Attributes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredCollection.map((row, idx) => {
                  const id = row[currentTableMeta.idField] ?? row.id ?? `row_${idx}`;
                  const primaryLabel = row[currentTableMeta.displayField] || row.name || row.item_name || row.company || row.customer_name || String(id);
                  
                  // Extract preview attributes excluding id and displayField
                  const previewKeys = Object.keys(row)
                    .filter((k) => k !== currentTableMeta.idField && k !== "id" && k !== currentTableMeta.displayField && typeof row[k] !== "object")
                    .slice(0, 4);

                  return (
                    <tr key={String(id)} className="hover:bg-[#101e17] transition group">
                      
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold">
                          {String(id).length > 20 ? `${String(id).slice(0, 18)}...` : String(id)}
                        </span>
                      </td>

                      {/* PRIMARY LABEL */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-white text-sm">
                          {primaryLabel}
                        </div>
                        {row.national_id && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            National ID: <strong>{row.national_id}</strong>
                          </div>
                        )}
                        {row.phone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Phone: {row.phone}
                          </div>
                        )}
                      </td>

                      {/* ATTRIBUTES PREVIEW */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex flex-wrap gap-1.5">
                          {previewKeys.map((k) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-[#060c08] border border-slate-800 text-slate-300">
                              <span className="text-slate-500">{k}:</span> {String(row[k])}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Directly edit fields of this record"
                          >
                            <Edit3 size={12} /> Direct Edit
                          </button>

                          <button
                            onClick={() => handleOpenDelete(row)}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Delete this wrong entry"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DIRECT EDIT MODAL */}
      {/* ======================================================== */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0b1410] border-2 border-cyan-500/40 w-full max-w-2xl rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white font-serif">
                  Direct Edit Record: {currentTableMeta.label}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#060c08] p-2.5 rounded-xl border border-slate-800 shrink-0 font-mono">
              <span className="text-[11px] text-slate-400">
                Record ID: <strong className="text-emerald-400">{editingRecord[currentTableMeta.idField] ?? editingRecord.id}</strong>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Editor Mode:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!editJsonMode) {
                      setRawJsonText(JSON.stringify({ ...editingRecord, ...editFormValues }, null, 2));
                    }
                    setEditJsonMode(!editJsonMode);
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-bold cursor-pointer"
                >
                  {editJsonMode ? "Switch to Form Mode" : "Switch to Raw JSON"}
                </button>
              </div>
            </div>

            {/* EDIT CONTENT */}
            <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {editJsonMode ? (
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Raw JSON Payload:</label>
                  <textarea
                    rows={14}
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    className="w-full bg-[#050a07] border border-slate-700 rounded-xl p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.keys(editFormValues).map((key) => {
                    const val = editFormValues[key];
                    const isReadOnly = key === "id" || key === currentTableMeta.idField;
                    const valType = typeof val;

                    if (valType === "object" && val !== null) {
                      return null; // Nested objects handled via JSON mode
                    }

                    return (
                      <div key={key} className={key === "notes" ? "sm:col-span-2" : ""}>
                        <label className="text-slate-300 font-medium block mb-1 font-mono text-[11px]">
                          {key}
                          {isReadOnly && <span className="text-slate-500 ml-1">(Primary Key)</span>}
                        </label>
                        <input
                          type={valType === "number" ? "number" : "text"}
                          disabled={isReadOnly}
                          value={val ?? ""}
                          step={valType === "number" ? "any" : undefined}
                          onChange={(e) => {
                            const newV = valType === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                            setEditFormValues((prev) => ({ ...prev, [key]: newV }));
                          }}
                          className={`w-full bg-[#060c08] border rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none ${
                            isReadOnly ? "border-slate-800 text-slate-500 cursor-not-allowed" : "border-slate-700 focus:border-cyan-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Check size={14} /> Commit Edit &amp; Preserve Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRM DELETE MODAL */}
      {/* ======================================================== */}
      {isDeleteModalOpen && recordToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#120a0a] border-2 border-red-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-red-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Trash2 size={18} className="text-red-400" /> Confirm Delete Wrong Record
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <div className="p-3 bg-[#0a0505] rounded-xl border border-red-900/50 space-y-2 font-mono text-xs">
              <div className="text-slate-400">
                Table: <strong className="text-white">{currentTableMeta.label}</strong>
              </div>
              <div className="text-slate-400">
                Record ID: <strong className="text-red-300">{String(recordToDelete.id)}</strong>
              </div>
              <div className="text-slate-400">
                Summary: <strong className="text-white">{recordToDelete.summary}</strong>
              </div>
            </div>

            <p className="text-amber-200/90 text-[11px] leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Guaranteed Safe Deletion:</strong> Deleting this record removes only this erroneous entry. All other records, totals, and historical logs remain completely intact and preserved.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSERT RECORD MODAL */}
      {/* ======================================================== */}
      {isInsertModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0b1410] border-2 border-emerald-500/40 w-full max-w-xl rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Plus size={18} className="text-emerald-400" /> Insert New Record into {currentTableMeta.label}
              </h3>
              <button onClick={() => setIsInsertModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveInsert} className="space-y-4">
              <div>
                <label className="text-slate-300 font-mono block mb-1">Record JSON Payload:</label>
                <textarea
                  rows={12}
                  required
                  value={newRecordJson}
                  onChange={(e) => setNewRecordJson(e.target.value)}
                  className="w-full bg-[#050a07] border border-slate-700 rounded-xl p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsInsertModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
                >
                  Save Record to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
