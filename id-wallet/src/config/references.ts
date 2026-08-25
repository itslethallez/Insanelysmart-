/** Every calculator input that is not typed by the business must point here. */

export type Reference = {
  id: string;
  title: string;
  publisher: string;
  year: string;
  url: string;
  usedFor: string;
};

export const REFERENCES = {
  asbfeoSa: {
    id: "asbfeo-sa-2024",
    title: "Location of Australia's small businesses by state and territory",
    publisher: "Australian Small Business and Family Enterprise Ombudsman (based on ABS customised data)",
    year: "2024",
    url: "https://www.asbfeo.gov.au/sites/default/files/2024-04/Location%20of%20Australia%E2%80%99s%20small%20businesses%20by%20state%20and%20territory.pdf",
    usedFor:
      "Market size: 155,221 small businesses in South Australia and 118,344 in Greater Adelaide at 30 June 2023 (0–19 employees).",
  },
  absBusinessSize: {
    id: "abs-cab-2024-25",
    title: "Characteristics of Australian Business",
    publisher: "Australian Bureau of Statistics",
    year: "2024–25",
    url: "https://www.abs.gov.au/statistics/industry/technology-and-innovation/characteristics-australian-business/latest-release",
    usedFor: "Business size bands: micro (0–4), small (5–19), medium (20–199).",
  },
  clerksAward: {
    id: "fairwork-ma000002",
    title: "Clerks—Private Sector Award pay guide (MA000002)",
    publisher: "Fair Work Ombudsman / Fair Work Commission",
    year: "2026–27",
    url: "https://calculate.fairwork.gov.au/Download/AwardSummary?awardCode=ma000002",
    usedFor:
      "Admin labour rate: Level 2, year 1 adult hourly rate of $29.45 from the first full pay period on or after 1 July 2026.",
  },
  superGuarantee: {
    id: "ato-super-sg",
    title: "Super guarantee percentage",
    publisher: "Australian Taxation Office",
    year: "2025–",
    url: "https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds",
    usedFor: "12% Super Guarantee loaded on top of the award hourly rate when costing replacement admin labour.",
  },
  airtaskerFounderTax: {
    id: "airtasker-founder-tax",
    title: "Founder Tax: the hidden tasks costing business owners thousands every year",
    publisher: "Airtasker national founder survey, reported by The Times Australia",
    year: "2025",
    url: "https://thetimes.com.au/business-news/51941-founder-tax-the-hidden-tasks-costing-business-owners-thousands-every-year",
    usedFor:
      "Default admin time if the owner is unsure: 2.7 hrs/week admin + 2.2 hrs/week accounting. Working year of 48 weeks (their survey used 48.84).",
  },
  ampAdmin: {
    id: "amp-bank-admin-2025",
    title: "Time burden of financial admin on small businesses",
    publisher: "AMP Bank",
    year: "2025",
    url: "https://www.amp.com.au/about-amp/news/2025/march/3-in-5-Aussie-small-business-owners-sacrificing-personal-time-to-get-on-top-of-financial-admin",
    usedFor:
      "Context: 3 in 5 Australian small business owners sacrifice personal time for financial admin; ~2.4 million businesses are self-employed or have 1–4 staff.",
  },
  mitLeadResponse: {
    id: "mit-insidesales-2007",
    title: "Lead Response Management Study",
    publisher: "Dr James Oldroyd / MIT Sloan with InsideSales.com",
    year: "2007",
    url: "https://web.archive.org/web/20090529010553/http://www.leadresponsemanagement.org/mit_study",
    usedFor:
      "Speed-to-lead: odds of qualifying a lead drop 21× if you call at 30 minutes instead of 5 minutes; odds of making contact drop 100×.",
  },
  hbrLeads: {
    id: "hbr-leads-2011",
    title: "The Short Life of Online Sales Leads",
    publisher: "Harvard Business Review (Oldroyd, McElheran, Elkington)",
    year: "2011",
    url: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    usedFor:
      "Firms that tried to contact a lead within an hour were nearly 7× as likely to qualify it as those that waited even an hour later.",
  },
  atoDeductions: {
    id: "ato-business-deductions",
    title: "Business deductions",
    publisher: "Australian Taxation Office",
    year: "current",
    url: "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/income-and-deductions-for-business/deductions",
    usedFor: "Most expenses incurred in carrying on a business, if related to earning assessable income, are deductible.",
  },
  atoDigital: {
    id: "ato-digital-products",
    title: "Deductions for digital product expenses",
    publisher: "Australian Taxation Office",
    year: "current",
    url: "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/income-and-deductions-for-business/deductions/deductions-for-digital-product-expenses",
    usedFor:
      "Software subscription fees and similar digital operating expenses are generally deductible in the year incurred. Custom in-house software can be capital — owners should confirm with their accountant.",
  },
  atoCompanyTax: {
    id: "ato-company-tax",
    title: "Company tax rates",
    publisher: "Australian Taxation Office",
    year: "current",
    url: "https://www.ato.gov.au/tax-rates-and-codes/company-tax-rates",
    usedFor: "25% company tax rate for base-rate entities, used only as an illustration of after-tax cost. Not advice.",
  },
} as const satisfies Record<string, Reference>;

export const REFERENCE_LIST: Reference[] = Object.values(REFERENCES);
