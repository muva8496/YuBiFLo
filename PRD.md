# Product Requirements Document (PRD)
## Product Name: YuBiFLo (Your Business Is A Flower)
**Tagline:** *No notebooks. No typing. Just know your numbers.*  
**Document Version:** 2.4 (Enterprise & MSME Edition)  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. Executive Summary & Vision

### 1.1 The Metaphor: "Your Business Is A Flower"
Small micro-merchants and fast-paced retailers in emerging markets (starting with East Africa/Kenya) do not fail due to lack of effort; they fail due to **operational blindness and cash drift**. A shop is an organic living entity—like a flower:
- The **Soil / Roots**: The morning till float, M-Pesa balances, and supplier trust.
- The **Stem**: Daily velocity of stock moving across the counter without bottlenecking.
- The **Petals (Business Bloom)**: The 5 vital signs of financial health:
  1. **Profit**: True gross margin after cost-of-goods-sold (COGS), not just cash turnover.
  2. **Cash & Float**: Clean separation of drawer money, M-Pesa till, and personal pocket money.
  3. **Debts (Deni / Credit)**: Structured tracking of neighbor loans that ensures timely collections.
  4. **Stock**: Real-time shelf inventory with break-bulk mathematics.
  5. **Suppliers**: Transparent invoices and restock manifests.

### 1.2 Core Thesis
Traditional accounting software (QuickBooks, Wave, Excel) fails retail counter owners because **retailers do not have the time or desk space to type at a keyboard all day**. Notebooks also fail because pages tear, credit gets forgotten, and owner drawings (chai, lunch, fare) quietly bleed working capital.

**YuBiFLo replaces typing with listening (VCR: Voice Cash Register)**, anchors each day with a **05:57 AM dawn float lock**, and reconciles real profit in the evening.

---

## 2. Key Target Personas & Use Cases

| Persona | Archetype | Pain Points | YuBiFLo Solution |
| :--- | :--- | :--- | :--- |
| **Mama Wanjiku / Mama Boi** | High-velocity neighbourhood duka / retail kiosk owner. | 400+ daily OTC cash transactions; loses track of customer deni; mixes pocket cash with till. | VCR hands-free listening; 1-tap WhatsApp deni reminders; 05:57 AM morning float lock. |
| **Bwana Njoroge** | Hardware & Building Materials store proprietor. | Credit owed by building contractors; bags of cement damaged; slow-moving paint stock. | Contractor milestone credit ledgers; broken-bulk packaging; dead-stock alerts. |
| **Hassan / Wema Wholesale** | Bulk commodity & grain depot distributor. | 90-bag truck manifests; shrinkage formulas; multi-route duka collections. | Truck delivery verification; route credit ledgers; bulk reserve vs. shelf separation. |
| **YuBiFLo Sovereign Platform Administrator** | Network CDO / Portfolio Supervisor. | Needs macro insights across all client nodes without breaching data confidentiality. | Aggregated health radar; tenant isolation cryptography; password-gated client vaults. |

---

## 3. End-to-End Client Journey: How a Client Moves in the App

Below is the step-by-step architectural breakdown of how a prospective customer, new client, and returning shopkeeper navigate and experience YuBiFLo.

```
+-----------------------------------------------------------------------------------+
|                           PHASE 1: PUBLIC DISCOVERY                               |
|   Landing Page ("Your Business Is A Flower") -> How It Works -> Voice Simulator   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v  [Clicks "Start Free with VCR" or "Client Log In"]
+-----------------------------------------------------------------------------------+
|                        PHASE 2: SECURITY & PASSCODE GATE                          |
|   Passcode Modal: Enters "8496" -> Unlocks Isolated Client Node Vault             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           PHASE 3: OPERATING THE SHOP                             |
|  Step A (Morning 05:57 AM): Lock Dawn Till Cash & M-Pesa Float (OpeningFloatTab)  |
|  Step B (Midday Counter): VCR Voice Ledger / Speed Actions / WhatsApp Deni        |
|  Step C (Afternoon): Stock & Supply Vault / Break-bulk Inventory Intake           |
|  Step D (Evening 08:30 PM): Evening Cash Audit & Unexplained Cash Resolution      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           PHASE 4: BUSINESS BLOOM & GROWTH                        |
|  Executive White Dashboard -> Bloom Petal Scoring (92/100) -> Offline PWA Export  |
+-----------------------------------------------------------------------------------+
```

### Detailed Journey Breakdown

#### Phase 1: Public Discovery & Exploration (YuBiFloLandingPage)
1. **Entry**: Client lands on `https://yubiflo.com`.
2. **Visual Orientation**: Client sees the fresh Forest Green (`#1E5136`) and gold branding with the serif tagline: *"No notebooks. No typing. Just know your numbers."*
3. **Sub-heading Clarity**: *"Tell us your starting cash each morning. YuBiFLo listens at the counter and shows you your real profit."*
4. **Interactive Demos**:
   - Client views the **Business Bloom** 5-petal interactive graphic in the hero.
   - Client tests the **VCR Live Feed Ticker**, watching simulated spoken phrases convert to balanced ledger items with pause/play capability.
   - Client explores the **"See your kind of business"** selector:
     - **Duka**: Available now.
     - **Hardware**: Coming next (with waitlist sign-up modal).
     - **Wholesale**: Coming soon (with waitlist sign-up modal).
   - Client clicks **"Try the Voice Simulator"** to speak/select test sentences in Swahili/English and view instant financial output.

#### Phase 2: Security & Client Isolation Gatekeeper (`AlacioAccessGateModal`)
1. **Trigger**: When the client clicks *"Start free with VCR"*, *"Client Log in"*, selects the store node from the top workspace menu, or opens the *"DB Root Console"*.
2. **Security Barrier**: A 4-digit security modal overlays the screen:
   - Client enters passcode **`8496`**.
   - If incorrect: Modal shakes with error *"Incorrect password. Access denied."*
   - If `8496`: State unlocks immediately and transitions smoothly into the private tenant workspace.
3. **Data Protection Policy**: The client's business name, inventory rates, customer deni list, and debtor phone numbers remain private.

#### Phase 3: The Daily Operational Rhythm
Once inside the store workspace (`currentView === "workspace"`), the merchant moves through four chronological daily stages:

##### Stage 1: Dawn Baseline (05:57 AM - MorningBookendTab / OpeningFloatTab)
- The shopkeeper counts actual physical cash in the drawer before opening the metal shutters.
- Enters bill denominations (1000s, 500s, 200s, 100s, 50s, coins) and checks the M-Pesa float.
- Clicks **"Lock Dawn Baseline"**.
- *System Outcome*: Sets an indelible point-in-time timestamp. Any coin entering the drawer after this second is counted strictly as today's revenue.

##### Stage 2: Midday Counter Transactions (VoiceLedger / UnifiedVoiceLedgerTab / DashboardTab)
- **VCR Listening**: When a customer orders *"Sold 2 Unga Jogoo and 3 Brookside Milk cash 620 Shillings"*, the merchant speaks it into the counter microphone or taps rapid sale.
- **Auto-Parsing**:
  - Deduces 2 units of Unga Jogoo and 3 units of Brookside Milk from inventory.
  - Adds KSh 620 to Till Cash.
  - Writes balanced accounting debit/credit entries.
  - **Audio Discard**: Raw audio is deleted immediately after parsing numbers.
- **Credit Sales (Deni)**: If a neighbor buys on credit, the transaction posts to `CustomersCreditTab`. The merchant can trigger a 1-tap polite WhatsApp payment reminder with pre-filled balance and Till number.

##### Stage 3: Inventory & Supply Chain (SupplyStockVaultTab / SupplierLogTab)
- Milk and bread trucks arrive midday.
- Merchant enters multi-pack crate deliveries (e.g. 21-pack Brookside crates).
- System decomposes bulk crates into individual retail unit margins.

##### Stage 4: Evening Cash Audit & Unexplained Cash (EveningReconciliationTab / DashboardTab)
- At closing, the merchant counts the drawer and compares it against expected drawer cash (Opening Float + Cash Sales - Recorded Outflows).
- If there is an unexplained difference (e.g. KSh 450):
  - Two 1-tap chips appear: **Personal (Drawing)** (e.g. lunch/chai) vs **Business (Expense)** (e.g. council levy).
  - Tapping a chip balances the ledger with zero missing money.

#### Phase 4: Long-Term Growth & Sovereign Oversight
- **Executive White Dashboard**: High-level financial clarity—income vs. expense charts, profit & loss, liquid cash, and overdue debt breakdown.
- **Business Bloom Score**: The merchant checks their flower health score (e.g. 92/100). As clean trading days accumulate, the petals illuminate.
- **PWA Export**: Using the *"Export PWA"* action, the merchant downloads a single-store offline app that runs locally on their Android or desktop device even during network blackouts.

---

## 4. Feature Specifications & System Modules

### Module 1: Business Bloom Signature Graphic
- **Purpose**: A visual health indicator representing 5 interconnected business dimensions:
  1. *Profit Health* (Gross margin vs. operating overhead)
  2. *Cash & Float Health* (Clean drawer reconciliation without co-mingling)
  3. *Debts / Deni Health* (Low default rate under 5% of monthly revenue)
  4. *Stock Health* (High inventory velocity without dead-shelf capital)
  5. *Supplier Health* (Timely settlement of wholesale invoices)
- **Implementation**: Native SVG rendering with dynamically colored, animated petals and a central numerical score (0-100).

### Module 2: VCR (Voice Cash Register) Engine
- **Voice Recognition**: Handles multi-dialect inputs (English, Swahili, Sheng).
- **Zero Conversation Retention**: Evaluates monetary keywords, items, and values, produces JSON transaction records, and drops the raw audio stream immediately.
- **Simulation Mode**: Built-in interactive simulator on the homepage allows any visitor to test sample sentences and see real-time ledger extraction.

### Module 3: Triple-Store Data Architecture & Offline Resilience
- **Tier 1 (Client LocalStorage)**: Instant, zero-latency state updates with zero offline risk (`loadAlacioState()` / `saveAlacioState()`).
- **Tier 2 (Cloud Firestore Sync)**: Private tenant document structure in Firestore (`workspaces/{tenantId}`) for cloud multi-device sync.
- **Tier 3 (SQL Data Warehouse Engine)**: Enterprise tabular structures (`schemaSql.ts`) supporting macro analysis across the merchant network.

### Module 4: Client Protection & Passcode Gatekeeper
- **Master Password**: Protected by access code `8496`.
- **Anonymity Policy**: Public-facing demonstrations display generic `"Retail Pro Store"` or `"Sample data"`. Sensitive client debt balances and phone numbers are inaccessible without authentication.

---

## 5. Non-Functional Requirements & Compliance

1. **Kenyan Regulatory Alignment**:
   - Built with Kenya's Data Protection Act in mind.
   - Strictly prohibits public sharing or marketing use of individual consumer debtor ledgers or proprietary store margins.
2. **Performance & Motion**:
   - First Contentful Paint < 1.2s.
   - Numbers count up on load with respect for `prefers-reduced-motion`.
   - Lightweight bundle with Vite tree-shaking.
3. **Hardware Compatibility**:
   - Responsive from mobile screens (320px) to desktop counter terminals.
   - Standalone PWA installable on low-cost Android smartphones and ChromeOS counter tablets.

---

## 6. Success Metrics & KPIs

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Drawer Reconciliation Rate** | > 98% daily match | Ratio of evening reconciled sessions with zero unexplained variance. |
| **Time Spent on Bookkeeping** | < 4 minutes / day | Total time spent entering dawn float and evening review combined. |
| **Deni Recovery Speed** | 3.2 days average | Days between credit purchase and full settlement via WhatsApp reminder. |
| **Phantom Shrinkage Reduction** | 100% elimination | Catching owner drawings and employee lunch cash before drawer drift occurs. |
| **Business Bloom Score Growth** | +15 pts in 30 days | Average merchant progression from baseline to disciplined operation. |

---

## 7. Product Roadmap

- **Phase 1 (Current / Implemented)**:
  - Full YuBiFLo homepage redesign with Forest Green & Gold aesthetic.
  - Business Bloom signature graphic and interactive 5-tile sample dashboards.
  - VCR live ticker and voice simulator modal.
  - Client password gatekeeper (`8496`) and private tenant sandboxing.
  - Full working duka operations runtime (Dawn Lock, Inventory, Customer Deni, Evening Audit).
- **Phase 2 (Coming Next)**:
  - Hardware & Construction Blueprint (broken-bulk cement, timber footage, contractor project accounts).
  - Direct WhatsApp Business Cloud API integration for automated balance statements.
- **Phase 3 (Coming Soon)**:
  - Wholesale & Distribution Blueprint (bulk grain shrinkage formulas, multi-vehicle dispatch manifests).
  - Multi-branch owner synchronization with centralized portfolio dashboards.
