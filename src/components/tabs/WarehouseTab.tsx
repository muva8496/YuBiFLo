import React, { useState } from "react";
import { 
  Building2, Package, ArrowRight, Plus, RefreshCw, 
  CheckCircle2, AlertTriangle, ShieldCheck, Database, 
  Layers, Truck, ArrowDownRight, X, Edit3, Trash2, Check
} from "lucide-react";
import { WarehouseBatch, InventoryItem } from "../../types/alacio";

interface WarehouseTabProps {
  currency: string;
  warehouse: WarehouseBatch[];
  inventory: InventoryItem[];
  onTransferToShelf: (batchId: string, quantityToMove: number) => void;
  onReceiveShipment: (newBatch: Omit<WarehouseBatch, "id">) => void;
  onEditBatch?: (batchId: string, updatedData: Partial<WarehouseBatch>) => void;
  onDeleteBatch?: (batchId: string) => void;
}

export default function WarehouseTab({
  currency,
  warehouse,
  inventory,
  onTransferToShelf,
  onReceiveShipment,
  onEditBatch,
  onDeleteBatch
}: WarehouseTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<WarehouseBatch | null>(null);
  const [transferQty, setTransferQty] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Batch states
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<WarehouseBatch | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editBatchNo, setEditBatchNo] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editBulkQty, setEditBulkQty] = useState("");
  const [editUnitType, setEditUnitType] = useState("");
  const [editCostPerUnit, setEditCostPerUnit] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editExpiry, setEditExpiry] = useState("");

  // Delete Batch states
  const [isDeleteBatchOpen, setIsDeleteBatchOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<WarehouseBatch | null>(null);

  const handleOpenEditBatch = (batch: WarehouseBatch) => {
    setEditingBatch(batch);
    setEditItemName(batch.item_name);
    setEditBatchNo(batch.batch_number);
    setEditSupplier(batch.supplier_name);
    setEditSupplierId(batch.supplier_national_id || "");
    setEditBulkQty(String(batch.bulk_quantity));
    setEditUnitType(batch.unit_type);
    setEditCostPerUnit(String(batch.bulk_cost_per_unit));
    setEditLocation(batch.storage_location);
    setEditExpiry(batch.expiry_date || "");
    setIsEditBatchOpen(true);
  };

  const handleExecuteEditBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !editItemName.trim()) return;

    const qty = parseFloat(editBulkQty) || 0;
    const cost = parseFloat(editCostPerUnit) || 0;

    if (onEditBatch) {
      onEditBatch(editingBatch.id, {
        item_name: editItemName.trim(),
        batch_number: editBatchNo.trim(),
        supplier_name: editSupplier.trim(),
        supplier_national_id: editSupplierId.trim() || undefined,
        bulk_quantity: qty,
        unit_type: editUnitType.trim(),
        bulk_cost_per_unit: cost,
        total_batch_cost: qty * cost,
        storage_location: editLocation.trim(),
        expiry_date: editExpiry
      });
    }

    setIsEditBatchOpen(false);
    setToastMsg(`Warehouse batch for "${editItemName}" updated successfully. Data preserved.`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleOpenDeleteBatch = (batch: WarehouseBatch) => {
    setBatchToDelete(batch);
    setIsDeleteBatchOpen(true);
  };

  const handleExecuteDeleteBatch = () => {
    if (!batchToDelete) return;
    if (onDeleteBatch) {
      onDeleteBatch(batchToDelete.id);
    }
    setIsDeleteBatchOpen(false);
    setToastMsg(`Warehouse batch "${batchToDelete.item_name} (${batchToDelete.batch_number})" deleted. All other batches preserved.`);
    setBatchToDelete(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // New Shipment form state
  const [itemName, setItemName] = useState("Unga Jogoo 2kg");
  const [supplier, setSupplier] = useState("");
  const [supplierNationalId, setSupplierNationalId] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [bulkQty, setBulkQty] = useState("");
  const [unitType, setUnitType] = useState("bales");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [location, setLocation] = useState("Backroom Bay 1");
  const [expiry, setExpiry] = useState("2027-04-30");

  const totalWhCost = warehouse.reduce((acc, b) => acc + (b.bulk_quantity * b.bulk_cost_per_unit), 0);
  const totalUnits = warehouse.reduce((acc, b) => acc + b.bulk_quantity, 0);
  const lowBufferCount = warehouse.filter((b) => b.bulk_quantity <= b.reorder_threshold).length;

  const categories = ["All", "Flour", "Dairy", "Cooking & Oils", "Poultry", "Sugar", "Bakery"];

  const filteredBatches = warehouse.filter((b) => {
    return selectedCategory === "All" || b.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleOpenTransfer = (batch: WarehouseBatch) => {
    setSelectedBatch(batch);
    setTransferQty("5");
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !transferQty) return;
    const qty = parseInt(transferQty);
    if (qty <= 0 || qty > selectedBatch.bulk_quantity) return;

    onTransferToShelf(selectedBatch.id, qty);
    setIsTransferModalOpen(false);
    setToastMsg(`Transferred ${qty} ${selectedBatch.unit_type} of ${selectedBatch.item_name} from Warehouse to Active Front Shelf!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleExecuteReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !bulkQty || !costPerUnit) return;

    const matchedInv = inventory.find((i) => i.name.toLowerCase().includes(itemName.toLowerCase()));
    const qty = parseFloat(bulkQty);
    const cost = parseFloat(costPerUnit);

    onReceiveShipment({
      item_id: matchedInv ? matchedInv.id : Date.now(),
      item_name: itemName,
      category: matchedInv ? matchedInv.category : "General",
      batch_number: batchNo.trim() || `BN-${Date.now().toString().slice(-4)}`,
      supplier_name: supplier.trim() || "Local Wholesaler",
      supplier_national_id: supplierNationalId.trim() || undefined,
      bulk_quantity: qty,
      unit_type: unitType,
      bulk_cost_per_unit: cost,
      total_batch_cost: qty * cost,
      storage_location: location,
      reorder_threshold: 8,
      received_date: new Date().toISOString().slice(0, 10),
      expiry_date: expiry,
      status: "IN_STORAGE"
    });

    setIsReceiveModalOpen(false);
    setToastMsg(`Logged incoming wholesale delivery: ${qty} ${unitType} of ${itemName} received into ${location}!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HEADER WITH CLOUD DATABASE BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
              <Building2 className="text-emerald-400" size={22} /> Reserve Vault // Depot Bulk Batches
            </h2>
            <span className="text-[10px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <Database size={11} /> Cloud Firestore
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Backroom reserve vault. Pallet allocations, wholesale capital lock, and atomic shelf transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReceiveModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow font-mono"
          >
            <Truck size={14} /> + Receive Wholesale Batch
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP 3 WAREHOUSE KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Warehouse Bulk Capital Reserve
          </span>
          <div className="text-3xl font-black font-mono text-white mt-1">
            {currency} {totalWhCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Wholesale capital tied in backroom bulk storage
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Total Bulk Units in Backroom
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {totalUnits.toLocaleString()} Units
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {warehouse.length} verified supplier shipment batches
          </span>
        </div>

        <div className="bg-[#121822] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Wholesale Reorder Buffer Alerts
          </span>
          <div className={`text-3xl font-black font-mono mt-1 ${lowBufferCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {lowBufferCount} Batches Low
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {lowBufferCount > 0 ? "Supplier PO required to prevent shop stockouts" : "Healthy warehouse supply buffers"}
          </span>
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer font-medium ${
              selectedCategory === cat
                ? "bg-slate-700 text-white border-slate-600 shadow"
                : "bg-[#121822] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* WAREHOUSE BATCHES TABLE */}
      <div className="bg-[#121822] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#161d29] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Item &amp; Batch Code</th>
                <th className="py-3 px-4 font-semibold">Supplier &amp; Location</th>
                <th className="py-3 px-4 font-semibold text-center">Warehouse Stock</th>
                <th className="py-3 px-4 font-semibold text-center">Shelf Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Wholesale Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Batch Valuation</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredBatches.map((batch) => {
                const shelfMatch = inventory.find((i) => i.id === batch.item_id || i.name.toLowerCase() === batch.item_name.toLowerCase());
                const shelfQty = shelfMatch ? shelfMatch.current_stock : 0;
                const isLow = batch.bulk_quantity <= batch.reorder_threshold;

                return (
                  <tr key={batch.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                      <div className="font-semibold text-white">{batch.item_name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{batch.batch_number} &bull; {batch.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      <div className="font-semibold text-white">{batch.supplier_name}</div>
                      {batch.supplier_national_id && (
                        <div className="text-[10px] text-emerald-400 font-mono font-bold">
                          ID Deposit: {batch.supplier_national_id}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono">{batch.storage_location}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isLow ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {batch.bulk_quantity} {batch.unit_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">
                      {shelfQty} on shelf
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {currency} {batch.bulk_cost_per_unit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-white">
                      {currency} {(batch.bulk_quantity * batch.bulk_cost_per_unit).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenEditBatch(batch)}
                          className="px-2 py-1 text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded transition cursor-pointer flex items-center gap-1"
                          title="Edit batch wholesale details or quantity"
                        >
                          <Edit3 size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteBatch(batch)}
                          className="px-2 py-1 text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition cursor-pointer flex items-center gap-1"
                          title="Delete warehouse batch entered wrong"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                        <button
                          onClick={() => handleOpenTransfer(batch)}
                          disabled={batch.bulk_quantity <= 0}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded transition cursor-pointer disabled:opacity-40 flex items-center gap-1"
                        >
                          <span>Move to Shelf</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSFER TO SHELF MODAL */}
      {isTransferModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRight size={16} className="text-emerald-400" /> Transfer to Retail Shelf: {selectedBatch.item_name}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <div className="p-3 bg-[#0a0d12] rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Warehouse Location:</span>
                <span className="text-white font-bold">{selectedBatch.storage_location}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Available in Warehouse:</span>
                <span className="text-emerald-400 font-bold">{selectedBatch.bulk_quantity} {selectedBatch.unit_type}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Units to Move to Front Display Shelf ({selectedBatch.unit_type})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedBatch.bulk_quantity}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
                >
                  Confirm Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE SHIPMENT MODAL */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121822] border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={16} className="text-emerald-400" /> Log Incoming Wholesale Shipment
              </h3>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleExecuteReceive} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Merchandise Item</label>
                <select
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.name}>
                      {inv.name} ({inv.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unga Millers Hub"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supplier National ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 28419203 (OTC Deposit)"
                    value={supplierNationalId}
                    onChange={(e) => setSupplierNationalId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Batch Code / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. BN-8492"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bulk Qty Received</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 50"
                    value={bulkQty}
                    onChange={(e) => setBulkQty(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Wholesale Cost ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 175"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Warehouse Storage Bay</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow"
                >
                  Save to Warehouse &amp; Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WAREHOUSE BATCH MODAL */}
      {isEditBatchOpen && editingBatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121822] border-2 border-cyan-500/40 w-full max-w-lg rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Edit3 size={18} className="text-cyan-400" /> Edit Warehouse Batch: {editingBatch.item_name}
              </h3>
              <button onClick={() => setIsEditBatchOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Correct batch quantities, cost per unit, supplier details, or bay location entered wrong.
            </p>

            <form onSubmit={handleExecuteEditBatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Batch Code / Invoice #</label>
                  <input
                    type="text"
                    required
                    value={editBatchNo}
                    onChange={(e) => setEditBatchNo(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Supplier National ID</label>
                  <input
                    type="text"
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bulk Qty</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editBulkQty}
                    onChange={(e) => setEditBulkQty(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={editUnitType}
                    onChange={(e) => setEditUnitType(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cost / Unit ({currency})</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editCostPerUnit}
                    onChange={(e) => setEditCostPerUnit(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditBatchOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Batch Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE WAREHOUSE BATCH MODAL */}
      {isDeleteBatchOpen && batchToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#180f12] border-2 border-red-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-red-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Trash2 size={18} className="text-red-400" /> Delete Warehouse Batch
              </h3>
              <button onClick={() => setIsDeleteBatchOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>

            <div className="p-3 bg-[#0f090b] rounded-xl border border-red-900/40 space-y-1 font-mono text-xs">
              <div className="text-white font-bold text-sm font-sans">{batchToDelete.item_name}</div>
              <div className="text-emerald-400">Batch Code: {batchToDelete.batch_number}</div>
              <div className="text-slate-400">Available: {batchToDelete.bulk_quantity} {batchToDelete.unit_type}</div>
              <div className="text-slate-400">Supplier: {batchToDelete.supplier_name}</div>
              <div className="text-amber-400 pt-1">
                Batch Valuation: {currency} {(batchToDelete.bulk_quantity * batchToDelete.bulk_cost_per_unit).toLocaleString()}
              </div>
            </div>

            <p className="text-amber-200/90 text-[11px] leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <strong>Data Preservation Guarantee:</strong> Deleting this batch removes only this wrong or duplicate entry. All other warehouse batches and store inventory remain completely preserved.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteBatchOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteBatch}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
