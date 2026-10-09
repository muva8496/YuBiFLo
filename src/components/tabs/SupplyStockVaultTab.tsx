import React, { useState } from "react";
import { 
  Truck, Building2, Package, Camera, Layers, 
  ArrowRight, Plus, RefreshCw, Sparkles, Database, 
  ShieldCheck, Upload
} from "lucide-react";
import { 
  AlacioMasterState, 
  SupplierProfile, 
  WarehouseBatch, 
  InventoryItem 
} from "../../types/alacio";
import { ProcessedReceipt } from "../../services/receiptOcrService";
import SupplierLogTab, { MultiSupplyDelivery } from "./SupplierLogTab";
import WarehouseTab from "./WarehouseTab";
import InventoryTab from "./InventoryTab";
import ReceiptUploadScannerTab from "./ReceiptUploadScannerTab";

interface SupplyStockVaultTabProps {
  state: AlacioMasterState;
  onLogMultiDelivery: (delivery: MultiSupplyDelivery) => void;
  onAddSupplier?: (newSupplier: {
    name: string;
    company: string;
    driver_name?: string;
    phone: string;
    national_id: string;
    category: string;
    payment_preference: "NATIONAL_ID_DEPOSIT" | "MPESA_TILL" | "CASH_DRAWER" | "BANK_TRANSFER";
    till_or_account?: string;
    payment_terms?: string;
  }) => void;
  onEditSupplier?: (supplierId: string, updatedData: Partial<SupplierProfile>) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onTransferToShelf: (batchId: string, quantityToMove: number) => void;
  onReceiveShipment: (newBatchData: Omit<WarehouseBatch, "id">) => void;
  onEditBatch?: (batchId: string, updatedData: Partial<WarehouseBatch>) => void;
  onDeleteBatch?: (batchId: string) => void;
  onOpenRestock: (item?: InventoryItem) => void;
  onCommitProcessedReceipt: (receipt: ProcessedReceipt) => void;
  initialSubTab?: "suppliers" | "warehouse" | "inventory" | "receipts";
}

type SubModuleKey = "suppliers" | "warehouse" | "inventory" | "receipts";

export default function SupplyStockVaultTab({
  state,
  onLogMultiDelivery,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onTransferToShelf,
  onReceiveShipment,
  onEditBatch,
  onDeleteBatch,
  onOpenRestock,
  onCommitProcessedReceipt,
  initialSubTab = "suppliers"
}: SupplyStockVaultTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubModuleKey>(initialSubTab);

  const suppliersCount = state.suppliers?.length || 5;
  const warehouseBatchesCount = state.warehouse?.length || 0;
  const inventorySkusCount = state.inventory?.length || 0;

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      
      {/* CONSOLIDATED HUB HEADER */}
      <div className="bg-[#0b1612] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Layers size={18} />
              </div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                Supply, Stock &amp; Warehouse Vault
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Unified Vector Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Consolidated supply chain control: Inbound supplier manifests, backroom warehouse depot lots, display shelf SKUs, and vision receipt scans under one sovereign perimeter.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[10px] text-slate-400">Total Pipeline:</span>
            <span className="text-emerald-400 font-bold">{state.currency} {(state.kpis.total_active_shelf_retail_value + (state.warehouse.reduce((a, b) => a + (b.bulk_quantity * b.bulk_cost_per_unit), 0))).toLocaleString()}</span>
          </div>
        </div>

        {/* 4 CONSOLIDATED SUB-MODULE TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* SUB-MODULE 1: SUPPLIER LOGS */}
          <button
            type="button"
            onClick={() => setActiveSubTab("suppliers")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSubTab === "suppliers"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck size={16} className={activeSubTab === "suppliers" ? "text-cyan-400" : "text-slate-500"} />
              <span>Inbound Suppliers</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              activeSubTab === "suppliers" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-slate-800 text-slate-400"
            }`}>
              {suppliersCount}
            </span>
          </button>

          {/* SUB-MODULE 2: WAREHOUSE & BULK */}
          <button
            type="button"
            onClick={() => setActiveSubTab("warehouse")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSubTab === "warehouse"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 size={16} className={activeSubTab === "warehouse" ? "text-emerald-400" : "text-slate-500"} />
              <span>Warehouse Vault</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              activeSubTab === "warehouse" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
            }`}>
              {warehouseBatchesCount} bulk
            </span>
          </button>

          {/* SUB-MODULE 3: INVENTORY SKUs */}
          <button
            type="button"
            onClick={() => setActiveSubTab("inventory")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSubTab === "inventory"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={16} className={activeSubTab === "inventory" ? "text-teal-400" : "text-slate-500"} />
              <span>Active SKUs</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              activeSubTab === "inventory" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-slate-800 text-slate-400"
            }`}>
              {inventorySkusCount} items
            </span>
          </button>

          {/* SUB-MODULE 4: VISION RECEIPT SCANNER */}
          <button
            type="button"
            onClick={() => setActiveSubTab("receipts")}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
              activeSubTab === "receipts"
                ? "bg-[#14291f] border-emerald-500 text-white shadow-md shadow-emerald-950 font-bold"
                : "bg-[#09090b] border-slate-800 text-slate-400 hover:bg-[#111113] hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera size={16} className={activeSubTab === "receipts" ? "text-amber-400" : "text-slate-500"} />
              <span>Receipt Scanner</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              activeSubTab === "receipts" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-400"
            }`}>
              OCR
            </span>
          </button>
        </div>
      </div>

      {/* RENDER THE ACTIVE SUB-MODULE */}
      <div>
        {activeSubTab === "suppliers" && (
          <SupplierLogTab
            state={state}
            onLogMultiDelivery={onLogMultiDelivery}
            onAddSupplier={onAddSupplier}
            onEditSupplier={onEditSupplier}
            onDeleteSupplier={onDeleteSupplier}
          />
        )}

        {activeSubTab === "warehouse" && (
          <WarehouseTab
            currency={state.currency}
            warehouse={state.warehouse}
            inventory={state.inventory}
            onTransferToShelf={onTransferToShelf}
            onReceiveShipment={onReceiveShipment}
            onEditBatch={onEditBatch}
            onDeleteBatch={onDeleteBatch}
          />
        )}

        {activeSubTab === "inventory" && (
          <InventoryTab
            currency={state.currency}
            inventory={state.inventory}
            onOpenRestock={onOpenRestock}
          />
        )}

        {activeSubTab === "receipts" && (
          <ReceiptUploadScannerTab
            state={state}
            onCommitProcessedReceipt={onCommitProcessedReceipt}
          />
        )}
      </div>

    </div>
  );
}
