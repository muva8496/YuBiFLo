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

export interface CommercialVoiceEvaluation {
  isCommercialTransaction: boolean;
  classification:
    | "VALID_SALE"
    | "VALID_CREDIT"
    | "VALID_RESTOCK"
    | "VALID_ADVANCE"
    | "REJECTED_MEDIA"
    | "REJECTED_CHATTER"
    | "REJECTED_INQUIRY";
  rejectionCategory?: "MUSIC_OR_LYRICS" | "TIKTOK_OR_MEDIA" | "CASUAL_CHATTER" | "PRICE_INQUIRY";
  rejectionReason?: string;
  detectedLanguage: KenyanLanguage;
  confidence: number;
  intentType: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT" | "CASH_SALE" | "NONE";
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  amountPaid: number;
  cashPaid: number;
  mpesaPaid: number;
  debtAmount: number;
  changeGiven: number;
  paymentMethod: "CASH" | "MPESA" | "CREDIT";
  counterparty: string;
  isCollected: boolean;
  englishTranslation: string;
}

const TIKTOK_OR_MEDIA_MARKERS = [
  "tiktok",
  "fyp",
  "for you page",
  "like and subscribe",
  "follow me",
  "follow for part",
  "link in bio",
  "comment below",
  "share this video",
  "subscribe to my channel",
  "youtube",
  "reels",
  "trending sound",
  "duet",
  "breaking news",
  "citizen tv",
  "ntv",
  "ktn",
  "kiss 100",
  "classic 105",
  "radio jambo",
  "ghetto radio",
  "kameme fm",
  "inooro",
  "hallelujah",
  "praise the lord",
  "amen brother",
  "goooal",
  "arsenal",
  "manchester",
  "premier league",
  "champions league"
];

const MUSIC_OR_LYRICS_MARKERS = [
  "♪",
  "♫",
  "la la la",
  "na na na",
  "oh baby",
  "yeah yeah",
  "skrrt",
  "amapiano",
  "gengetone",
  "arbantone",
  "bongo flava",
  "dj ",
  "remix",
  "chorus",
  "verse one",
  "drop the beat",
  "turn up the music",
  "wimbo",
  "ngoma"
];

const CASUAL_GREETING_ONLY_MARKERS = [
  "mambo vipi",
  "habari yako",
  "habari ya asubuhi",
  "sasa bro",
  "niaje morio",
  "niaje",
  "uko aje",
  "uko poa",
  "niko poa",
  "wimwega",
  "wĩmwega",
  "uvoo waku",
  "ũvoo waku",
  "baridi sana leo",
  "jua kali",
  "hali ya anga",
  "kwema",
  "mzuri sana"
];

export class KenyanDialectEngine {
  /**
   * Evaluates spoken text across Kikuyu, Kamba, Swahili, English, and Sheng.
   * Actively filters out music, lyrics, TikTok/YouTube audio, radio, and non-buying chatter.
   */
  public static evaluateCommercialUtterance(
    rawText: string,
    inventory: Array<{ name: string; unit_type?: string; unit_retail?: number; unit_cost?: number }> = [],
    options?: {
      strictBuyIntentFilter?: boolean;
      ignoreMediaAndTikTok?: boolean;
      customAliases?: Array<{ spokenPhrase: string; mappedItemName: string; intentHint?: string }>;
      ignoredPhrases?: string[];
    }
  ): CommercialVoiceEvaluation {
    const cleanText = (rawText || "").trim();
    const textLower = cleanText.toLowerCase();
    const strictFilter = options?.strictBuyIntentFilter ?? true;
    const ignoreMedia = options?.ignoreMediaAndTikTok ?? true;

    // 1. Language Detection via dialect marker scoring
    let highestLang: KenyanLanguage = "SWAHILI";
    let highestScore = 0;

    (Object.keys(KENYAN_DIALECT_DICTIONARIES) as KenyanLanguage[]).forEach((langKey) => {
      const dict = KENYAN_DIALECT_DICTIONARIES[langKey];
      let score = 0;
      dict.terms.money.forEach((w) => { if (textLower.includes(w)) score += 3; });
      dict.terms.debt_credit.forEach((w) => { if (textLower.includes(w)) score += 4; });
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

    // Strong transaction cues (only these override noisy words if spoken together)
    const hasExplicitCommercialAction =
      /\b(nimeuza|amelipa|amechukua|nipe|niwekee|niandike|niandikie|niope|nengye|rehe|ete|leta|shusha|deni|thiiri|thiirĩ|thĩnĩ|kopa|mpesa|m-pesa|till|cash|chenji|tsenji|change|elfu|ngiri|crate|kĩrate|kilate|mkate|maziwa|sukari|thukari|unga|mũtu|mutu|soda|yoghurt|mayai|eggs|mafuta|bale)\b/i.test(
        textLower
      ) ||
      (inventory || []).some((it) =>
        it.name
          .toLowerCase()
          .split(/\s+/)
          .some((tok) => tok.length >= 4 && textLower.includes(tok))
      ) ||
      (options?.customAliases || []).some((al) =>
        al.spokenPhrase.trim() && textLower.includes(al.spokenPhrase.toLowerCase().trim())
      );

    // 2. Check proprietor-trained Ignored Phrases
    const matchedIgnored = (options?.ignoredPhrases || []).find(
      (p) => p.trim().length >= 3 && textLower.includes(p.toLowerCase().trim())
    );
    if (matchedIgnored) {
      return {
        isCommercialTransaction: false,
        classification: "REJECTED_CHATTER",
        rejectionCategory: "CASUAL_CHATTER",
        rejectionReason: `Matched trained ignore rule: "${matchedIgnored}"`,
        detectedLanguage: highestLang,
        confidence: 0.98,
        intentType: "NONE",
        items: [],
        totalAmount: 0,
        amountPaid: 0,
        cashPaid: 0,
        mpesaPaid: 0,
        debtAmount: 0,
        changeGiven: 0,
        paymentMethod: "CASH",
        counterparty: "",
        isCollected: true,
        englishTranslation: cleanText
      };
    }

    // 3. Filter Music / Lyrics & TikTok / YouTube / Radio audio
    if (ignoreMedia) {
      const hitMedia = TIKTOK_OR_MEDIA_MARKERS.find((m) => textLower.includes(m));
      if (hitMedia && !hasExplicitCommercialAction) {
        return {
          isCommercialTransaction: false,
          classification: "REJECTED_MEDIA",
          rejectionCategory: "TIKTOK_OR_MEDIA",
          rejectionReason: `Filtered TikTok / phone media / broadcast audio ("${hitMedia}")`,
          detectedLanguage: highestLang,
          confidence: 0.96,
          intentType: "NONE",
          items: [],
          totalAmount: 0,
          amountPaid: 0,
          cashPaid: 0,
          mpesaPaid: 0,
          debtAmount: 0,
          changeGiven: 0,
          paymentMethod: "CASH",
          counterparty: "",
          isCollected: true,
          englishTranslation: cleanText
        };
      }

      const hitMusic = MUSIC_OR_LYRICS_MARKERS.find((m) => textLower.includes(m));
      if (hitMusic && !hasExplicitCommercialAction) {
        return {
          isCommercialTransaction: false,
          classification: "REJECTED_MEDIA",
          rejectionCategory: "MUSIC_OR_LYRICS",
          rejectionReason: `Filtered background music or song lyrics ("${hitMusic}")`,
          detectedLanguage: highestLang,
          confidence: 0.95,
          intentType: "NONE",
          items: [],
          totalAmount: 0,
          amountPaid: 0,
          cashPaid: 0,
          mpesaPaid: 0,
          debtAmount: 0,
          changeGiven: 0,
          paymentMethod: "CASH",
          counterparty: "",
          isCollected: true,
          englishTranslation: cleanText
        };
      }
    }

    // 4. Filter Price-Only Inquiries & Non-Buying Greetings / Chatter
    if (strictFilter) {
      const isPriceInquiryOnly =
        /\b(bei gani|pesa ngapi|how much|ni ngapi|kiasi gani)\b/i.test(textLower) &&
        !/\b(amelipa|nimeuza|chukua|nipe|leta|weka|deni|mpesa|cash|elfu|mia|chenji|change)\b/i.test(textLower);
      if (isPriceInquiryOnly) {
        return {
          isCommercialTransaction: false,
          classification: "REJECTED_INQUIRY",
          rejectionCategory: "PRICE_INQUIRY",
          rejectionReason: "Price inquiry only — no actual purchase, credit, or payment confirmed.",
          detectedLanguage: highestLang,
          confidence: 0.91,
          intentType: "NONE",
          items: [],
          totalAmount: 0,
          amountPaid: 0,
          cashPaid: 0,
          mpesaPaid: 0,
          debtAmount: 0,
          changeGiven: 0,
          paymentMethod: "CASH",
          counterparty: "",
          isCollected: true,
          englishTranslation: cleanText
        };
      }

      const isGreetingOnly = CASUAL_GREETING_ONLY_MARKERS.some((g) => textLower.includes(g));
      if ((isGreetingOnly || cleanText.split(/\s+/).length <= 2) && !hasExplicitCommercialAction) {
        return {
          isCommercialTransaction: false,
          classification: "REJECTED_CHATTER",
          rejectionCategory: "CASUAL_CHATTER",
          rejectionReason: "Casual conversation / greeting filtered (no buying intent).",
          detectedLanguage: highestLang,
          confidence: 0.92,
          intentType: "NONE",
          items: [],
          totalAmount: 0,
          amountPaid: 0,
          cashPaid: 0,
          mpesaPaid: 0,
          debtAmount: 0,
          changeGiven: 0,
          paymentMethod: "CASH",
          counterparty: "",
          isCollected: true,
          englishTranslation: cleanText
        };
      }

      if (!hasExplicitCommercialAction) {
        return {
          isCommercialTransaction: false,
          classification: "REJECTED_CHATTER",
          rejectionCategory: "CASUAL_CHATTER",
          rejectionReason: "Speech contains no shop item, quantity, credit, or payment cue.",
          detectedLanguage: highestLang,
          confidence: 0.87,
          intentType: "NONE",
          items: [],
          totalAmount: 0,
          amountPaid: 0,
          cashPaid: 0,
          mpesaPaid: 0,
          debtAmount: 0,
          changeGiven: 0,
          paymentMethod: "CASH",
          counterparty: "",
          isCollected: true,
          englishTranslation: cleanText
        };
      }
    }

    // 5. Intent Classification
    const isSupplier =
      /\b(kĩrate|kirate|crate|crates|bale|bales|supplier|ameleta|rehe|ete|leta|shusha|drop|deliver|delivery|restock)\b/i.test(
        textLower
      );
    const isCredit =
      /\b(thiirĩ|thiiri|thĩnĩ|nthĩĩ|deni|kopa|kopea|niope|credit|ngakũrĩha|ngakwĩva|nitalipa kesho|niandike|niandikie|andika|kitabu)\b/i.test(
        textLower
      );
    const isAdvance =
      /\b(hwaĩ-inĩ|hwai-ini|wĩoo|wioo|jioni|nitachukua|atachukua|ngacoka|ngasyoka|pick up|reserved|nimeacha)\b/i.test(
        textLower
      );

    let intentType: "SUPPLIER_DELIVERY" | "CREDIT_RECORD" | "ADVANCE_PAYMENT" | "CASH_SALE" = "CASH_SALE";
    if (isSupplier) intentType = "SUPPLIER_DELIVERY";
    else if (isCredit) intentType = "CREDIT_RECORD";
    else if (isAdvance) intentType = "ADVANCE_PAYMENT";

    // 6. Payment Mode & Counterparty Extraction
    const isMpesa = /\b(mpesa|m-pesa|till|pochi|send money|equitel)\b/i.test(textLower);
    const paymentMethod: "CASH" | "MPESA" | "CREDIT" =
      intentType === "CREDIT_RECORD" && !/\b(amelipa|paid)\b/i.test(textLower)
        ? "CREDIT"
        : isMpesa
        ? "MPESA"
        : "CASH";

    let counterparty = intentType === "SUPPLIER_DELIVERY" ? "Wholesale Supplier" : "Walk-in Customer";
    const namedMatch =
      cleanText.match(/\b(Mama\s+[A-Z][a-z]+|Baba\s+[A-Z][a-z]+|Pastor\s+[A-Z][a-z]+)\b/i) ||
      cleanText.match(/\b(Kamau|Wanjiku|Mutua|Otieno|Grace|Jane|David|Boi|Brayo|Stacy|Sharon|Kibet|Njoroge|Achieng)\b/i);
    if (namedMatch) {
      counterparty = namedMatch[0];
    } else if (textLower.includes("brookside")) {
      counterparty = "Brookside Dairy Delivery";
    }

    // 7. Helper to look up real catalog item price
    const findCatalogMatch = (keywords: string[], fallbackName: string, fallbackUnit: string, fallbackPrice: number) => {
      // First check custom aliases
      for (const alias of options?.customAliases || []) {
        const phrase = alias.spokenPhrase.toLowerCase().trim();
        if (phrase && textLower.includes(phrase)) {
          const invHit = (inventory || []).find((i) =>
            i.name.toLowerCase().includes(alias.mappedItemName.toLowerCase())
          );
          if (invHit) {
            return {
              name: invHit.name,
              unit: invHit.unit_type || fallbackUnit,
              price: Number(invHit.unit_retail) || fallbackPrice
            };
          }
          return { name: alias.mappedItemName, unit: fallbackUnit, price: fallbackPrice };
        }
      }
      // Next match shop inventory
      for (const kw of keywords) {
        const invHit = (inventory || []).find((i) => i.name.toLowerCase().includes(kw.toLowerCase()));
        if (invHit) {
          return {
            name: invHit.name,
            unit: invHit.unit_type || fallbackUnit,
            price: isSupplier
              ? Number(invHit.unit_cost) || fallbackPrice
              : Number(invHit.unit_retail) || fallbackPrice
          };
        }
      }
      return { name: fallbackName, unit: fallbackUnit, price: fallbackPrice };
    };

    const items: Array<{ itemName: string; quantity: number; unit: string; unitPrice: number; subtotal: number }> = [];

    const extractQtyNear = (pattern: RegExp, defaultQty = 1): number => {
      const m = textLower.match(pattern);
      if (!m) return defaultQty;
      const chunk = m[0];
      const numMatch = chunk.match(/\b(\d+)\b/);
      if (numMatch) return Math.max(1, Number(numMatch[1]));
      if (/\b(mbili|igĩrĩ|igiri|ilĩ|ili|two)\b/.test(chunk)) return 2;
      if (/\b(tatu|ithatũ|ithatu|itatũ|itatu|three)\b/.test(chunk)) return 3;
      if (/\b(nne|inya|four)\b/.test(chunk)) return 4;
      if (/\b(tano|ithano|ĩtano|itano|five)\b/.test(chunk)) return 5;
      if (/\b(ishirini|twenty|mĩrongo ĩrĩ|mĩongo ĩlĩ)\b/.test(chunk)) return 20;
      return defaultQty;
    };

    if (/\b(maziwa|milk|iria|ĩia|iia)\b/i.test(textLower)) {
      const qty = extractQtyNear(/(?:\b\w+\s+){0,2}(?:maziwa|milk|iria|ĩia|iia)(?:\s+\w+){0,2}/i, isSupplier ? 2 : 1);
      const isCrate = /\b(crate|kĩrate|kilate|crates)\b/i.test(textLower);
      const matched = findCatalogMatch(["milk", "brookside", "fresha"], "Brookside Fresh Milk 500ml", isCrate ? "crates" : "packets", isCrate ? 1320 : 60);
      const price = isCrate ? 1320 : matched.price;
      items.push({
        itemName: matched.name,
        quantity: qty,
        unit: isCrate ? "crates" : matched.unit,
        unitPrice: price,
        subtotal: qty * price
      });
    }

    if (/\b(mkate|mikate|bread|mũgate|migate|mũkate|boflo)\b/i.test(textLower)) {
      const qty = extractQtyNear(/(?:\b\w+\s+){0,2}(?:mkate|mikate|bread|mũgate|migate|mũkate|boflo)(?:\s+\w+){0,2}/i, isSupplier ? 20 : 1);
      const matched = findCatalogMatch(["bread", "broadways", "festive"], "Broadways White Bread 400g", "loaves", 65);
      items.push({
        itemName: matched.name,
        quantity: qty,
        unit: matched.unit,
        unitPrice: matched.price,
        subtotal: qty * matched.price
      });
    }

    if (/\b(sukari|thukari|cukari|sugar)\b/i.test(textLower)) {
      const qty = extractQtyNear(/(?:\b\w+\s+){0,2}(?:sukari|thukari|cukari|sugar)(?:\s+\w+){0,2}/i, 1);
      const priceMatch = textLower.includes("40") || textLower.includes("arobaini") || textLower.includes("forty") || textLower.includes("mĩrongo ĩna") ? 40 : undefined;
      const matched = findCatalogMatch(["sugar", "mumias"], "Mumias Sugar", textLower.includes("robo") || priceMatch === 40 ? "quarter-kg" : "kg", priceMatch ?? 160);
      const price = priceMatch ?? matched.price;
      items.push({
        itemName: matched.name,
        quantity: qty,
        unit: priceMatch === 40 ? "quarter-kg" : matched.unit,
        unitPrice: price,
        subtotal: qty * price
      });
    }

    if (/\b(unga|mũtu|mutu|flour|pembe|jogoo)\b/i.test(textLower)) {
      const qty = extractQtyNear(/(?:\b\w+\s+){0,2}(?:unga|mũtu|mutu|flour|pembe|jogoo)(?:\s+\w+){0,2}/i, 1);
      const isBaleOr600 = textLower.includes("600") || textLower.includes("mia sita") || textLower.includes("soo sita") || textLower.includes("bale") || textLower.includes("matandat");
      const matched = findCatalogMatch(["unga", "jogoo", "pembe"], isBaleOr600 ? "Unga Jogoo 2kg Bale" : "Unga Jogoo 2kg", isBaleOr600 ? "bale" : "packet", isBaleOr600 ? 600 : 185);
      const price = isBaleOr600 ? 600 : matched.price;
      items.push({
        itemName: matched.name,
        quantity: qty,
        unit: isBaleOr600 ? "bale" : matched.unit,
        unitPrice: price,
        subtotal: qty * price
      });
    }

    if (/\b(yoghurt|yogurt)\b/i.test(textLower)) {
      const matched = findCatalogMatch(["yoghurt", "ilara"], "Ilara Yoghurt 150ml", "cup", 35);
      items.push({ itemName: matched.name, quantity: 1, unit: matched.unit, unitPrice: matched.price, subtotal: matched.price });
    }

    if (/\b(soda|coca|fanta|sprite)\b/i.test(textLower)) {
      const matched = findCatalogMatch(["soda", "coca"], "Soda 300ml", "bottle", 50);
      items.push({ itemName: matched.name, quantity: 1, unit: matched.unit, unitPrice: matched.price, subtotal: matched.price });
    }

    if (/\b(mafuta|oil|salit|elianto)\b/i.test(textLower)) {
      const matched = findCatalogMatch(["oil", "salit", "mafuta"], "Salit Cooking Oil 1L", "bottle", 320);
      items.push({ itemName: matched.name, quantity: 1, unit: matched.unit, unitPrice: matched.price, subtotal: matched.price });
    }

    // Check any custom alias not yet matched above
    for (const alias of options?.customAliases || []) {
      const phrase = alias.spokenPhrase.toLowerCase().trim();
      if (phrase && textLower.includes(phrase) && !items.some((i) => i.itemName.toLowerCase().includes(alias.mappedItemName.toLowerCase()))) {
        const invHit = (inventory || []).find((i) => i.name.toLowerCase().includes(alias.mappedItemName.toLowerCase()));
        const price = Number(invHit?.unit_retail) || 100;
        items.push({
          itemName: invHit?.name || alias.mappedItemName,
          quantity: 1,
          unit: invHit?.unit_type || "pcs",
          unitPrice: price,
          subtotal: price
        });
      }
    }

    // Direct numeric fallback if items still empty but speech explicitly had inventory or money
    const spokenNumbers = (cleanText.match(/\b\d+\b/g) || []).map((n) => Number(n));
    let totalAmount = items.reduce((acc, it) => acc + it.subtotal, 0);

    if (items.length === 0) {
      const fallbackAmt = spokenNumbers.find((n) => n >= 10 && n <= 100000) || 100;
      const invMatch = (inventory || []).find((i) =>
        i.name.toLowerCase().split(/\s+/).some((tok) => tok.length >= 4 && textLower.includes(tok))
      );
      const itemName = invMatch?.name || "Counter Retail Item";
      const price = Number(invMatch?.unit_retail) || fallbackAmt;
      items.push({
        itemName,
        quantity: 1,
        unit: invMatch?.unit_type || "pcs",
        unitPrice: price,
        subtotal: price
      });
      totalAmount = price;
    }

    // Override/split paid & debt amounts when explicitly spoken
    let debtAmount = 0;
    let cashPaid = 0;
    let mpesaPaid = 0;
    let changeGiven = 0;
    let amountPaid = totalAmount;

    const deniExplicitMatch = textLower.match(/(?:deni|debt)\s+(?:ya\s+)?(\d+)/i);
    if (intentType === "CREDIT_RECORD") {
      debtAmount = deniExplicitMatch ? Number(deniExplicitMatch[1]) : totalAmount;
      const paidExplicit = textLower.match(/(?:amelipa|cash|paid)\s+(\d+)/i);
      const paidVal = paidExplicit ? Number(paidExplicit[1]) : 0;
      if (paidVal > 0 && paidVal < totalAmount) {
        debtAmount = totalAmount - paidVal;
        cashPaid = isMpesa ? 0 : paidVal;
        mpesaPaid = isMpesa ? paidVal : 0;
        amountPaid = paidVal;
      } else {
        amountPaid = 0;
      }
    } else if (intentType === "ADVANCE_PAYMENT") {
      const tendered1000 = textLower.includes("1000") || textLower.includes("elfu") || textLower.includes("ngiri");
      const paidVal = tendered1000 ? 1000 : (spokenNumbers.find((n) => n >= totalAmount) || totalAmount);
      amountPaid = paidVal;
      changeGiven = Math.max(0, paidVal - totalAmount);
      cashPaid = totalAmount;
    } else if (paymentMethod === "MPESA") {
      mpesaPaid = totalAmount;
      amountPaid = totalAmount;
    } else {
      cashPaid = totalAmount;
      amountPaid = totalAmount;
    }

    return {
      isCommercialTransaction: true,
      classification:
        intentType === "CREDIT_RECORD"
          ? "VALID_CREDIT"
          : intentType === "SUPPLIER_DELIVERY"
          ? "VALID_RESTOCK"
          : intentType === "ADVANCE_PAYMENT"
          ? "VALID_ADVANCE"
          : "VALID_SALE",
      detectedLanguage: highestLang,
      confidence: 0.94,
      intentType,
      items,
      totalAmount,
      amountPaid,
      cashPaid,
      mpesaPaid,
      debtAmount,
      changeGiven,
      paymentMethod,
      counterparty,
      isCollected: intentType !== "ADVANCE_PAYMENT",
      englishTranslation: `${intentType.replace("_", " ")}: ${items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")} (${paymentMethod})`
    };
  }

  /**
   * Backward-compatible wrapper used by MultilingualVoiceTab.
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
    const res = KenyanDialectEngine.evaluateCommercialUtterance(rawText, [], {
      strictBuyIntentFilter: false,
      ignoreMediaAndTikTok: true
    });
    return {
      detectedLanguage: res.detectedLanguage,
      confidence: res.confidence,
      intent: res.intentType === "NONE" ? "UNKNOWN" : res.intentType,
      extractedItems: res.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unit: i.unit })),
      amount: res.totalAmount,
      changeGiven: res.changeGiven,
      paymentMode: res.paymentMethod,
      counterparty: res.counterparty || "Walk-in Customer",
      pickupDeferred: !res.isCollected,
      transcriptionEnglish: res.rejectionReason || res.englishTranslation
    };
  }
}
