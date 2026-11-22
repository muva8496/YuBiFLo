export type ClientArticleCategory =
  | "Cashflow & Float"
  | "Customer Credit"
  | "Stock & Pricing"
  | "Counter Operations"
  | "Owner Discipline";

export interface ClientArticleSection {
  heading: string;
  paragraphs: string[];
  exampleTable?: {
    caption: string;
    headers: string[];
    rows: string[][];
  };
}

export interface ClientArticle {
  id: string;
  title: string;
  subtitle: string;
  category: ClientArticleCategory;
  readTime: string;
  publishedAt: string;
  author: string;
  summary: string;
  keyNumbers: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  sections: ClientArticleSection[];
  actionPrompt: {
    label: string;
    description: string;
    demoTab: string;
  };
}

export const CLIENT_ARTICLE_CATEGORIES: ClientArticleCategory[] = [
  "Cashflow & Float",
  "Customer Credit",
  "Stock & Pricing",
  "Counter Operations",
  "Owner Discipline"
];

export const CLIENT_ARTICLES: ClientArticle[] = [
  {
    id: "cash-in-till-vs-real-profit",
    title: "Why Cash in Your Till at 9 PM Is Never Your Real Profit",
    subtitle:
      "A busy counter can still lose money silently when opening float, supplier cash payouts, and shelf restocks sit in the same drawer.",
    category: "Cashflow & Float",
    readTime: "5 min read",
    publishedAt: "November 2026",
    author: "YuBiFLo MSME Research",
    summary:
      "Most shopkeepers finish the day counting notes in the drawer and checking their M-Pesa Till balance. Here is why that single number misleads growing businesses—and the two-minute morning habit that fixes it.",
    keyNumbers: [
      {
        label: "Dawn Lock Check",
        value: "2 mins",
        note: "Time needed at opening to record Cash + M-Pesa float"
      },
      {
        label: "Hidden Daily Leakage",
        value: "8% – 14%",
        note: "Typical unrecorded till gaps in busy mixed-payment shops"
      },
      {
        label: "Reconciliation Channels",
        value: "Cash + Mobile",
        note: "Track drawer notes and Pochi / Till separately"
      }
    ],
    sections: [
      {
        heading: "The 9 PM illusion every shop owner knows",
        paragraphs: [
          "Suppose you open your duka at 6:00 AM with KSh 3,500 in small change inside the cash drawer and KSh 4,200 on your M-Pesa Till. All day, customers stream in for milk, bread, sugar, cooking oil, and airtime. Around 11:00 AM, the bread distributor arrives and you hand over KSh 2,600 cash from the drawer. At 2:00 PM, a regular customer takes KSh 450 worth of groceries on credit. At 4:00 PM, you buy lunch and pay a boda rider KSh 200 out of the till.",
          "By 9:00 PM, your feet ache and you count KSh 11,400 in cash plus KSh 9,800 on M-Pesa. Because the drawer looks heavier than it did at dawn, the day feels successful. Yet without separating your morning float, supplier restocks, credit given out, and personal cash taken, you still do not know two critical facts: whether any cash went missing during the rush, and how much of that money actually belongs to profit rather than tomorrow's restock."
        ],
        exampleTable: {
          caption: "Sample daily drawer vs. real trading calculation (KSh)",
          headers: ["Item at Counter", "Amount", "What It Actually Means"],
          rows: [
            ["Morning Dawn Float (Cash + M-Pesa)", "KSh 7,700", "Capital already in the business before opening"],
            ["Cash & M-Pesa Collected Today", "KSh 18,450", "Total gross inflows from paid sales"],
            ["Bread & Milk Restock Paid Out", "-KSh 4,900", "Inventory replacement cost, not lost profit"],
            ["Customer Credit (Deni) Issued", "KSh 1,250", "Goods left the shelf; cash not collected yet"],
            ["True Gross Margin Earned", "KSh 3,680", "Real earnings left after cost of goods sold"]
          ]
        }
      },
      {
        heading: "Why locking your morning float changes everything",
        paragraphs: [
          "Accounting for small retail does not require complex ledgers. It starts with one firm boundary: lock the exact cash and mobile money balance before the first customer walks in. When you know your starting float, every shilling that enters or leaves has to answer to that baseline.",
          "At closing time, expected drawer balance is simple arithmetic: Opening Float plus Cash Sales minus Cash Restocks and Logged Expenses. If expected cash is KSh 12,100 and your physical count is KSh 11,950, you catch a KSh 150 discrepancy the same evening while memories are fresh—rather than discovering missing stock capital at the end of the month."
        ]
      },
      {
        heading: "Three rules to keep tonight's closing clean",
        paragraphs: [
          "First, record supplier cash payouts immediately when the delivery van leaves, even if the receipt is a handwritten slip. Second, never treat credit sales as cash sales until the M-Pesa confirmation or cash lands in your hand. Third, review your gross margin weekly rather than staring only at daily revenue—high-turnover items like bread and milk bring foot traffic, while higher-margin goods pay the rent."
        ]
      }
    ],
    actionPrompt: {
      label: "Try Dawn Float Lock in live workspace",
      description: "See how locking morning Cash and M-Pesa float automatically reconciles evening sales.",
      demoTab: "dawn_lock"
    }
  },
  {
    id: "hidden-leak-of-uncollected-deni",
    title: "The Hidden Leak of Uncollected Deni: Protecting Your Working Stock Capital",
    subtitle:
      "Neighbor credit builds loyalty, yet informal notebooks turn profitable shelves into empty shelves when due dates drift.",
    category: "Customer Credit",
    readTime: "4 min read",
    publishedAt: "November 2026",
    author: "YuBiFLo MSME Research",
    summary:
      "In neighborhood retail, saying no to every credit request can cost loyal households. Saying yes without itemized records, strict repayment deadlines, and overdue visibility quietly drains your restock budget.",
    keyNumbers: [
      {
        label: "Healthy Deni Ceiling",
        value: "< 12%",
        note: "Keep total outstanding credit below 12% of weekly turnover"
      },
      {
        label: "7-Day Rule",
        value: "Max 7 days",
        note: "Standard collection window for household consumables"
      },
      {
        label: "Itemized Clarity",
        value: "100% Items",
        note: "Record exact goods taken, not just round cash totals"
      }
    ],
    sections: [
      {
        heading: "Why writing 'Mama Brayo - 400' in a book causes disputes",
        paragraphs: [
          "Two weeks later, when a neighbor disputes a balance, an exercise book line reading '12th Nov — 400/=' gives neither of you confidence. Was that 2 packets of maize meal and milk, or cooking oil and sugar? Did they pay KSh 150 on Tuesday morning when the shop was busy? Uncertain records create awkward arguments at the counter, and shop owners often waive part of the debt just to avoid tension.",
          "Recording itemized credit—listing the exact items, quantities, date taken, and agreed payment deadline—removes emotion from the conversation. Both the seller and the buyer see a clear, respectful ledger."
        ]
      },
      {
        heading: "The power of a fixed 'Must Pay By' date",
        paragraphs: [
          "Open-ended credit ('I will pass by end month') stretches working capital until your wholesale supplier arrives and you cannot pay for fresh stock. Every debtor account needs a firm settlement date agreed at the counter: Friday evening, Monday morning, or the 5th of the month.",
          "When a promised date passes without payment, that account should surface immediately on your daily screen as overdue so you do not accidentally extend another KSh 500 on top of an unpaid bill."
        ]
      },
      {
        heading: "A practical three-tier credit policy for small businesses",
        paragraphs: [
          "Keep credit simple for your team: first, limit uncollected credit strictly to verified regular customers with phone numbers on file; second, pause new credit for any account that already has an overdue balance; third, send polite WhatsApp balance reminders showing the exact items and total before end-of-month bills compete for the customer's salary."
        ]
      }
    ],
    actionPrompt: {
      label: "Explore Customer Deni ledger",
      description: "See itemized debtor accounts, due-date tracking, and overdue alerts in the live workspace.",
      demoTab: "customer_deni"
    }
  },
  {
    id: "break-bulk-pricing-math",
    title: "Break-Bulk Pricing Math: Pricing Packets, Crates, and Loose Units Without Losing Margin",
    subtitle:
      "Wholesale suppliers invoice by the bale, crate, or carton—while customers buy single packets and loose pieces.",
    category: "Stock & Pricing",
    readTime: "6 min read",
    publishedAt: "November 2026",
    author: "YuBiFLo MSME Research",
    summary:
      "When wholesale prices shift every fortnight, guessing your retail unit price off the top of your head can wipe out your entire margin on fast-moving staples. Here is how to calculate exact break-bulk unit costs.",
    keyNumbers: [
      {
        label: "Staple Margin Target",
        value: "12% – 18%",
        note: "Typical target for fast movers like flour, sugar, and milk"
      },
      {
        label: "General Goods Target",
        value: "20% – 30%",
        note: "Standard markup for household soap, snacks, and dry goods"
      },
      {
        label: "Two-Way Intake",
        value: "Lot or Unit",
        note: "Log bulk distributor lots alongside granular receipt lines"
      }
    ],
    sections: [
      {
        heading: "Where margin disappears between delivery and shelf",
        paragraphs: [
          "Consider a wholesaler delivering 1 bale of 2kg maize flour (12 packets) at KSh 1,920, plus 1 carton of 24 small cooking oil bottles at KSh 3,120. Many busy owners glance at the invoice total, pay via M-Pesa, and keep selling at last month's shelf price. If the bale rose by KSh 120 since the previous delivery, your unit cost jumped from KSh 150 to KSh 160 per packet—silently shrinking a thin KSh 20 margin down to KSh 10.",
          "Whenever inbound cargo arrives, dividing the landed cost—including delivery transport if charged separately—by the exact sellable units inside the bale or carton reveals your real breakeven cost before a single packet reaches the shelf."
        ],
        exampleTable: {
          caption: "Example break-bulk conversion from wholesale invoice to shelf price",
          headers: ["Wholesale Delivery", "Units Inside", "Unit Cost", "Suggested Shelf Price (+20%)"],
          rows: [
            ["1 Bale Flour (2kg)", "12 packets", "KSh 160.00", "KSh 190.00 – 195.00"],
            ["1 Crate Milk (500ml)", "20 packets", "KSh 52.00", "KSh 62.00 – 65.00"],
            ["1 Carton Cooking Oil (500ml)", "24 bottles", "KSh 130.00", "KSh 155.00 – 160.00"],
            ["1 Sack Sugar (50kg)", "50 kg packed", "KSh 138.00/kg", "KSh 165.00 – 170.00/kg"]
          ]
        }
      },
      {
        heading: "Handling both bulk batch loads and itemized supplier receipts",
        paragraphs: [
          "Real suppliers rarely follow one neat format. Bread vans and soda trucks often supply one big batch quantity with a single batch figure, while cash-and-carry wholesalers hand over multi-line invoices listing fifteen different SKUs, cartons, half-dozens, and loose pieces.",
          "Keeping both options clean—recording whole bulk lots when a single product truck unloads, and breaking down itemized receipts line by line for mixed wholesale runs—ensures your stock vault never assumes wrong supplier numbers or misses price hikes."
        ]
      }
    ],
    actionPrompt: {
      label: "Test Inbound Cargo & Selling Prices",
      description: "See batch restock intake alongside automatic margin calculation (+15% to +30%).",
      demoTab: "purchases"
    }
  },
  {
    id: "hands-free-counter-capture",
    title: "Counting Every Sale During Rush Hour Without Stopping to Write in a Book",
    subtitle:
      "Peak evening hours are when most revenue happens—and when manual books get abandoned.",
    category: "Counter Operations",
    readTime: "4 min read",
    publishedAt: "November 2026",
    author: "YuBiFLo MSME Research",
    summary:
      "Between 5:30 PM and 8:30 PM, customers do not wait for a shopkeeper to flip pages and write SKU names. Hands-free voice logging captures rapid counter speech while ignoring background shop noise.",
    keyNumbers: [
      {
        label: "Typing Overhead",
        value: "0 seconds",
        note: "Keep hands free to pack bags, hand change, and check M-Pesa"
      },
      {
        label: "Continuous Shift Ready",
        value: "Up to 24h",
        note: "Designed to run cleanly across full morning-to-closing shifts"
      },
      {
        label: "Mixed Dialect Support",
        value: "EN / SW / Sheng",
        note: "Understands natural counter phrasing across Kenyan shops"
      }
    ],
    sections: [
      {
        heading: "Why evening rush breaks manual POS and paper notebooks",
        paragraphs: [
          "Anyone who has worked behind a retail counter or busy eatery knows the 6:00 PM rush. One buyer asks for two loaves of bread and milk, another is flashing an M-Pesa confirmation message, and a third is asking for change. Nobody stops the queue to tap five screens per customer or write neatly in a ruled hardcover book.",
          "So owners promise themselves they will 'write everything down later.' Half of it is remembered accurately; the other half turns into rough guesses, leaving stock counts out of sync with cash by closing time."
        ]
      },
      {
        heading: "Speaking naturally while background audio keeps playing",
        paragraphs: [
          "Real counters are never library-quiet. Shop radios play music, customers chat outside, and attendants watch short phone clips during quiet spells. Effective counter voice capture separates clear commercial intent—like 'Sold two Jogoo unga cash 340' or 'Mama Boi credit one loaf 65'—from background songs, greetings, or unrelated chatter.",
          "By combining acoustic vocal filtering with commercial transaction parsing, only real sales, credit entries, and restocks enter your ledger, while raw audio stays private and is discarded."
        ]
      }
    ],
    actionPrompt: {
      label: "See Voice Ledger in action",
      description: "Explore continuous counter voice recording and background-noise filtering live.",
      demoTab: "voice_ledger"
    }
  },
  {
    id: "separating-owner-drawings-from-stock",
    title: "One Drawer, Two Pockets: Separating Family Spending From Business Stock Money",
    subtitle:
      "Many profitable shops feel cash-strapped simply because household expenses pull from the same pool as supplier restocks.",
    category: "Owner Discipline",
    readTime: "5 min read",
    publishedAt: "November 2026",
    author: "YuBiFLo MSME Research",
    summary:
      "A thriving business can look broke if school fees, transport, airtime, and daily meals leave the drawer unrecorded. Separating Owner Drawings from Business Expenses restores instant clarity.",
    keyNumbers: [
      {
        label: "3-Fold Separation",
        value: "COGS / OpEx / Draw",
        note: "Keep stock purchases, shop costs, and personal draws distinct"
      },
      {
        label: "True Business Health",
        value: "Net Margin",
        note: "Know if your shop is growing even after family draws"
      },
      {
        label: "Monthly Pay Habit",
        value: "Fixed Salary",
        note: "Pay yourself an intentional owner draw rather than random dips"
      }
    ],
    sections: [
      {
        heading: "The quiet trap of running a family from the cash drawer",
        paragraphs: [
          "When you own an MSME, the shop is both your livelihood and your daily emergency fund. It feels natural to pull KSh 1,500 from the drawer for family groceries, KSh 3,000 for school transport, or KSh 500 for personal airtime. None of that is wrong—after all, you work hard so your business supports your household.",
          "The problem happens when those withdrawals go unlogged or get mixed up with shop costs like rent, electricity tokens, and supplier invoices. Suddenly, your bank and M-Pesa feel empty, and it becomes impossible to tell whether the business itself has poor margins or whether household draws simply exceeded weekly net profit."
        ]
      },
      {
        heading: "Separating three outflows in 10 seconds a day",
        paragraphs: [
          "Every shilling leaving your business falls into one of three clear buckets: Stock & Supplier Restocks (buying goods to resell), Business Operating Expenses (shop rent, electricity, bags, staff wages), and Owner Drawings (personal or family cash taken by the proprietor).",
          "Once those three streams are logged under separate labels, your monthly statement tells the exact truth: 'My duka earned KSh 48,000 net profit after stock and rent, and I drew KSh 32,000 for home—so KSh 16,000 stayed inside to grow inventory.' That single number is how small shops graduate into multi-branch enterprises."
        ]
      }
    ],
    actionPrompt: {
      label: "Inspect Owner Expenses & 3-Fold Ledgers",
      description: "See how personal withdrawals, operating expenses, and supplier restocks stay cleanly separated.",
      demoTab: "owner_expenses"
    }
  }
];
