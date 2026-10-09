/**
 * YuBiFLo & PayDesk Enterprise Documentation Data Store
 * Comprehensive Business Requirements Document (BRD) & Product Requirements Document (PRD)
 * Built specifically for Admin & Stakeholder Management
 */

export interface DocSection {
  id: string;
  number: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface EnterpriseDoc {
  docId: "BRD" | "PRD";
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
  author: string;
  organization: string;
  status: "APPROVED_FOR_PRODUCTION" | "DRAFT" | "UNDER_REVIEW";
  summary: string;
  sections: DocSection[];
}

export const YUBIFLO_BRD: EnterpriseDoc = {
  docId: "BRD",
  title: "Business Requirements Document (BRD)",
  subtitle: "YuBiFLo SaaS Platform • Beyond POS & Automated Retail Ledger Ecosystem",
  version: "v3.4.0-Enterprise",
  lastUpdated: "August 2026",
  author: "Executive Product & Business Architecture Team",
  organization: "YuBiFLo Technologies / PayDesk Africa",
  status: "APPROVED_FOR_PRODUCTION",
  summary:
    "Institutional specification defining business vision, market opportunity, stakeholder ecosystem, turnover-driven inventory reconciliation, double-entry financial compliance, and commercial multi-tenant monetization for Kenyan and East African retail commerce.",
  sections: [
    {
      id: "brd-1",
      number: "1.0",
      title: "Executive Summary & Business Vision",
      tags: ["Vision", "Strategy", "Market Context"],
      content: `### 1.1 Brand Identity & Philosophy
**YuBiFLo** is built on the core commercial thesis: **"Your Business is a Flower" (YuBiFLo)**. A business requires steady watering (capital management), fertile soil (organized stock), clean pruning (cost elimination), and sunlight (realized sales velocity). 

Unlike conventional rigid Western Point of Sale (POS) systems that demand barcode scans for every micro-transaction, YuBiFLo is engineered specifically for the dynamic, informal, fast-paced retail ecosystem of East Africa (Kenya, Uganda, Tanzania, Rwanda).

### 1.2 The Core Problem Statement
Micro, Small, and Medium Enterprises (MSMEs) in East Africa—encompassing neighborhood **Dukas, Mini-supermarkets, Agro-dealers, Chemists/Pharmacies, and Hardware stores**—face three systemic points of failure:
1. **The Transaction Tallying Burden**: Cashiers and shop owners cannot scan every packet of milk, loaf of bread, or matchbox during intense morning and evening peak foot-traffic.
2. **The "Deni" (Credit) Leakage Crisis**: Informal customer credit is written in dog-eared paper notebooks. Debts are disputed, forgotten, or uncollected, draining 15% to 30% of working capital.
3. **Double-Entry Accounting Absence**: Merchants lack formal bookkeepers. Revenue, expenses, supplier debts, and cash float are mingled, making tax compliance, bank loans, and investor audits impossible.

### 1.3 Strategic Solution & Value Proposition
YuBiFLo introduces the industry's first **Restock-Triggered Turnover Accounting Model**. By treating the physical arrival of new inventory batches as mathematical audit proof of past sales, the platform eliminates the requirement of live line-item scanning while delivering 100% accurate double-entry T-Accounts, gross margin realization, and zero-loss cash/M-Pesa reconciliation.`,
    },
    {
      id: "brd-2",
      number: "2.0",
      title: "Market Analysis & Target Demographics",
      tags: ["Demographics", "TAM", "Personas"],
      content: `### 2.1 Target Market Demographics (Kenya & East Africa)
- **Primary Segment (Tier 1)**: Independent Dukas, Kiosks, and General Merchants (500K+ registered in Kenya).
- **Secondary Segment (Tier 2)**: Neighborhood Mini-Supermarkets, Wholesale Distributors, and Dry Produce Wholesalers.
- **Specialized Segment (Tier 3)**: Agrovet outlets, Chemists/Pharmacies, and Hardware & Construction suppliers.

### 2.2 Payment Infrastructure Context
- **M-Pesa Dominance**: Over 78% of retail payments in Kenya flow through Safaricom M-Pesa Buy Goods Till numbers or Paybills.
- **Banking Integration**: Seamless settlement to commercial accounts (notably Equity Bank Paybill 247247, Account 1450180372031).
- **Cash Drawer Float**: The remaining 22% cash volume requires strict denomination audits at open and close.

### 2.3 Competitive Differentiation Matrix
| Dimension | Traditional Legacy POS | Generic Cashbook Apps | YuBiFLo / PayDesk |
| :--- | :--- | :--- | :--- |
| **Sales Capture** | Strict barcode scan required | Manual manual entry | Automated Restock Turnover + Express POS |
| **Accounting** | Single-entry / Basic summary | Unbalanced logs | Automated Double-Entry Individual T-Accounts |
| **Credit ("Deni")** | Rigid or non-existent | Basic list | Real-time Customer & Supplier Ledgers with Limits |
| **Multi-Tenant SaaS** | Expensive server setup | Single user mobile only | Cloud SaaS with Instant Provisioning & Admin Hub |
| **Hardware Agnostic** | Proprietary barcode hardware | Phone only | Web, Tablet, Mobile PWA, 58mm/80mm Thermal |`,
    },
    {
      id: "brd-3",
      number: "3.0",
      title: "Business Process & Value Chain Workflows",
      tags: ["Workflows", "Restock Engine", "Accounting"],
      content: `### 3.1 Restock-Triggered Turnover Workflow
1. **Supply Delivery Arrival**: Distributor delivers new supply batch (e.g., 50 packets of Brookside Milk).
2. **Shelf Remainder Check**: Cashier/Owner inspects the shelf and enters unsold items remaining from previous Batch (e.g., 4 packets remaining, 1 damaged).
3. **Turnover Derivation**: The system calculates exact units sold: 
   $$\\text{Proven Units Sold} = \\text{Previous Batch Initial Qty} - \\text{Remaining on Shelf} - \\text{Damaged/Spoilage}$$
4. **Automated Sales Injection**: Revenue and gross profit are instantly posted to the Sales Ledger and T-Accounts without manual counter receipts.
5. **Fresh Batch Activation**: The new 50 packets become the active supply batch, setting the baseline for the next turnover cycle.

### 3.2 Customer Credit ('Deni') Lifecycle
- **Registration**: Customer profile created with National ID/Phone and dynamic Credit Limit.
- **Credit Sale**: Dispatched items tagged with partial or zero upfront payment; balance automatically transferred to Accounts Receivable ledger.
- **Collection / Repayment**: Inward repayments (Cash, M-Pesa Till, Bank) immediately reduce customer outstanding balance and credit Cash/Bank accounts.

### 3.3 Supplier Creditor & Expense Management
- **Supplier Deliveries**: Logged as immediate cash settlement or supplier credit (Accounts Payable).
- **Operational Expense Logging**: Categorized into Rent, Wages, Electricity, Transport, City Council licenses, and Damaged stock write-offs.`,
    },
    {
      id: "brd-4",
      number: "4.0",
      title: "Financial Model, Pricing & SaaS Monetization",
      tags: ["Monetization", "MRR", "Pricing"],
      content: `### 4.1 Multi-Tier Subscription Structure
1. **Starter Kiosk Tier** (KES 999 / month or KES 9,990 / year):
   - For single-counter dukas and small kiosks.
   - Max 300 Inventory Items, 2 Cashier Staff logins, 1 Branch.
   - Core POS, Restock Turnover, Customer Deni, Basic Cashflow.

2. **Professional Retail Tier** (KES 2,499 / month or KES 23,990 / year) — *Most Popular*:
   - For growing supermarkets, wholesalers, and busy retail counters.
   - Max 2,500 Inventory Items, 5 Cashier logins, 3 Branches.
   - Full Double-Entry T-Accounts, Multi-Item Batch Restock, Evidential Date Audits, OCR Receipt Scanning.

3. **Enterprise Wholesaler Tier** (KES 5,999 / month or KES 59,990 / year):
   - For large wholesale depots, distributors, and multi-branch chains.
   - Unlimited Inventory, Unlimited Cashiers, Unlimited Branches.
   - Dedicated Support, Custom Analytics, API Integrations, Multi-Tenant Administrative Control.

### 4.2 SaaS Financial Metrics & Projections
- **Target ARPU (Average Revenue Per User)**: KES 2,150 / month.
- **Gross Margin on Subscription**: >88% (Cloud hosting + automated infrastructure).
- **Target LTV / CAC Ratio**: >4.8x across urban and peri-urban trading centers.`,
    },
    {
      id: "brd-5",
      number: "5.0",
      title: "Regulatory, Compliance & Financial Governance",
      tags: ["Compliance", "KRA eTIMS", "Audit"],
      content: `### 5.1 Kenya Revenue Authority (KRA) eTIMS Alignment
- Structured architecture ready for direct electronic tax invoice transmission (Control Unit / QR code integration).
- Immutable audit timestamps on all sales records, batch completions, and credit notes.

### 5.2 Evidential Audit Trail Standards
- **Strict Timestamping**: All financial actions record created time, modified time, evidential historical date picker entries, and cashier actor PIN.
- **Zero-Deletion Architecture**: Financial journals cannot be deleted silently; adjustments are logged with compensating contra-entries.

### 5.3 High-Precision Monetary Arithmetic
- Strict currency quantization preventing JavaScript IEEE 754 floating-point rounding errors on decimal cents and fractional weights (kg, litres).`,
    },
    {
      id: "brd-6",
      number: "6.0",
      title: "Key Performance Indicators (KPIs)",
      tags: ["KPIs", "Success Metrics"],
      content: `### 6.1 Operational Performance Metrics
- **Morning Float Setup Duration**: < 60 seconds per shift.
- **Batch Restock & Turnover Calculation Time**: < 45 seconds per product.
- **Evening Z-Report Reconciliation Gap**: < KES 50 average variance across all active tenants.

### 6.2 Business & Adoption Metrics
- **Monthly Active Merchant Retention (MRE)**: $\\ge 94\\%$.
- **Customer Deni Recovery Velocity**: Improved by an average of $38\\%$ within 30 days of onboarding.
- **Stock-Out Reduction**: Decreased by $42\\%$ via real-time batch turnover indicators.`,
    },
  ],
};

export const YUBIFLO_PRD: EnterpriseDoc = {
  docId: "PRD",
  title: "Product Requirements Document (PRD)",
  subtitle: "Technical & Functional Specifications for YuBiFLo / PayDesk Architecture",
  version: "v3.4.0-Enterprise",
  lastUpdated: "August 2026",
  author: "Lead Systems Architect & Product Engineering",
  organization: "YuBiFLo Technologies / PayDesk Africa",
  status: "APPROVED_FOR_PRODUCTION",
  summary:
    "Definitive technical blueprint detailing system architecture, user personas, functional modules, double-entry mathematical models, UI/UX interaction standards, and security controls.",
  sections: [
    {
      id: "prd-1",
      number: "1.0",
      title: "Product Scope & Technical Architecture",
      tags: ["Architecture", "Tech Stack", "PWA"],
      content: `### 1.1 Technology Stack
- **Frontend Framework**: React 18+ with TypeScript (Strict Mode).
- **Build System**: Vite with Tailwind CSS styling and headless accessibility primitives.
- **State Management & Persistence**: Dual-layer architecture with instant local reactive state and cloud persistence adapters.
- **Visualizations & Charts**: Recharts & D3 mathematical renderers.
- **Icons**: Lucide React iconography.

### 1.2 Form Factors & Device Compatibility
- **Desktop POS**: 1080p / 1440p high-density layout with dual-column panels and keyboard shortcuts.
- **Tablet / iPad Counter Mode**: Touch-optimized 44px+ hit targets with responsive drawer navigations.
- **Mobile PWA**: Offline-first mobile interface for shop owners walking wholesale markets.
- **Printing Support**: Direct raw thermal output for 58mm and 80mm ESC/POS receipt printers.`,
    },
    {
      id: "prd-2",
      number: "2.0",
      title: "User Personas & Journey Maps",
      tags: ["Personas", "Journeys"],
      content: `### 2.1 Persona 1: Shopkeeper / Duka Owner ("Mama Wanjiku")
- **Profile**: 42-year-old retail business owner running a high-turnover grocery duka in Kangemi, Nairobi.
- **Daily Journey**:
  1. Opens shop at 6:30 AM $\\rightarrow$ Enters Morning Float (KES 3,500 cash in drawer, KES 12,000 M-Pesa float).
  2. 9:00 AM: Milk delivery arrives $\\rightarrow$ Opens Restock Modal, enters remaining 2 packets on shelf, automatically proves KES 2,470 milk sales.
  3. 1:00 PM: Customer buys sugar on credit $\\rightarrow$ Logs customer deni with credit limit check.
  4. 8:30 PM: Closes day $\\rightarrow$ Performs reconciliation audit against Cash Drawer, M-Pesa Till, and Equity Paybill.

### 2.2 Persona 2: Counter Cashier / Sales Clerk ("Kevin")
- **Profile**: 24-year-old counter assistant logged in with dedicated 4-digit PIN.
- **Primary Need**: Super-fast checkout, receipt issuance, and instant customer search without accessing admin profit settings.

### 2.3 Persona 3: Platform Super-Administrator
- **Profile**: YuBiFLo regional SaaS manager monitoring tenant health, billing invoices, license keys, and module permissions.`,
    },
    {
      id: "prd-3",
      number: "3.0",
      title: "Core Functional Specifications",
      tags: ["Modules", "Restock Engine", "T-Accounts", "Float"],
      content: `### 3.1 Module A: Restock-Triggered Turnover Engine
- **Single & Multi-Item Support**: Supports individual restocks or batch multi-item deliveries in a single invoice.
- **Support for Both New & Existing Products**: Allows picking existing catalogue items or typing custom new products on the fly.
- **Evidential Date-Time Picker**: Allows backdating or precise stamping of restock deliveries to match supplier invoices.
- **Mathematical Formula Engine**:
  - $\\text{Proven Units Sold} = \\text{Active Batch Initial Qty} - \\text{Remaining on Shelf} - \\text{Spoilage}$
  - $\\text{Realized Revenue} = \\text{Proven Units Sold} \\times \\text{Unit Selling Price}$
  - $\\text{Gross Profit} = \\text{Proven Units Sold} \\times (\\text{Unit Selling Price} - \\text{Unit Cost Price})$

### 3.2 Module B: Automated Non-Consolidated T-Accounts
- **Zero Manual Journal Entry**: The engine listens to all transactions (Sales, Restocks, Deni, Repayments, Expenses, Float) and automatically writes balanced Dr/Cr ledger rows.
- **Dual View Modes**:
  - **Individual Accounts Mode**: Dedicated T-Accounts for each Supplier (Creditors), each Customer (Debtors), each Expense category, Liquid channels (Cash, M-Pesa, Equity Bank), and Stock items.
  - **Consolidated Trial Balance Mode**: Classical balancing table proving $\\sum \\text{Debits} = \\sum \\text{Credits}$.

### 3.3 Module C: Morning Float & Cashflow Manager
- **Denomination Calculator**: Notes (1000, 500, 200, 100, 50) and Coins (20, 10, 5, 1).
- **Multi-Channel Float Tracking**: Cash Drawer Float, M-Pesa Till SIM Float, and Equity Bank Float.
- **Owner Capital & Drawings**: Capital injections, personal drawings, and retained earnings transfers.

### 3.4 Module D: Customer & Supplier Ledgers
- **Customer Credit Manager**: Credit limit enforcement, repayment scheduling, statement generation.
- **Supplier Accounts Payable**: Tracks pending wholesale balances and payment settlements.

### 3.5 Module E: SaaS Master Admin Console
- **Multi-Tenant Switcher**: Allows seamless switching between client stores.
- **Subscription Tier Manager**: Edit prices (KES), item caps, staff limits, and allowed modules.
- **Store Provisioning Modal**: Generate license keys, assign billing cycles, and activate stores.`,
    },
    {
      id: "prd-4",
      number: "4.0",
      title: "Data Models & Storage Schemas",
      tags: ["Data Models", "TypeScript", "Schemas"],
      content: `### 4.1 Key TypeScript Entity Definitions
\`\`\`typescript
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  unit_cost_price: number;
  unit_selling_price: number;
  current_stock_qty: number;
  reorder_level: number;
  created_at: string;
}

export interface SupplyBatch {
  id: string;
  item_id: string;
  item_name: string;
  batch_number: number;
  initial_qty: number;
  remaining_qty: number;
  unit_cost_price: number;
  unit_selling_price: number;
  supplier_name: string;
  received_at: string;
  status: "ACTIVE" | "DEPLETED" | "CLOSED";
}

export interface TAccountEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  counterpart_account: string;
}
\`\`\`

### 4.2 Storage & Migration Integrity
- Local storage state partitioned by \`active_merchant_id\`.
- Automatic migration hooks to upgrade legacy single-item structures into multi-item batch formats without data loss.`,
    },
    {
      id: "prd-5",
      number: "5.0",
      title: "Non-Functional & Security Requirements",
      tags: ["Security", "NFR", "Performance"],
      content: `### 5.1 Performance Benchmarks
- **First Contentful Paint (FCP)**: < 0.6 seconds.
- **Restock Batch Execution Latency**: < 35 milliseconds.
- **T-Account Generation Overhead**: < 10 milliseconds for 5,000 ledger lines.

### 5.2 Security & Access Controls
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access to financial reports, admin console, SaaS tier settings, and store switches.
  - **Cashier**: Restricted to Express POS, Customer lookups, and Day End receipts.
- **Admin PIN Protection**: Master passcode encryption protecting schema, tenant switching, and tier modifications.`,
    },
    {
      id: "prd-6",
      number: "6.0",
      title: "Product Roadmap & Future Enhancements",
      tags: ["Roadmap", "Milestones"],
      content: `### 6.1 Phase Matrix
- **Phase 1 (Completed)**: Core POS, Restock Turnover Engine, Customer Credit Manager, Cashflow View.
- **Phase 2 (Completed)**: Multi-Item Restock (New + Existing), Evidential Date Timestamps, Automated Non-Consolidated T-Accounts, SaaS Master Console.
- **Phase 3 (Next Milestone)**: Direct Bluetooth Thermal Printer ESC/POS driver integration & WhatsApp automated debt reminder webhook.
- **Phase 4 (Future Roadmap)**: Direct KRA eTIMS API middleware integration & Offline peer-to-peer mesh sync between counter devices.`,
    },
  ],
};

/**
 * Helper to generate full Markdown representation
 */
export function generateMarkdownDoc(doc: EnterpriseDoc): string {
  let md = `# ${doc.title}\n`;
  md += `## ${doc.subtitle}\n\n`;
  md += `**Document ID:** ${doc.docId} | **Version:** ${doc.version} | **Status:** ${doc.status}\n`;
  md += `**Organization:** ${doc.organization} | **Author:** ${doc.author}\n`;
  md += `**Last Updated:** ${doc.lastUpdated}\n\n`;
  md += `---\n\n`;
  md += `### Executive Summary\n${doc.summary}\n\n`;
  md += `---\n\n`;

  doc.sections.forEach((sec) => {
    md += `## Section ${sec.number}: ${sec.title}\n\n`;
    md += `${sec.content}\n\n`;
    md += `---\n\n`;
  });

  md += `*Generated automatically from YuBiFLo Enterprise SaaS Admin Console.*\n`;
  return md;
}

/**
 * Helper to generate printable HTML representation for PDF generation
 */
export function generatePrintableHtml(doc: EnterpriseDoc): string {
  const contentHtml = doc.sections
    .map(
      (sec) => `
      <section class="doc-section" style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #000000; padding-bottom: 6px; margin-top: 24px; font-size: 18px;">
          ${sec.number} ${sec.title}
        </h2>
        <div style="font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${sec.content.replace(/###/g, "<strong>").replace(/\*\*/g, "")}
        </div>
      </section>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${doc.title} - ${doc.version}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 40px;
          color: #0f172a;
          background: #ffffff;
        }
        .header {
          border-bottom: 3px solid #000000;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .title { font-size: 24px; font-weight: 900; color: #047857; margin: 0; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
        .meta-bar {
          display: flex;
          justify-content: space-between;
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          color: #475569;
          margin-top: 12px;
        }
        .summary-box {
          background: #ecfdf5;
          border-left: 4px solid #000000;
          padding: 12px;
          border-radius: 4px;
          margin: 16px 0 24px 0;
          font-size: 12px;
          color: #065f46;
        }
        @media print {
          body { margin: 15mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${doc.title}</h1>
        <p class="subtitle">${doc.subtitle}</p>
        <div class="meta-bar">
          <span><strong>Doc ID:</strong> ${doc.docId}</span>
          <span><strong>Version:</strong> ${doc.version}</span>
          <span><strong>Status:</strong> ${doc.status}</span>
          <span><strong>Updated:</strong> ${doc.lastUpdated}</span>
        </div>
      </div>
      <div class="summary-box">
        <strong>Summary:</strong> ${doc.summary}
      </div>
      ${contentHtml}
      <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center;">
        YuBiFLo Enterprise SaaS Specifications • Confidential & Proprietary
      </footer>
    </body>
    </html>
  `;
}

/**
 * Trigger browser file download
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
