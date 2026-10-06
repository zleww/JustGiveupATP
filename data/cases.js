/* ==========================================================
   JurisCards Arena — Case Docket (Monsters & Bosses, PRD §5)

   Each case is a legal problem the player must "defeat" by establishing its elements.

   Element fields:
     label        what must be established (shown after Element Check or once established)
     counters     RA numbers that legally establish this element (must exist in the codex)
     resolvedBy   instead of counters: "clarify" (Request Clarification) or "elementCheck"
     requiresFact index into hiddenFacts — element stays sealed until that fact is uncovered
     basis        statutory citation shown to the player once the element is established

   STATUTORY ACCURACY INVARIANT (PRD §9): every `counters` entry and `basis` must reflect
   the actual statute. When adding a case, cite the section and accept every RA in the codex
   that genuinely covers the element (e.g. RA 9485 as amended by RA 11032).
   Educational content only — not legal advice.
   ========================================================== */
(function (global) {
  "use strict";

  const TIERS = {
    1: { name: "Infraction", label: "Tier 1 · Infractions", attack: 10 },
    2: { name: "Violation", label: "Tier 2 · Violations", attack: 16 },
    3: { name: "Boss", label: "Tier 3 · Boss Litigation", attack: 22 },
  };

  const CASES = [
    // ------------------------------------------------------
    // TIER 1 — Minor Infractions & Procedural Flaws (50–60 HP, 2 elements)
    // ------------------------------------------------------
    {
      id: "bureaucratic-delay",
      tier: 1,
      name: "The Bureaucratic Delay",
      sigil: "⌛",
      hp: 55,
      digital: false,
      docket: "Ana filed a complete application for a barangay business clearance at her municipal hall. Ten working days later there is still no action and no written notice.",
      facts: [
        "The application was complete when filed; Ana holds the stamped receiving copy.",
        "The office has not issued an approval, a denial, or any written explanation.",
      ],
      hiddenFacts: [
        "The office's posted Citizen's Charter classifies the clearance as a simple transaction: 3 working days.",
      ],
      elements: [
        {
          label: "A complete application for a simple government transaction was filed",
          counters: ["RA 11032", "RA 9485"],
          basis: "RA 11032 (amending RA 9485), Sec. 9: simple transactions must be acted on within 3 working days.",
        },
        {
          label: "The prescribed processing time in the Citizen's Charter has lapsed",
          resolvedBy: "clarify",
          basis: "The Citizen's Charter (RA 11032, Sec. 6) fixes the processing time the office is bound by.",
        },
      ],
    },
    {
      id: "missing-fact",
      tier: 1,
      name: "The Missing Fact",
      sigil: "❔",
      hp: 50,
      digital: false,
      docket: "A pharmacy refused to give Lola Remy the 20% discount on her maintenance medicines. The cashier says she \"doesn't look old enough\".",
      facts: [
        "The medicines are prescribed maintenance drugs for Lola Remy's own use.",
        "The cashier charged the full price, including VAT.",
      ],
      hiddenFacts: [
        "Lola Remy presented her OSCA ID showing she is 67 years old.",
      ],
      elements: [
        {
          label: "The buyer is a senior citizen (60 or older) with valid proof of age",
          resolvedBy: "clarify",
          basis: "RA 9994 covers resident Filipino citizens at least 60 years old; an OSCA ID is valid proof.",
        },
        {
          label: "The 20% discount and VAT exemption were denied on medicines for the senior's own use",
          counters: ["RA 9994"],
          basis: "RA 9994, Sec. 4(a): 20% discount and VAT exemption on medicines for the exclusive use of senior citizens.",
        },
      ],
    },
    {
      id: "wrong-jurisdiction",
      tier: 1,
      name: "Wrong Jurisdiction",
      sigil: "⚑",
      hp: 60,
      digital: true,
      docket: "Someone broke into Paolo's online banking-linked email. Paolo filed the complaint for barangay conciliation, and the respondent says that is the only proper forum.",
      facts: [
        "The intruder logged into Paolo's email account without his permission.",
        "The complaint is pending before the Lupon of Paolo's barangay.",
      ],
      hiddenFacts: [
        "The intruder lives in a different city from Paolo.",
      ],
      elements: [
        {
          label: "The act is illegal access to a computer system — a cybercrime",
          counters: ["RA 10175"],
          basis: "RA 10175, Sec. 4(a)(1): access to the whole or any part of a computer system without right.",
        },
        {
          label: "Barangay conciliation is not the proper forum for this offense",
          resolvedBy: "elementCheck",
          basis: "Local Government Code Sec. 408 excludes offenses punishable by over 1 year of imprisonment; RA 10175, Sec. 21 vests jurisdiction in the Regional Trial Courts.",
        },
      ],
    },
    {
      id: "phantom-deduction",
      tier: 1,
      name: "The Phantom Deduction",
      sigil: "₱",
      hp: 55,
      digital: false,
      docket: "Jomar's employer keeps withholding income tax from every paycheck. Jomar is sure he earns too little to owe any.",
      facts: [
        "Jomar is a regular employee with no other source of income.",
        "His payslips show a monthly \"withholding tax\" line item.",
      ],
      hiddenFacts: [
        "Jomar's annual taxable compensation income is ₱240,000.",
      ],
      elements: [
        {
          label: "The employee's annual taxable income is ₱250,000 or below",
          resolvedBy: "clarify",
          basis: "Annual taxable income must first be established from payroll records.",
        },
        {
          label: "Income of ₱250,000 or below is taxed at 0%",
          counters: ["RA 10963"],
          basis: "RA 10963 (TRAIN), amending NIRC Sec. 24(A)(2): 0% income tax on taxable income not over ₱250,000.",
        },
      ],
    },
    {
      id: "open-burner",
      tier: 1,
      name: "The Open Burner",
      sigil: "🔥",
      hp: 55,
      digital: false,
      docket: "Every evening a neighbour piles household garbage — plastics included — in a vacant lot and sets it on fire.",
      facts: [
        "The garbage is ordinary household waste burned in the open air.",
        "Thick black smoke drifts into nearby homes; residents report coughing.",
      ],
      hiddenFacts: [],
      elements: [
        {
          label: "Solid waste is being burned in the open",
          counters: ["RA 9003"],
          basis: "RA 9003, Sec. 48(2): open burning of solid waste is a prohibited act.",
        },
        {
          label: "Burning municipal waste that emits toxic and poisonous fumes",
          counters: ["RA 8749"],
          basis: "RA 8749, Sec. 20: incineration of municipal, biomedical and hazardous waste that emits poisonous and toxic fumes is banned.",
        },
      ],
    },
    {
      id: "schoolyard-shadow",
      tier: 1,
      name: "The Schoolyard Shadow",
      sigil: "✎",
      hp: 50,
      digital: false,
      docket: "A Grade 8 student is mocked daily by classmates and in their group chat. Her parents reported it, but the school says it has \"no procedure\" for this.",
      facts: [
        "Classmates repeatedly ridicule her in class and in an online group chat.",
        "The school has no anti-bullying policy on file.",
      ],
      hiddenFacts: [],
      elements: [
        {
          label: "Repeated acts by students that humiliate a fellow student, including online",
          counters: ["RA 10627"],
          basis: "RA 10627, Sec. 2: bullying includes repeated verbal, written or electronic acts, including cyber-bullying.",
        },
        {
          label: "The school must adopt and enforce an anti-bullying policy",
          counters: ["RA 10627"],
          basis: "RA 10627, Sec. 3: all elementary and secondary schools must adopt anti-bullying policies with procedures for reporting and response.",
        },
      ],
    },

    // ------------------------------------------------------
    // TIER 2 — Statutory Offenses (70–85 HP, 3–4 elements)
    // ------------------------------------------------------
    {
      id: "digital-intruder",
      tier: 2,
      name: "The Digital Intruder",
      sigil: "⌁",
      hp: 75,
      digital: true,
      docket: "After a breakup, Marco logged into his ex-partner's social media account, read her messages, deleted several conversations, and changed the recovery email.",
      facts: [
        "Marco accessed the account from his own laptop.",
        "Conversations were deleted and the recovery email was replaced with Marco's.",
      ],
      hiddenFacts: [
        "The owner never shared her password with Marco or authorised any access.",
      ],
      elements: [
        {
          label: "Access to a computer system or account",
          counters: ["RA 10175"],
          basis: "RA 10175, Sec. 4(a)(1): illegal access covers access to the whole or any part of a computer system.",
        },
        {
          label: "The access was without right",
          counters: ["RA 10175"],
          requiresFact: 0,
          basis: "RA 10175, Sec. 4(a)(1): the access must be \"without right\" — no authority from the owner.",
        },
        {
          label: "Computer data was deleted or altered without right",
          counters: ["RA 10175"],
          basis: "RA 10175, Sec. 4(a)(3): data interference — intentional alteration, damaging or deletion of computer data without right.",
        },
      ],
    },
    {
      id: "street-predator",
      tier: 2,
      name: "The Street Predator",
      sigil: "☍",
      hp: 80,
      digital: false,
      docket: "At a jeepney terminal, a man wolf-whistles at Bea, comments loudly on her body, and keeps demanding her number.",
      facts: [
        "The incident happened at a public jeepney terminal in daylight.",
        "He catcalled and wolf-whistled, then commented on her body and repeatedly asked for her number.",
      ],
      hiddenFacts: [
        "After Bea refused, he followed her for three blocks.",
      ],
      elements: [
        {
          label: "Catcalling and wolf-whistling directed at the victim",
          counters: ["RA 11313"],
          basis: "RA 11313, Sec. 4: catcalling and wolf-whistling are gender-based streets and public spaces sexual harassment.",
        },
        {
          label: "Committed in a public space",
          counters: ["RA 11313"],
          basis: "RA 11313, Sec. 3: public spaces include streets, terminals and public utility vehicles.",
        },
        {
          label: "Persistent uninvited comments on appearance and relentless requests for personal details",
          counters: ["RA 11313"],
          basis: "RA 11313, Sec. 4 & 11: persistent comments on appearance and relentless requests for personal details are punishable.",
        },
        {
          label: "Stalking the victim",
          counters: ["RA 11313"],
          requiresFact: 0,
          basis: "RA 11313, Sec. 11(c): stalking is penalised as a graver form of gender-based public spaces harassment.",
        },
      ],
    },
    {
      id: "data-discloser",
      tier: 2,
      name: "The Data Discloser",
      sigil: "⛁",
      hp: 80,
      digital: true,
      docket: "A clinic staffer posted a patient's name, phone number and HIV-related diagnosis in a public Facebook group.",
      facts: [
        "The staffer accessed the record through the clinic's patient system.",
        "The patient never consented to any disclosure.",
      ],
      hiddenFacts: [
        "The post's caption mocked the patient — the staffer meant to shame him.",
      ],
      elements: [
        {
          label: "The information is sensitive personal information (health)",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 3(l): sensitive personal information includes an individual's health records.",
        },
        {
          label: "Disclosed by an employee of a personal information controller",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 3(h) & 32: the clinic is a personal information controller, liable together with its employees and agents.",
        },
        {
          label: "Disclosed to third parties without the data subject's consent",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 32: unauthorized disclosure of personal information to a third party without consent.",
        },
        {
          label: "Disclosure made with malice or bad faith",
          counters: ["RA 10173"],
          requiresFact: 0,
          basis: "RA 10173, Sec. 31: malicious disclosure — disclosure with malice or in bad faith.",
        },
      ],
    },
    {
      id: "red-tape-racketeer",
      tier: 2,
      name: "The Red-Tape Racketeer",
      sigil: "⛓",
      hp: 85,
      digital: false,
      docket: "To renew her sari-sari store's permit, Liza was told to submit documents not in the Citizen's Charter and pay an \"express fee\". A man outside offered to \"fix\" it for ₱2,000.",
      facts: [
        "The extra documents demanded are not listed in the office's Citizen's Charter.",
        "The \"express fee\" is not in the Charter and no official receipt was offered.",
        "The man outside claimed he could get the permit released the same day.",
      ],
      hiddenFacts: [
        "The renewal (a simple transaction) has now been pending for 15 working days.",
      ],
      elements: [
        {
          label: "Additional requirements not listed in the Citizen's Charter",
          counters: ["RA 11032", "RA 9485"],
          basis: "RA 9485 as amended by RA 11032, Sec. 21(b): imposing additional requirements beyond the Citizen's Charter.",
        },
        {
          label: "Additional costs not reflected in the Citizen's Charter",
          counters: ["RA 11032", "RA 9485"],
          basis: "RA 9485 as amended by RA 11032, Sec. 21(c): imposing additional costs not reflected in the Citizen's Charter.",
        },
        {
          label: "Fixing or collusion with fixers",
          counters: ["RA 11032", "RA 9485"],
          basis: "RA 9485 as amended by RA 11032, Sec. 21(h): fixing and/or collusion with fixers.",
        },
        {
          label: "Failure to act within the prescribed processing time",
          counters: ["RA 11032", "RA 9485"],
          requiresFact: 0,
          basis: "RA 9485 as amended by RA 11032, Sec. 21(e): failure to render government services within the prescribed processing time.",
        },
      ],
    },
    {
      id: "coercive-partner",
      tier: 2,
      name: "The Coercive Partner",
      sigil: "⚔",
      hp: 75,
      digital: false,
      docket: "Carla's live-in partner, father of her child, insults and belittles her daily and humiliated her in front of their neighbours.",
      facts: [
        "Carla and the offender live together and share a child.",
        "The insults are repeated, and one incident happened publicly before neighbours.",
      ],
      hiddenFacts: [
        "A psychologist has documented that Carla now suffers severe anxiety and sleeplessness.",
      ],
      elements: [
        {
          label: "The victim is a woman in a covered relationship with the offender",
          counters: ["RA 9262"],
          basis: "RA 9262, Sec. 3(a): covers acts against a woman with whom the offender has or had a sexual or dating relationship, or with whom he has a common child.",
        },
        {
          label: "Repeated verbal abuse and public humiliation",
          counters: ["RA 9262"],
          basis: "RA 9262, Sec. 3(a)(C): psychological violence includes public ridicule or humiliation and repeated verbal abuse.",
        },
        {
          label: "The acts caused mental or emotional anguish",
          counters: ["RA 9262"],
          requiresFact: 0,
          basis: "RA 9262, Sec. 5(i): causing mental or emotional anguish, public ridicule or humiliation.",
        },
      ],
    },

    // ------------------------------------------------------
    // TIER 3 — Boss Litigation (multi-issue, 100–120 HP, 4–5 elements)
    // ------------------------------------------------------
    {
      id: "debt-shaming-syndicate",
      tier: 3,
      name: "The Debt-Shaming Syndicate",
      sigil: "☠",
      hp: 115,
      digital: true,
      docket: "An online lending app harvested a borrower's entire phone contact list, texted every contact that he was a \"scammer\" who owes money, and posted the same accusation on its public page.",
      facts: [
        "The lending company collects and stores borrowers' personal data through its app.",
        "The app read the borrower's whole contact list, which the loan did not need.",
        "Contacts received messages naming the borrower and his debt.",
        "The company's public page called the borrower a \"scammer\".",
      ],
      hiddenFacts: [
        "The borrower never consented to his contacts being accessed or messaged.",
      ],
      elements: [
        {
          label: "The lending company is a personal information controller",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 3(h): a person or organization that controls the collection, holding and processing of personal information.",
        },
        {
          label: "Processing beyond the declared, legitimate purpose",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 11 & 25: processing must be proportional to a declared purpose; unauthorized processing is penalised.",
        },
        {
          label: "No consent from the data subject",
          resolvedBy: "clarify",
          basis: "RA 10173, Sec. 12: consent (or another lawful criterion) is required to process personal information.",
        },
        {
          label: "Personal information disclosed to third parties",
          counters: ["RA 10173"],
          basis: "RA 10173, Sec. 32: unauthorized disclosure of personal information to third parties.",
        },
        {
          label: "A defamatory imputation published online",
          counters: ["RA 10175"],
          basis: "RA 10175, Sec. 4(c)(4): libel committed through a computer system (cyber libel).",
        },
      ],
    },
    {
      id: "viral-harasser",
      tier: 3,
      name: "The Viral Harasser",
      sigil: "✸",
      hp: 105,
      digital: true,
      docket: "An anonymous account floods a student journalist's posts with sexist slurs, uploads her photos without consent, and spreads a fabricated story that she sells exam answers.",
      facts: [
        "The account posts sexist and misogynistic comments under every one of her posts.",
        "Her personal photos were uploaded and shared without her consent.",
        "A post falsely claims she sells exam answers and names her school.",
      ],
      hiddenFacts: [
        "The account also sends her dozens of threatening direct messages daily.",
      ],
      elements: [
        {
          label: "Sexist and misogynistic remarks made online",
          counters: ["RA 11313"],
          basis: "RA 11313, Sec. 12: gender-based online sexual harassment includes unwanted sexist and misogynistic remarks online.",
        },
        {
          label: "Uploading and sharing the victim's photos without consent",
          counters: ["RA 11313"],
          basis: "RA 11313, Sec. 12: unauthorized recording and sharing of a victim's photos or information online.",
        },
        {
          label: "A false, defamatory imputation published through a computer system",
          counters: ["RA 10175", "RA 11313"],
          basis: "RA 10175, Sec. 4(c)(4): cyber libel. RA 11313, Sec. 12 also covers posting lies about victims to harm their reputation.",
        },
        {
          label: "Cyberstalking and incessant threatening messages",
          counters: ["RA 11313"],
          requiresFact: 0,
          basis: "RA 11313, Sec. 12: invasion of privacy through cyberstalking and incessant messaging; threats through ICT.",
        },
      ],
    },
  ];

  global.JURIS_TIERS = TIERS;
  global.JURIS_CASES = CASES;
})(typeof window !== "undefined" ? window : globalThis);
