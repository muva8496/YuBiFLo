import {
  Supplier,
  SupplierDelivery,
  SupplierPayment,
  Customer,
  CustomerSale,
  CustomerDebtRepayment,
  MoneyOutExpense,
  SalesLedgerEntry,
  SupplyBatch,
  InventoryItem,
  DailyMorningFloatLog,
  OwnerCapitalRecord,
  Merchant,
  TAccountLedger,
  TAccountEntry,
  SupplierRanking,
  SupplierTier,
  CustomerRanking,
  CustomerTier,
  CustomerTrustGrade,
  CustomerDebtStatusBadge,
} from "../types";

export interface AccountingLedgerSet {
  creditorsPurchasesLedger: TAccountLedger;
  debtorsSalesLedger: TAccountLedger;
  nominalExpensesLedger: TAccountLedger;
  cashLiquidLedger: TAccountLedger;
  stockInventoryLedger: TAccountLedger;
  ownerCapitalLedger: TAccountLedger;
  individualSuppliers: TAccountLedger[];
  individualCustomers: TAccountLedger[];
  individualExpenses: TAccountLedger[];
  individualLiquidChannels: TAccountLedger[];
  individualStockItems: TAccountLedger[];
  trialBalance: {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    difference: number;
    rows: Array<{
      accountCode: string;
      accountTitle: string;
      nature: string;
      debit: number;
      credit: number;
    }>;
  };
}

export class AccountingEngine {
  /**
   * Generates the 6 Classical Accounting T-Account Ledgers
   */
  static generateTLedgers(params: {
    suppliers: Supplier[];
    supplierDeliveries: SupplierDelivery[];
    supplierPayments: SupplierPayment[];
    customers: Customer[];
    customerSales: CustomerSale[];
    customerRepayments: CustomerDebtRepayment[];
    expenses: MoneyOutExpense[];
    sales: SalesLedgerEntry[];
    batches: SupplyBatch[];
    items: InventoryItem[];
    morningLogs: DailyMorningFloatLog[];
    ownerCapital: OwnerCapitalRecord[];
    merchant: Merchant;
    filterSupplierId?: string;
    filterCustomerId?: string;
    filterExpenseCategory?: string;
    filterPaymentChannel?: string;
    filterItemId?: string;
    startDate?: string;
    endDate?: string;
  }): AccountingLedgerSet {
    const {
      suppliers,
      supplierDeliveries,
      supplierPayments,
      customers,
      customerSales,
      customerRepayments,
      expenses,
      sales,
      batches,
      items,
      ownerCapital,
      filterSupplierId,
      filterCustomerId,
      filterExpenseCategory,
      filterPaymentChannel,
      filterItemId,
      startDate,
      endDate,
    } = params;

    const isDateInRange = (dateStr: string) => {
      if (!dateStr) return true;
      const d = dateStr.split("T")[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    // ----------------------------------------------------
    // 1. CREDITORS & PURCHASES T-LEDGER (Accounts Payable)
    // ----------------------------------------------------
    // Debit: Supplier Payments made (reducing our debt)
    // Credit: Inbound Deliveries & Purchases on credit (increasing debt)
    const creditorsDebits: TAccountEntry[] = [];
    supplierPayments
      .filter((p) => isDateInRange(p.date || p.created_at))
      .filter((p) => (!filterSupplierId || p.supplier_id === filterSupplierId))
      .forEach((p) => {
        creditorsDebits.push({
          id: p.id,
          date: (p.date || p.created_at || "").split("T")[0],
          reference: p.reference || `PMT-${p.id.slice(-4)}`,
          description: `Payment to ${p.supplier_name} (${p.payment_channel.replace("_", " ")})`,
          entity_name: p.supplier_name,
          amount: Number(p.amount) || 0,
          payment_channel: p.payment_channel,
        });
      });

    // Also include payments made directly at delivery
    supplierDeliveries
      .filter((d) => isDateInRange(d.delivery_date || d.created_at))
      .filter((d) => (!filterSupplierId || d.supplier_id === filterSupplierId))
      .filter((d) => d.amount_paid > 0)
      .forEach((d) => {
        creditorsDebits.push({
          id: `deliv-pay-${d.id}`,
          date: (d.delivery_date || d.created_at || "").split("T")[0],
          reference: d.invoice_or_delivery_note || `DROP-${d.id.slice(-4)}`,
          description: `Settled drop payment: ${d.supplier_name}`,
          entity_name: d.supplier_name,
          amount: Number(d.amount_paid) || 0,
          payment_channel: d.payment_channel,
        });
      });

    const creditorsCredits: TAccountEntry[] = [];
    supplierDeliveries
      .filter((d) => isDateInRange(d.delivery_date || d.created_at))
      .filter((d) => (!filterSupplierId || d.supplier_id === filterSupplierId))
      .forEach((d) => {
        creditorsCredits.push({
          id: d.id,
          date: (d.delivery_date || d.created_at || "").split("T")[0],
          reference: d.invoice_or_delivery_note || `INV-${d.id.slice(-4)}`,
          description: `Inbound delivery drop: ${d.supplier_name} (${d.items.length} items)`,
          entity_name: d.supplier_name,
          amount: Number(d.total_amount) || 0,
          payment_channel: d.payment_channel,
        });
      });

    const totalCreditorsDebit = creditorsDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalCreditorsCredit = creditorsCredits.reduce((acc, e) => acc + e.amount, 0);
    const creditorsBalance = Math.abs(totalCreditorsCredit - totalCreditorsDebit);
    const creditorsSide =
      totalCreditorsCredit >= totalCreditorsDebit
        ? "CREDIT"
        : "DEBIT";

    const creditorsPurchasesLedger: TAccountLedger = {
      id: "ledger-creditors",
      title: "Creditors & Purchases Ledger",
      subtitle: "Suppliers & Accounts Payable (Payable Debt Owed to Wholesalers)",
      type: "CREDITORS_PURCHASES",
      account_code: "ACC-2010",
      nature: "LIABILITY_CR",
      debits: creditorsDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: creditorsCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalCreditorsDebit,
      total_credit: totalCreditorsCredit,
      balance_c_d: creditorsBalance,
      balance_side: creditorsSide,
    };

    // ----------------------------------------------------
    // 2. DEBTORS & SALES T-LEDGER (Accounts Receivable / Deni)
    // ----------------------------------------------------
    // Debit: Credit Sales & Deni given to customers (increasing our receivable asset)
    // Credit: Customer Repayments received (reducing customer debt)
    const debtorsDebits: TAccountEntry[] = [];
    customerSales
      .filter((s) => isDateInRange(s.date || s.created_at))
      .filter((s) => (!filterCustomerId || s.customer_id === filterCustomerId))
      .filter((s) => s.deni_added > 0)
      .forEach((s) => {
        debtorsDebits.push({
          id: s.id,
          date: (s.date || s.created_at || "").split("T")[0],
          reference: `SALE-${s.id.slice(-4)}`,
          description: `Credit Sale (Deni) to ${s.customer_name}`,
          entity_name: s.customer_name,
          amount: Number(s.deni_added) || 0,
          payment_channel: s.payment_channel,
        });
      });

    const debtorsCredits: TAccountEntry[] = [];
    customerRepayments
      .filter((r) => isDateInRange(r.date || r.created_at))
      .filter((r) => (!filterCustomerId || r.customer_id === filterCustomerId))
      .forEach((r) => {
        debtorsCredits.push({
          id: r.id,
          date: (r.date || r.created_at || "").split("T")[0],
          reference: r.reference || `REC-${r.id.slice(-4)}`,
          description: `Deni debt repayment by ${r.customer_name} (${r.payment_channel.replace("_", " ")})`,
          entity_name: r.customer_name,
          amount: Number(r.amount_paid) || 0,
          payment_channel: r.payment_channel,
        });
      });

    // Also include any initial customer balances if no sales yet
    if (debtorsDebits.length === 0 && debtorsCredits.length === 0) {
      customers
        .filter((c) => (!filterCustomerId || c.id === filterCustomerId))
        .filter((c) => c.outstanding_credit_deni > 0)
        .forEach((c) => {
          debtorsDebits.push({
            id: `init-${c.id}`,
            date: (c.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
            reference: `BAL-B/F`,
            description: `Opening Deni Balance: ${c.name}`,
            entity_name: c.name,
            amount: Number(c.outstanding_credit_deni) || 0,
            payment_channel: "CREDIT_DENI",
          });
        });
    }

    const totalDebtorsDebit = debtorsDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalDebtorsCredit = debtorsCredits.reduce((acc, e) => acc + e.amount, 0);
    const debtorsBalance = Math.abs(totalDebtorsDebit - totalDebtorsCredit);
    const debtorsSide =
      totalDebtorsDebit >= totalDebtorsCredit
        ? "DEBIT"
        : "CREDIT";

    const debtorsSalesLedger: TAccountLedger = {
      id: "ledger-debtors",
      title: "Debtors & Customer Ledger",
      subtitle: "Accounts Receivable & Neighborhood Deni (Asset to Collect)",
      type: "DEBTORS_SALES",
      account_code: "ACC-1020",
      nature: "ASSET_DR",
      debits: debtorsDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: debtorsCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalDebtorsDebit,
      total_credit: totalDebtorsCredit,
      balance_c_d: debtorsBalance,
      balance_side: debtorsSide,
    };

    // ----------------------------------------------------
    // 3. NOMINAL / OPERATING EXPENSES T-LEDGER
    // ----------------------------------------------------
    // Debit: Operating expenses incurred (Rent, Electricity, Wages, Licenses, Spoilage, Packaging, etc.)
    // Credit: Expense refunds, discounts & period-end P&L closing
    const expenseDebits: TAccountEntry[] = [];
    expenses
      .filter((e) => isDateInRange(e.created_at))
      .filter((e) => (!filterExpenseCategory || e.category === filterExpenseCategory))
      .forEach((e) => {
        expenseDebits.push({
          id: e.id,
          date: (e.created_at || "").split("T")[0],
          reference: e.receipt_reference || `EXP-${e.id.slice(-4)}`,
          description: `${e.category}: ${e.notes || e.item_name || "General Operating Expense"}`,
          entity_name: e.supplier_name || e.category,
          amount: Number(e.total_cost) || 0,
          payment_channel: "CASH",
          category: e.category,
        });
      });

    const expenseCredits: TAccountEntry[] = [];
    // If no refunds, empty credits (normal for expenses)
    const totalExpenseDebit = expenseDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalExpenseCredit = expenseCredits.reduce((acc, e) => acc + e.amount, 0);
    const expenseBalance = totalExpenseDebit - totalExpenseCredit;

    const nominalExpensesLedger: TAccountLedger = {
      id: "ledger-expenses",
      title: "Nominal / General Expenses Ledger",
      subtitle: "Operating Overheads & Store Costs (Rent, Electricity Tokens, Wages, Spoilage)",
      type: "NOMINAL_EXPENSES",
      account_code: "ACC-5010",
      nature: "EXPENSE_DR",
      debits: expenseDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: expenseCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalExpenseDebit,
      total_credit: totalExpenseCredit,
      balance_c_d: expenseBalance,
      balance_side: "DEBIT",
    };

    // ----------------------------------------------------
    // 4. CASH BOOK & LIQUID ASSETS T-LEDGER
    // ----------------------------------------------------
    // Debit: Cash Receipts (Cash Sales, Debt Repayments, Capital Additions)
    // Credit: Cash Disbursements (Supplier payments, Operating expenses, Owner drawings)
    const cashDebits: TAccountEntry[] = [];
    const cashCredits: TAccountEntry[] = [];

    // Cash receipts from Sales
    sales
      .filter((s) => isDateInRange(s.created_at || s.batch_end_date))
      .forEach((s) => {
        cashDebits.push({
          id: s.id,
          date: (s.created_at || s.batch_end_date || "").split("T")[0],
          reference: `SAL-${s.id.slice(-4)}`,
          description: `Duka Cash/Paybill/M-Pesa sale (${s.item_name})`,
          entity_name: "Store Customer",
          amount: Number(s.total_revenue) || 0,
          payment_channel: "CASH",
        });
      });

    // Customer Debt Repayments
    customerRepayments
      .filter((r) => isDateInRange(r.date || r.created_at))
      .filter((r) => (!filterPaymentChannel || r.payment_channel === filterPaymentChannel))
      .forEach((r) => {
        cashDebits.push({
          id: `cr-pay-${r.id}`,
          date: (r.date || r.created_at || "").split("T")[0],
          reference: r.reference || `REC-${r.id.slice(-4)}`,
          description: `Customer Debt Collection: ${r.customer_name}`,
          entity_name: r.customer_name,
          amount: Number(r.amount_paid) || 0,
          payment_channel: r.payment_channel,
        });
      });

    // Owner Capital Injections
    ownerCapital
      .filter((c) => isDateInRange(c.date || c.created_at))
      .filter((c) => c.entry_type === "CAPITAL_INJECTION")
      .filter((c) => (!filterPaymentChannel || c.payment_channel === filterPaymentChannel))
      .forEach((c) => {
        cashDebits.push({
          id: c.id,
          date: (c.date || c.created_at || "").split("T")[0],
          reference: `CAP-${c.id.slice(-4)}`,
          description: `Capital Contribution: ${c.purpose_or_reason}`,
          entity_name: c.recipient_or_contributor,
          amount: Number(c.amount) || 0,
          payment_channel: c.payment_channel,
        });
      });

    // Cash Disbursements: Operating Expenses
    expenses
      .filter((e) => isDateInRange(e.created_at))
      .forEach((e) => {
        cashCredits.push({
          id: `cash-exp-${e.id}`,
          date: (e.created_at || "").split("T")[0],
          reference: e.receipt_reference || `EXP-${e.id.slice(-4)}`,
          description: `Expense Payout: ${e.category} (${e.notes || e.item_name || "General"})`,
          entity_name: e.supplier_name || e.category,
          amount: Number(e.total_cost) || 0,
          payment_channel: "CASH",
        });
      });

    // Cash Disbursements: Supplier Payments
    supplierPayments
      .filter((p) => isDateInRange(p.date || p.created_at))
      .filter((p) => (!filterPaymentChannel || p.payment_channel === filterPaymentChannel))
      .forEach((p) => {
        cashCredits.push({
          id: `cash-supp-${p.id}`,
          date: (p.date || p.created_at || "").split("T")[0],
          reference: p.reference || `PMT-${p.id.slice(-4)}`,
          description: `Supplier Payout: ${p.supplier_name}`,
          entity_name: p.supplier_name,
          amount: Number(p.amount) || 0,
          payment_channel: p.payment_channel,
        });
      });

    // Cash Disbursements: Owner Drawings
    ownerCapital
      .filter((c) => isDateInRange(c.date || c.created_at))
      .filter((c) => c.entry_type === "PERSONAL_DRAWING")
      .filter((c) => (!filterPaymentChannel || c.payment_channel === filterPaymentChannel))
      .forEach((c) => {
        cashCredits.push({
          id: `draw-${c.id}`,
          date: (c.date || c.created_at || "").split("T")[0],
          reference: `DRAW-${c.id.slice(-4)}`,
          description: `Personal Drawing: ${c.purpose_or_reason}`,
          entity_name: c.recipient_or_contributor,
          amount: Number(c.amount) || 0,
          payment_channel: c.payment_channel,
        });
      });

    const totalCashDebit = cashDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalCashCredit = cashCredits.reduce((acc, e) => acc + e.amount, 0);
    const cashBalance = Math.abs(totalCashDebit - totalCashCredit);
    const cashSide = totalCashDebit >= totalCashCredit ? "DEBIT" : "CREDIT";

    const cashLiquidLedger: TAccountLedger = {
      id: "ledger-cash",
      title: "Cash Book & Liquid Assets Ledger",
      subtitle: "Physical Cash Drawer, Equity Paybill (1450180372031) & M-Pesa E-Float Tills",
      type: "CASH_LIQUID",
      account_code: "ACC-1010",
      nature: "ASSET_DR",
      debits: cashDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: cashCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalCashDebit,
      total_credit: totalCashCredit,
      balance_c_d: cashBalance,
      balance_side: cashSide,
    };

    // ----------------------------------------------------
    // 5. STOCK & INVENTORY ASSET T-LEDGER
    // ----------------------------------------------------
    // Debit: Inbound Stock Deliveries / Restocks at Cost + Inward Freight
    // Credit: Cost of Goods Sold (COGS from Sales) + Spoilage Write-offs
    const stockDebits: TAccountEntry[] = [];
    const stockCredits: TAccountEntry[] = [];

    // Inbound stock batches at cost
    batches
      .filter((b) => isDateInRange(b.received_at))
      .filter((b) => (!filterItemId || b.item_id === filterItemId))
      .forEach((b) => {
        const batchCost = (b.initial_qty || 0) * (b.unit_cost_price || 0);
        stockDebits.push({
          id: b.id,
          date: (b.received_at || "").split("T")[0],
          reference: `BAT-${b.id.slice(-4)}`,
          description: `Inbound Restock: ${b.item_name} (${b.initial_qty} units @ KSh ${b.unit_cost_price})`,
          entity_name: "Supplier Restock Drop",
          amount: Number(batchCost) || 0,
        });
      });

    // Also check supplier deliveries items
    supplierDeliveries
      .filter((d) => isDateInRange(d.delivery_date || d.created_at))
      .forEach((d) => {
        d.items.forEach((itemLine) => {
          if (!filterItemId || itemLine.item_id === filterItemId) {
            stockDebits.push({
              id: `drop-${d.id}-${itemLine.item_name}`,
              date: (d.delivery_date || d.created_at || "").split("T")[0],
              reference: d.invoice_or_delivery_note || `DROP-${d.id.slice(-4)}`,
              description: `Delivery Drop: ${itemLine.item_name} (${itemLine.qty} ${itemLine.unit_of_measure})`,
              entity_name: d.supplier_name,
              amount: Number(itemLine.subtotal) || 0,
            });
          }
        });
      });

    // COGS from Sales
    sales
      .filter((s) => isDateInRange(s.created_at || s.batch_end_date))
      .filter((s) => (!filterItemId || s.item_id === filterItemId))
      .forEach((s) => {
        stockCredits.push({
          id: `cogs-${s.id}`,
          date: (s.created_at || s.batch_end_date || "").split("T")[0],
          reference: `SALE-${s.id.slice(-4)}`,
          description: `COGS: ${s.item_name} (${s.qty_sold} sold @ cost KSh ${s.unit_cost_price})`,
          entity_name: "Sold to Customer",
          amount: Number(s.total_cost) || 0,
        });
      });

    // Spoilage / Damaged Stock
    batches
      .filter((b) => b.spoilage_loss_qty > 0)
      .filter((b) => (!filterItemId || b.item_id === filterItemId))
      .forEach((b) => {
        const spoilageVal = b.spoilage_loss_qty * b.unit_cost_price;
        stockCredits.push({
          id: `spoil-${b.id}`,
          date: (b.closed_at || b.received_at || "").split("T")[0],
          reference: `SPOIL-${b.id.slice(-4)}`,
          description: `Stock Spoilage: ${b.item_name} (${b.spoilage_loss_qty} units write-off)`,
          entity_name: "Loss / Spoilage",
          amount: Number(spoilageVal) || 0,
        });
      });

    const totalStockDebit = stockDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalStockCredit = stockCredits.reduce((acc, e) => acc + e.amount, 0);
    const stockBalance = Math.abs(totalStockDebit - totalStockCredit);
    const stockSide = totalStockDebit >= totalStockCredit ? "DEBIT" : "CREDIT";

    const stockInventoryLedger: TAccountLedger = {
      id: "ledger-stock",
      title: "Stock & Inventory Asset Ledger",
      subtitle: "Merchandise Inventory & Cost of Goods Sold (Asset Valuation on Shelves)",
      type: "STOCK_INVENTORY",
      account_code: "ACC-1030",
      nature: "ASSET_DR",
      debits: stockDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: stockCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalStockDebit,
      total_credit: totalStockCredit,
      balance_c_d: stockBalance,
      balance_side: stockSide,
    };

    // ----------------------------------------------------
    // 6. OWNER'S CAPITAL & PERSONAL ACCOUNT T-LEDGER
    // ----------------------------------------------------
    // Debit: Personal Drawings & Owner Cash Withdrawals
    // Credit: Capital Injected + Retained Business Profits
    const capitalDebits: TAccountEntry[] = [];
    const capitalCredits: TAccountEntry[] = [];

    ownerCapital
      .filter((c) => isDateInRange(c.date || c.created_at))
      .forEach((c) => {
        if (c.entry_type === "PERSONAL_DRAWING") {
          capitalDebits.push({
            id: c.id,
            date: (c.date || c.created_at || "").split("T")[0],
            reference: `DRAW-${c.id.slice(-4)}`,
            description: `Owner Personal Drawing: ${c.purpose_or_reason}`,
            entity_name: c.recipient_or_contributor,
            amount: Number(c.amount) || 0,
            payment_channel: c.payment_channel,
          });
        } else {
          capitalCredits.push({
            id: c.id,
            date: (c.date || c.created_at || "").split("T")[0],
            reference: `CAP-${c.id.slice(-4)}`,
            description: `${c.entry_type === "CAPITAL_INJECTION" ? "Capital Injection" : "Retained Profit Reinvestment"}: ${c.purpose_or_reason}`,
            entity_name: c.recipient_or_contributor,
            amount: Number(c.amount) || 0,
            payment_channel: c.payment_channel,
          });
        }
      });

    // Compute cumulative trading gross profit to add as retained earnings credit
    const totalGrossProfit = sales.reduce((acc, s) => acc + (s.total_profit || 0), 0);
    const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.total_cost, 0);
    const netRetainedProfit = Math.max(0, totalGrossProfit - totalOperatingExpenses);

    if (netRetainedProfit > 0) {
      capitalCredits.push({
        id: "net-profit-transfer",
        date: new Date().toISOString().split("T")[0],
        reference: "P&L-TRANS",
        description: "Cumulative Trading Net Operating Profit Surplus",
        entity_name: "Duka Retained Earnings",
        amount: netRetainedProfit,
      });
    }

    const totalCapitalDebit = capitalDebits.reduce((acc, e) => acc + e.amount, 0);
    const totalCapitalCredit = capitalCredits.reduce((acc, e) => acc + e.amount, 0);
    const capitalBalance = Math.abs(totalCapitalCredit - totalCapitalDebit);
    const capitalSide = totalCapitalCredit >= totalCapitalDebit ? "CREDIT" : "DEBIT";

    const ownerCapitalLedger: TAccountLedger = {
      id: "ledger-owner-capital",
      title: "Owner's Capital & Personal Drawings Ledger",
      subtitle: "Proprietor Equity, Capital Introduced & Domestic Drawings (Owner Net Worth)",
      type: "OWNER_CAPITAL_DRAWINGS",
      account_code: "ACC-3010",
      nature: "EQUITY_CR",
      debits: capitalDebits.sort((a, b) => b.date.localeCompare(a.date)),
      credits: capitalCredits.sort((a, b) => b.date.localeCompare(a.date)),
      total_debit: totalCapitalDebit,
      total_credit: totalCapitalCredit,
      balance_c_d: capitalBalance,
      balance_side: capitalSide,
    };

    // ----------------------------------------------------
    // 7. AUTOMATED INDIVIDUAL NON-CONSOLIDATED T-ACCOUNTS
    // ----------------------------------------------------

    // A. Individual Supplier T-Ledgers (Creditors)
    const individualSuppliers: TAccountLedger[] = suppliers.map((supplier) => {
      const suppDebits: TAccountEntry[] = [];
      const suppCredits: TAccountEntry[] = [];
      const sNameNorm = supplier.name.trim().toLowerCase().replace(/\s+/g, " ");

      const matchesSupplier = (entityId?: string, entityName?: string) => {
        if (entityId && entityId === supplier.id) return true;
        if (!entityName) return false;
        const norm = entityName.trim().toLowerCase().replace(/\s+/g, " ");
        return norm === sNameNorm || norm.includes(sNameNorm) || sNameNorm.includes(norm);
      };

      const trackedRefIds = new Set<string>();

      // 1. Debits: Payments made to this supplier
      supplierPayments
        .filter((p) => matchesSupplier(p.supplier_id, p.supplier_name) && isDateInRange(p.date || p.created_at))
        .forEach((p) => {
          trackedRefIds.add(p.id);
          if (p.reference) trackedRefIds.add(p.reference);
          suppDebits.push({
            id: p.id,
            date: (p.date || p.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
            reference: p.reference || `PMT-${p.id.slice(-4)}`,
            description: `Payment Settled (${(p.payment_channel || "CASH").replace(/_/g, " ")})`,
            entity_name: supplier.name,
            amount: Number(p.amount) || 0,
            payment_channel: p.payment_channel,
          });
        });

      // 2. Direct drop payments (amount paid at drop time)
      supplierDeliveries
        .filter((d) => matchesSupplier(d.supplier_id, d.supplier_name) && isDateInRange(d.delivery_date || d.created_at))
        .forEach((d) => {
          trackedRefIds.add(d.id);
          if (d.invoice_or_delivery_note) trackedRefIds.add(d.invoice_or_delivery_note);

          if (d.amount_paid > 0) {
            suppDebits.push({
              id: `drop-pay-${d.id}`,
              date: (d.delivery_date || d.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
              reference: d.invoice_or_delivery_note || `DROP-${d.id.slice(-4)}`,
              description: `Drop Settlement Payment (${(d.payment_channel || "CASH").replace(/_/g, " ")})`,
              entity_name: supplier.name,
              amount: Number(d.amount_paid) || 0,
              payment_channel: d.payment_channel,
            });
          }

          // Credits: Inbound delivery invoices
          const itemSummary = d.items && d.items.length > 0 ? d.items.map((it) => `${it.qty}x ${it.item_name}`).join(", ") : "Wholesale Stock";
          suppCredits.push({
            id: d.id,
            date: (d.delivery_date || d.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
            reference: d.invoice_or_delivery_note || `INV-${d.id.slice(-4)}`,
            description: `Delivery Invoice: ${itemSummary}`,
            entity_name: supplier.name,
            amount: Number(d.total_amount) || 0,
            payment_channel: d.payment_channel,
          });
        });

      // 3. Batches with matching supplier name not already tracked
      batches
        .filter((b) => {
          const suppName = (b as any).supplier_name || (b.notes?.includes("Supplier: ") ? b.notes.split("Supplier: ")[1]?.split("|")[0]?.trim() : "");
          return matchesSupplier(undefined, suppName) && isDateInRange(b.received_at);
        })
        .forEach((b) => {
          const batchRef = String(b.batch_number || `BATCH-${b.id.slice(-4)}`);
          if (!trackedRefIds.has(b.id) && !trackedRefIds.has(batchRef) && !trackedRefIds.has(`deliv-batch-${b.id}`)) {
            const cost = (Number(b.unit_cost_price) || 0) * (Number(b.initial_qty) || 1);
            suppCredits.push({
              id: `batch-${b.id}`,
              date: (b.received_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
              reference: batchRef,
              description: `Supply Consignment: ${b.initial_qty}x ${b.item_name}`,
              entity_name: supplier.name,
              amount: cost,
              payment_channel: "CASH",
            });
            // Assume batch paid at acquisition unless unfulfilled
            suppDebits.push({
              id: `batch-pay-${b.id}`,
              date: (b.received_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
              reference: batchRef,
              description: `Batch Payment (${b.item_name})`,
              entity_name: supplier.name,
              amount: cost,
              payment_channel: "CASH",
            });
          }
        });

      // 4. Expenses with matching supplier name not already tracked
      expenses
        .filter((e) => matchesSupplier(undefined, e.supplier_name) && isDateInRange(e.created_at))
        .forEach((e) => {
          const expRef = e.receipt_reference || e.id;
          if (!trackedRefIds.has(e.id) && !trackedRefIds.has(expRef) && !trackedRefIds.has(`deliv-sync-${e.id}`)) {
            suppCredits.push({
              id: `exp-${e.id}`,
              date: (e.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
              reference: expRef,
              description: `Wholesale Expense: ${e.item_name || e.category}`,
              entity_name: supplier.name,
              amount: Number(e.total_cost) || 0,
              payment_channel: "CASH",
            });
            suppDebits.push({
              id: `exp-pay-${e.id}`,
              date: (e.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
              reference: expRef,
              description: `Expense Payment (${e.item_name || e.category})`,
              entity_name: supplier.name,
              amount: Number(e.total_cost) || 0,
              payment_channel: "CASH",
            });
          }
        });

      const totalDr = suppDebits.reduce((acc, e) => acc + e.amount, 0);
      const totalCr = suppCredits.reduce((acc, e) => acc + e.amount, 0);
      const balance = Math.abs(totalCr - totalDr);
      const side = totalCr >= totalDr ? "CREDIT" : "DEBIT";

      return {
        id: `supp-ledger-${supplier.id}`,
        title: supplier.name,
        subtitle: `${supplier.category} · Phone: ${supplier.phone || "N/A"} · Terms: ${(supplier.payment_terms || "Cash on Delivery").replace(/_/g, " ")}`,
        type: "CREDITORS_PURCHASES",
        account_code: `ACC-SUPP-${supplier.id.slice(-4).toUpperCase()}`,
        nature: "LIABILITY_CR",
        debits: suppDebits.sort((a, b) => b.date.localeCompare(a.date)),
        credits: suppCredits.sort((a, b) => b.date.localeCompare(a.date)),
        total_debit: totalDr,
        total_credit: totalCr,
        balance_c_d: balance,
        balance_side: side,
      };
    });

    // B. Individual Customer T-Ledgers (Debtors / Deni)
    const individualCustomers: TAccountLedger[] = customers.map((customer) => {
      const custDebits: TAccountEntry[] = [];
      const custCredits: TAccountEntry[] = [];

      // Debits: Credit sales (Deni additions)
      customerSales
        .filter((s) => s.customer_id === customer.id && isDateInRange(s.date || s.created_at))
        .filter((s) => s.deni_added > 0)
        .forEach((s) => {
          custDebits.push({
            id: s.id,
            date: (s.date || s.created_at || "").split("T")[0],
            reference: `SALE-${s.id.slice(-4)}`,
            description: `Deni Taken: ${s.items.map((it) => `${it.qty}x ${it.item_name}`).join(", ") || "Credit Goods"}`,
            entity_name: customer.name,
            amount: Number(s.deni_added) || 0,
            payment_channel: s.payment_channel,
          });
        });

      // Opening balance if present and no sales yet
      if (custDebits.length === 0 && customer.outstanding_credit_deni > 0) {
        custDebits.push({
          id: `init-${customer.id}`,
          date: (customer.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
          reference: "BAL-B/F",
          description: `Opening Deni Balance (Carried Forward)`,
          entity_name: customer.name,
          amount: Number(customer.outstanding_credit_deni) || 0,
          payment_channel: "CREDIT_DENI",
        });
      }

      // Credits: Debt repayments received
      customerRepayments
        .filter((r) => r.customer_id === customer.id && isDateInRange(r.date || r.created_at))
        .forEach((r) => {
          custCredits.push({
            id: r.id,
            date: (r.date || r.created_at || "").split("T")[0],
            reference: r.reference || `REC-${r.id.slice(-4)}`,
            description: `Deni Repayment Received (${(r.payment_channel || "CASH").replace(/_/g, " ")})`,
            entity_name: customer.name,
            amount: Number(r.amount_paid) || 0,
            payment_channel: r.payment_channel,
          });
        });

      const totalDr = custDebits.reduce((acc, e) => acc + e.amount, 0);
      const totalCr = custCredits.reduce((acc, e) => acc + e.amount, 0);
      const balance = Math.abs(totalDr - totalCr);
      const side = totalDr >= totalCr ? "DEBIT" : "CREDIT";

      return {
        id: `cust-ledger-${customer.id}`,
        title: customer.name,
        subtitle: `${customer.customer_type.replace(/_/g, " ")} · Phone: ${customer.phone || "N/A"} · Trust: ${customer.trust_status.replace(/_/g, " ")} (Limit: KSh ${(customer.credit_limit || 0).toLocaleString()})`,
        type: "DEBTORS_SALES",
        account_code: `ACC-DENI-${customer.id.slice(-4).toUpperCase()}`,
        nature: "ASSET_DR",
        debits: custDebits.sort((a, b) => b.date.localeCompare(a.date)),
        credits: custCredits.sort((a, b) => b.date.localeCompare(a.date)),
        total_debit: totalDr,
        total_credit: totalCr,
        balance_c_d: balance,
        balance_side: side,
      };
    });

    // C. Individual Expense Category T-Ledgers
    const expenseCategoriesSet = new Set<string>([
      "RENT",
      "ELECTRICITY_TOKENS",
      "CASUAL_WAGES",
      "TRANSPORT_BODA",
      "KANJO_LICENSES",
      "DAMAGED_STOCK",
      "PACKAGING_BAGS",
      "SECURITY",
      "MAINTENANCE",
      "GENERAL",
      ...expenses.map((e) => e.category),
    ]);

    const individualExpenses: TAccountLedger[] = Array.from(expenseCategoriesSet).map((cat) => {
      const expDebits: TAccountEntry[] = [];
      const expCredits: TAccountEntry[] = [];

      expenses
        .filter((e) => e.category === cat && isDateInRange(e.created_at))
        .forEach((e) => {
          expDebits.push({
            id: e.id,
            date: (e.created_at || "").split("T")[0],
            reference: e.receipt_reference || `EXP-${e.id.slice(-4)}`,
            description: `${e.notes || e.item_name || cat.replace(/_/g, " ")} (${e.supplier_name || "Direct Cash"})`,
            entity_name: e.supplier_name || cat,
            amount: Number(e.total_cost) || 0,
            payment_channel: "CASH",
            category: cat,
          });
        });

      const totalDr = expDebits.reduce((acc, e) => acc + e.amount, 0);
      const totalCr = expCredits.reduce((acc, e) => acc + e.amount, 0);
      const balance = totalDr - totalCr;

      return {
        id: `exp-ledger-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        title: `${cat.replace(/_/g, " ")} Account`,
        subtitle: `Operational Expense Line · Overheads & Deductions`,
        type: "NOMINAL_EXPENSES",
        account_code: `ACC-EXP-${cat.slice(0, 4).toUpperCase()}`,
        nature: "EXPENSE_DR",
        debits: expDebits.sort((a, b) => b.date.localeCompare(a.date)),
        credits: expCredits.sort((a, b) => b.date.localeCompare(a.date)),
        total_debit: totalDr,
        total_credit: totalCr,
        balance_c_d: balance,
        balance_side: "DEBIT",
      };
    });

    // D. Individual Liquid Channels (Cash, M-Pesa Till, Equity Paybill, Bank)
    const liquidChannels = [
      {
        channel: "CASH",
        title: "Cash in Drawer & Physical Till Float",
        code: "ACC-LIQ-CASH",
        subtitle: "Physical Notes & Coins in Shop Cash Drawer",
      },
      {
        channel: "MPESA_TILL",
        title: "M-Pesa E-Float / Merchant Till SIM",
        code: "ACC-LIQ-MPESA",
        subtitle: "Safaricom M-Pesa Buy Goods / E-Float Balance",
      },
      {
        channel: "EQUITY_PAYBILL",
        title: "Equity Bank Paybill (1450180372031)",
        code: "ACC-LIQ-PAYBILL",
        subtitle: "Direct Equity Bank Till & Merchant Collections",
      },
      {
        channel: "BANK",
        title: "Commercial Bank Clearing Account",
        code: "ACC-LIQ-BANK",
        subtitle: "Commercial Bank Account Deposits & Cheques",
      },
    ];

    const individualLiquidChannels: TAccountLedger[] = liquidChannels.map((liq) => {
      const debits: TAccountEntry[] = [];
      const credits: TAccountEntry[] = [];

      // Inflows (Debits)
      if (liq.channel === "CASH") {
        sales
          .filter((s) => isDateInRange(s.created_at || s.batch_end_date))
          .forEach((s) => {
            debits.push({
              id: `sale-liq-${s.id}`,
              date: (s.created_at || s.batch_end_date || "").split("T")[0],
              reference: `SAL-${s.id.slice(-4)}`,
              description: `Cash Sale (${s.item_name} x ${s.qty_sold})`,
              entity_name: "Customer",
              amount: Number(s.total_revenue) || 0,
              payment_channel: "CASH",
            });
          });
      }

      // Repayments
      customerRepayments
        .filter((r) => r.payment_channel === liq.channel && isDateInRange(r.date || r.created_at))
        .forEach((r) => {
          debits.push({
            id: `rep-liq-${r.id}`,
            date: (r.date || r.created_at || "").split("T")[0],
            reference: r.reference || `REC-${r.id.slice(-4)}`,
            description: `Deni Repayment from ${r.customer_name}`,
            entity_name: r.customer_name,
            amount: Number(r.amount_paid) || 0,
            payment_channel: liq.channel,
          });
        });

      // Capital Injections
      ownerCapital
        .filter((c) => c.entry_type === "CAPITAL_INJECTION" && c.payment_channel === liq.channel && isDateInRange(c.date || c.created_at))
        .forEach((c) => {
          debits.push({
            id: `cap-liq-${c.id}`,
            date: (c.date || c.created_at || "").split("T")[0],
            reference: `CAP-${c.id.slice(-4)}`,
            description: `Capital Contribution: ${c.purpose_or_reason}`,
            entity_name: c.recipient_or_contributor,
            amount: Number(c.amount) || 0,
            payment_channel: liq.channel,
          });
        });

      // Outflows (Credits)
      if (liq.channel === "CASH") {
        expenses
          .filter((e) => isDateInRange(e.created_at))
          .forEach((e) => {
            credits.push({
              id: `exp-liq-${e.id}`,
              date: (e.created_at || "").split("T")[0],
              reference: e.receipt_reference || `EXP-${e.id.slice(-4)}`,
              description: `Expense Payout: ${e.category} (${e.notes || e.item_name || "General"})`,
              entity_name: e.supplier_name || e.category,
              amount: Number(e.total_cost) || 0,
              payment_channel: "CASH",
            });
          });
      }

      // Supplier Payments
      supplierPayments
        .filter((p) => p.payment_channel === liq.channel && isDateInRange(p.date || p.created_at))
        .forEach((p) => {
          credits.push({
            id: `pmt-liq-${p.id}`,
            date: (p.date || p.created_at || "").split("T")[0],
            reference: p.reference || `PMT-${p.id.slice(-4)}`,
            description: `Supplier Payment to ${p.supplier_name}`,
            entity_name: p.supplier_name,
            amount: Number(p.amount) || 0,
            payment_channel: liq.channel,
          });
        });

      // Owner Drawings
      ownerCapital
        .filter((c) => c.entry_type === "PERSONAL_DRAWING" && c.payment_channel === liq.channel && isDateInRange(c.date || c.created_at))
        .forEach((c) => {
          credits.push({
            id: `draw-liq-${c.id}`,
            date: (c.date || c.created_at || "").split("T")[0],
            reference: `DRAW-${c.id.slice(-4)}`,
            description: `Personal Drawing: ${c.purpose_or_reason}`,
            entity_name: c.recipient_or_contributor,
            amount: Number(c.amount) || 0,
            payment_channel: liq.channel,
          });
        });

      const totalDr = debits.reduce((acc, e) => acc + e.amount, 0);
      const totalCr = credits.reduce((acc, e) => acc + e.amount, 0);
      const balance = Math.abs(totalDr - totalCr);
      const side = totalDr >= totalCr ? "DEBIT" : "CREDIT";

      return {
        id: `liq-ledger-${liq.channel.toLowerCase()}`,
        title: liq.title,
        subtitle: liq.subtitle,
        type: "CASH_LIQUID",
        account_code: liq.code,
        nature: "ASSET_DR",
        debits: debits.sort((a, b) => b.date.localeCompare(a.date)),
        credits: credits.sort((a, b) => b.date.localeCompare(a.date)),
        total_debit: totalDr,
        total_credit: totalCr,
        balance_c_d: balance,
        balance_side: side,
      };
    });

    // E. Individual Product Stock & Inventory T-Ledgers
    const individualStockItems: TAccountLedger[] = items.map((item) => {
      const itemDebits: TAccountEntry[] = [];
      const itemCredits: TAccountEntry[] = [];

      // Inbound Batches (Dr)
      batches
        .filter((b) => b.item_id === item.id && isDateInRange(b.received_at))
        .forEach((b) => {
          const val = (b.initial_qty || 0) * (b.unit_cost_price || 0);
          itemDebits.push({
            id: b.id,
            date: (b.received_at || "").split("T")[0],
            reference: `BAT-${b.id.slice(-4)}`,
            description: `Batch Restock: ${b.initial_qty} ${item.unit_of_measure} @ KSh ${b.unit_cost_price}`,
            entity_name: "Supplier Drop",
            amount: Number(val) || 0,
          });
        });

      // COGS Sold (Cr)
      sales
        .filter((s) => s.item_id === item.id && isDateInRange(s.created_at || s.batch_end_date))
        .forEach((s) => {
          itemCredits.push({
            id: `sale-item-${s.id}`,
            date: (s.created_at || s.batch_end_date || "").split("T")[0],
            reference: `SALE-${s.id.slice(-4)}`,
            description: `COGS Sold: ${s.qty_sold} ${item.unit_of_measure} @ cost KSh ${s.unit_cost_price}`,
            entity_name: "Customer Sale",
            amount: Number(s.total_cost) || 0,
          });
        });

      // Spoilage Loss (Cr)
      batches
        .filter((b) => b.item_id === item.id && b.spoilage_loss_qty > 0)
        .forEach((b) => {
          const spoilVal = b.spoilage_loss_qty * b.unit_cost_price;
          itemCredits.push({
            id: `spoil-${b.id}`,
            date: (b.closed_at || b.received_at || "").split("T")[0],
            reference: `SPOIL-${b.id.slice(-4)}`,
            description: `Damaged Stock: ${b.spoilage_loss_qty} ${item.unit_of_measure} lost`,
            entity_name: "Loss Write-off",
            amount: Number(spoilVal) || 0,
          });
        });

      const totalDr = itemDebits.reduce((acc, e) => acc + e.amount, 0);
      const totalCr = itemCredits.reduce((acc, e) => acc + e.amount, 0);
      const balance = Math.abs(totalDr - totalCr);
      const side = totalDr >= totalCr ? "DEBIT" : "CREDIT";

      return {
        id: `item-ledger-${item.id}`,
        title: item.name,
        subtitle: `${item.category} · Current Stock: ${item.current_stock_qty || 0} ${item.unit_of_measure} · Selling Price: KSh ${item.unit_selling_price}`,
        type: "STOCK_INVENTORY",
        account_code: `ACC-STK-${item.id.slice(-4).toUpperCase()}`,
        nature: "ASSET_DR",
        debits: itemDebits.sort((a, b) => b.date.localeCompare(a.date)),
        credits: itemCredits.sort((a, b) => b.date.localeCompare(a.date)),
        total_debit: totalDr,
        total_credit: totalCr,
        balance_c_d: balance,
        balance_side: side,
      };
    });

    // ----------------------------------------------------
    // 8. BALANCED DOUBLE-ENTRY TRIAL BALANCE
    // ----------------------------------------------------
    const trialBalanceRows = [
      {
        accountCode: "ACC-1010",
        accountTitle: "Cash Book & Liquid Assets",
        nature: "Asset (Debit)",
        debit: cashLiquidLedger.balance_side === "DEBIT" ? cashLiquidLedger.balance_c_d : 0,
        credit: cashLiquidLedger.balance_side === "CREDIT" ? cashLiquidLedger.balance_c_d : 0,
      },
      {
        accountCode: "ACC-1020",
        accountTitle: "Debtors & Customer Deni",
        nature: "Asset (Debit)",
        debit: debtorsSalesLedger.balance_side === "DEBIT" ? debtorsSalesLedger.balance_c_d : 0,
        credit: debtorsSalesLedger.balance_side === "CREDIT" ? debtorsSalesLedger.balance_c_d : 0,
      },
      {
        accountCode: "ACC-1030",
        accountTitle: "Merchandise Inventory Asset",
        nature: "Asset (Debit)",
        debit: stockInventoryLedger.balance_side === "DEBIT" ? stockInventoryLedger.balance_c_d : 0,
        credit: stockInventoryLedger.balance_side === "CREDIT" ? stockInventoryLedger.balance_c_d : 0,
      },
      {
        accountCode: "ACC-2010",
        accountTitle: "Creditors & Supplier Debt",
        nature: "Liability (Credit)",
        debit: creditorsPurchasesLedger.balance_side === "DEBIT" ? creditorsPurchasesLedger.balance_c_d : 0,
        credit: creditorsPurchasesLedger.balance_side === "CREDIT" ? creditorsPurchasesLedger.balance_c_d : 0,
      },
      {
        accountCode: "ACC-3010",
        accountTitle: "Owner Capital & Equity",
        nature: "Equity (Credit)",
        debit: ownerCapitalLedger.balance_side === "DEBIT" ? ownerCapitalLedger.balance_c_d : 0,
        credit: ownerCapitalLedger.balance_side === "CREDIT" ? ownerCapitalLedger.balance_c_d : 0,
      },
      {
        accountCode: "ACC-5010",
        accountTitle: "Nominal Operating Expenses",
        nature: "Expense (Debit)",
        debit: nominalExpensesLedger.balance_side === "DEBIT" ? nominalExpensesLedger.balance_c_d : 0,
        credit: nominalExpensesLedger.balance_side === "CREDIT" ? nominalExpensesLedger.balance_c_d : 0,
      },
    ];

    const totalDebits = trialBalanceRows.reduce((acc, r) => acc + r.debit, 0);
    const totalCredits = trialBalanceRows.reduce((acc, r) => acc + r.credit, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    return {
      creditorsPurchasesLedger,
      debtorsSalesLedger,
      nominalExpensesLedger,
      cashLiquidLedger,
      stockInventoryLedger,
      ownerCapitalLedger,
      individualSuppliers,
      individualCustomers,
      individualExpenses,
      individualLiquidChannels,
      individualStockItems,
      trialBalance: {
        totalDebits,
        totalCredits,
        isBalanced: difference <= 1,
        difference,
        rows: trialBalanceRows,
      },
    };
  }

  /**
   * Computes Supplier Rankings & Performance Leaderboard
   */
  static rankSuppliers(params: {
    suppliers: Supplier[];
    supplierDeliveries: SupplierDelivery[];
    supplierPayments: SupplierPayment[];
  }): SupplierRanking[] {
    const { suppliers, supplierDeliveries, supplierPayments } = params;

    const rankings: SupplierRanking[] = suppliers.map((supplier) => {
      const deliveries = supplierDeliveries.filter((d) => d.supplier_id === supplier.id);
      const payments = supplierPayments.filter((p) => p.supplier_id === supplier.id);

      const totalVolume = deliveries.reduce((acc, d) => acc + d.total_amount, 0) || supplier.total_supplied_value || 0;
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0) || supplier.total_paid_value || 0;
      const outstandingOwed = supplier.outstanding_balance_owed || Math.max(0, totalVolume - totalPaid);
      const deliveriesCount = deliveries.length || (totalVolume > 0 ? 1 : 0);

      // Reliability Score: Delivery completion rate + credit terms favorability
      let score = 70;
      if (deliveriesCount >= 3) score += 15;
      if (supplier.payment_terms === "CREDIT_14_DAYS" || supplier.payment_terms === "CREDIT_30_DAYS") score += 10;
      if (supplier.payment_terms === "CREDIT_7_DAYS") score += 5;
      if (outstandingOwed === 0 && totalVolume > 0) score += 5;
      const reliabilityScore = Math.min(100, Math.max(50, score));

      // Stars
      const stars = reliabilityScore >= 90 ? 5 : reliabilityScore >= 80 ? 4 : reliabilityScore >= 65 ? 3 : 2;

      // Tiering
      let tier: SupplierTier = "AD_HOC";
      if (totalVolume >= 50000 || deliveriesCount >= 5) {
        tier = "TIER_1_STRATEGIC";
      } else if (totalVolume >= 20000 || deliveriesCount >= 3) {
        tier = "TIER_2_CORE";
      } else if (totalVolume > 0 || deliveriesCount >= 1) {
        tier = "TIER_3_REGULAR";
      }

      return {
        supplier,
        rank: 0,
        tier,
        total_volume: totalVolume,
        total_paid: totalPaid,
        outstanding_owed: outstandingOwed,
        deliveries_count: deliveriesCount,
        fulfillment_rate: 98,
        settlement_speed_days: supplier.payment_terms === "CREDIT_14_DAYS" ? 14 : supplier.payment_terms === "CREDIT_7_DAYS" ? 7 : 0,
        reliability_score: reliabilityScore,
        stars,
      };
    });

    // Sort by Total Volume descending, then by Reliability Score
    rankings.sort((a, b) => {
      if (b.total_volume !== a.total_volume) return b.total_volume - a.total_volume;
      return b.reliability_score - a.reliability_score;
    });

    // Assign 1-indexed rank
    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rankings;
  }

  /**
   * Computes Customer (Consumer) Rankings & Loyalty Leaderboard
   * 
   * RANKING CRITERIA:
   * 1. Must have ever had a debt before (to prevent inactive / uncredited accounts from ranking at the top)
   * 2. The customer with NO or LEAST debt at the time ranks on top (0 debt first, then ascending outstanding deni)
   * 3. Tie-breakers: Total debt successfully repaid, lifetime spend, and repayment promptness score.
   */
  static rankCustomers(
    paramsOrCustomers:
      | {
          customers: Customer[];
          customerSales: CustomerSale[];
          customerRepayments: CustomerDebtRepayment[];
        }
      | Customer[],
    legacyCustomerSales?: CustomerSale[],
    legacyCustomerRepayments?: CustomerDebtRepayment[]
  ): CustomerRanking[] {
    let customers: Customer[];
    let customerSales: CustomerSale[];
    let customerRepayments: CustomerDebtRepayment[];

    if (Array.isArray(paramsOrCustomers)) {
      customers = paramsOrCustomers;
      customerSales = legacyCustomerSales || [];
      customerRepayments = legacyCustomerRepayments || [];
    } else {
      customers = paramsOrCustomers.customers || [];
      customerSales = paramsOrCustomers.customerSales || [];
      customerRepayments = paramsOrCustomers.customerRepayments || [];
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const rankings: CustomerRanking[] = customers.map((customer) => {
      const sales = customerSales.filter((s) => s.customer_id === customer.id);
      const repayments = customerRepayments.filter((r) => r.customer_id === customer.id);

      const lifetimeSpend =
        sales.reduce((acc, s) => acc + s.total_amount, 0) || customer.lifetime_purchases_value || 0;
      const salesCount = sales.length || (lifetimeSpend > 0 ? 1 : 0);
      const avgBasketValue = salesCount > 0 ? Math.round(lifetimeSpend / salesCount) : 0;
      const outstandingDeni = customer.outstanding_credit_deni || 0;
      const creditLimit = customer.credit_limit || 1000;
      const creditUtilizationPct = creditLimit > 0 ? Math.min(100, Math.round((outstandingDeni / creditLimit) * 100)) : 0;

      // Debt calculations & history check
      const totalDebtAccrued =
        sales.reduce((acc, s) => acc + (Number(s.deni_added) || 0), 0) +
        (Number(customer.historical_opening_deni) || 0) +
        (customer.outstanding_credit_deni > 0 && (!customer.lifetime_payments_value || customer.lifetime_payments_value === 0) && sales.length === 0
          ? customer.outstanding_credit_deni
          : 0);

      const totalDebtRepaid =
        repayments.reduce((acc, r) => acc + (Number(r.amount_paid) || 0), 0) ||
        (Number(customer.lifetime_payments_value) || 0);

      const creditSalesCount = sales.filter(
        (s) => (s.deni_added && s.deni_added > 0) || s.payment_channel === "CREDIT_DENI" || s.payment_channel === "SPLIT"
      ).length;

      // Check if customer has ever had debt before
      const hadDebtBefore =
        totalDebtAccrued > 0 ||
        totalDebtRepaid > 0 ||
        outstandingDeni > 0 ||
        creditSalesCount > 0 ||
        (customer.historical_opening_deni ? customer.historical_opening_deni > 0 : false) ||
        (customer.notes?.toLowerCase().includes("deni") || false);

      // Check if debt spans back to last month or older
      const hasOldCreditSale = sales.some(
        (s) => (s.deni_added && s.deni_added > 0) && new Date(s.date) < currentMonthStart
      );
      const hasOldOpeningDeni = !!customer.historical_opening_deni && customer.historical_opening_deni > 0;
      const hasLastMonthDebt =
        outstandingDeni > 0 &&
        (hasOldCreditSale || hasOldOpeningDeni || customer.trust_status === "OVERDUE_DEBT");

      // Determine Debt Status Badge
      let debtStatusBadge: CustomerDebtStatusBadge = "NO_CREDIT_HISTORY";
      if (!hadDebtBefore) {
        debtStatusBadge = "NO_CREDIT_HISTORY";
      } else if (outstandingDeni === 0) {
        debtStatusBadge = "DEBT_CLEARED_TOP_REPAYER";
      } else if (hasLastMonthDebt) {
        debtStatusBadge = "LAST_MONTH_OVERDUE";
      } else if (outstandingDeni <= 1000) {
        debtStatusBadge = "ACTIVE_LEAST_DENI";
      } else {
        debtStatusBadge = "MODERATE_DENI";
      }

      // Repayment Promptness Score
      let repaymentScore = 80;
      if (customer.trust_status === "TRUSTED") repaymentScore = 95;
      if (customer.trust_status === "GOOD_STANDING") repaymentScore = 85;
      if (customer.trust_status === "OVERDUE_DEBT") repaymentScore = 40;
      if (customer.trust_status === "BLOCKED_CREDIT") repaymentScore = 15;
      if (repayments.length >= 2) repaymentScore = Math.min(100, repaymentScore + 10);
      if (hadDebtBefore && outstandingDeni === 0) repaymentScore = Math.min(100, repaymentScore + 10);

      // Trust Grade
      let trustGrade: CustomerTrustGrade = "B";
      if (repaymentScore >= 90 && outstandingDeni <= creditLimit * 0.5) trustGrade = "A+";
      else if (repaymentScore >= 80 && outstandingDeni <= creditLimit) trustGrade = "A";
      else if (repaymentScore >= 60) trustGrade = "B";
      else if (repaymentScore >= 40) trustGrade = "C";
      else trustGrade = "D";

      // Tier
      let tier: CustomerTier = "CASUAL_RETAIL";
      if (customer.customer_type === "WHOLESALE_BUYER" || lifetimeSpend >= 30000) {
        tier = "VIP_WHOLESALE";
      } else if (customer.customer_type === "LOCAL_EATERY" || lifetimeSpend >= 10000 || salesCount >= 5) {
        tier = "KEY_REGULAR";
      } else if (customer.customer_type === "NEIGHBORHOOD_RESIDENT" || customer.customer_type === "MAMA_MBOGA") {
        tier = "LOYAL_NEIGHBORHOOD";
      }
      if (trustGrade === "D" || customer.trust_status === "BLOCKED_CREDIT") {
        tier = "CREDIT_RISK";
      }

      return {
        customer,
        rank: 0,
        tier,
        lifetime_spend: lifetimeSpend,
        sales_count: salesCount,
        avg_basket_value: avgBasketValue,
        outstanding_deni: outstandingDeni,
        credit_utilization_pct: creditUtilizationPct,
        repayment_promptness_score: repaymentScore,
        trust_grade: trustGrade,
        had_debt_before: hadDebtBefore,
        total_debt_accrued: totalDebtAccrued,
        total_debt_repaid: totalDebtRepaid,
        debt_status_badge: debtStatusBadge,
        has_last_month_debt: hasLastMonthDebt,
      };
    });

    // Sort by:
    // 1. Must have had debt before (avoid inactive/uncredited customers on top)
    // 2. Lowest / Zero current outstanding debt at the time (best repayers on top)
    // 3. Tie-breaker: Highest total debt successfully repaid, then lifetime spend
    rankings.sort((a, b) => {
      // Rule 1: Had debt before vs never had debt
      if (a.had_debt_before !== b.had_debt_before) {
        return a.had_debt_before ? -1 : 1;
      }

      // Rule 2: For active credit customers, rank by lowest outstanding debt first (0 deni on top)
      if (a.had_debt_before && b.had_debt_before) {
        if (a.outstanding_deni !== b.outstanding_deni) {
          return a.outstanding_deni - b.outstanding_deni;
        }
        // Tie-breaker 1: Total debt repaid
        if (b.total_debt_repaid !== a.total_debt_repaid) {
          return b.total_debt_repaid - a.total_debt_repaid;
        }
        // Tie-breaker 2: Lifetime spend
        if (b.lifetime_spend !== a.lifetime_spend) {
          return b.lifetime_spend - a.lifetime_spend;
        }
        // Tie-breaker 3: Repayment score
        return b.repayment_promptness_score - a.repayment_promptness_score;
      }

      // Rule 3: For never-had-debt customers, sort by lifetime spend
      if (b.lifetime_spend !== a.lifetime_spend) {
        return b.lifetime_spend - a.lifetime_spend;
      }
      return b.repayment_promptness_score - a.repayment_promptness_score;
    });

    // Assign 1-indexed rank
    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rankings;
  }
}
