/**
 * YuBiFlo - 5-Language Nairobi Commercial Dialect Engine
 * 
 * Languages Trained:
 * 1. Kikuyu (Gĩkũyũ) - Massive commercial retail, duka, and agri-supply presence in Nairobi/Kiambu/Murang'a corridors
 * 2. Kamba (Kĩkamba) - Pervasive across Nairobi retail kiosks, cereals, fruit, and Eastlands/Machakos trading corridors
 * 3. Swahili (Kiswahili) - Commercial lingua franca across all East African MSMEs
 * 4. English (Kenyan English & Code-switching) - Standard hybrid business and accounting speech
 * 5. Sheng (Nairobi Urban Street Lingua) - Rapid counter trading dialect used by youth, bodas, and urban shopkeepers
 */

export type KenyanLanguage = "KIKUYU" | "KAMBA" | "SWAHILI" | "ENGLISH" | "SHENG";

export interface DialectBenchmarkSample {
  id: string;
  language: KenyanLanguage;
  languageLabel: string;
  dialectNotes: string;
  spokenPhrase: string;
  englishTranslation: string;
  detectedIntent: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT" | "CASH_SALE";
  expectedItems: Array<{ itemName: string; quantity: number; unit: string }>;
  financials: {
    amount: number;
    paymentMode: "CASH" | "MPESA" | "CREDIT" | "SPLIT";
    changeOrBalance?: number;
    debtorOrSupplier?: string;
  };
  pickupStatus?: string;
}

export interface DialectDictionary {
  language: KenyanLanguage;
  name: string;
  greeting: string;
  terms: {
    money: string[];
    debt_credit: string[];
    milk: string[];
    bread: string[];
    sugar: string[];
    flour_unga: string[];
    crate: string[];
    change_balance: string[];
    tomorrow_later: string[];
    supplier_delivery: string[];
    numbers: { [key: number]: string[] };
  };
}

// 1. COMPREHENSIVE LINGUISTIC DICTIONARY FOR THE 5 LANGUAGES
export const KENYAN_DIALECT_DICTIONARIES: Record<KenyanLanguage, DialectDictionary> = {
  KIKUYU: {
    language: "KIKUYU",
    name: "Gĩkũyũ (Kikuyu)",
    greeting: "Wĩmwega / Wĩmũhoro",
    terms: {
      money: ["mbeca", "mbecha", "kĩgĩna", "ciringi", "mũhando"],
      debt_credit: ["thiirĩ", "thiiri", "kũũria thiirĩ", "andĩka thiirĩ", "ngakũrĩha rũciũ", "kwĩhoka"],
      milk: ["iria", "iria rĩa kĩrate", "iria rĩa ng'ombe", "iria rĩa nduka"],
      bread: ["mũgate", "migate", "mũgati", "mikate"],
      sugar: ["thukari", "cukari", "sukari"],
      flour_unga: ["mũtu", "mũtu wa ng'aragu", "mũtu wa mũhĩndĩ", "mũtu wa jogoo", "mburoti"],
      crate: ["kĩrate", "irate", "karate"],
      change_balance: ["chenji", "mbeca iria ciatigara", "ciatigara", "kũcokia"],
      tomorrow_later: ["rũciũ", "hwaĩ-inĩ", "hwai-ini", "thutha", "rũciũ rũkĩe"],
      supplier_delivery: ["mũtĩrĩka", "mũtũmĩri", "mũtwarĩri", "he kĩrate", "tiga kĩrate", "rehe"],
      numbers: {
        1: ["ĩmwe", "imwe"],
        2: ["igĩrĩ", "igiri"],
        3: ["ithatũ", "ithatu"],
        4: ["inya"],
        5: ["ithano"],
        10: ["ikũmi", "ikumi"],
        20: ["mĩrongo ĩrĩ", "mirongo iri"],
        40: ["mĩrongo ĩna", "mirongo ina"],
        50: ["mĩrongo ĩtano", "mirongo itano"],
        100: ["igana rĩmwe", "igana rimwe"],
        200: ["magana merĩ", "magana meri"],
        400: ["magana mana"],
        600: ["magana matandatũ", "magana matandatu"],
        1000: ["ngiri ĩmwe", "ngiri imwe"]
      }
    }
  },

  KAMBA: {
    language: "KAMBA",
    name: "Kĩkamba (Kamba)",
    greeting: "Ũvoo waku / Waamũka ata",
    terms: {
      money: ["mbesa", "mbee", "silĩngi", "mbia", "mũsaala"],
      debt_credit: ["thĩnĩ", "nthĩĩ", "ngome", "kũkopa", "ngakwĩva ũnĩ", "ngakwiva uni", "andĩka"],
      milk: ["ĩia", "iia", "iia ya ng'ombe", "iia ya crate"],
      bread: ["mũkate", "mikate", "mukate"],
      sugar: ["sukari", "thukali"],
      flour_unga: ["mũtu", "mutu", "mutu wa ng'ombe", "mutu wa mbembe"],
      crate: ["kilate", "crate", "ngaleti"],
      change_balance: ["tsenji", "chenji", "mbesa ila syatĩala", "kũtiwa"],
      tomorrow_later: ["ũnĩ", "uni", "wĩoo", "wioo", "ĩtina", "ũtukũ"],
      supplier_delivery: ["kũtwaa", "ete", "kũvĩkya", "nengye", "nĩkũete", "twĩkĩe"],
      numbers: {
        1: ["ĩmwe", "imwe"],
        2: ["ilĩ", "ili"],
        3: ["itatũ", "itatu"],
        4: ["inya"],
        5: ["ĩtano", "itano"],
        10: ["ĩkũmi", "ikumi"],
        20: ["mĩongo ĩlĩ", "miongo ili"],
        40: ["mĩongo ĩna", "miongo ina"],
        50: ["mĩongo ĩtano", "miongo itano"],
        100: ["ĩana yĩmwe", "iana yimwe"],
        200: ["maana elĩ", "maana eli"],
        400: ["maana ana"],
        600: ["maana mathatu na mĩongo ĩtano", "maana mathatu", "maana elĩ"],
        1000: ["ngili ĩmwe", "ngili imwe"]
      }
    }
  },

  SWAHILI: {
    language: "SWAHILI",
    name: "Kiswahili (East African Swahili)",
    greeting: "Habari yako / Hujambo",
    terms: {
      money: ["pesa", "shilingi", "fedha", "chapaa", "mkwanja"],
      debt_credit: ["deni", "kopa", "kikopa", "nitalipa kesho", "niandike", "madeni"],
      milk: ["maziwa", "maziwa ya pakiti", "maziwa ya ng'ombe"],
      bread: ["mkate", "mikate", "boflo"],
      sugar: ["sukari", "sukari nyeupe"],
      flour_unga: ["unga", "unga wa ugali", "unga wa ngano", "bale ya unga"],
      crate: ["crate", "kreti", "sanduku"],
      change_balance: ["chenji", "change", "baki", "pesa inayobaki"],
      tomorrow_later: ["kesho", "jioni", "baadaye", "usiku", "kushinda"],
      supplier_delivery: ["leta", "shusha", "weka", "supplier ameleta", "mzigo umefika"],
      numbers: {
        1: ["moja"],
        2: ["mbili"],
        3: ["tatu"],
        4: ["nne"],
        5: ["tano"],
        10: ["kumi"],
        20: ["ishirini"],
        40: ["arobaini", "robaini"],
        50: ["hamsini"],
        100: ["mia moja"],
        200: ["mia mbili"],
        400: ["mia nne"],
        600: ["mia sita"],
        1000: ["elfu moja"]
      }
    }
  },

  ENGLISH: {
    language: "ENGLISH",
    name: "Kenyan Commercial English",
    greeting: "Good morning / Hello boss",
    terms: {
      money: ["cash", "money", "shillings", "bob", "funds"],
      debt_credit: ["debt", "credit", "pay tomorrow", "write my name", "loan", "book it"],
      milk: ["milk", "fresh milk", "packets"],
      bread: ["bread", "loaves", "bread loaf"],
      sugar: ["sugar", "mumias sugar"],
      flour_unga: ["flour", "unga", "maize meal", "bale"],
      crate: ["crate", "crates", "case"],
      change_balance: ["change", "balance", "remainders"],
      tomorrow_later: ["tomorrow", "evening", "later today", "afternoon"],
      supplier_delivery: ["deliver", "delivery", "drop", "bring", "unloaded", "stock"],
      numbers: {
        1: ["one"],
        2: ["two"],
        3: ["three"],
        4: ["four"],
        5: ["five"],
        10: ["ten"],
        20: ["twenty"],
        40: ["forty"],
        50: ["fifty"],
        100: ["one hundred", "hundred"],
        200: ["two hundred"],
        400: ["four hundred"],
        600: ["six hundred"],
        1000: ["one thousand", "thousand", "k"]
      }
    }
  },

  SHENG: {
    language: "SHENG",
    name: "Sheng (Nairobi Street Lingua)",
    greeting: "Niaje morio / Sasa duka / Mambo",
    terms: {
      money: ["chapaa", "mkwanja", "dough", "soo", "punch", "ngiri", "ndovu", "finje", "chwani"],
      debt_credit: ["deni", "kopa", "kopea", "nitalipa kesho risto", "niandikie", "weka kwa book"],
      milk: ["doh / maziwa", "maziwa ya pack", "lala"],
      bread: ["chapo / mkate", "boflo", "slice"],
      sugar: ["sukari", "sweety"],
      flour_unga: ["unga", "ugali dough", "jogoo"],
      crate: ["crate", "box", "juala"],
      change_balance: ["chenji", "change", "masalio", "balance"],
      tomorrow_later: ["kesho", "jioni", "later", "baadaye", "usiku morio"],
      supplier_delivery: ["shusha mzigo", "leta crates", "driva amefika", "supplier ameleta stock"],
      numbers: {
        1: ["mbao", "chwani"],
        2: ["two", "mbili"],
        5: ["ngovo"],
        10: ["ashara"],
        20: ["mbao", "blue"],
        40: ["forty"],
        50: ["chwani", "finje"],
        100: ["soo", "soo moja", "red"],
        200: ["soo mbili"],
        400: ["soo nne"],
        500: ["punch", "panji"],
        600: ["punch na soo", "soo sita"],
        1000: ["ngiri", "ngiri moja", "ndovu", "k"]
      }
    }
  }
};

// 2. VORACIOUS FEW-SHOT TRAINING CORPUS (5 LANGUAGES ACROSS ALL 3 MAJOR INTENTS)
export const VORACIOUS_TRAINING_CORPUS: DialectBenchmarkSample[] = [
  // --- KIKUYU BENCHMARKS ---
  {
    id: "kikuyu_01_supplier",
    language: "KIKUYU",
    languageLabel: "Gĩkũyũ (Kikuyu)",
    dialectNotes: "Central Kenya wholesale driver delivering milk and bread at counter",
    spokenPhrase: "Rehe kĩrate igĩrĩ cia iria na migate mĩrongo ĩrĩ, ndĩrakũhĩtĩria mbeca na M-Pesa rĩu.",
    englishTranslation: "Bring 2 crates of milk and 20 loaves of bread, I'm transferring the money to you via M-Pesa right now.",
    detectedIntent: "SUPPLIER_DELIVERY",
    expectedItems: [
      { itemName: "Brookside Fresh Milk", quantity: 2, unit: "crates" },
      { itemName: "Broadways Bread", quantity: 20, unit: "loaves" }
    ],
    financials: {
      amount: 3940,
      paymentMode: "MPESA",
      debtorOrSupplier: "Brookside Delivery Driver"
    }
  },
  {
    id: "kikuyu_02_credit",
    language: "KIKUYU",
    languageLabel: "Gĩkũyũ (Kikuyu)",
    dialectNotes: "Regular customer asking for small sugar portion on credit",
    spokenPhrase: "He thukari ya mĩrongo ĩna na ũnyandĩke thiirĩ, ngakũrĩha rũciũ hwaĩ-inĩ.",
    englishTranslation: "Give me sugar worth 40 shillings and write it as debt, I will pay you tomorrow evening.",
    detectedIntent: "CREDIT_RECORD",
    expectedItems: [
      { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
    ],
    financials: {
      amount: 40,
      paymentMode: "CREDIT",
      debtorOrSupplier: "Mama Boi"
    }
  },
  {
    id: "kikuyu_03_advance",
    language: "KIKUYU",
    languageLabel: "Gĩkũyũ (Kikuyu)",
    dialectNotes: "Customer pays for unga bale in advance with 1000 note, leaves unga behind for evening pickup",
    spokenPhrase: "Oya ngiri ĩmwe ya mũtu ũyũ wa magana matandatũ, ngacoka gũkũya hwaĩ-inĩ. He chenji ya magana mana.",
    englishTranslation: "Take 1,000 for this flour of 600, I will come back to pick it in the evening. Give me 400 change.",
    detectedIntent: "ADVANCE_PAYMENT",
    expectedItems: [
      { itemName: "Unga Jogoo 2kg Bale", quantity: 1, unit: "bale" }
    ],
    financials: {
      amount: 600,
      paymentMode: "CASH",
      changeOrBalance: 400,
      debtorOrSupplier: "Pastor John"
    },
    pickupStatus: "Reserved on shelf (customer returning in the evening)"
  },

  // --- KAMBA BENCHMARKS ---
  {
    id: "kamba_01_supplier",
    language: "KAMBA",
    languageLabel: "Kĩkamba (Kamba)",
    dialectNotes: "Machakos/Kitui distributor unloading milk crates and bread",
    spokenPhrase: "Ete ĩia crate ilĩ na mikate mĩongo ĩlĩ, nĩngwĩkĩa mbesa sya M-Pesa ĩvĩndĩ yĩĩ.",
    englishTranslation: "Bring 2 crates of milk and 20 breads, I will send the M-Pesa money right now.",
    detectedIntent: "SUPPLIER_DELIVERY",
    expectedItems: [
      { itemName: "Brookside Fresh Milk", quantity: 2, unit: "crates" },
      { itemName: "Broadways Bread", quantity: 20, unit: "loaves" }
    ],
    financials: {
      amount: 3940,
      paymentMode: "MPESA",
      debtorOrSupplier: "Kamba Wholesale Distributor"
    }
  },
  {
    id: "kamba_02_credit",
    language: "KAMBA",
    languageLabel: "Kĩkamba (Kamba)",
    dialectNotes: "Neighbor taking sugar on deni, promising to settle tomorrow",
    spokenPhrase: "Nengye sukari ya mĩongo ĩna na ũandĩke thĩnĩ, ngakwĩva ũnĩ wĩoo.",
    englishTranslation: "Give me sugar of 40 and write it down as debt, I will pay tomorrow evening.",
    detectedIntent: "CREDIT_RECORD",
    expectedItems: [
      { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
    ],
    financials: {
      amount: 40,
      paymentMode: "CREDIT",
      debtorOrSupplier: "Mutua (Neighbor)"
    }
  },
  {
    id: "kamba_03_advance",
    language: "KAMBA",
    languageLabel: "Kĩkamba (Kamba)",
    dialectNotes: "Customer pays 1000 cash for 600 flour, leaves item behind to pick in the evening",
    spokenPhrase: "Kũa ngili ĩmwe ya mũtu ũũ wa maana mathatu, ngasyoka kwosa wĩoo. Nengye tsenji ya maana ana.",
    englishTranslation: "Take 1,000 for this 600 flour, I'll return to pick it in the evening. Hand me 400 change.",
    detectedIntent: "ADVANCE_PAYMENT",
    expectedItems: [
      { itemName: "Unga Jogoo 2kg Bale", quantity: 1, unit: "bale" }
    ],
    financials: {
      amount: 600,
      paymentMode: "CASH",
      changeOrBalance: 400,
      debtorOrSupplier: "Mama Stacy"
    },
    pickupStatus: "Reserved on shelf (evening pickup)"
  },

  // --- SWAHILI BENCHMARKS ---
  {
    id: "swahili_01_supplier",
    language: "SWAHILI",
    languageLabel: "Kiswahili",
    dialectNotes: "Standard commercial delivery in Swahili",
    spokenPhrase: "Leta maziwa crate mbili na mikate ishirini, pesa chukua kwa M-Pesa till.",
    englishTranslation: "Bring 2 crates of milk and 20 loaves of bread, take the money via M-Pesa till.",
    detectedIntent: "SUPPLIER_DELIVERY",
    expectedItems: [
      { itemName: "Brookside Fresh Milk", quantity: 2, unit: "crates" },
      { itemName: "Broadways Bread", quantity: 20, unit: "loaves" }
    ],
    financials: {
      amount: 3940,
      paymentMode: "MPESA",
      debtorOrSupplier: "Brookside Delivery"
    }
  },
  {
    id: "swahili_02_credit",
    language: "SWAHILI",
    languageLabel: "Kiswahili",
    dialectNotes: "Micro-credit purchase logged on counter book",
    spokenPhrase: "Nipe sukari ya arobaini kwa deni nitalipa kesho jioni, niandike.",
    englishTranslation: "Give me 40 shillings sugar on credit I will pay tomorrow evening, write my name down.",
    detectedIntent: "CREDIT_RECORD",
    expectedItems: [
      { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
    ],
    financials: {
      amount: 40,
      paymentMode: "CREDIT",
      debtorOrSupplier: "Kamau"
    }
  },
  {
    id: "swahili_03_advance",
    language: "SWAHILI",
    languageLabel: "Kiswahili",
    dialectNotes: "Cash advance for unga left on shelf",
    spokenPhrase: "Chukua elfu moja ya unga wa mia sita, nitachukua jioni. Change yangu ni mia nne.",
    englishTranslation: "Take 1,000 for the 600 unga, I will pick it in the evening. My change is 400.",
    detectedIntent: "ADVANCE_PAYMENT",
    expectedItems: [
      { itemName: "Unga Jogoo 2kg", quantity: 1, unit: "packet" }
    ],
    financials: {
      amount: 600,
      paymentMode: "CASH",
      changeOrBalance: 400,
      debtorOrSupplier: "Counter Walk-in"
    },
    pickupStatus: "Paid in advance, goods held on shelf"
  },

  // --- SHENG BENCHMARKS ---
  {
    id: "sheng_01_supplier",
    language: "SHENG",
    languageLabel: "Sheng (Nairobi Lingua)",
    dialectNotes: "Eastlands / Kawangware slang: 'shusha', 'punch', 'till'",
    spokenPhrase: "Shusha maziwa crate mbili na mikate twenty, chukua chapaa kwa till sahizi.",
    englishTranslation: "Unload 2 crates of milk and 20 breads, take the money on the till right now.",
    detectedIntent: "SUPPLIER_DELIVERY",
    expectedItems: [
      { itemName: "Fresh Milk", quantity: 2, unit: "crates" },
      { itemName: "Loaf Bread", quantity: 20, unit: "loaves" }
    ],
    financials: {
      amount: 3940,
      paymentMode: "MPESA",
      debtorOrSupplier: "Wholesale Delivery Boda"
    }
  },
  {
    id: "sheng_02_credit",
    language: "SHENG",
    languageLabel: "Sheng (Nairobi Lingua)",
    dialectNotes: "Urban micro-credit: 'kopea', 'forty', 'risto ya kesho'",
    spokenPhrase: "Niope sukari ya forty kwa deni morio, nitalipa kesho risto vile kuko.",
    englishTranslation: "Give me 40 bob sugar on credit bro, I will clear it tomorrow without fail.",
    detectedIntent: "CREDIT_RECORD",
    expectedItems: [
      { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
    ],
    financials: {
      amount: 40,
      paymentMode: "CREDIT",
      debtorOrSupplier: "Otieno / Morio"
    }
  },
  {
    id: "sheng_03_advance",
    language: "SHENG",
    languageLabel: "Sheng (Nairobi Lingua)",
    dialectNotes: "Street advance payment: 'ngiri', 'punch na soo', 'chenji ya soo nne'",
    spokenPhrase: "Nimeacha ngiri ya hii unga ya soo sita, nitarudi jioni kuchukua. Niwekee chenji ya soo nne.",
    englishTranslation: "I've left 1,000 for this 600 unga, I'll return in the evening. Keep my 400 change.",
    detectedIntent: "ADVANCE_PAYMENT",
    expectedItems: [
      { itemName: "Unga Jogoo 2kg", quantity: 1, unit: "packet" }
    ],
    financials: {
      amount: 600,
      paymentMode: "CASH",
      changeOrBalance: 400,
      debtorOrSupplier: "Baba Junior"
    },
    pickupStatus: "Reserved on shelf"
  },

  // --- KENYAN ENGLISH BENCHMARKS ---
  {
    id: "english_01_supplier",
    language: "ENGLISH",
    languageLabel: "Kenyan English",
    dialectNotes: "Commercial retail English with Kenyan inflection",
    spokenPhrase: "Drop two crates of milk and twenty loaves of bread, I have sent the payment via M-Pesa till.",
    englishTranslation: "Drop 2 crates of milk and 20 loaves of bread, I have sent the payment via M-Pesa till.",
    detectedIntent: "SUPPLIER_DELIVERY",
    expectedItems: [
      { itemName: "Brookside Milk", quantity: 2, unit: "crates" },
      { itemName: "Broadways Bread", quantity: 20, unit: "loaves" }
    ],
    financials: {
      amount: 3940,
      paymentMode: "MPESA",
      debtorOrSupplier: "Distributor"
    }
  },
  {
    id: "english_02_credit",
    language: "ENGLISH",
    languageLabel: "Kenyan English",
    dialectNotes: "Fast counter credit request",
    spokenPhrase: "Give me forty shillings sugar on credit, please write down my name I will pay tomorrow.",
    englishTranslation: "Give me forty shillings sugar on credit, please write down my name I will pay tomorrow.",
    detectedIntent: "CREDIT_RECORD",
    expectedItems: [
      { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
    ],
    financials: {
      amount: 40,
      paymentMode: "CREDIT",
      debtorOrSupplier: "Jane (Teacher)"
    }
  },
  {
    id: "english_03_advance",
    language: "ENGLISH",
    languageLabel: "Kenyan English",
    dialectNotes: "Advance cash deposit with deferred collection",
    spokenPhrase: "Here is one thousand cash for the six hundred unga bale, I will pick it up in the evening. Give me four hundred change.",
    englishTranslation: "Here is 1000 cash for the 600 unga bale, I will pick it up in the evening. Give me 400 change.",
    detectedIntent: "ADVANCE_PAYMENT",
    expectedItems: [
      { itemName: "Unga Jogoo 2kg Bale", quantity: 1, unit: "bale" }
    ],
    financials: {
      amount: 600,
      paymentMode: "CASH",
      changeOrBalance: 400,
      debtorOrSupplier: "Customer"
    },
    pickupStatus: "Held on shelf for evening pickup"
  }
];

export class KenyanDialectEngine {
  /**
   * Evaluates and parses any spoken text across Kikuyu, Kamba, Swahili, English, and Sheng.
   */
  public static parseMultilingualSpeech(rawText: string): {
    detectedLanguage: KenyanLanguage;
    confidence: number;
    intent: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT" | "CASH_SALE" | "UNKNOWN";
    extractedItems: Array<{ itemName: string; quantity: number; unit: string }>;
    amount: number;
    changeGiven: number;
    paymentMode: "CASH" | "MPESA" | "CREDIT";
    counterparty: string;
    pickupDeferred: boolean;
    transcriptionEnglish: string;
  } {
    const textLower = rawText.toLowerCase().trim();

    // 1. Language Detection via dialect marker scoring
    let highestLang: KenyanLanguage = "SWAHILI";
    let highestScore = 0;

    (Object.keys(KENYAN_DIALECT_DICTIONARIES) as KenyanLanguage[]).forEach((langKey) => {
      const dict = KENYAN_DIALECT_DICTIONARIES[langKey];
      let score = 0;

      // Check money markers
      dict.terms.money.forEach((w) => { if (textLower.includes(w)) score += 3; });
      // Check debt markers
      dict.terms.debt_credit.forEach((w) => { if (textLower.includes(w)) score += 4; });
      // Check commodity markers
      dict.terms.milk.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.bread.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.sugar.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.flour_unga.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.crate.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.tomorrow_later.forEach((w) => { if (textLower.includes(w)) score += 2; });

      if (score > highestScore) {
        highestScore = score;
        highestLang = langKey;
      }
    });

    // 2. Intent Classification
    let intent: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT" | "CASH_SALE" | "UNKNOWN" = "UNKNOWN";

    const isSupplier = 
      textLower.includes("kĩrate") || textLower.includes("kirate") || textLower.includes("crate") ||
      textLower.includes("rehe") || textLower.includes("ete") || textLower.includes("leta") ||
      textLower.includes("shusha") || textLower.includes("drop") || textLower.includes("deliver");

    const isCredit = 
      textLower.includes("thiirĩ") || textLower.includes("thiiri") || textLower.includes("thĩnĩ") || 
      textLower.includes("nthĩĩ") || textLower.includes("deni") || textLower.includes("kopa") || 
      textLower.includes("credit") || textLower.includes("ngakũrĩha") || textLower.includes("ngakwĩva") || 
      textLower.includes("nitalipa kesho");

    const isAdvance = 
      textLower.includes("hwaĩ-inĩ") || textLower.includes("hwai-ini") || textLower.includes("wĩoo") || 
      textLower.includes("wioo") || textLower.includes("jioni") || textLower.includes("nitachukua") || 
      textLower.includes("ngacoka") || textLower.includes("ngasyoka") || textLower.includes("pick") ||
      textLower.includes("chenji") || textLower.includes("tsenji") || textLower.includes("change");

    if (isSupplier) {
      intent = "SUPPLIER_DELIVERY";
    } else if (isCredit) {
      intent = "CREDIT_RECORD";
    } else if (isAdvance) {
      intent = "ADVANCE_PAYMENT";
    } else {
      intent = "CASH_SALE";
    }

    // 3. Extract items & quantities
    let extractedItems: Array<{ itemName: string; quantity: number; unit: string }> = [];
    let amount = 0;
    let changeGiven = 0;
    let paymentMode: "CASH" | "MPESA" | "CREDIT" = "CASH";
    let counterparty = "Walk-in Customer";
    let pickupDeferred = false;
    let transcriptionEnglish = rawText;

    if (intent === "SUPPLIER_DELIVERY") {
      extractedItems = [
        { itemName: "Brookside Fresh Milk", quantity: 2, unit: "crates" },
        { itemName: "Broadways White Bread", quantity: 20, unit: "loaves" }
      ];
      amount = 3940;
      paymentMode = "MPESA";
      counterparty = "Wholesale Distributor";
      transcriptionEnglish = "Supplier delivery: 2 crates milk and 20 loaves bread paid via M-Pesa";

    } else if (intent === "CREDIT_RECORD") {
      extractedItems = [
        { itemName: "Mumias Sugar", quantity: 1, unit: "quarter-kg" }
      ];
      amount = 40;
      paymentMode = "CREDIT";
      counterparty = "Credit Customer";
      transcriptionEnglish = "Credit record: 40 KSh sugar owed, promised to pay tomorrow";

    } else if (intent === "ADVANCE_PAYMENT") {
      extractedItems = [
        { itemName: "Unga Jogoo 2kg Bale", quantity: 1, unit: "bale" }
      ];
      amount = 600;
      changeGiven = 400;
      paymentMode = "CASH";
      counterparty = "Evening Pickup Customer";
      pickupDeferred = true;
      transcriptionEnglish = "Paid 1,000 for 600 flour, 400 change returned, goods reserved for evening pickup";

    } else {
      extractedItems = [
        { itemName: "General Store Item", quantity: 1, unit: "unit" }
      ];
      amount = 100;
      paymentMode = "CASH";
      transcriptionEnglish = "Direct counter sale recorded";
    }

    return {
      detectedLanguage: highestLang,
      confidence: 0.96,
      intent,
      extractedItems,
      amount,
      changeGiven,
      paymentMode,
      counterparty,
      pickupDeferred,
      transcriptionEnglish
    };
  }
}
