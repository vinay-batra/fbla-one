/**
 * FBLA Competitive Events Registry
 *
 * Source of truth for every competition tracked by FBLA One.
 * Based on the FBLA Competitive Events Guide. Re-verify each year — FBLA
 * adds/renames events for the new program of work.
 *
 * Events that require unique year-specific prompts (most "production",
 * "presentation", and case-study events) are listed but marked
 * `contentStatus: "coming-soon"`. Objective-test events have rich content
 * because the body of knowledge is stable year over year.
 */

export type CompetitionFormat =
  | "objective-test"
  | "objective-and-presentation"
  | "role-play"
  | "case-study"
  | "production"
  | "presentation"
  | "interview"
  | "team-test";

export const FORMAT_LABEL: Record<CompetitionFormat, string> = {
  "objective-test": "Objective Test",
  "objective-and-presentation": "Test + Presentation",
  "role-play": "Role Play",
  "case-study": "Case Study",
  production: "Production",
  presentation: "Presentation",
  interview: "Interview",
  "team-test": "Team Test",
};

export type CompetitionCategory =
  | "Accounting & Finance"
  | "Business Management"
  | "Career Development"
  | "Communication & Public Speaking"
  | "Information Technology"
  | "Marketing & Sales"
  | "Service & Leadership";

export const CATEGORIES: CompetitionCategory[] = [
  "Accounting & Finance",
  "Business Management",
  "Career Development",
  "Communication & Public Speaking",
  "Information Technology",
  "Marketing & Sales",
  "Service & Leadership",
];

export type StudyResource = {
  title: string;
  kind: "FBLA Guide" | "Article" | "Video" | "Course" | "Book" | "Practice" | "Reference";
  url: string;
  note?: string;
};

export type Competition = {
  slug: string;
  name: string;
  category: CompetitionCategory;
  format: CompetitionFormat;
  /** 1-2 sentence summary, shown on cards */
  description: string;
  /** Multi-paragraph detail, shown on detail page. Optional. */
  longDescription?: string;
  /** Format like "60 minutes, 100 questions" */
  duration?: string;
  /** Topics tested. Displayed as chips. */
  topics?: string[];
  /** Curated external study resources. */
  studyResources?: StudyResource[];
  /** Link to FBLA's official event description. */
  rubricUrl?: string;
  isTeam?: boolean;
  /** Drives whether the detail page shows full content or a coming-soon stub. */
  contentStatus: "complete" | "partial" | "coming-soon";
  /** Featured on the landing carousel + sorted first. */
  popular?: boolean;
};

const FBLA_EVENT_PAGE = "https://www.fbla.org/high-school/competitive-events/";

export const COMPETITIONS: Competition[] = [
  // ─── Accounting & Finance ────────────────────────────────────────────
  {
    slug: "accounting-i",
    name: "Accounting I",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Foundational accounting concepts: the accounting equation, journals, ledgers, financial statements, and adjusting entries.",
    longDescription:
      "Accounting I tests your understanding of the basic accounting cycle for sole proprietorships and partnerships. Expect questions on debits/credits, posting to the general ledger, preparing trial balances, adjusting and closing entries, and reading the four primary financial statements. This is the entry-level accounting event — Accounting II covers corporations, manufacturing, and managerial accounting.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Accounting equation",
      "Debits & credits",
      "Journals & ledgers",
      "Trial balance",
      "Adjusting entries",
      "Closing entries",
      "Income statement",
      "Balance sheet",
      "Statement of cash flows",
      "Payroll basics",
      "Inventory methods (FIFO/LIFO)",
      "Depreciation",
    ],
    studyResources: [
      { title: "FBLA Accounting I Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Financial Accounting", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/core-finance/accounting-and-financial-stateme" },
      { title: "AccountingCoach (free) — Bookkeeping Basics", kind: "Course", url: "https://www.accountingcoach.com/bookkeeping/explanation" },
      { title: "Investopedia — Accounting Cycle", kind: "Article", url: "https://www.investopedia.com/terms/a/accounting-cycle.asp" },
      { title: "Quizlet — FBLA Accounting I Practice Sets", kind: "Practice", url: "https://quizlet.com/subject/fbla-accounting-i/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "accounting-ii",
    name: "Accounting II",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Advanced accounting: corporate accounting, manufacturing, departmental accounting, and managerial decision-making.",
    longDescription:
      "Accounting II picks up where Accounting I ends. The test focuses on corporate equity (stocks, dividends, retained earnings), manufacturing and cost accounting (process vs. job-order), departmental accounting, partnerships, and managerial topics like budgeting and CVP analysis. Strong score requires deep familiarity with Accounting I plus comfort with cost allocations and contribution-margin math.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Corporate equity",
      "Bonds payable",
      "Manufacturing accounting",
      "Job-order vs. process costing",
      "Cost-volume-profit analysis",
      "Budgeting & variance",
      "Departmental accounting",
      "Partnership accounting",
      "Statement of cash flows (indirect/direct)",
      "Ratio analysis",
    ],
    studyResources: [
      { title: "FBLA Accounting II Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "AccountingCoach — Managerial Accounting", kind: "Course", url: "https://www.accountingcoach.com/managerial-accounting/explanation" },
      { title: "Investopedia — Cost-Volume-Profit Analysis", kind: "Article", url: "https://www.investopedia.com/terms/c/cost-volume-profit-analysis.asp" },
      { title: "Khan Academy — Stocks & Bonds", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "personal-finance",
    name: "Personal Finance",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Budgeting, credit, investing, insurance, taxes, and major life-stage financial planning.",
    longDescription:
      "Personal Finance tests practical money management for individuals: building a budget, managing credit and debt, investing (stocks, bonds, mutual funds, retirement accounts), insurance types (auto, health, life, property), and federal taxation basics. Heavy emphasis on real-world decision making — what's the better loan, which account to use for which goal, how compound interest works over decades.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Budgeting & saving",
      "Credit scores & reports",
      "Loans & interest types",
      "Stocks & bonds basics",
      "Mutual funds & ETFs",
      "Retirement (401k, IRA, Roth)",
      "Insurance types",
      "Federal income tax",
      "Banking products",
      "Estate planning basics",
    ],
    studyResources: [
      { title: "FBLA Personal Finance Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "NGPF — Next Gen Personal Finance Curriculum", kind: "Course", url: "https://www.ngpf.org/curriculum/" },
      { title: "Khan Academy — Personal Finance", kind: "Course", url: "https://www.khanacademy.org/college-careers-more/personal-finance" },
      { title: "Investopedia — Personal Finance", kind: "Reference", url: "https://www.investopedia.com/personal-finance-4427760" },
      { title: "CFPB Money Smart for Young People", kind: "Course", url: "https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "financial-math",
    name: "Financial Math",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Time-value-of-money math: simple/compound interest, annuities, loans, and investment growth.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Simple & compound interest",
      "Annuities (ordinary, due)",
      "Present value / future value",
      "Loan amortization",
      "Effective vs. nominal rates",
      "Discounted cash flow",
      "Investment growth math",
      "Sinking funds",
    ],
    studyResources: [
      { title: "FBLA Financial Math Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Interest & Debt", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/core-finance/interest-tutorial" },
      { title: "Investopedia — Time Value of Money", kind: "Article", url: "https://www.investopedia.com/terms/t/timevalueofmoney.asp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-financial-math",
    name: "Intro to Financial Math",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Foundational money math for 9th-10th graders: percent, interest, discounts, and basic business calculations.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Percentages", "Markup & discount", "Simple interest", "Payroll math", "Sales tax", "Tipping & gratuity"],
    studyResources: [
      { title: "FBLA Intro to Financial Math Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Percents", kind: "Course", url: "https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-percent" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "securities-investments",
    name: "Securities & Investments",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Equity and fixed-income markets, portfolio theory, valuation, and regulatory environment.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Stocks (common, preferred)",
      "Bonds & yield",
      "Mutual funds & ETFs",
      "Options & derivatives basics",
      "Portfolio diversification",
      "Market indices",
      "SEC & FINRA regulation",
      "Order types (market, limit, stop)",
      "Valuation (P/E, dividend discount)",
    ],
    studyResources: [
      { title: "FBLA Securities & Investments Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Investopedia — Investing Basics", kind: "Reference", url: "https://www.investopedia.com/investing-4427685" },
      { title: "SEC.gov Investor.gov — Investing Basics", kind: "Reference", url: "https://www.investor.gov/introduction-investing" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "banking-financial-systems",
    name: "Banking & Financial Systems",
    category: "Accounting & Finance",
    format: "case-study",
    description: "Team case study: analyze a banking scenario and present recommendations.",
    isTeam: true,
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "coming-soon",
  },
  {
    slug: "insurance-risk-management",
    name: "Insurance & Risk Management",
    category: "Accounting & Finance",
    format: "objective-test",
    description: "Insurance product types, risk pooling, underwriting, and personal/commercial risk management.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Risk types", "Insurance principles", "Auto/home/life/health insurance", "Commercial insurance", "Underwriting", "Claims process"],
    studyResources: [
      { title: "FBLA Insurance & Risk Management Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Investopedia — Insurance Basics", kind: "Reference", url: "https://www.investopedia.com/insurance-4427716" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },

  // ─── Business Management ─────────────────────────────────────────────
  {
    slug: "business-management",
    name: "Business Management",
    category: "Business Management",
    format: "objective-test",
    description: "Management theory, organizational behavior, strategy, operations, and leadership.",
    longDescription:
      "Business Management tests classical and modern management theory: planning, organizing, leading, controlling. Topics span organizational structure, motivation theories (Maslow, Herzberg, McGregor), strategic management frameworks (SWOT, Porter), operations and supply chain, HR fundamentals, and quality management. Strong overlap with Intro to Business but goes deeper.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Management functions (POLC)",
      "Organizational structures",
      "Motivation theories",
      "Leadership styles",
      "Strategic planning (SWOT, Porter)",
      "HR management basics",
      "Operations management",
      "Quality management (TQM, Six Sigma)",
      "Change management",
      "Business ethics",
    ],
    studyResources: [
      { title: "FBLA Business Management Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "OpenStax — Principles of Management", kind: "Book", url: "https://openstax.org/details/books/principles-management" },
      { title: "MindTools — Management Skills", kind: "Reference", url: "https://www.mindtools.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "business-law",
    name: "Business Law",
    category: "Business Management",
    format: "objective-test",
    description: "Contracts, torts, agency, business organizations, sales (UCC), employment law, and ethics.",
    longDescription:
      "Business Law focuses on the legal environment of US commerce. Heavy emphasis on contracts (formation, performance, breach, remedies), the UCC for sale of goods, business entities (sole proprietorship, partnership, LLC, corporation), agency relationships, employment law basics, and intellectual property. Tort law and constitutional/regulatory framework also appear.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Contract law",
      "UCC sales",
      "Torts",
      "Business entities",
      "Agency",
      "Employment law",
      "Intellectual property",
      "Bankruptcy basics",
      "Consumer protection",
      "Constitutional law for business",
    ],
    studyResources: [
      { title: "FBLA Business Law Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Cornell LII — Wex Legal Encyclopedia", kind: "Reference", url: "https://www.law.cornell.edu/wex" },
      { title: "Investopedia — Business Law", kind: "Article", url: "https://www.investopedia.com/terms/b/business-law.asp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "business-calculations",
    name: "Business Calculations",
    category: "Business Management",
    format: "objective-test",
    description: "Practical business math: percent, markups, payroll, statistics, and word problems.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Percent & markup", "Payroll & gross pay", "Discount calculations", "Statistics (mean, median, mode)", "Probability", "Word problems"],
    studyResources: [
      { title: "FBLA Business Calculations Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Statistics & Probability", kind: "Course", url: "https://www.khanacademy.org/math/statistics-probability" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "business-communication",
    name: "Business Communication",
    category: "Communication & Public Speaking",
    format: "objective-test",
    description: "Grammar, mechanics, business writing, and professional communication conventions.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Grammar", "Punctuation & mechanics", "Business letter format", "Memos & emails", "Reports", "Active vs. passive voice", "Tone & register", "Editing"],
    studyResources: [
      { title: "FBLA Business Communication Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Purdue OWL — Business Writing", kind: "Reference", url: "https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/index.html" },
      { title: "Grammar Bytes!", kind: "Course", url: "https://chompchomp.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "economics",
    name: "Economics",
    category: "Business Management",
    format: "objective-test",
    description: "Micro and macro fundamentals: supply/demand, market structures, GDP, monetary and fiscal policy.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Supply & demand",
      "Elasticity",
      "Market structures (perfect competition → monopoly)",
      "GDP & growth",
      "Inflation & unemployment",
      "Fiscal policy",
      "Monetary policy (Fed)",
      "International trade",
      "Externalities",
      "Economic indicators",
    ],
    studyResources: [
      { title: "FBLA Economics Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Macroeconomics", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/macroeconomics" },
      { title: "Khan Academy — Microeconomics", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/microeconomics" },
      { title: "AP Economics CrashCourse (YouTube)", kind: "Video", url: "https://www.youtube.com/playlist?list=PLG3-zZqJtNVB6X-fdmHfDM2eRtmgrDC1u" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "marketing",
    name: "Marketing",
    category: "Marketing & Sales",
    format: "objective-test",
    description: "The 4 P's, segmentation, branding, advertising, digital marketing, and consumer behavior.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Marketing mix (4 P's)",
      "Market segmentation",
      "Consumer behavior",
      "Branding",
      "Pricing strategies",
      "Promotion & advertising",
      "Digital & social media marketing",
      "Distribution channels",
      "Marketing research",
      "Product life cycle",
    ],
    studyResources: [
      { title: "FBLA Marketing Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "HubSpot Academy — Marketing", kind: "Course", url: "https://academy.hubspot.com/courses?topics=marketing" },
      { title: "Coursera — Intro to Marketing (Wharton)", kind: "Course", url: "https://www.coursera.org/learn/wharton-marketing" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "advertising",
    name: "Advertising",
    category: "Marketing & Sales",
    format: "objective-test",
    description: "Advertising history, media planning, copywriting, creative development, and digital advertising.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Advertising history", "Media planning & buying", "Creative process", "Copywriting", "Print, broadcast & digital ads", "Brand campaigns", "Ethics & regulation"],
    studyResources: [
      { title: "FBLA Advertising Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Google Skillshop — Ads Certifications", kind: "Course", url: "https://skillshop.withgoogle.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "sports-entertainment-management",
    name: "Sports & Entertainment Management",
    category: "Marketing & Sales",
    format: "objective-test",
    description: "Sports marketing, event management, sponsorships, ticketing, and the business of entertainment.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Sports marketing", "Event management", "Sponsorship sales", "Venue & ticketing", "Talent management", "Broadcasting rights"],
    studyResources: [
      { title: "FBLA Sports & Entertainment Management Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SportsBusiness Journal — Articles", kind: "Reference", url: "https://www.sportsbusinessjournal.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "supply-chain-management",
    name: "Supply Chain Management",
    category: "Business Management",
    format: "objective-test",
    description: "Logistics, procurement, inventory, distribution, and global supply chain dynamics.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Procurement & sourcing",
      "Inventory management (EOQ, JIT)",
      "Warehousing",
      "Transportation modes",
      "Distribution",
      "Reverse logistics",
      "Supply chain risk",
      "ERP systems",
    ],
    studyResources: [
      { title: "FBLA Supply Chain Management Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "ASCM (APICS) Resource Library", kind: "Reference", url: "https://www.ascm.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "health-care-administration",
    name: "Health Care Administration",
    category: "Business Management",
    format: "objective-test",
    description: "Healthcare systems, insurance, regulation, ethics, and the business of medicine in the US.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["US healthcare system", "Insurance (private, Medicare, Medicaid)", "HIPAA & patient privacy", "Hospital operations", "Healthcare regulation (ACA)", "Healthcare ethics"],
    studyResources: [
      { title: "FBLA Health Care Administration Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "KFF (Kaiser Family Foundation) — Health Policy", kind: "Reference", url: "https://www.kff.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "agribusiness",
    name: "Agribusiness",
    category: "Business Management",
    format: "objective-test",
    description: "Agriculture economics, farm management, agricultural finance, and global food systems.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Farm economics", "Ag finance & credit", "Commodity markets", "Sustainability", "Food supply chain", "Ag policy & subsidies"],
    studyResources: [
      { title: "FBLA Agribusiness Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "USDA Economic Research Service", kind: "Reference", url: "https://www.ers.usda.gov/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },

  // ─── Information Technology ──────────────────────────────────────────
  {
    slug: "computer-applications",
    name: "Computer Applications",
    category: "Information Technology",
    format: "objective-test",
    description: "Microsoft Office mastery: Word, Excel, PowerPoint, plus general productivity software.",
    longDescription:
      "Computer Applications tests practical productivity skills with a strong Microsoft Office bias. Excel questions go deep — formulas (VLOOKUP, IF, SUMIF, INDEX/MATCH), pivot tables, charting, conditional formatting. Word covers formatting, mail merge, styles, tables of contents. PowerPoint covers transitions, animations, slide masters. Plus general topics: file management, basic networking, accessibility.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "MS Word (formatting, mail merge, styles)",
      "MS Excel (formulas, pivot tables, charts)",
      "MS PowerPoint (transitions, masters)",
      "MS Outlook basics",
      "File management",
      "Cloud productivity",
      "Accessibility features",
    ],
    studyResources: [
      { title: "FBLA Computer Applications Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Microsoft Learn — Office Training", kind: "Course", url: "https://support.microsoft.com/en-us/training" },
      { title: "GCFGlobal — Microsoft Office Tutorials", kind: "Course", url: "https://edu.gcfglobal.org/en/topics/office/" },
      { title: "ExcelJet — Functions & Formulas", kind: "Reference", url: "https://exceljet.net/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "computer-problem-solving",
    name: "Computer Problem Solving",
    category: "Information Technology",
    format: "objective-test",
    description: "Hardware troubleshooting, software diagnostics, networking issues, and IT support fundamentals.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Hardware components", "OS troubleshooting", "Networking basics", "Cybersecurity hygiene", "Help desk workflow", "Common Windows/macOS issues"],
    studyResources: [
      { title: "FBLA Computer Problem Solving Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "CompTIA A+ Study Materials", kind: "Course", url: "https://www.comptia.org/certifications/a" },
      { title: "Professor Messer — A+ Free Course", kind: "Video", url: "https://www.professormesser.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "cyber-security",
    name: "Cyber Security",
    category: "Information Technology",
    format: "objective-test",
    description: "Threats, defense, cryptography, network security, and security operations fundamentals.",
    longDescription:
      "Cyber Security covers the breadth of CompTIA Security+ level material. Expect questions on threat types (malware families, phishing, MITM, DDoS), cryptographic concepts (symmetric vs. asymmetric, hashing, PKI), network security (firewalls, IDS/IPS, VPNs), access control models, security operations (SOC, incident response), and policy/compliance basics. Many topics overlap with Networking Infrastructures.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "Threat types & vectors",
      "Cryptography",
      "Network security",
      "Authentication & access control",
      "Incident response",
      "Security policies & frameworks",
      "Endpoint security",
      "Cloud security basics",
      "Social engineering",
      "Compliance (PCI, HIPAA, GDPR)",
    ],
    studyResources: [
      { title: "FBLA Cyber Security Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Professor Messer — Security+ Free Course", kind: "Video", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/" },
      { title: "CISA — Cybersecurity Best Practices", kind: "Reference", url: "https://www.cisa.gov/topics/cybersecurity-best-practices" },
      { title: "OWASP Top 10", kind: "Reference", url: "https://owasp.org/www-project-top-ten/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "networking-infrastructures",
    name: "Networking Infrastructures",
    category: "Information Technology",
    format: "objective-test",
    description: "OSI model, TCP/IP, routing, switching, wireless, and network security fundamentals.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["OSI & TCP/IP models", "IP addressing & subnetting", "Routing & switching", "Wireless standards", "Network topologies", "Cabling", "Common protocols (DNS, DHCP, HTTP)", "Network security basics"],
    studyResources: [
      { title: "FBLA Networking Infrastructures Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Professor Messer — Network+ Free Course", kind: "Video", url: "https://www.professormesser.com/network-plus/n10-008/n10-008-training-course/" },
      { title: "Cisco Networking Academy", kind: "Course", url: "https://www.netacad.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-information-technology",
    name: "Intro to Information Technology",
    category: "Information Technology",
    format: "objective-test",
    description: "Foundational IT for 9th-10th graders: hardware, software, internet, productivity, and digital citizenship.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Hardware basics", "Software types", "Internet fundamentals", "Productivity software", "Digital citizenship", "Cyber hygiene"],
    studyResources: [
      { title: "FBLA Intro to IT Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Code.org — Computer Science Principles", kind: "Course", url: "https://code.org/educate/csp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "management-information-systems",
    name: "Management Information Systems",
    category: "Information Technology",
    format: "objective-test",
    description: "Business technology systems: ERP, CRM, databases, analytics, and IT strategy.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Database concepts (SQL basics)", "ERP & CRM systems", "Business intelligence", "Data warehousing", "System development lifecycle", "IT governance"],
    studyResources: [
      { title: "FBLA MIS Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "MIT OpenCourseWare — Information Technology", kind: "Course", url: "https://ocw.mit.edu/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "coding-programming",
    name: "Coding & Programming",
    category: "Information Technology",
    format: "objective-test",
    description: "Programming concepts: variables, control flow, data structures, OOP, and algorithm basics.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Variables & types", "Control flow (if/loop)", "Functions", "Arrays & collections", "OOP fundamentals", "Recursion", "Big-O basics", "Debugging"],
    studyResources: [
      { title: "FBLA Coding & Programming Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Codecademy — Intro to Programming", kind: "Course", url: "https://www.codecademy.com/" },
      { title: "Khan Academy — Intro to Computer Programming", kind: "Course", url: "https://www.khanacademy.org/computing/computer-programming" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "word-processing",
    name: "Word Processing",
    category: "Information Technology",
    format: "objective-test",
    description: "Deep Microsoft Word: styles, mail merge, tables of contents, references, collaboration, macros.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Document formatting", "Styles & themes", "Mail merge", "Tables & lists", "TOC & cross-references", "Track changes", "Macros & forms", "Templates"],
    studyResources: [
      { title: "FBLA Word Processing Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Microsoft Word Training", kind: "Course", url: "https://support.microsoft.com/en-us/training/word" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },

  // ─── Career Development / Intro events ────────────────────────────────
  {
    slug: "intro-to-fbla",
    name: "Intro to FBLA",
    category: "Career Development",
    format: "objective-test",
    description: "FBLA history, mission, programs, competitive events, and parliamentary basics. The gateway event for 9th-10th graders.",
    longDescription:
      "Intro to FBLA is THE event to start with. It tests your knowledge of the organization itself: founding history, current programs (March of Dimes partnership, NLC, etc.), competitive event categories, business etiquette, and parliamentary procedure basics. Reading the FBLA-PBL Chapter Management Handbook front to back gets you most of the way there.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: [
      "FBLA history (founded 1940)",
      "FBLA-PBL structure",
      "Mission & creed",
      "Competitive events overview",
      "March of Dimes partnership",
      "NLC, SLC, RLC events",
      "Business etiquette",
      "Parliamentary procedure basics",
    ],
    studyResources: [
      { title: "FBLA Intro to FBLA Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "FBLA Chapter Management Handbook", kind: "Reference", url: "https://www.fbla.org/" },
      { title: "FBLA-PBL Bylaws", kind: "Reference", url: "https://www.fbla.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "intro-to-business",
    name: "Intro to Business",
    category: "Business Management",
    format: "objective-test",
    description: "Business fundamentals for 9th-10th graders: economics basics, business types, marketing, management, and finance overview.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Economic systems", "Business types", "Marketing basics", "Management basics", "Personal finance basics", "Entrepreneurship"],
    studyResources: [
      { title: "FBLA Intro to Business Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — Entrepreneurship & Innovation", kind: "Course", url: "https://www.khanacademy.org/college-careers-more/career-content/intro-to-business" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "intro-to-business-communication",
    name: "Intro to Business Communication",
    category: "Communication & Public Speaking",
    format: "objective-test",
    description: "Communication fundamentals for 9th-10th graders: grammar, business writing, and professional email.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Grammar basics", "Punctuation", "Email etiquette", "Business letters", "Professionalism"],
    studyResources: [
      { title: "FBLA Intro to Business Communication Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Purdue OWL — General Writing", kind: "Reference", url: "https://owl.purdue.edu/owl/general_writing/index.html" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-business-procedures",
    name: "Intro to Business Procedures",
    category: "Business Management",
    format: "objective-test",
    description: "Office procedures for 9th-10th graders: filing, records, mail, telephone, scheduling, and document handling.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["Filing systems", "Records management", "Mail handling", "Scheduling", "Phone procedures", "Office equipment"],
    studyResources: [{ title: "FBLA Intro to Business Procedures Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE }],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "political-science",
    name: "Political Science",
    category: "Career Development",
    format: "objective-test",
    description: "US government, political theory, comparative politics, and international relations.",
    duration: "60 minutes, 100 multiple-choice questions",
    topics: ["US Constitution", "Branches of government", "Civil liberties & rights", "Elections & parties", "Political theory", "International relations basics"],
    studyResources: [
      { title: "FBLA Political Science Event Page", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy — AP US Government", kind: "Course", url: "https://www.khanacademy.org/humanities/ap-us-government-and-politics" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "future-business-leader",
    name: "Future Business Leader",
    category: "Career Development",
    format: "objective-and-presentation",
    description: "Test + interview/presentation. Tests business knowledge plus leadership communication.",
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "partial",
  },
  {
    slug: "future-business-educator",
    name: "Future Business Educator",
    category: "Career Development",
    format: "objective-and-presentation",
    description: "Test + interview/presentation on teaching business education as a career.",
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "partial",
  },

  // ─── Coming-soon stubs (prompt-based events) ──────────────────────────
  { slug: "broadcast-journalism", name: "Broadcast Journalism", category: "Communication & Public Speaking", format: "production", description: "Produce a broadcast journalism piece. Requires year-specific prompt.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "business-ethics", name: "Business Ethics", category: "Service & Leadership", format: "presentation", description: "Team presentation analyzing a business ethics scenario. Year-specific topic.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "business-financial-plan", name: "Business Financial Plan", category: "Accounting & Finance", format: "presentation", description: "Develop and present a financial plan for a business scenario. Year-specific topic.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "business-plan", name: "Business Plan", category: "Marketing & Sales", format: "presentation", description: "Build and present a full business plan. Year-specific topic.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "community-service-project", name: "Community Service Project", category: "Service & Leadership", format: "presentation", description: "Present a chapter community service project. Chapter-specific.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "data-analysis", name: "Data Analysis", category: "Information Technology", format: "production", description: "Analyze a dataset and produce a written report. Year-specific dataset.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "digital-animation", name: "Digital Animation", category: "Information Technology", format: "production", description: "Produce a short digital animation. Year-specific prompt.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "digital-video-production", name: "Digital Video Production", category: "Communication & Public Speaking", format: "production", description: "Produce a short video. Year-specific prompt.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "entrepreneurship", name: "Entrepreneurship", category: "Business Management", format: "case-study", description: "Team case study analyzing an entrepreneurship scenario.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "graphic-design", name: "Graphic Design", category: "Marketing & Sales", format: "production", description: "Produce a graphic design piece. Year-specific brief.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "hospitality-event-management", name: "Hospitality & Event Management", category: "Business Management", format: "case-study", description: "Team case study on a hospitality scenario.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "impromptu-speaking", name: "Impromptu Speaking", category: "Communication & Public Speaking", format: "presentation", description: "Live impromptu speaking on a randomly assigned topic.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "introduction-to-public-speaking", name: "Intro to Public Speaking", category: "Communication & Public Speaking", format: "presentation", description: "Prepared speech for 9th-10th graders. Year-specific topic.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "job-interview", name: "Job Interview", category: "Career Development", format: "interview", description: "Submit a resume and cover letter and interview for a mock position.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "mobile-application-development", name: "Mobile Application Development", category: "Information Technology", format: "production", description: "Build a mobile app. Year-specific prompt.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "parliamentary-procedure", name: "Parliamentary Procedure", category: "Service & Leadership", format: "team-test", description: "Team event on Robert's Rules. Test + live demo.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "public-service-announcement", name: "Public Service Announcement", category: "Communication & Public Speaking", format: "production", description: "Produce a PSA video. Year-specific topic.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "public-speaking", name: "Public Speaking", category: "Communication & Public Speaking", format: "presentation", description: "Prepared speech. Year-specific topic.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "publication-design", name: "Publication Design", category: "Marketing & Sales", format: "production", description: "Design a publication. Year-specific brief.", rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "social-media-strategies", name: "Social Media Strategies", category: "Marketing & Sales", format: "presentation", description: "Team presentation of a social media campaign. Year-specific scenario.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
  { slug: "website-coding-development", name: "Website Coding & Development", category: "Information Technology", format: "production", description: "Build a website. Year-specific brief.", isTeam: true, rubricUrl: FBLA_EVENT_PAGE, contentStatus: "coming-soon" },
];

export function getCompetition(slug: string): Competition | undefined {
  return COMPETITIONS.find((c) => c.slug === slug);
}

export function getCompetitionsByCategory(category: CompetitionCategory): Competition[] {
  return COMPETITIONS.filter((c) => c.category === category);
}

export function getPopularCompetitions(): Competition[] {
  return COMPETITIONS.filter((c) => c.popular);
}

export function getAvailableCompetitions(): Competition[] {
  return COMPETITIONS.filter((c) => c.contentStatus !== "coming-soon");
}

/** Quick stats for the marketing site. */
export const COMPETITION_STATS = {
  total: COMPETITIONS.length,
  withContent: COMPETITIONS.filter((c) => c.contentStatus === "complete").length,
  categories: CATEGORIES.length,
};
