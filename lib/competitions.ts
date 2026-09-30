/**
 * FBLA Competitive Events Registry
 *
 * Source of truth for every competition tracked by ChapterPrep.
 *
 * Lineup, names, and formats follow FBLA's official 2025-2026 High School
 * Competitive Events List and changes document. Timing, team sizes, and
 * knowledge areas follow the current national guidelines (2026-2027), which
 * FBLA released with no structural changes to the 2025-2026 lineup; only some
 * test knowledge areas were updated. Re-verify every August when FBLA
 * publishes the new guidelines.
 *
 * Year-specific presentation topics are deliberately not copied here: they
 * change every year, so each entry describes how the event works and points
 * to the official guidelines for the current topic.
 */

/**
 * How an event is judged. The label must tell a student, at a glance, whether
 * there is a test and whether it comes first.
 *
 * - objective-test: a 100-question, 50-minute multiple-choice test only.
 * - test-then-role-play: everyone takes the objective test; the top scorers
 *   advance to a role play final that decides the winners.
 * - test-and-presentation: an objective test plus a judged presentation or
 *   interview (and a pre-judged asset); the scores combine to pick finalists.
 * - production: a hands-on production test completed on a computer.
 * - presentation: a judged presentation or speech, no test.
 * - interview: pre-judged application materials plus a judged interview.
 * - chapter-event: a chapter's pre-judged report plus a presentation.
 */
export type CompetitionFormat =
  | "objective-test"
  | "test-then-role-play"
  | "test-and-presentation"
  | "production"
  | "presentation"
  | "interview"
  | "chapter-event";

export const FORMAT_LABEL: Record<CompetitionFormat, string> = {
  "objective-test": "Objective Test",
  "test-then-role-play": "Test, then Role Play",
  "test-and-presentation": "Test + Presentation",
  production: "Production Test",
  presentation: "Presentation",
  interview: "Interview",
  "chapter-event": "Chapter Presentation",
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
  /** Official timing, e.g. "50-minute online test, 100 multiple-choice questions" */
  duration?: string;
  /**
   * Tested events: the official knowledge areas (the AI practice test draws
   * from these). Judged events: what the official rating sheet scores.
   * Displayed as chips.
   */
  topics?: string[];
  /**
   * The presentation or interview rating-sheet items, for events where
   * `topics` holds the objective test's knowledge areas instead (test plus
   * presentation events). The AI Judge scores against these when present.
   */
  judgedOn?: string[];
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

export const FBLA_EVENT_PAGE = "https://www.fbla.org/high-school/competitive-events/";

// We used to deep-link each event to its guideline PDF on connect.fbla.org, but
// FBLA renames those files every cycle (the 2025-26 update also renamed several
// events), so the constructed links broke with "Missing file ID". Official
// guidelines now point at FBLA_EVENT_PAGE, the stable competitive-events hub
// that links the current guidelines for every event.

export const COMPETITIONS: Competition[] = [
  // --- Accounting & Finance ----------------------------------------------
  {
    slug: "accounting-i",
    name: "Accounting",
    category: "Accounting & Finance",
    format: "objective-test",
    description:
      "Objective test on fundamental accounting: the accounting cycle, journal entries, payables and receivables, taxes, and financial reports.",
    longDescription:
      "Accounting (formerly Accounting I) tests the fundamentals: accounting standards, the full accounting cycle, accounts payable and receivable, tax accounting, and preparing and reading financial reports. It is meant for students early in their accounting studies: to be eligible you can have completed no more than two semesters of high school accounting (one full year on a block schedule). How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundations of Accounting",
      "Standards and Compliance",
      "The Accounting Cycle",
      "Accounts Payable and Receivable",
      "Tax Accounting",
      "Financial Reports",
      "Technology and Accounting",
      "Career Opportunities",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "AccountingCoach: Accounting Basics", kind: "Course", url: "https://www.accountingcoach.com/accounting-basics/explanation" },
      { title: "AccountingCoach (free): Bookkeeping Basics", kind: "Course", url: "https://www.accountingcoach.com/bookkeeping/explanation" },
      { title: "Investopedia: Accounting Cycle", kind: "Article", url: "https://www.investopedia.com/terms/a/accounting-cycle.asp" },
      { title: "Quizlet: FBLA Accounting Practice Sets", kind: "Practice", url: "https://quizlet.com/subject/fbla-accounting-i/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "accounting-ii",
    name: "Advanced Accounting",
    category: "Accounting & Finance",
    format: "objective-test",
    description:
      "Objective test on higher-level accounting: inventory, payroll, financial statements, and managerial accounting.",
    longDescription:
      "Advanced Accounting (formerly Accounting II) goes beyond the basics into inventory, payroll, corporate financial statements, and managerial accounting, building on the same accounting cycle and standards as Accounting. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundations of Accounting",
      "Standards and Compliance",
      "The Accounting Cycle",
      "Inventory",
      "Payroll",
      "Financial Statements",
      "Managerial Accounting",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "AccountingCoach: Managerial Accounting", kind: "Course", url: "https://www.accountingcoach.com/managerial-accounting/explanation" },
      { title: "Investopedia: Cost-Volume-Profit Analysis", kind: "Article", url: "https://www.investopedia.com/terms/c/cost-volume-profit-analysis.asp" },
      { title: "Khan Academy: Stocks & Bonds", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds" },
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
    description:
      "Objective test on everyday money skills: budgeting, saving, credit, investing, and managing risk.",
    longDescription:
      "Personal Finance covers the financial decisions people make every day: how money works, setting financial goals, choosing banks and other financial-services providers, investing, financial literacy, and managing risk with insurance. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Principles of Money",
      "Financial Needs and Goals",
      "Financial-Services Providers",
      "Investment Strategies",
      "Financial Literacy",
      "Risk Management",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "NGPF: Next Gen Personal Finance Curriculum", kind: "Course", url: "https://www.ngpf.org/curriculum/" },
      { title: "Khan Academy: Personal Finance", kind: "Course", url: "https://www.khanacademy.org/college-careers-more/personal-finance" },
      { title: "Investopedia: Personal Finance", kind: "Reference", url: "https://www.investopedia.com/personal-finance-4427760" },
      { title: "CFPB Money Smart for Young People", kind: "Course", url: "https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "securities-investments",
    name: "Securities & Investments",
    category: "Accounting & Finance",
    format: "objective-test",
    description:
      "Objective test on investing and financial markets: stocks, bonds, funds, investment analysis, and the securities industry.",
    longDescription:
      "Securities & Investments covers how financial markets work, how to analyze and select investments, the main securities products (stocks, bonds, mutual funds, and more), and how the securities industry is organized and regulated. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Principles of Money",
      "Financial Markets",
      "Investment Analysis",
      "Selecting Investments",
      "Securities & Investments Industry",
      "Securities Products",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Investopedia: Investing Basics", kind: "Reference", url: "https://www.investopedia.com/investing-4427685" },
      { title: "SEC.gov Investor.gov: Investing Basics", kind: "Reference", url: "https://www.investor.gov/introduction-investing" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "banking-financial-systems",
    name: "Banking & Financial Systems",
    category: "Accounting & Finance",
    format: "test-then-role-play",
    description:
      "Objective test on banking and financial institutions, then a role play for finalists on a banking scenario.",
    longDescription:
      "Banking & Financial Systems covers how banks and other financial institutions work: money and markets, lending and credit, daily banking operations, regulatory compliance, and serving banking customers. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Fundamental Principles of Money",
      "Financial Institutions & Markets",
      "Financial Analysis & Decision-Making",
      "Regulatory Compliance in Finance",
      "Banking Services & Daily Operations",
      "Loans & Credit",
      "Customer Relations in Banking",
      "Professional Development in Banking",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Federal Reserve Education", kind: "Course", url: "https://www.federalreserveeducation.org/" },
      { title: "Investopedia Banking Basics", kind: "Reference", url: "https://www.investopedia.com/banking-4427754" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "insurance-risk-management",
    name: "Insurance & Risk Management",
    category: "Accounting & Finance",
    format: "objective-test",
    description:
      "Objective test on risk management and insurance: personal and commercial policies, underwriting, and claims.",
    longDescription:
      "Insurance & Risk Management covers how people and businesses identify and manage risk, the legal principles behind insurance, personal and commercial insurance products, underwriting, and claims and fraud management. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Risk Management Fundamentals",
      "Insurance Industry & Legal Principles",
      "Personal Insurance Products",
      "Commercial & Specialized Insurance Products",
      "Insurance Operations & Underwriting",
      "Claims & Fraud Management",
      "Professional Development in Insurance",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Investopedia: Insurance Basics", kind: "Reference", url: "https://www.investopedia.com/insurance-4427716" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    category: "Accounting & Finance",
    format: "objective-test",
    description:
      "Objective test on the real estate industry: property law, transactions and financing, agency, and ethics.",
    longDescription:
      "Real Estate (added for 2025-26) covers real estate fundamentals, the laws and regulations that govern property, how transactions are financed and closed, the agent and client relationship (agency), and professional ethics. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Real Estate Fundamentals",
      "Laws and Regulations",
      "Real Estate Transactions and Finance",
      "Ethics",
      "Agency",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Investopedia: Real Estate Basics", kind: "Reference", url: "https://www.investopedia.com/real-estate-4427764" },
      { title: "NAR: Real Estate Education", kind: "Reference", url: "https://www.nar.realtor/education" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "business-financial-plan",
    name: "Financial Planning",
    category: "Accounting & Finance",
    format: "presentation",
    description:
      "Team presentation: build a personal financial plan for the family in FBLA's case scenario and present it to judges.",
    longDescription:
      "Financial Planning (added for 2025-26) gives you a detailed family case each year and asks you to build a financial plan that helps them reach their goals, covering areas such as budgeting, saving, debt, investing, insurance, and retirement. Team event (1 to 3 members). How it runs: there is no test. You present your plan live to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic and Problem Definition",
      "Budgeting and Expense Tracking",
      "Debt Management",
      "Investments and Retirement",
      "Goal Attainment Strategies",
      "Recommendations and Professional Guidance",
      "Cited Sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SBA: Business Plan Guide", kind: "Reference", url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan" },
      { title: "Investopedia: Financial Plan", kind: "Article", url: "https://www.investopedia.com/terms/f/financial-plan.asp" },
      { title: "SCORE Financial Templates", kind: "Reference", url: "https://score.org/resource/business-plan-template-startup-business" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "financial-statement-analysis",
    name: "Financial Statement Analysis",
    category: "Accounting & Finance",
    format: "presentation",
    description:
      "Team presentation: analyze a real company's financial statements and present findings and recommendations.",
    longDescription:
      "Financial Statement Analysis assigns a real public company each year. You study its annual report and financial statements, explain what changed and what it says about the company's financial health (using ratios and trends), and recommend strategic decisions. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Purpose of Each Statement",
      "Analysis of Each Statement",
      "Overall Financial Condition",
      "Guidance for Business Decisions",
      "Changes From Prior Periods and What They Reveal",
      "Two to Three Strategic Recommendations",
      "Cited Sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  // --- Business Management -----------------------------------------------
  {
    slug: "business-management",
    name: "Business Management",
    category: "Business Management",
    format: "test-then-role-play",
    description:
      "Objective test on management principles, then a role play for finalists on a management problem.",
    longDescription:
      "Business Management covers how organizations are run: the business environment, types of management, business finance, operations, and strategic management. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Business Environment",
      "Management Types",
      "Business Finance",
      "Operations",
      "Strategic Management",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "OpenStax: Principles of Management", kind: "Book", url: "https://openstax.org/details/books/principles-management" },
      { title: "MindTools: Management Skills", kind: "Reference", url: "https://www.mindtools.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "business-law",
    name: "Business Law",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on the legal system and business: contracts and commercial law, employment law, ethics, and tax and trade law.",
    longDescription:
      "Business Law covers the legal foundations of business, commercial law (including contracts), employment law, business ethics, financial and tax law, and international trade and commerce law. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Legal Foundations",
      "Commercial Law",
      "Employment Law",
      "Business Ethics",
      "Financial & Tax Law",
      "International Trade & Commerce Law",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Cornell LII: Wex Legal Encyclopedia", kind: "Reference", url: "https://www.law.cornell.edu/wex" },
      { title: "Investopedia: Business Law", kind: "Article", url: "https://www.investopedia.com/terms/b/business-law.asp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "economics",
    name: "Economics",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on economic concepts: economic systems, government and business, cost and profit, economic indicators, and global trade.",
    longDescription:
      "Economics covers core economic concepts, how businesses and economic systems work, government's impact on business, cost and profit relationships, economic indicators, and global trade. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Fundamental Economic Concepts",
      "Nature of Business",
      "Economic Systems",
      "Government's Impact on Business",
      "Cost/Profit Relationships",
      "Economic Indicators",
      "Global Trade",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy: Macroeconomics", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/macroeconomics" },
      { title: "Khan Academy: Microeconomics", kind: "Course", url: "https://www.khanacademy.org/economics-finance-domain/microeconomics" },
      { title: "AP Economics CrashCourse (YouTube)", kind: "Video", url: "https://www.youtube.com/playlist?list=PLG3-zZqJtNVB6X-fdmHfDM2eRtmgrDC1u" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "supply-chain-management",
    name: "Supply Chain Management",
    category: "Business Management",
    format: "presentation",
    description:
      "Team presentation: solve the year's supply chain case (logistics, procurement, inventory, distribution) for a panel of judges.",
    longDescription:
      "Supply Chain Management changed for 2025-26 from an objective test to a team presentation with a topic. Each year FBLA releases a business case, and your team acts as supply chain consultants, presenting a strategy that covers how goods, information, and money move through the supply chain (logistics, procurement, inventory control, and distribution). The objective test on this subject is now Introduction to Supply Chain Management (grades 9 and 10). Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Supply chain scenario and strategy",
      "Management planning: structure and operations",
      "Financial planning: costs, pricing, and risk",
      "Demand planning: forecasting and inventory",
      "Credible cited sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "ASCM (APICS) Resource Library", kind: "Reference", url: "https://www.ascm.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "health-care-administration",
    name: "Healthcare Administration",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on running healthcare organizations: finance, staffing, technology, billing and insurance, and policy.",
    longDescription:
      "Healthcare Administration covers how healthcare organizations are structured and managed: finances and budgeting, staffing and training, strategic management, healthcare technology, billing and insurance, and healthcare policy and regulation. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Healthcare Organizations and Structure",
      "Healthcare Finances and Budgeting",
      "Staffing and Training",
      "Strategic Management",
      "Healthcare Technology",
      "Healthcare Billing and Insurance",
      "Healthcare Policy and Regulation",
      "Communication and Leadership",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "KFF (Kaiser Family Foundation): Health Policy", kind: "Reference", url: "https://www.kff.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "agribusiness",
    name: "Agribusiness",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on business in agriculture: agribusiness economics, operations, finance and marketing, law, and natural resources.",
    longDescription:
      "Agribusiness applies business principles to the agriculture industry, covering safety and regulations, agribusiness economics, operations and management, finance and marketing, business law and ethics, and natural resources. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Safety Procedures and Regulations",
      "Nature of Agribusiness",
      "Business Law",
      "Ethics",
      "Agribusiness Economics",
      "Operations and Management",
      "Finance and Marketing",
      "Natural Resources and Systems",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "USDA Economic Research Service", kind: "Reference", url: "https://www.ers.usda.gov/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "human-resource-management",
    name: "Human Resource Management",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on HR: staffing, training, performance management, employee relations, and compensation.",
    longDescription:
      "Human Resource Management covers the HR function: staffing and talent acquisition, training and development, performance management, employee relations, compensation and total rewards, and workplace health and safety. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Nature of Human Resources Management",
      "Staffing and Talent Acquisition",
      "Training and Development",
      "Performance Management",
      "Employee Relations and Issue Resolution",
      "Compensation and Total Rewards",
      "Health and Safety",
      "Professional Development in Human Resources",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SHRM: HR Resources", kind: "Reference", url: "https://www.shrm.org/" },
      { title: "Investopedia: Human Resources", kind: "Article", url: "https://www.investopedia.com/terms/h/humanresources.asp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "organizational-leadership",
    name: "Organizational Leadership",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on leadership in organizations: management, leadership styles, business relationships, and critical thinking.",
    longDescription:
      "Organizational Leadership covers the role of management, leadership principles, managing business relationships, human resources, critical thinking, and handling stressful situations. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Role of Management in Business",
      "Leadership",
      "Manage Business Relationships",
      "Human Resources Management",
      "Critical-Thinking Skills",
      "Manage Stressful Situations",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "MindTools: Leadership Skills", kind: "Reference", url: "https://www.mindtools.com/" },
      { title: "HBR: Leadership Articles", kind: "Article", url: "https://hbr.org/topic/leadership" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "project-management",
    name: "Project Management",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on managing projects from start to finish: initiating, planning, executing, monitoring, and closing.",
    longDescription:
      "Project Management (added for 2025-26) follows a project's life cycle: foundational concepts, initiating and planning a project, executing, monitoring, and controlling it, and closing it out. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundational Knowledge",
      "Initiating and Planning a Project",
      "Executing, Monitoring, and Controlling a Project",
      "Closing a Project",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "PMI: Project Management Basics", kind: "Reference", url: "https://www.pmi.org/about/learn-about-pmi/what-is-project-management" },
      { title: "Atlassian: Agile Coach", kind: "Course", url: "https://www.atlassian.com/agile" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "public-administration-management",
    name: "Public Administration & Management",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test on how government works: public finance, public policy and governance, and public-sector management.",
    longDescription:
      "Public Administration & Management (added for 2025-26, replacing Public Policy & Advocacy) covers public-sector fundamentals, public finance, public policy and governance, public management, communication, and ethics. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Public Finance",
      "Public Policy and Governance",
      "Communication",
      "Public Sector Fundamentals",
      "Public Management",
      "Ethics",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "ASPA: American Society for Public Administration", kind: "Reference", url: "https://www.aspanet.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-supply-chain-management",
    name: "Introduction to Supply Chain Management",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on how goods move: operations, purchasing, inventory, distribution, and transportation.",
    longDescription:
      "Introduction to Supply Chain Management (added for 2025-26, grades 9 and 10 only) covers supply chain management's role in business, operations, project management, purchasing, inventory processes, distribution, and transportation strategies. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Operations",
      "Project Management",
      "Purchasing",
      "Supply Chain Management's Role in Business",
      "Distribution",
      "Supply Chain Management Activities",
      "Inventory Processes",
      "Transportation Strategies",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "ASCM (APICS) Resource Library", kind: "Reference", url: "https://www.ascm.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-business",
    name: "Introduction to Business Concepts",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on business basics: economics, types of businesses, ownership, and careers.",
    longDescription:
      "Introduction to Business Concepts (grades 9 and 10 only) covers basic economic concepts and systems, the nature of business, cost and profit, owning a business, types of business activities, career planning, and job-search skills. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Fundamental Economic Concepts",
      "Nature of Business",
      "Economic Systems",
      "Cost/Profit Relationships",
      "Owning a Business",
      "Types of Business Activities",
      "Career Planning",
      "Job-Search Skills",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Khan Academy: Entrepreneurship & Innovation", kind: "Course", url: "https://www.khanacademy.org/college-careers-more/career-content/intro-to-business" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "intro-to-business-procedures",
    name: "Introduction to Business Procedures",
    category: "Business Management",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on office procedures: correspondence, information management, workplace protocols, and career readiness.",
    longDescription:
      "Introduction to Business Procedures (grades 9 and 10 only) covers professional communication and correspondence, information management and technology, workplace protocols and decision making, and professional development and career readiness. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Professional Communication & Correspondence",
      "Information Management & Technology",
      "Workplace Protocols & Decision Making",
      "Professional Development & Career Readiness",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    category: "Business Management",
    format: "test-then-role-play",
    description:
      "Objective test on starting and running a business, then a role play for finalists on an entrepreneurial scenario.",
    longDescription:
      "Entrepreneurship covers what it takes to start and manage a business: entrepreneurial fundamentals, finding opportunities, business venture concepts and resources, launching a new venture, and business law. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Fundamentals of Entrepreneurship",
      "Discovery Strategies",
      "Business Venture Concepts",
      "Business Venture Resources",
      "New Business Venture Activities",
      "Business Law and Regulations",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Y Combinator: Startup School (free)", kind: "Course", url: "https://www.startupschool.org/" },
      { title: "SCORE: Startup Resources", kind: "Reference", url: "https://score.org/resource/business-plan-template-startup-business" },
      { title: "Investopedia: Lean Startup", kind: "Article", url: "https://www.investopedia.com/terms/l/lean-startup.asp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "hospitality-event-management",
    name: "Hospitality & Event Management",
    category: "Business Management",
    format: "test-then-role-play",
    description:
      "Objective test on hospitality and events, then a role play for finalists on a hospitality or event scenario.",
    longDescription:
      "Hospitality & Event Management covers the hospitality industry and event management: customer relations, economics and finances, operations, product and service management, promotion and selling, and planning events. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Customer Relations",
      "Economics and Finances",
      "Information Management",
      "Operations",
      "Professional Development",
      "Product/Service Management",
      "Promotion and Selling",
      "Event Management",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "PCMA: Events Industry Resources", kind: "Reference", url: "https://www.pcma.org/resources/" },
      { title: "MPI: Meeting Professionals International", kind: "Course", url: "https://www.mpi.org/education" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "international-business",
    name: "International Business",
    category: "Business Management",
    format: "test-then-role-play",
    description:
      "Objective test on global business, then a role play for finalists on an international business scenario.",
    longDescription:
      "International Business covers how businesses operate across borders: economic concepts and systems, the nature of business, government's impact, business law, and global trade. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Fundamental Economic Concepts",
      "The Nature of Business",
      "Economic Systems",
      "Impact of Government",
      "Business Law",
      "Global Trade",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "event-planning",
    name: "Event Planning",
    category: "Business Management",
    format: "presentation",
    description:
      "Team presentation: plan a real event (organization, budget, promotion, logistics) and present the plan to judges.",
    longDescription:
      "Event Planning (expanded for 2025-26 from Introduction to Event Planning) has you present an actual event your team planned, with evidence such as its date and photos, a full income and expense budget, and how you handled challenges, showing your skills in organization, budgeting, promotion, and logistics. Chapters that used to enter American Enterprise Project or Partnership with Business Project can bring that work here. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Event Overview and Goals",
      "Planning Process and Timeline",
      "Budget Breakdown",
      "Logistics and Layout",
      "Marketing and Promotion",
      "Legal and Risk Management",
      "Execution and Evaluation",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-business-presentation",
    name: "Introduction to Business Presentation",
    category: "Business Management",
    format: "presentation",
    description:
      "Team presentation for grades 9 and 10: present the year's business topic using presentation software.",
    longDescription:
      "Introduction to Business Presentation (grades 9 and 10 only) has you develop and deliver a business presentation on the topic FBLA releases each year, using presentation software as a visual aid. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Understanding of the event topic",
      "Clear purpose and logical sequence",
      "Summary and feasible recommendations",
      "Professional slide design and formatting",
      "Credible cited sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  // --- Career Development ------------------------------------------------
  {
    slug: "intro-to-fbla",
    name: "Introduction to FBLA",
    category: "Career Development",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on FBLA itself: history, bylaws, programs, competitive events, and publications.",
    longDescription:
      "Introduction to FBLA (grades 9 and 10 only) tests your knowledge of the organization: its history, bylaws, programs, pledge, mission, goals, and creed, structure, high school competitive events, dress code, publications, deadlines, website and communications, and partners. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "FBLA History",
      "FBLA Corporate & Division Bylaws",
      "FBLA Programs",
      "FBLA Pledge, Mission, Goals, Creed",
      "FBLA High School Competitive Events",
      "FBLA Structure",
      "FBLA Dress Code",
      "FBLA Publications",
      "FBLA Deadlines",
      "FBLA Website & Communications",
      "FBLA Partners",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "FBLA Chapter Management Handbook", kind: "Reference", url: "https://www.fbla.org/" },
      { title: "FBLA Bylaws", kind: "Reference", url: "https://www.fbla.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "future-business-leader",
    name: "Future Business Leader",
    category: "Career Development",
    format: "test-and-presentation",
    description:
      "Cover letter and resume (pre-judged), an objective test on FBLA and business, then a leadership interview.",
    longDescription:
      "Future Business Leader is FBLA's premier individual award, recognizing members who combine leadership, business knowledge, and active FBLA involvement. Individual event. How it runs, in four parts: (1) you submit a cover letter (one page) and resume (up to two pages) as a PDF, judged before the conference; (2) you take a 50-minute, 100-question objective test on FBLA (its organization, bylaws and handbook, competitive event guidelines, publications, and mission, pledge, and goals) plus general business and technology knowledge; (3) a 10-minute preliminary interview with judges, with no technology or materials allowed; and (4) a 10-minute final interview for finalists. Your pre-judged, test, and preliminary interview scores are added together to choose finalists, and the final interview decides the winners.",
    duration: "50-minute test (100 questions) and a 10-minute interview (preliminary and final rounds), plus a cover letter and resume submitted before the conference",
    judgedOn: [
      "FBLA Participation and Leadership",
      "Other School and Community Organizations",
      "Areas of Outstanding Achievement",
      "Career Knowledge and Plans",
      "Greeting, Introduction and Closing",
      "Confidence, Assertiveness and Enthusiasm",
      "Verbal and Nonverbal Communication",
    ],
    topics: [
      "FBLA Organization",
      "FBLA Bylaws & Handbook",
      "FBLA National Competitive Event Guidelines",
      "FBLA National Publications",
      "FBLA Mission, Pledge and Goals",
      "General Business and Technology Knowledge",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "MindTools: Leadership Skills", kind: "Reference", url: "https://www.mindtools.com/" },
      { title: "LinkedIn Learning: Business Fundamentals", kind: "Course", url: "https://www.linkedin.com/learning/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "future-business-educator",
    name: "Future Business Educator",
    category: "Career Development",
    format: "presentation",
    description:
      "Individual presentation: write a business lesson plan (pre-judged) and teach part of it to judges.",
    longDescription:
      "Future Business Educator is for members interested in teaching business. You develop a lesson plan on the topic FBLA releases each year and then present it, showing your subject knowledge, instructional planning, and presentation skills. Individual event. How it runs: there is no test. You submit the lesson plan (no more than three pages, using FBLA's template) as a PDF, judged before the conference. In the presentation the judges play your students while you teach part of the lesson: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference your pre-judged score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus a lesson plan submitted before the conference",
    topics: [
      "Lesson Plan: Standards, Objectives and Activities",
      "Subject Matter Knowledge",
      "Material Meets Lesson Objectives",
      "Appropriate for Audience and Subject",
      "Interesting, Motivating, Creative Lesson",
      "Cited Sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "NBEA: National Business Education Association", kind: "Reference", url: "https://www.nbea.org/" },
      { title: "ACTE: Career Technical Education", kind: "Reference", url: "https://www.acteonline.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "job-interview",
    name: "Job Interview",
    category: "Career Development",
    format: "interview",
    description:
      "Submit a cover letter and resume for pre-judging, then interview for a job in front of judges.",
    longDescription:
      "Job Interview has you prepare professional application materials and then interview for a position. Individual event. How it runs: there is no test. You choose a part-time, internship, or full-time job you are (or will soon be) qualified for and submit a one-page cover letter and a resume of up to two pages as a PDF, judged before the conference. Then you complete a 10-minute interview with judges; no technology or materials may be brought in. Internet access is not provided. At the National Leadership Conference your pre-judged score and preliminary interview score are added together to choose finalists, who do a second 10-minute interview; the final interview decides the winners.",
    duration: "10-minute interview (preliminary and final rounds), plus a cover letter and resume submitted before the conference",
    topics: [
      "Cover letter and resume quality",
      "Job fit with qualifications",
      "Company and job research",
      "Thoughtful, critical-thinking answers",
      "Strengths backed by examples",
      "Career goals and motivation",
      "Greeting, delivery, and communication",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "LinkedIn: Tips for a Great LinkedIn Profile", kind: "Reference", url: "https://www.linkedin.com/business/talent/blog/talent-acquisition/tips-for-writing-a-great-linkedin-profile" },
      { title: "Glassdoor: Common Interview Questions", kind: "Reference", url: "https://www.glassdoor.com/blog/common-interview-questions/" },
      { title: "The Muse: Interview Prep Guide", kind: "Reference", url: "https://www.themuse.com/advice/interview-questions-and-answers" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "career-portfolio",
    name: "Career Portfolio",
    category: "Career Development",
    format: "presentation",
    description:
      "Individual presentation: present a professional portfolio of your skills, accomplishments, and career goals.",
    longDescription:
      "Career Portfolio (formerly Electronic Career Portfolio; the portfolio can now be physical or digital) has you build a professional portfolio around one career you choose: your resume, school and work experience, skills, awards, and certifications, plus research on the education the career requires, its salary outlook, and its challenges. You then present it to judges. Individual event. How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Resume Review with Visual Aids",
      "Career Research and Salary Data",
      "Career-Related Education and Experience",
      "Skills, Awards and Certifications",
      "Cited Sources",
      "Use of Portfolio",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  // --- Communication & Public Speaking -----------------------------------
  {
    slug: "business-communication",
    name: "Business Communication",
    category: "Communication & Public Speaking",
    format: "objective-test",
    description:
      "Objective test on workplace communication: written, verbal, and digital communication and professional relationships.",
    longDescription:
      "Business Communication covers communication basics, written and verbal communication, communicating in the workplace, and building professional interpersonal relationships. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Communication Basics",
      "Written Communication",
      "Verbal Communication",
      "Workplace Communication",
      "Interpersonal Relationships",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Purdue OWL: Business Writing", kind: "Reference", url: "https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/index.html" },
      { title: "Grammar Bytes!", kind: "Course", url: "https://chompchomp.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "journalism",
    name: "Journalism",
    category: "Communication & Public Speaking",
    format: "objective-test",
    description:
      "Objective test on journalism: news writing, editing, research, and the principles and ethics of reporting.",
    longDescription:
      "Journalism covers communication and writing skills, editing, the fundamental principles of journalism, research and investigation, and composing news stories. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Basic Communication Skills",
      "Writing Skills",
      "Editing",
      "Fundamental Principles of Journalism",
      "Research and Investigation",
      "Compose News Stories",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Poynter: Journalism Resources", kind: "Reference", url: "https://www.poynter.org/" },
      { title: "SPJ Code of Ethics", kind: "Reference", url: "https://www.spj.org/ethicscode.asp" },
      { title: "AP Stylebook Basics", kind: "Reference", url: "https://www.apstylebook.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-business-communication",
    name: "Introduction to Business Communication",
    category: "Communication & Public Speaking",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on communication basics: writing, reading, listening, speaking, and workplace communication.",
    longDescription:
      "Introduction to Business Communication (grades 9 and 10 only) covers communication basics, written communication, reading to understand, active listening, verbal communication, workplace communication, and interpersonal relationships. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Communication Basics",
      "Written Communication",
      "Reading to Understand",
      "Active Listening",
      "Verbal Communication",
      "Workplace Communication",
      "Interpersonal Relationships",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Purdue OWL: General Writing", kind: "Reference", url: "https://owl.purdue.edu/owl/general_writing/index.html" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "broadcast-journalism",
    name: "Broadcast Journalism",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Team presentation: produce and deliver a news broadcast, including a pre-recorded story of up to 2 minutes.",
    longDescription:
      "Broadcast Journalism has you research, script, and produce a news broadcast on the topic FBLA releases each year, then deliver it live to judges. The broadcast must include a pre-recorded story segment of no more than two minutes. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "2-Minute News Segment",
      "Visual and Editorial Design",
      "Production Techniques and Tools",
      "Research, Accuracy and Ethics",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SPJ Code of Ethics", kind: "Reference", url: "https://www.spj.org/ethicscode.asp" },
      { title: "Poynter: Journalism Resources", kind: "Reference", url: "https://www.poynter.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "digital-video-production",
    name: "Digital Video Production",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Team presentation: produce a video on the year's topic (pre-judged) and present it to judges.",
    longDescription:
      "Digital Video Production has you plan and produce a video on the topic FBLA releases each year, tailored to a specific audience. Team event (1 to 3 members). How it runs: there is no test. You submit a link to the video (no more than two minutes long), which is judged before the conference and played during your presentation, then present live: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference your pre-judged score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus the video submitted before the conference",
    topics: [
      "Topic and Concept Fit",
      "Film Techniques and Editing",
      "Audio and Visual Elements",
      "Logical Flow and Call to Action",
      "Copyright and Originality",
      "Tools and Development Process",
      "Video Integration in Presentation",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Film Riot: Video Production Tutorials", kind: "Video", url: "https://www.youtube.com/@FilmRiot" },
      { title: "DaVinci Resolve: Free Training", kind: "Course", url: "https://www.blackmagicdesign.com/products/davinciresolve/training" },
      { title: "YouTube Creators Channel", kind: "Course", url: "https://www.youtube.com/@YouTubeCreators" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "impromptu-speaking",
    name: "Impromptu Speaking",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Individual speech on a topic you only see on site, after 20 minutes of preparation.",
    longDescription:
      "Impromptu Speaking tests how well you think on your feet. The topic is secret until your preparation time begins. Individual event. How it runs: there is no test. You get the topic and 20 minutes to prepare with two notecards, then deliver a speech of up to 7 minutes. There is no Q&A, and no technology, reference materials, visuals, or props are allowed. At the National Leadership Conference there is a preliminary round, and the top speakers from each section advance to a final round that decides the winners.",
    duration: "20 minutes prep (topic given on site), speech up to 7 minutes, no Q&A",
    topics: [
      "Incorporates the Provided Topic",
      "Consistent Theme",
      "Accurate Supporting Information",
      "Immediate Introduction",
      "Supported Body and Transitions",
      "Effective Conclusion",
      "Extemporaneous Delivery",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Toastmasters: Public Speaking Tips", kind: "Reference", url: "https://www.toastmasters.org/resources/public-speaking-tips" },
      { title: "TED: How to Give a Great Talk", kind: "Video", url: "https://www.ted.com/playlists/574/how_to_make_a_great_presentation" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "introduction-to-public-speaking",
    name: "Introduction to Public Speaking",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Individual speech for grades 9 and 10 on the year's topic, followed by judges' questions.",
    longDescription:
      "Introduction to Public Speaking (grades 9 and 10 only) has you write and deliver a speech on the topic FBLA releases each year, building confidence, organization, and verbal communication skills. Individual event. How it runs: there is no test. You deliver a speech of up to 5 minutes, followed by 2 minutes of questions from the judges. Visual aids, props, handouts, and electronic devices are not allowed, though you may use notes you prepared. At the National Leadership Conference there is a preliminary round, and the top speakers from each section advance to a final round that decides the winners.",
    duration: "Speech up to 5 minutes, 2 minutes Q&A",
    topics: [
      "Topic and theme incorporated",
      "Clear introduction and transition",
      "Connected supporting information",
      "Conclusion tied to the topic",
      "Steady pace without filler words",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Toastmasters: Public Speaking Tips", kind: "Reference", url: "https://www.toastmasters.org/resources/public-speaking-tips" },
      { title: "TED Talks: Great Presentation Examples", kind: "Video", url: "https://www.ted.com/playlists/574/how_to_make_a_great_presentation" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "public-service-announcement",
    name: "Public Service Announcement",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Team presentation: create a 60-second PSA video on the year's topic and explain your process to judges.",
    longDescription:
      "Public Service Announcement has you research the topic FBLA releases each year, define a clear objective, and create a 60-second video PSA that raises awareness. You show the PSA to judges and explain your research and your creative and production process. All video content must be original. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic understanding and learning objective",
      "Research findings explained",
      "Design and script writing process",
      "Video and audio techniques",
      "Equipment and software used",
      "Copyright, sources, and originality",
      "PSA video shown",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Ad Council: PSA Examples", kind: "Reference", url: "https://www.adcouncil.org/campaigns" },
      { title: "Adobe Premiere Pro Tutorials", kind: "Course", url: "https://helpx.adobe.com/premiere-pro/tutorials.html" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "public-speaking",
    name: "Public Speaking",
    category: "Communication & Public Speaking",
    format: "presentation",
    description:
      "Individual prepared speech on the year's topic, followed by judges' questions.",
    longDescription:
      "Public Speaking has you write and deliver a well-structured speech on the topic FBLA releases each year. Individual event. How it runs: there is no test. You deliver a speech of up to 5 minutes, followed by 2 minutes of questions from the judges. Visual aids, props, handouts, and electronic devices are not allowed, though you may use notes you prepared. At the National Leadership Conference there is a preliminary round, and the top speakers from each section advance to a final round that decides the winners.",
    duration: "Speech up to 5 minutes, 2 minutes Q&A",
    topics: [
      "Topic and theme incorporated",
      "Clear introduction and transition",
      "Connected supporting information",
      "Conclusion tied to the topic",
      "Steady pace without filler words",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Toastmasters: Public Speaking Tips", kind: "Reference", url: "https://www.toastmasters.org/resources/public-speaking-tips" },
      { title: "TED Talks: Presentation Techniques", kind: "Video", url: "https://www.ted.com/playlists/574/how_to_make_a_great_presentation" },
      { title: "Coursera: Dynamic Public Speaking", kind: "Course", url: "https://www.coursera.org/learn/public-speaking" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  // --- Information Technology --------------------------------------------
  {
    slug: "computer-applications",
    name: "Computer Applications",
    category: "Information Technology",
    format: "production",
    description:
      "Hands-on production test: complete business tasks in word processing, spreadsheet, and presentation software.",
    longDescription:
      "Computer Applications is a hands-on production test, not a multiple-choice test. You complete real business tasks using word processing, spreadsheet, and slide presentation software, including work that integrates data across the three (for example, linking live spreadsheet data into a document or slide deck). Since 2025-26 it also covers the skills from the retired Spreadsheet Applications and Word Processing events. Individual event. How it runs: you have 2 hours to complete the production test on your own device, with internet provided. You may use the FBLA Production Test Reference Guide (from fbla.org) during the test, and you may use up to two personal devices (one primary device and one external screen). Your work is scored with a rating sheet provided on site.",
    duration: "2-hour production test (hands-on, on your own device)",
    topics: [
      "Spreadsheet Functions and Formulas",
      "Creating and Formatting with Word Processing",
      "Developing Slides & Presentations",
      "Integrating Spreadsheets and Word Processing",
      "Integrating Presentations and Spreadsheets",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Microsoft Office Help & Training", kind: "Course", url: "https://support.microsoft.com/en-us/office" },
      { title: "GCFGlobal: Excel Tutorials", kind: "Course", url: "https://edu.gcfglobal.org/en/excel/" },
      { title: "ExcelJet: Functions & Formulas", kind: "Reference", url: "https://exceljet.net/" },
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
    description:
      "Objective test on computer systems and troubleshooting: operating systems, hardware, networks, security, and mobile devices.",
    longDescription:
      "Computer Problem Solving covers troubleshooting the technology people use at work: operating systems, networks, computer hardware and connectivity, security, laptops, tablets, and mobile devices, and printers and peripherals. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Operating Systems",
      "Networks",
      "Computer Hardware and Connectivity",
      "Security",
      "Laptops, Tablets, and Mobile Devices",
      "Printers and Peripherals",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "CompTIA A+ Study Materials", kind: "Course", url: "https://www.comptia.org/certifications/a" },
      { title: "Professor Messer: A+ Free Course", kind: "Video", url: "https://www.professormesser.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "cyber-security",
    name: "Cybersecurity",
    category: "Information Technology",
    format: "objective-test",
    description:
      "Objective test on protecting systems and data: threats and vulnerabilities, network and data security, and security operations.",
    longDescription:
      "Cybersecurity covers security fundamentals, cyber threats and vulnerabilities (such as malware and phishing), secure design, network and data security, security operations, and security protocols and threat mitigation. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Security Fundamentals",
      "Cyber Threats and Vulnerabilities",
      "Security and Design",
      "Network and Data Security",
      "Security Operations and Management",
      "Security Protocols and Threat Mitigation",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Professor Messer: Security+ Free Course", kind: "Video", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/" },
      { title: "CISA: Cybersecurity Best Practices", kind: "Reference", url: "https://www.cisa.gov/topics/cybersecurity-best-practices" },
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
    description:
      "Objective test on computer networks: topologies and architecture, protocols and standards, hardware, and network security.",
    longDescription:
      "Networking Infrastructures covers networking basics, network topologies and architecture, network security, protocols and standards, and network hardware and connectivity. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Networking Basics",
      "Network Topologies and Architecture",
      "Network Security",
      "Network Protocols and Standards",
      "Network Hardware and Connectivity",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Professor Messer: Network+ Free Course", kind: "Video", url: "https://www.professormesser.com/network-plus/n10-008/n10-008-training-course/" },
      { title: "Cisco Networking Academy", kind: "Course", url: "https://www.netacad.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-information-technology",
    name: "Introduction to Information Technology",
    category: "Information Technology",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on IT basics: hardware, software, operating systems, networking, and information management.",
    longDescription:
      "Introduction to Information Technology (grades 9 and 10 only) covers computer hardware, software fundamentals and applications, operating systems, modern technologies, networking concepts, and information management. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Computer Hardware",
      "Software Fundamentals",
      "Operating Systems",
      "Software Applications",
      "Modern Technologies",
      "Networking Concepts",
      "Information Management Concepts",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Code.org: Computer Science Principles", kind: "Course", url: "https://code.org/educate/csp" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "management-information-systems",
    name: "Management Information Systems",
    category: "Information Technology",
    format: "test-then-role-play",
    description:
      "Objective test on business information systems, then a role play for finalists recommending a technology solution.",
    longDescription:
      "Management Information Systems covers how businesses use technology to manage information and make decisions: systems analysis and design, object-oriented programming concepts, data management, IT project management, IT infrastructure, and emerging technologies. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. The role play typically asks you to analyze a small business's situation and recommend an information system solution. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Systems Design and Analysis",
      "Object Oriented Programming Concepts",
      "Data and Information Management",
      "IT Project Management",
      "IT Infrastructure",
      "Emerging Business Technologies",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "MIT OpenCourseWare: Information Technology", kind: "Course", url: "https://ocw.mit.edu/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "coding-programming",
    name: "Coding & Programming",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: build a standalone program for the year's topic and demo it to judges.",
    longDescription:
      "Coding & Programming asks you to design and build a standalone application (command line, desktop, or interactive interface) that solves the problem in the topic FBLA releases each year, then present and demonstrate it to judges. The program must run standalone with no errors, and you should have documentation ready (a readme, the source code, and credit for any libraries or outside resources). It is not a test. Team event (1 to 3 members). How it runs: you present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Language Choice and Code Comments",
      "Modular, Readable Code",
      "UX Design and Accessibility",
      "Navigation and Intelligent Feature",
      "Input Validation",
      "Functionality and Output Reports",
      "Data Storage and Structures",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Codecademy: Intro to Programming", kind: "Course", url: "https://www.codecademy.com/" },
      { title: "Khan Academy: Intro to Computer Programming", kind: "Course", url: "https://www.khanacademy.org/computing/computer-programming" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "data-science-ai",
    name: "Data Science & AI",
    category: "Information Technology",
    format: "objective-test",
    description:
      "Objective test on data and artificial intelligence: statistics, data analysis, machine learning, AI basics, and AI ethics.",
    longDescription:
      "Data Science & AI (added for 2025-26) covers probability and statistics, data analysis for AI, data and AI tools, AI basics, machine learning, perception, representation, and reasoning, data literacy, and privacy and ethics. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Probability and Statistics Foundations",
      "Data Analysis and Statistics for AI",
      "Tools for Data and AI",
      "AI Basics",
      "Machine Learning",
      "Perception, Representation, and Reasoning",
      "Privacy and Ethics",
      "Data Literacy and Foundations",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Elements of AI (free course)", kind: "Course", url: "https://www.elementsofai.com/" },
      { title: "Khan Academy: Statistics & Probability", kind: "Course", url: "https://www.khanacademy.org/math/statistics-probability" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "data-analysis",
    name: "Data Analysis",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: analyze the data set FBLA provides, find trends, and present recommendations.",
    longDescription:
      "Data Analysis gives you a real data set and a business scenario each year. You analyze the data (plus your own research), find trends, and present data-backed recommendations to judges, including at least three visualizations you create yourself. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic Understanding and Terminology",
      "Depth of Data Analysis",
      "Three or More Visualizations",
      "Feasible Recommendation and Plan",
      "Accurate Statements",
      "Cited Sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Kaggle: Free Data Analysis Courses", kind: "Course", url: "https://www.kaggle.com/learn" },
      { title: "Towards Data Science: Articles", kind: "Reference", url: "https://towardsdatascience.com/" },
      { title: "ExcelJet: Excel Functions Reference", kind: "Reference", url: "https://exceljet.net/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "digital-animation",
    name: "Digital Animation",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: create an original animated video on the year's topic (pre-judged) and present it.",
    longDescription:
      "Digital Animation has you create an original animated video on the topic FBLA releases each year, showing creativity, storytelling, and animation technique. Team event (1 to 3 members). How it runs: there is no test. You submit a link to the animation (no more than two minutes long), which is judged before the conference and played during your presentation, then present live: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference your pre-judged score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus the animation submitted before the conference",
    topics: [
      "Topic Fit and Accuracy",
      "Design, Graphics and Sound",
      "Animation Quality and Editing",
      "Logical Flow and Credits",
      "Development and Production Process",
      "Software, Hardware and Techniques",
      "Copyright and Originality",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "The 12 Principles of Animation", kind: "Reference", url: "https://www.animationmentor.com/blog/the-12-principles-of-animation/" },
      { title: "Blender Guru: Free Blender Tutorials", kind: "Video", url: "https://www.youtube.com/@BlenderGuru" },
      { title: "Adobe Animate Tutorials", kind: "Course", url: "https://helpx.adobe.com/animate/tutorials.html" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "mobile-application-development",
    name: "Mobile Application Development",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: build a working mobile app for the year's topic and demo it to judges.",
    longDescription:
      "Mobile Application Development asks you to design and build a functional mobile app for the topic FBLA releases each year, then present it to judges, showing its user interface design and how it solves the problem. The app must run standalone on a smartphone platform (Android, iOS, or Windows Phone) with no programming errors. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Planning process and documents",
      "Classes, modules, and architecture",
      "Innovation and creativity",
      "UX design and input validation",
      "Fully addresses the prompt",
      "Social media integration",
      "Secure data handling and storage",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Apple Human Interface Guidelines", kind: "Reference", url: "https://developer.apple.com/design/human-interface-guidelines/" },
      { title: "Material Design (Google)", kind: "Reference", url: "https://m3.material.io/" },
      { title: "Flutter Official Documentation", kind: "Course", url: "https://docs.flutter.dev/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "website-coding-development",
    name: "Website Coding & Development",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: code a functional website from scratch for the year's topic and demo it to judges.",
    longDescription:
      "Website Coding & Development asks you to build a website for the topic FBLA releases each year, with the main focus on coding and functionality (it must be coded from scratch, and templates are not permitted), then present it to judges. The site should be responsive across desktop, tablet, and mobile. Website Design is the companion event focused on visual design. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Clean original code, no templates",
      "Usability, accessibility, and navigation",
      "Color, fonts, and graphics",
      "Topic content, grammar, and sources",
      "Advanced coding skills",
      "Works across multiple devices",
      "Consistent pages, error-free interactivity",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "MDN Web Docs: Web Technology Reference", kind: "Reference", url: "https://developer.mozilla.org/en-US/" },
      { title: "freeCodeCamp: Free Web Dev Courses", kind: "Course", url: "https://www.freecodecamp.org/" },
      { title: "web.dev: Modern Web Development (Google)", kind: "Course", url: "https://web.dev/learn/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "computer-game-simulation-programming",
    name: "Computer Game & Simulation Programming",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: build a game or simulation for the year's topic and demo it to judges.",
    longDescription:
      "Computer Game & Simulation Programming asks you to design and develop an interactive game or simulation on the topic FBLA releases each year, then present and demonstrate it to judges. The game should have a title screen, clear rules, and multiple outcomes, and be challenging but possible to complete. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Concept, Rules and Topic Fit",
      "Challenge and Multiple Outcomes",
      "Innovation and Creativity",
      "Tools and Technical Implementation",
      "Graphics, Assets and Design",
      "Title Screen and UX Design",
      "Intuitive Controls and Mechanics",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-programming",
    name: "Introduction to Programming",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation for grades 9 and 10: build a basic program for the year's topic and demo it to judges.",
    longDescription:
      "Introduction to Programming (grades 9 and 10 only) asks you to design and build a basic computer program for the topic FBLA releases each year, using any language, and present it to judges. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Code comments and modular structure",
      "Intuitive interface and navigation",
      "User input validation",
      "Fully addresses the prompt",
      "Presentable output reports",
      "Data storage and variable use",
      "Complete documentation and attribution",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "network-design",
    name: "Network Design",
    category: "Information Technology",
    format: "test-then-role-play",
    description:
      "Objective test on networking, then a role play for finalists designing a network solution for a business.",
    longDescription:
      "Network Design covers planning, installing, configuring, securing, and administering networks, plus network protocols, services, and access. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. The role play asks you to design a network solution that meets an organization's needs. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Network Installation and Configuration",
      "Network Security and Recovery",
      "Network Administration",
      "Network Planning",
      "Network Protocols, Services, and Access",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "technology-support-services",
    name: "Technology Support & Services",
    category: "Information Technology",
    format: "test-then-role-play",
    description:
      "Objective test on IT support, then a role play for finalists where you solve a help desk problem.",
    longDescription:
      "Technology Support & Services (formerly Help Desk) covers IT fundamentals, service desk operations, hardware and software troubleshooting, and IT management and administration. Individual event. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "IT Fundamentals",
      "Service Desk Operations",
      "Hardware and Software Troubleshooting",
      "IT Management and Administration",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "website-design",
    name: "Website Design",
    category: "Information Technology",
    format: "presentation",
    description:
      "Team presentation: design a user-friendly website for the year's topic and present it to judges.",
    longDescription:
      "Website Design asks you to create a website for the topic FBLA releases each year, with the emphasis on front-end design: layout, navigation, look and feel, and user experience. The site must work correctly on at least three platforms, such as desktop, tablet, and mobile. Website Coding & Development is the companion event focused on code and functionality. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Planning, development, and implementation",
      "Required elements on topic",
      "UX design and accessibility",
      "Grammar and cited sources",
      "Multi-platform compatibility",
      "Error-free interactivity, consistent pages",
      "Planned success metrics",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  // --- Marketing & Sales -------------------------------------------------
  {
    slug: "marketing",
    name: "Marketing",
    category: "Marketing & Sales",
    format: "test-then-role-play",
    description:
      "Objective test on marketing concepts, then a role play for finalists on a marketing problem.",
    longDescription:
      "Marketing covers marketing fundamentals and planning, marketing research (marketing-information management), product and service management, channels, pricing, promotion, and selling. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Marketing Fundamentals",
      "Market Planning",
      "Marketing-Information Management",
      "Product/Service Management",
      "Channel Management",
      "Pricing",
      "Promotion",
      "Selling",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "HubSpot Academy: Marketing", kind: "Course", url: "https://academy.hubspot.com/courses?topics=marketing" },
      { title: "Coursera: Intro to Marketing (Wharton)", kind: "Course", url: "https://www.coursera.org/learn/wharton-marketing" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "advertising",
    name: "Advertising",
    category: "Marketing & Sales",
    format: "objective-test",
    description:
      "Objective test on advertising: branding, promotion, creating marketing content, design principles, and sales promotion.",
    longDescription:
      "Advertising covers branding, promotion, creating advertisements and marketing content, design principles, and sales-promotion activities. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Branding",
      "Promotion",
      "Advertisement",
      "Develop Marketing Content",
      "Design Principles",
      "Sales-Promotion Activities",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Google Skillshop: Ads Certifications", kind: "Course", url: "https://skillshop.withgoogle.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-marketing-concepts",
    name: "Introduction to Marketing Concepts",
    category: "Marketing & Sales",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on marketing basics: products, channels, pricing, promotion, and selling.",
    longDescription:
      "Introduction to Marketing Concepts (grades 9 and 10 only) covers marketing fundamentals, product and service management, channel management, marketing information, pricing, promotion, and selling. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Marketing Fundamentals",
      "Product/Service Management",
      "Channel Management",
      "Marketing-Information Management",
      "Pricing",
      "Promotion",
      "Selling",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "HubSpot Academy: Marketing", kind: "Course", url: "https://academy.hubspot.com/courses?topics=marketing" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-retail-merchandising",
    name: "Introduction to Retail & Merchandising",
    category: "Marketing & Sales",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on retail basics: customer service, stock handling, inventory, and visual merchandising.",
    longDescription:
      "Introduction to Retail & Merchandising (added for 2025-26, grades 9 and 10 only) covers foundational retail knowledge, customer service and sales, stock handling, inventory storage and control, visual merchandising and displays, and retail careers. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundational Retail Knowledge",
      "Customer Service and Sales",
      "Stock-Handling Procedures",
      "Inventory Storage and Control",
      "Career Opportunities",
      "Visual Merchandising",
      "Display Techniques",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "NRF: National Retail Federation Resources", kind: "Reference", url: "https://nrf.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "retail-management",
    name: "Retail Management",
    category: "Marketing & Sales",
    format: "objective-test",
    description:
      "Objective test on retail operations and strategy: selling, pricing, inventory control, merchandising, and product mix.",
    longDescription:
      "Retail Management (added for 2025-26) covers core retail operations and strategy: selling, pricing, market planning, warehousing and transportation, inventory control, visual merchandising and displays, and product mix. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundational Retail Knowledge",
      "Selling",
      "Pricing",
      "Market Planning",
      "Warehousing and Transportation",
      "Inventory Control",
      "Visual Merchandising",
      "Display Techniques",
      "Product Mix",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "NRF: National Retail Federation Resources", kind: "Reference", url: "https://nrf.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "sports-entertainment-management",
    name: "Sports & Entertainment Management",
    category: "Marketing & Sales",
    format: "test-then-role-play",
    description:
      "Objective test on the sports and entertainment business, then a role play for finalists.",
    longDescription:
      "Sports & Entertainment Management covers the business side of sports and entertainment: management and marketing fundamentals, pricing, advertising, publicity and public relations, sales promotion, event planning, and distribution. Team event (1 to 3 members). Every member takes the test on their own and the team's scores are averaged. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Fundamentals of Sports/Entertainment Management & Marketing",
      "Product/Service Management",
      "Pricing",
      "Advertising Basics",
      "Publicity and Public Relations",
      "Sales Promotion",
      "The Sports/Entertainment Management & Marketing Environment",
      "Event Planning",
      "Sports/Event Distribution",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SportsBusiness Journal: Articles", kind: "Reference", url: "https://www.sportsbusinessjournal.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "business-plan",
    name: "Business Plan",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation: write a business plan for a new business, submit it for pre-judging, and pitch it to judges.",
    longDescription:
      "Business Plan asks you to develop a complete plan for launching a new business. The business must not have been operating for more than 12 months before your first level of competition. Team event (1 to 3 members). How it runs: there is no test. First you submit the written plan as a PDF report (no more than 17 pages, following the rating sheet sequence, with no links or QR codes), which is judged before the conference. Then you present live: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference your report score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus a written report submitted before the conference",
    topics: [
      "Business Concept and Company Profile",
      "Industry, Market and Competition",
      "Marketing and Sales Strategy",
      "Operations and Management",
      "Financial Documents and Projections",
      "Risks and Long-Term Goals",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "SBA.gov: Business Plan Guide", kind: "Reference", url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan" },
      { title: "SCORE: Business Plan Template", kind: "Reference", url: "https://score.org/resource/business-plan-template-startup-business" },
      { title: "HBR: How to Write a Great Business Plan", kind: "Article", url: "https://hbr.org/1997/07/how-to-write-a-great-business-plan" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
    popular: true,
  },
  {
    slug: "graphic-design",
    name: "Graphic Design",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation: create original designs for the year's branding brief and walk judges through them.",
    longDescription:
      "Graphic Design has you create original visual content for the brief FBLA releases each year and present your designs and design process to judges, showing design principles, software skills, and visual communication. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic and Materials Described",
      "Design Process and Principles",
      "Audience Interest and Appeal",
      "Programs and Tools Used",
      "Consistency With Theme",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Adobe Graphic Design Learning", kind: "Course", url: "https://www.adobe.com/learn/graphic-design.html" },
      { title: "Canva Design School", kind: "Course", url: "https://www.canva.com/learn/design/" },
      { title: "Awwwards: Design Inspiration", kind: "Reference", url: "https://www.awwwards.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "publication-design",
    name: "Visual Design",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation: create original visual design work for the year's topic and present it to judges.",
    longDescription:
      "Visual Design has you develop original visual content for the topic FBLA releases each year and present it to judges, explaining your design principles, visual communication choices, and creative process. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic and materials described",
      "Design principles applied",
      "Technical design tool skills",
      "Clear visual communication",
      "Creative process explained",
      "Design consistent with theme",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Adobe InDesign Tutorials", kind: "Course", url: "https://helpx.adobe.com/indesign/tutorials.html" },
      { title: "Smashing Magazine: Typography", kind: "Reference", url: "https://www.smashingmagazine.com/category/typography/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "social-media-strategies",
    name: "Social Media Strategies",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation: design a multi-platform social media campaign for the year's business case.",
    longDescription:
      "Social Media Strategies asks you to build a social media marketing campaign across multiple platforms for the business case FBLA releases each year, showing how you would engage the audience, keep content cohesive, and measure performance. You present at least three posts across multiple platforms and drive the campaign toward a clear call to action. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Campaign fits topic and audience",
      "Social media strategies and metrics",
      "Research and methodology",
      "Content design and development",
      "Clear call-to-action",
      "Three posts across multiple platforms",
      "Credible cited sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "HubSpot: Social Media Marketing Certification", kind: "Course", url: "https://academy.hubspot.com/courses/social-media-marketing" },
      { title: "Meta Blueprint: Free Social Media Courses", kind: "Course", url: "https://www.facebook.com/business/learn" },
      { title: "Google Digital Garage", kind: "Course", url: "https://learndigital.withgoogle.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "customer-service",
    name: "Customer Service",
    category: "Marketing & Sales",
    format: "test-then-role-play",
    description:
      "Objective test on serving customers, then a role play for finalists where you handle a customer situation live.",
    longDescription:
      "Customer Service (formerly Client Service, with an objective test added for 2025-26) covers building positive customer relationships, emotional intelligence, resolving conflict, delivering on a brand promise, customer relationship management, and sales techniques. Individual event. How it runs: everyone first takes a 50-minute, 100-question multiple-choice objective test. At the National Leadership Conference the top 15 test scores advance to the final round, a role play: you get a business scenario, 20 minutes to prepare with two notecards, and then 7 minutes to present your solution to judges, who can ask questions during the role play. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15): 20 minutes prep, then a 7-minute role play",
    topics: [
      "Fostering Positive Relationships",
      "Emotional Intelligence",
      "Conflict Resolution",
      "Delivering on a Brand Promise",
      "Customer Relationship Management",
      "Sales Processes and Techniques",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "intro-to-social-media-strategy",
    name: "Introduction to Social Media Strategy",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation for grades 9 and 10: plan a social media campaign on a single platform for the year's topic.",
    longDescription:
      "Introduction to Social Media Strategy (grades 9 and 10 only) asks you to create a campaign on one social media platform for the topic FBLA releases each year, including three original ads, and to explain your strategy, content, and the metrics you would track. Team event (1 to 3 members). How it runs: there is no test. You present to judges: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A",
    topics: [
      "Topic understanding and terminology",
      "Social media strategy and metrics",
      "Design and development process",
      "One-platform campaign with three ads",
      "Credible cited sources",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "sales-presentation",
    name: "Sales Presentation",
    category: "Marketing & Sales",
    format: "presentation",
    description:
      "Team presentation: sell a product or service of your choice to judges in an interactive sales call.",
    longDescription:
      "Sales Presentation has you sell a product or service of your choice, bringing your own materials and merchandise. The presentation is interactive: the judges play the customer, so you are expected to engage them, handle their questions, and close the sale. Team event (1 to 3 members). How it runs: there is no test. You get 3 minutes to set up and 7 minutes for the interactive presentation, with no separate Q&A period. Internet access is not provided. At the National Leadership Conference there is a preliminary round, and the top scorers from each section advance to a final round, where the final presentation score decides the winners.",
    duration: "3 minutes setup, 7-minute interactive presentation (no separate Q&A)",
    topics: [
      "Greeting and opening",
      "Determining customer needs",
      "Presenting the product or service",
      "Overcoming objections",
      "Suggestion selling",
      "Closing the sale",
      "Building the customer relationship",
      "Delivery and answering questions",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  // --- Service & Leadership ----------------------------------------------
  {
    slug: "intro-to-parliamentary-procedure",
    name: "Introduction to Parliamentary Procedure",
    category: "Service & Leadership",
    format: "objective-test",
    description:
      "Objective test for grades 9 and 10 on running meetings: motions, terminology, order of business, and voting.",
    longDescription:
      "Introduction to Parliamentary Procedure (grades 9 and 10 only) covers the foundations and terminology of parliamentary procedure, meeting structure and order of business, handling a main motion, classifying motions, and voting and elections. How it runs: this is an individual objective test and nothing else. You take a proctored, online test of 100 multiple-choice questions in 50 minutes. Study materials are not allowed, and a calculator is built into the testing platform. Each correct answer is worth one point with no penalty for wrong answers, and your test score is your result.",
    duration: "50-minute online test, 100 multiple-choice questions",
    topics: [
      "Foundations of Parliamentary Procedure",
      "Parliamentary Terminology",
      "Meeting Structure and Order of Business",
      "Handling a Main Motion",
      "Classification of Motions",
      "Voting and Elections",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Robert's Rules of Order (official)", kind: "Reference", url: "https://www.robertsrules.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    contentStatus: "complete",
  },
  {
    slug: "business-ethics",
    name: "Business Ethics",
    category: "Service & Leadership",
    format: "test-and-presentation",
    description:
      "Team event: an objective test, a pre-judged executive summary, and a presentation on the year's ethics case.",
    longDescription:
      "Business Ethics asks your team to analyze an ethical dilemma that businesses face (FBLA releases the case each year) and present a solution. Team event (1 to 3 members). How it runs, in four parts: (1) you submit an executive summary (no more than three pages) as a PDF, judged before the conference, which must reflect interviews with three local businesspeople; (2) each member takes a 50-minute, 100-question objective test, and the team's scores are averaged; (3) a preliminary presentation: 3 minutes to set up, 7 minutes to present, and 3 minutes of questions; and (4) a final presentation for finalists. Internet access is provided only for the test. Your pre-judged score, averaged test score, and preliminary presentation score are added together to choose finalists, and the final presentation decides the winners.",
    duration: "50-minute test (100 questions); 3 minutes setup, 7-minute presentation, 3 minutes Q&A; plus an executive summary submitted before the conference",
    judgedOn: [
      "Identifies and Defines the Ethical Issues",
      "Explains Why the Issues Happened",
      "Logical Recommendations to Resolve Them",
      "Safeguards That Would Have Prevented Them",
      "Research, Including Businesspeople Interviewed",
      "Cites Legitimate Sources",
      "Organized, Clearly Stated Delivery",
      "Confidence, Body Language and Voice",
    ],
    topics: [
      "Communication Skills",
      "Self-Awareness",
      "Doing the Right Thing",
      "Teamwork Skills",
      "Leadership Skills",
      "Career Readiness",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Institute of Business Ethics", kind: "Reference", url: "https://www.ibe.org.uk/" },
      { title: "Markkula Center: Ethical Decision Making", kind: "Reference", url: "https://www.scu.edu/ethics/ethics-resources/ethical-decision-making/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "community-service-project",
    name: "Community Service Project",
    category: "Service & Leadership",
    format: "chapter-event",
    description:
      "Chapter event: document your chapter's service project in a pre-judged report and present its impact.",
    longDescription:
      "Community Service Project is a chapter event that showcases a service initiative your chapter ran to meet a need in your school or community. The project must involve active chapter participation and show real impact. Chapter event presented by a team of 1 to 3 members; chapter events do not count against a member's one individual or team event. How it runs: there is no test. You submit a report (no more than 17 pages, with no links or QR codes) as a PDF, judged before the conference, then present live: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference your pre-judged score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus a report submitted before the conference",
    topics: [
      "Project Development and Strategies",
      "Community Needs Research",
      "Chapter Member Involvement",
      "Community Impact",
      "Publicity and Recognition",
      "Project Evaluation",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Points of Light", kind: "Reference", url: "https://www.pointsoflight.org/" },
      { title: "Council of Nonprofits Resources", kind: "Reference", url: "https://www.councilofnonprofits.org/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "parliamentary-procedure",
    name: "Parliamentary Procedure",
    category: "Service & Leadership",
    format: "test-then-role-play",
    description:
      "Team objective test on parliamentary law, then finalists run a mock chapter meeting as a role play.",
    longDescription:
      "Parliamentary Procedure tests how well your team can run an orderly, efficient meeting, based on Robert's Rules of Order, Newly Revised (12th edition). Team event (4 or 5 members). How it runs: every member first takes a 50-minute, 100-question objective test, and the team's scores are averaged. At the National Leadership Conference the top 15 teams advance to the role play: you receive a scenario that simulates a regular chapter meeting, get 20 minutes to prepare (parliamentary reference materials are allowed during prep only, and no scripts), and then conduct the meeting in front of judges for up to 10 minutes. Only the role play score decides the winners; the test score is used to break ties. At regional and state levels some states run only the test, so check your state's rules.",
    duration: "Test: 50 minutes, 100 multiple-choice questions. Finals (top 15 teams): 20 minutes prep, then a 10-minute mock meeting",
    topics: [
      "Foundations of Parliamentary Procedure",
      "Parliamentary Terminology",
      "Meeting Structure and Order of Business",
      "Handling Motions and Rules of Debate",
      "Classification of Motions",
      "Voting, Elections, and Nominations",
      "Boards and Committees",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
      { title: "Robert's Rules of Order (official)", kind: "Reference", url: "https://www.robertsrules.com/" },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
  {
    slug: "local-chapter-annual-business-report",
    name: "Local Chapter Annual Business Report",
    category: "Service & Leadership",
    format: "chapter-event",
    description:
      "Chapter event: document your chapter's year and Program of Work in a pre-judged report and present it.",
    longDescription:
      "Local Chapter Annual Business Report is a chapter event that documents your chapter's Program of Work and accomplishments for the year (from the end of one State Leadership Conference to the end of the next): its goals, activities, and overall impact. Chapter event presented by a team of 1 to 3 members; chapter events do not count against a member's one individual or team event. How it runs: there is no test. You submit a report (no more than 17 pages, with no links or QR codes) as a PDF, judged before the conference, then present live: 3 minutes to set up, a 7-minute presentation, and 3 minutes of questions. Internet access is not provided. At the National Leadership Conference your pre-judged score is added to your preliminary presentation score to decide who advances to the final round, and the final presentation decides the winners.",
    duration: "3 minutes setup, 7-minute presentation, 3 minutes Q&A, plus a report submitted before the conference",
    topics: [
      "Program of work and yearly activities",
      "Member-focused chapter activities",
      "State, national, and community service",
      "Conferences and recognition earned",
      "President remarks and membership data",
      "Report format and documentation",
      "Delivery and Q&A",
    ],
    studyResources: [
      { title: "FBLA Competitive Events Guidelines", kind: "FBLA Guide", url: FBLA_EVENT_PAGE },
    ],
    rubricUrl: FBLA_EVENT_PAGE,
    isTeam: true,
    contentStatus: "complete",
  },
];

export function getCompetition(slug: string): Competition | undefined {
  return COMPETITIONS.find((c) => c.slug === slug);
}

export function getPopularCompetitions(): Competition[] {
  return COMPETITIONS.filter((c) => c.popular);
}

/**
 * Formats that include a 100-question multiple-choice objective test, so an AI
 * practice test is useful. Role play and test + presentation events count:
 * every competitor takes the test first. Exported so the coach's picker, the
 * detail page, and the marketing counts read from ONE definition: the landing
 * page used to hardcode "55 competitions / 34 AI events" and both had silently
 * drifted from the registry.
 */
export const AI_TESTABLE_FORMATS: readonly CompetitionFormat[] = [
  "objective-test",
  "test-then-role-play",
  "test-and-presentation",
];

/** True when the event's format includes a multiple-choice objective test. */
export function hasObjectiveTest(c: Competition): boolean {
  return AI_TESTABLE_FORMATS.includes(c.format);
}

/** An event is AI-testable when it has real content AND a testable format. */
export function isAiTestable(c: Competition): boolean {
  return c.contentStatus === "complete" && hasObjectiveTest(c);
}

/** Quick stats for the marketing site. */
export const COMPETITION_STATS = {
  total: COMPETITIONS.length,
  withContent: COMPETITIONS.filter((c) => c.contentStatus === "complete").length,
  categories: CATEGORIES.length,
  /** Events the AI practice test generator supports. Drives marketing copy. */
  aiEligible: COMPETITIONS.filter(isAiTestable).length,
};
