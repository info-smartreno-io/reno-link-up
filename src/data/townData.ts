/**
 * Enhanced town data structure with SEO metadata and local information
 * Each town includes population, median home value, zip codes, and SEO content
 * 
 * Total Coverage: 70 towns across 5 Northern NJ counties
 */

import { essexTowns } from './essexTowns';

export interface TownData {
  name: string;
  slug: string;
  county: string;
  countySlug: string;
  zipCodes: string[];
  population?: string;
  medianHomeValue?: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  introText: string;
  featuredProjects?: string[];
  localInsights?: string[];
}

// Bergen County Towns
export const bergenTowns: TownData[] = [
  {
    name: "Ridgewood",
    slug: "ridgewood",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07450", "07451"],
    population: "25,979",
    medianHomeValue: "$725,000",
    metaTitle: "Home Renovations in Ridgewood, NJ | Kitchen, Bathroom & Addition Remodeling",
    metaDescription: "Expert home renovation services in Ridgewood, Bergen County. Free estimates for kitchen remodels, bathroom upgrades, additions & more. Vetted local contractors.",
    h1: "Home Renovations in Ridgewood, New Jersey",
    introText: "SmartReno connects Ridgewood homeowners with vetted local contractors for kitchen remodels, bathroom renovations, basement finishing, home additions, and exterior improvements. Get a free estimate and competitive bids from trusted professionals serving Bergen County.",
    featuredProjects: ["Kitchen Remodeling", "Master Bathroom Renovation", "Home Additions"],
    localInsights: [
      "Ridgewood's historic homes often require specialized renovation expertise",
      "Popular projects include kitchen modernizations and bathroom updates",
      "Village zoning requires permits for most renovation work"
    ]
  },
  {
    name: "Paramus",
    slug: "paramus",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07652", "07653"],
    population: "26,698",
    medianHomeValue: "$565,000",
    metaTitle: "Paramus NJ Home Renovations | Kitchen & Bathroom Remodeling Contractors",
    metaDescription: "Transform your Paramus home with expert renovation services. Free estimates for kitchen, bathroom, basement & addition projects. Vetted Bergen County contractors.",
    h1: "Professional Home Renovations in Paramus, NJ",
    introText: "Paramus homeowners trust SmartReno for quality home renovations. From modern kitchen remodels to luxurious bathroom upgrades and home additions, we connect you with Bergen County's best contractors for competitive pricing and expert craftsmanship.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Basement Finishing"],
    localInsights: [
      "Paramus homes benefit from basement finishing projects",
      "Kitchen and bathroom updates add significant home value",
      "Bergen County permit requirements apply to most projects"
    ]
  },
  {
    name: "Mahwah",
    slug: "mahwah",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07430"],
    population: "25,890",
    medianHomeValue: "$615,000",
    metaTitle: "Mahwah NJ Home Renovation Contractors | Kitchen, Bathroom & Addition Experts",
    metaDescription: "Quality home renovations in Mahwah, Bergen County. Free estimates for kitchen remodels, bathroom upgrades, additions and more from vetted local contractors.",
    h1: "Home Renovation Services in Mahwah, New Jersey",
    introText: "SmartReno brings professional renovation services to Mahwah homeowners. Whether you're planning a kitchen remodel, bathroom renovation, home addition, or exterior improvement, get free estimates from Bergen County's top-rated contractors.",
    featuredProjects: ["Kitchen Remodeling", "Bathroom Renovations", "Home Additions"],
    localInsights: [
      "Mahwah's spacious homes are ideal for addition projects",
      "Popular renovations include kitchen modernizations",
      "Local contractors familiar with Bergen County building codes"
    ]
  },
  {
    name: "Fair Lawn",
    slug: "fair-lawn",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07410"],
    population: "33,644",
    medianHomeValue: "$485,000",
    metaTitle: "Fair Lawn NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Expert home renovation contractors in Fair Lawn, Bergen County. Free estimates for kitchen, bathroom, basement & addition projects. Competitive pricing guaranteed.",
    h1: "Fair Lawn Home Renovation Experts",
    introText: "Transform your Fair Lawn home with SmartReno's network of vetted contractors. We specialize in kitchen remodels, bathroom renovations, basement finishing, and home additions throughout Bergen County.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Upgrades", "Basement Finishing"],
    localInsights: [
      "Fair Lawn homes often feature basement renovation opportunities",
      "Kitchen and bathroom remodels are most requested",
      "Competitive pricing from multiple Bergen County contractors"
    ]
  },
  {
    name: "Fort Lee",
    slug: "fort-lee",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07024"],
    population: "40,191",
    medianHomeValue: "$525,000",
    metaTitle: "Fort Lee NJ Renovation Contractors | Kitchen, Bathroom & Condo Remodeling",
    metaDescription: "Professional home and condo renovations in Fort Lee, Bergen County. Free estimates for kitchen, bathroom and interior remodeling. Vetted local contractors.",
    h1: "Fort Lee Home & Condo Renovation Services",
    introText: "Fort Lee residents choose SmartReno for expert home and condo renovations. From modern kitchens to spa-like bathrooms, our vetted Bergen County contractors deliver quality craftsmanship at competitive prices.",
    featuredProjects: ["Condo Renovations", "Kitchen Remodeling", "Bathroom Updates"],
    localInsights: [
      "Fort Lee condo renovations require board approval",
      "Modern kitchen and bathroom updates are most popular",
      "High-rise renovation expertise available"
    ]
  },
  {
    name: "Tenafly",
    slug: "tenafly",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07670"],
    population: "15,409",
    medianHomeValue: "$875,000",
    metaTitle: "Tenafly NJ Home Renovations | Luxury Kitchen & Bathroom Remodeling",
    metaDescription: "Upscale home renovations in Tenafly, Bergen County. Expert kitchen remodels, bathroom upgrades, additions & more. Free estimates from vetted contractors.",
    h1: "Luxury Home Renovations in Tenafly, NJ",
    introText: "Tenafly's distinguished homes deserve expert craftsmanship. SmartReno connects you with Bergen County's premier contractors for high-end kitchen remodels, luxurious bathroom renovations, and custom home additions.",
    featuredProjects: ["Luxury Kitchen Remodeling", "Master Bath Suites", "Custom Additions"],
    localInsights: [
      "Tenafly homes often feature high-end renovation projects",
      "Historic home renovations require specialized expertise",
      "Borough permits required for most renovation work"
    ]
  },
  {
    name: "Englewood",
    slug: "englewood",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07631"],
    population: "29,308",
    medianHomeValue: "$595,000",
    metaTitle: "Englewood NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Professional home renovation services in Englewood, Bergen County. Free estimates for kitchen, bathroom, basement & addition projects from vetted contractors.",
    h1: "Home Renovation Services in Englewood, New Jersey",
    introText: "Englewood homeowners trust SmartReno for quality renovations. From modern kitchen remodels to luxurious bathroom upgrades and home additions, we connect you with Bergen County's best contractors for expert craftsmanship.",
    localInsights: [
      "Englewood's diverse architecture requires flexible expertise",
      "Kitchen and bathroom modernizations most popular",
      "Local contractors familiar with city requirements"
    ]
  },
  {
    name: "Hackensack",
    slug: "hackensack",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07601"],
    population: "46,030",
    medianHomeValue: "$445,000",
    metaTitle: "Hackensack NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Hackensack, Bergen County. Free estimates for kitchen, bathroom and basement projects from vetted local contractors.",
    h1: "Hackensack Home Renovation Experts",
    introText: "Transform your Hackensack home with SmartReno's network of vetted contractors. We specialize in kitchen remodels, bathroom renovations, basement finishing, and home additions throughout Bergen County.",
    localInsights: [
      "Urban homes benefit from smart renovation design",
      "Basement finishing adds valuable living space",
      "County seat location ensures contractor availability"
    ]
  },
  {
    name: "Bergenfield",
    slug: "bergenfield",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07621"],
    population: "28,321",
    medianHomeValue: "$445,000",
    metaTitle: "Bergenfield NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Quality home renovations in Bergenfield, Bergen County. Free estimates for kitchen, bathroom, basement and addition projects from vetted contractors.",
    h1: "Professional Home Renovations in Bergenfield, NJ",
    introText: "Bergenfield homeowners choose SmartReno for affordable, quality renovations. Get competitive bids for kitchen remodels, bathroom upgrades, basement finishing, and home additions from trusted Bergen County contractors.",
    localInsights: [
      "Mid-century homes offer excellent renovation potential",
      "Kitchen and bathroom updates most requested",
      "Competitive pricing from multiple contractors"
    ]
  },
  {
    name: "Ramsey",
    slug: "ramsey",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07446"],
    population: "15,260",
    medianHomeValue: "$625,000",
    metaTitle: "Ramsey NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Ramsey, Bergen County. Free estimates for kitchen, bathroom, basement & addition projects from vetted local contractors.",
    h1: "Ramsey Home Renovation Services",
    introText: "Ramsey's well-maintained homes deserve expert renovation care. SmartReno connects you with Bergen County's premier contractors for kitchen remodels, bathroom renovations, and custom home additions.",
    localInsights: [
      "Spacious homes ideal for addition projects",
      "Modern kitchen updates very popular",
      "Borough permits processed efficiently"
    ]
  },
  {
    name: "Wyckoff",
    slug: "wyckoff",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07481"],
    population: "17,025",
    medianHomeValue: "$735,000",
    metaTitle: "Wyckoff NJ Home Renovations | Luxury Kitchen & Bathroom Remodeling",
    metaDescription: "Upscale home renovations in Wyckoff, Bergen County. Expert kitchen remodels, bathroom upgrades, additions & more from vetted contractors.",
    h1: "Luxury Home Renovations in Wyckoff, NJ",
    introText: "Wyckoff's prestigious homes deserve top-tier craftsmanship. SmartReno connects you with Bergen County's best contractors for high-end kitchen remodels, luxurious bathroom renovations, and custom additions.",
    localInsights: [
      "Large properties perfect for extensive additions",
      "High-end kitchen and bath projects common",
      "Township known for quality construction standards"
    ]
  },
  {
    name: "Closter",
    slug: "closter",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07624"],
    population: "8,594",
    medianHomeValue: "$695,000",
    metaTitle: "Closter NJ Home Renovation Services | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in Closter, Bergen County. Free estimates for kitchen, bathroom and addition projects from vetted local contractors.",
    h1: "Closter Home Renovation Contractors",
    introText: "Closter homeowners trust SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and home additions, get expert craftsmanship from Bergen County's top contractors.",
    localInsights: [
      "Well-established homes benefit from updates",
      "Kitchen and master bath renovations popular",
      "Borough regulations ensure quality work"
    ]
  },
  {
    name: "Cresskill",
    slug: "cresskill",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07626"],
    population: "8,844",
    medianHomeValue: "$715,000",
    metaTitle: "Cresskill NJ Home Renovations | Kitchen & Bathroom Remodeling Experts",
    metaDescription: "Expert home renovations in Cresskill, Bergen County. Free estimates for kitchen, bathroom and addition projects from vetted local contractors.",
    h1: "Cresskill Home Renovation Services",
    introText: "Cresskill's charming homes deserve expert renovation care. SmartReno connects you with Bergen County contractors specializing in kitchen remodels, bathroom renovations, and thoughtful home additions.",
    localInsights: [
      "Historic charm maintained through careful renovations",
      "Modern kitchen updates while preserving character",
      "Borough approval for exterior changes"
    ]
  },
  {
    name: "Demarest",
    slug: "demarest",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07627"],
    population: "5,018",
    medianHomeValue: "$825,000",
    metaTitle: "Demarest NJ Luxury Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "High-end home renovations in Demarest, Bergen County. Expert kitchen, bathroom and custom addition projects from vetted contractors.",
    h1: "Luxury Home Renovations in Demarest, NJ",
    introText: "Demarest's upscale homes demand exceptional craftsmanship. SmartReno connects you with Bergen County's finest contractors for premium kitchen remodels, spa-like bathrooms, and custom additions.",
    localInsights: [
      "Large lots ideal for extensive additions",
      "High-end finishes and materials standard",
      "Borough known for architectural excellence"
    ]
  },
  {
    name: "Saddle River",
    slug: "saddle-river",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07458"],
    population: "3,152",
    medianHomeValue: "$1,425,000",
    metaTitle: "Saddle River NJ Luxury Home Renovations | Premium Kitchen & Bath Remodeling",
    metaDescription: "Elite home renovations in Saddle River, Bergen County. Custom kitchen, bathroom and addition projects from premier contractors.",
    h1: "Elite Home Renovations in Saddle River, New Jersey",
    introText: "Saddle River's estate homes deserve the finest craftsmanship. SmartReno connects you with Bergen County's most experienced contractors for luxury kitchen remodels, custom bathrooms, and grand home additions.",
    localInsights: [
      "Estate properties with extensive renovation potential",
      "Custom millwork and high-end finishes expected",
      "Borough architectural review for major projects"
    ]
  },
  {
    name: "River Edge",
    slug: "river-edge",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07661"],
    population: "12,049",
    medianHomeValue: "$565,000",
    metaTitle: "River Edge NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Professional home renovations in River Edge, Bergen County. Free estimates for kitchen, bathroom and basement projects from vetted contractors.",
    h1: "River Edge Home Renovation Experts",
    introText: "River Edge homeowners choose SmartReno for quality renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and basement finishing from trusted Bergen County contractors.",
    localInsights: [
      "Traditional homes benefit from modern updates",
      "Kitchen and bathroom remodels add value",
      "Close-knit community values quality work"
    ]
  },
  {
    name: "Oradell",
    slug: "oradell",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07649"],
    population: "8,216",
    medianHomeValue: "$685,000",
    metaTitle: "Oradell NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Oradell, Bergen County. Free estimates for kitchen, bathroom and addition projects from vetted local contractors.",
    h1: "Oradell Home Renovation Services",
    introText: "Oradell's established homes deserve expert care. SmartReno connects you with Bergen County contractors specializing in kitchen remodels, bathroom renovations, and home additions.",
    localInsights: [
      "Well-maintained homes ready for updates",
      "Master suite additions popular",
      "Borough ensures quality construction standards"
    ]
  },
  {
    name: "Haworth",
    slug: "haworth",
    county: "Bergen County",
    countySlug: "bergen",
    zipCodes: ["07641"],
    population: "3,382",
    medianHomeValue: "$745,000",
    metaTitle: "Haworth NJ Home Renovations | Kitchen & Bathroom Remodeling Experts",
    metaDescription: "Quality home renovations in Haworth, Bergen County. Free estimates for kitchen, bathroom and addition projects from vetted contractors.",
    h1: "Haworth Home Renovation Contractors",
    introText: "Haworth homeowners trust SmartReno for professional renovations. From kitchen remodels to bathroom upgrades and additions, get expert craftsmanship from Bergen County's best contractors.",
    localInsights: [
      "Quiet community values quality workmanship",
      "Kitchen and bath modernizations common",
      "Small-town charm with suburban convenience"
    ]
  },
  {
    name: "Passaic",
    slug: "passaic",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07055"],
    population: "70,537",
    medianHomeValue: "$335,000",
    metaTitle: "Passaic NJ Home Renovations | Kitchen & Bathroom Remodeling Contractors",
    metaDescription: "Affordable home renovations in Passaic, Passaic County. Free estimates for kitchen, bathroom and interior projects from vetted local contractors.",
    h1: "Passaic Home Renovation Services",
    introText: "Passaic homeowners trust SmartReno for quality, affordable renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and interior improvements from experienced Passaic County contractors.",
    localInsights: [
      "Diverse housing stock from historic to modern",
      "Kitchen and bathroom updates most requested",
      "Bilingual contractors available for convenience"
    ]
  },
  {
    name: "Paterson",
    slug: "paterson",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07501", "07502", "07503", "07504", "07505", "07522"],
    population: "159,732",
    medianHomeValue: "$315,000",
    metaTitle: "Paterson NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in Paterson, Passaic County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Paterson Home Renovation Experts",
    introText: "Paterson's diverse neighborhoods benefit from SmartReno's renovation network. From kitchen remodels to bathroom upgrades and interior improvements, connect with qualified Passaic County contractors.",
    localInsights: [
      "Historic homes require specialized expertise",
      "Modern updates add significant property value",
      "Large contractor network ensures availability"
    ]
  },
  {
    name: "Totowa",
    slug: "totowa",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07512"],
    population: "11,580",
    medianHomeValue: "$425,000",
    metaTitle: "Totowa NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Quality home renovations in Totowa, Passaic County. Free estimates for kitchen, bathroom and basement projects from vetted local contractors.",
    h1: "Totowa Home Renovation Contractors",
    introText: "Totowa homeowners choose SmartReno for professional renovations. Get free estimates for kitchen remodels, bathroom upgrades, and basement finishing from trusted Passaic County contractors.",
    localInsights: [
      "Compact borough with strong community values",
      "Kitchen and bathroom updates most popular",
      "Local contractors know borough requirements"
    ]
  },
  {
    name: "Little Falls",
    slug: "little-falls",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07424"],
    population: "14,659",
    medianHomeValue: "$415,000",
    metaTitle: "Little Falls NJ Home Renovation Services | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Little Falls, Passaic County. Free estimates for kitchen, bathroom and basement projects from vetted contractors.",
    h1: "Little Falls Home Renovation Experts",
    introText: "Little Falls residents trust SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and basement finishing, get competitive bids from Passaic County's best contractors.",
    localInsights: [
      "Well-maintained homes benefit from updates",
      "Basement finishing adds valuable space",
      "Township ensures quality construction"
    ]
  },
  {
    name: "West Milford",
    slug: "west-milford",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07480"],
    population: "24,862",
    medianHomeValue: "$385,000",
    metaTitle: "West Milford NJ Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in West Milford, Passaic County. Free estimates for kitchen, bathroom and addition projects from vetted contractors.",
    h1: "West Milford Home Renovation Services",
    introText: "West Milford's lake and mountain homes deserve expert renovation care. SmartReno connects you with Passaic County contractors for kitchen remodels, bathroom upgrades, and home additions.",
    localInsights: [
      "Lake properties require waterproofing expertise",
      "Four-season rooms and additions popular",
      "Rural setting requires experienced contractors"
    ]
  },
  {
    name: "Ringwood",
    slug: "ringwood",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07456"],
    population: "11,735",
    medianHomeValue: "$465,000",
    metaTitle: "Ringwood NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Quality home renovations in Ringwood, Passaic County. Free estimates for kitchen, bathroom and addition projects from vetted local contractors.",
    h1: "Ringwood Home Renovation Experts",
    introText: "Ringwood homeowners choose SmartReno for professional renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and home additions from experienced Passaic County contractors.",
    localInsights: [
      "Mountain and lake homes have unique needs",
      "Custom additions to maximize views",
      "Borough contractors know local challenges"
    ]
  },
  {
    name: "Haledon",
    slug: "haledon",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07508"],
    population: "9,052",
    medianHomeValue: "$365,000",
    metaTitle: "Haledon NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Affordable home renovations in Haledon, Passaic County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Haledon Home Renovation Services",
    introText: "Haledon homeowners trust SmartReno for quality, affordable renovations. Get free estimates for kitchen remodels, bathroom upgrades, and interior improvements from Passaic County contractors.",
    localInsights: [
      "Compact homes benefit from smart design",
      "Kitchen and bathroom updates add value",
      "Small-town atmosphere values quality work"
    ]
  },
  {
    name: "Pompton Lakes",
    slug: "pompton-lakes",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07442"],
    population: "11,127",
    medianHomeValue: "$395,000",
    metaTitle: "Pompton Lakes NJ Home Renovation Contractors | Kitchen & Bath Remodeling",
    metaDescription: "Professional home renovations in Pompton Lakes, Passaic County. Free estimates for kitchen, bathroom and basement projects from vetted contractors.",
    h1: "Pompton Lakes Home Renovation Experts",
    introText: "Pompton Lakes residents choose SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and basement finishing, get competitive bids from trusted Passaic County contractors.",
    localInsights: [
      "Lakeside properties require special expertise",
      "Basement waterproofing often needed",
      "Borough values quality construction"
    ]
  }
];

// Passaic County Towns
export const passaicTowns: TownData[] = [
  {
    name: "Wayne",
    slug: "wayne",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07470"],
    population: "54,838",
    medianHomeValue: "$475,000",
    metaTitle: "Wayne NJ Home Renovations | Kitchen, Bathroom & Basement Remodeling",
    metaDescription: "Professional home renovation services in Wayne, Passaic County. Free estimates for kitchen, bathroom, basement & addition projects from vetted contractors.",
    h1: "Home Renovation Services in Wayne, New Jersey",
    introText: "Wayne homeowners trust SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and basement finishing, get competitive bids from Passaic County's top-rated contractors.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Basement Finishing"],
    localInsights: [
      "Wayne's large homes offer excellent renovation potential",
      "Basement finishing is a popular project",
      "Multiple contractors ensure competitive pricing"
    ]
  },
  {
    name: "Clifton",
    slug: "clifton",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07011", "07012", "07013", "07014"],
    population: "90,296",
    medianHomeValue: "$425,000",
    metaTitle: "Clifton NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Clifton, Passaic County. Free estimates for kitchen, bathroom, basement and addition projects. Vetted local contractors.",
    h1: "Professional Home Renovations in Clifton, NJ",
    introText: "Clifton's diverse housing stock benefits from SmartReno's renovation expertise. Whether you need a kitchen remodel, bathroom upgrade, or home addition, we connect you with qualified Passaic County contractors.",
    featuredProjects: ["Kitchen Remodeling", "Bathroom Upgrades", "Home Additions"],
    localInsights: [
      "Clifton's varied home styles require flexible expertise",
      "Kitchen and bathroom updates most requested",
      "Passaic County permit processes streamlined"
    ]
  },
  {
    name: "Woodland Park",
    slug: "woodland-park",
    county: "Passaic County",
    countySlug: "passaic",
    zipCodes: ["07424"],
    population: "13,484",
    medianHomeValue: "$385,000",
    metaTitle: "Woodland Park NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Quality home renovations in Woodland Park, Passaic County. Free estimates for kitchen, bathroom and basement projects from vetted local contractors.",
    h1: "Woodland Park Home Renovation Experts",
    introText: "SmartReno brings professional renovation services to Woodland Park homeowners. Get free estimates for kitchen remodels, bathroom renovations, and basement finishing from trusted Passaic County contractors.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Basement Projects"],
    localInsights: [
      "Compact homes benefit from smart renovation design",
      "Kitchen and bathroom updates add significant value",
      "Local contractors know Passaic County requirements"
    ]
  }
];

// Morris County Towns
export const morrisTowns: TownData[] = [
  {
    name: "Morristown",
    slug: "morristown",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07960", "07962", "07963"],
    population: "19,726",
    medianHomeValue: "$525,000",
    metaTitle: "Morristown NJ Home Renovations | Kitchen, Bathroom & Historic Home Remodeling",
    metaDescription: "Expert home renovations in Morristown, Morris County. Free estimates for kitchen, bathroom and historic home projects from vetted local contractors.",
    h1: "Home Renovation Services in Morristown, New Jersey",
    introText: "Morristown's historic charm meets modern renovation expertise with SmartReno. From kitchen remodels to bathroom upgrades and careful historic home renovations, connect with Morris County's best contractors.",
    featuredProjects: ["Historic Home Renovations", "Kitchen Remodeling", "Bathroom Updates"],
    localInsights: [
      "Historic district renovations require special approvals",
      "Victorian and Colonial homes need specialized expertise",
      "Morris County's premier renovation market"
    ]
  },
  {
    name: "Denville",
    slug: "denville",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07834"],
    population: "16,983",
    medianHomeValue: "$485,000",
    metaTitle: "Denville NJ Home Renovation Contractors | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in Denville, Morris County. Free estimates for kitchen, bathroom, basement & addition projects from vetted contractors.",
    h1: "Denville Home Renovation Experts",
    introText: "Denville homeowners choose SmartReno for quality renovations. Whether you're updating your kitchen, renovating bathrooms, or finishing your basement, get competitive bids from Morris County's top contractors.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Basement Finishing"],
    localInsights: [
      "Lake-area homes offer unique renovation opportunities",
      "Basement finishing very popular in Denville",
      "Morris County contractors with local expertise"
    ]
  },
  {
    name: "Parsippany",
    slug: "parsippany",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07054"],
    population: "56,162",
    medianHomeValue: "$445,000",
    metaTitle: "Parsippany NJ Home Renovations | Kitchen, Bathroom & Addition Remodeling",
    metaDescription: "Quality home renovations in Parsippany, Morris County. Free estimates for kitchen, bathroom, basement and addition projects. Vetted local contractors.",
    h1: "Professional Home Renovations in Parsippany, NJ",
    introText: "Parsippany's diverse neighborhoods benefit from SmartReno's renovation network. From modern kitchen remodels to luxurious bathrooms and home additions, connect with qualified Morris County contractors.",
    featuredProjects: ["Kitchen Remodeling", "Bathroom Upgrades", "Home Additions"],
    localInsights: [
      "Parsippany's housing variety requires flexible expertise",
      "Kitchen and bathroom remodels most requested",
      "Competitive pricing from multiple contractors"
    ]
  },
  {
    name: "Randolph",
    slug: "randolph",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07869"],
    population: "26,010",
    medianHomeValue: "$525,000",
    metaTitle: "Randolph NJ Home Renovation Services | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Randolph, Morris County. Free estimates for kitchen, bathroom, basement & addition projects from vetted local contractors.",
    h1: "Randolph Home Renovation Contractors",
    introText: "Randolph homeowners trust SmartReno for professional renovations. Get free estimates for kitchen remodels, bathroom upgrades, basement finishing, and home additions from Morris County's best contractors.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Basement Projects"],
    localInsights: [
      "Spacious Randolph homes ideal for additions",
      "Modern kitchen updates very popular",
      "Township permits streamlined for homeowners"
    ]
  },
  {
    name: "Madison",
    slug: "madison",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07940"],
    population: "16,530",
    medianHomeValue: "$685,000",
    metaTitle: "Madison NJ Home Renovations | Kitchen, Bathroom & Historic Home Remodeling",
    metaDescription: "Upscale home renovations in Madison, Morris County. Expert kitchen, bathroom and historic home projects. Free estimates from vetted contractors.",
    h1: "Madison Home Renovation Services",
    introText: "Madison's charming homes deserve expert renovation care. SmartReno connects you with Morris County's premier contractors for kitchen remodels, bathroom renovations, and thoughtful historic home updates.",
    featuredProjects: ["Historic Renovations", "Kitchen Remodeling", "Bathroom Upgrades"],
    localInsights: [
      "Downtown Madison homes feature historic character",
      "Kitchen and bathroom modernizations popular",
      "Borough review for historic district work"
    ]
  },
  {
    name: "Chatham",
    slug: "chatham",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07928"],
    population: "9,126",
    medianHomeValue: "$725,000",
    metaTitle: "Chatham NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Upscale home renovations in Chatham, Morris County. Expert kitchen, bathroom and addition projects from vetted local contractors.",
    h1: "Chatham Home Renovation Experts",
    introText: "Chatham's distinguished homes deserve expert craftsmanship. SmartReno connects you with Morris County's premier contractors for kitchen remodels, bathroom renovations, and custom additions.",
    localInsights: [
      "Historic downtown homes require careful renovations",
      "High-end kitchen and bath projects common",
      "Borough architectural review for exterior changes"
    ]
  },
  {
    name: "Florham Park",
    slug: "florham-park",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07932"],
    population: "12,582",
    medianHomeValue: "$645,000",
    metaTitle: "Florham Park NJ Home Renovation Contractors | Kitchen & Bath Remodeling",
    metaDescription: "Professional home renovations in Florham Park, Morris County. Free estimates for kitchen, bathroom and addition projects from vetted contractors.",
    h1: "Florham Park Home Renovation Services",
    introText: "Florham Park homeowners trust SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and home additions, get expert craftsmanship from Morris County's best contractors.",
    localInsights: [
      "Mix of historic and modern homes",
      "Kitchen and master suite renovations popular",
      "Borough ensures quality construction standards"
    ]
  },
  {
    name: "Boonton",
    slug: "boonton",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07005"],
    population: "8,711",
    medianHomeValue: "$425,000",
    metaTitle: "Boonton NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Quality home renovations in Boonton, Morris County. Free estimates for kitchen, bathroom and interior projects from vetted local contractors.",
    h1: "Boonton Home Renovation Contractors",
    introText: "Boonton's historic charm meets modern renovation with SmartReno. Get competitive bids for kitchen remodels, bathroom upgrades, and interior improvements from Morris County contractors.",
    localInsights: [
      "Victorian and historic homes require specialized care",
      "Downtown renovations maintain historic character",
      "Town values preservation and quality work"
    ]
  },
  {
    name: "Hanover",
    slug: "hanover",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07927", "07981"],
    population: "14,852",
    medianHomeValue: "$565,000",
    metaTitle: "Hanover NJ Home Renovation Services | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert home renovations in Hanover, Morris County. Free estimates for kitchen, bathroom, basement & addition projects from vetted contractors.",
    h1: "Hanover Home Renovation Experts",
    introText: "Hanover homeowners choose SmartReno for professional renovations. Get free estimates for kitchen remodels, bathroom upgrades, basement finishing, and additions from Morris County's top contractors.",
    localInsights: [
      "Spacious homes ideal for additions",
      "Modern kitchen and bath updates popular",
      "Township streamlines permit processes"
    ]
  },
  {
    name: "East Hanover",
    slug: "east-hanover",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07936"],
    population: "11,496",
    medianHomeValue: "$525,000",
    metaTitle: "East Hanover NJ Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in East Hanover, Morris County. Free estimates for kitchen, bathroom and basement projects from vetted contractors.",
    h1: "East Hanover Home Renovation Services",
    introText: "East Hanover residents trust SmartReno for quality renovations. From kitchen remodels to bathroom upgrades and basement finishing, get competitive bids from Morris County contractors.",
    localInsights: [
      "Well-maintained homes ready for updates",
      "Basement finishing adds valuable space",
      "Township known for residential quality"
    ]
  },
  {
    name: "Lincoln Park",
    slug: "lincoln-park",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07035"],
    population: "10,930",
    medianHomeValue: "$425,000",
    metaTitle: "Lincoln Park NJ Home Renovation Contractors | Kitchen & Bath Remodeling",
    metaDescription: "Quality home renovations in Lincoln Park, Morris County. Free estimates for kitchen, bathroom and basement projects from vetted local contractors.",
    h1: "Lincoln Park Home Renovation Experts",
    introText: "Lincoln Park homeowners choose SmartReno for affordable, quality renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and basement finishing from Morris County contractors.",
    localInsights: [
      "Diverse housing from townhomes to single-family",
      "Kitchen and bathroom updates most requested",
      "Borough contractors provide local expertise"
    ]
  },
  {
    name: "Rockaway",
    slug: "rockaway",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07866"],
    population: "6,685",
    medianHomeValue: "$385,000",
    metaTitle: "Rockaway NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Professional home renovations in Rockaway, Morris County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Rockaway Home Renovation Services",
    introText: "Rockaway homeowners trust SmartReno for quality renovations. Get free estimates for kitchen remodels, bathroom upgrades, and interior improvements from experienced Morris County contractors.",
    localInsights: [
      "Compact borough with strong community ties",
      "Kitchen and bathroom modernizations popular",
      "Local contractors know borough requirements"
    ]
  },
  {
    name: "Mount Olive",
    slug: "mount-olive",
    county: "Morris County",
    countySlug: "morris",
    zipCodes: ["07828"],
    population: "28,117",
    medianHomeValue: "$445,000",
    metaTitle: "Mount Olive NJ Home Renovation Contractors | Kitchen & Bath Remodeling",
    metaDescription: "Expert home renovations in Mount Olive, Morris County. Free estimates for kitchen, bathroom, basement & addition projects from vetted contractors.",
    h1: "Mount Olive Home Renovation Experts",
    introText: "Mount Olive homeowners choose SmartReno for professional renovations. From kitchen remodels to bathroom upgrades and home additions, get competitive bids from Morris County's best contractors.",
    localInsights: [
      "Large township with diverse housing stock",
      "Basement finishing and additions popular",
      "Township ensures quality construction"
    ]
  }
];

// Hudson County Towns
export const hudsonTowns: TownData[] = [
  {
    name: "Hoboken",
    slug: "hoboken",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07030"],
    population: "60,417",
    medianHomeValue: "$625,000",
    metaTitle: "Hoboken NJ Condo & Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Expert condo and home renovations in Hoboken, Hudson County. Free estimates for kitchen, bathroom and interior remodeling. Vetted local contractors.",
    h1: "Hoboken Condo & Home Renovation Services",
    introText: "Hoboken's urban living spaces shine with SmartReno renovations. From modern condo kitchens to luxurious bathrooms, connect with Hudson County contractors who understand high-density renovation challenges.",
    featuredProjects: ["Condo Renovations", "Kitchen Remodeling", "Bathroom Updates"],
    localInsights: [
      "Condo board approvals required for most work",
      "Space-efficient kitchen designs popular",
      "Urban renovation specialists available"
    ]
  },
  {
    name: "Jersey City",
    slug: "jersey-city",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"],
    population: "292,449",
    medianHomeValue: "$575,000",
    metaTitle: "Jersey City NJ Home & Condo Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home and condo renovations in Jersey City, Hudson County. Free estimates for kitchen, bathroom and interior projects. Vetted contractors.",
    h1: "Jersey City Home & Condo Renovation Experts",
    introText: "Jersey City's diverse neighborhoods trust SmartReno for quality renovations. Whether you're in a historic brownstone or modern high-rise, get expert kitchen, bathroom, and interior remodeling from Hudson County's best contractors.",
    featuredProjects: ["Condo Renovations", "Kitchen Remodeling", "Bathroom Upgrades"],
    localInsights: [
      "Wide range of property types from brownstones to condos",
      "Modern kitchen and bathroom updates most requested",
      "Multiple contractors ensure competitive pricing"
    ]
  },
  {
    name: "Weehawken",
    slug: "weehawken",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07086", "07087"],
    population: "17,197",
    medianHomeValue: "$595,000",
    metaTitle: "Weehawken NJ Condo Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Expert condo and home renovations in Weehawken, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Weehawken Condo & Home Renovation Services",
    introText: "Weehawken residents choose SmartReno for professional condo and home renovations. From waterfront condos to townhomes, get competitive bids for kitchen remodels and bathroom upgrades from Hudson County contractors.",
    featuredProjects: ["Condo Renovations", "Kitchen Updates", "Bathroom Remodeling"],
    localInsights: [
      "Waterfront condos require specialized expertise",
      "Modern kitchen and bath renovations popular",
      "Condo association guidelines navigated smoothly"
    ]
  },
  {
    name: "Union City",
    slug: "union-city",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07087"],
    population: "68,073",
    medianHomeValue: "$425,000",
    metaTitle: "Union City NJ Home Renovations | Kitchen & Bathroom Remodeling Contractors",
    metaDescription: "Quality home renovations in Union City, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted local contractors.",
    h1: "Union City Home Renovation Contractors",
    introText: "Union City homeowners trust SmartReno for affordable, quality renovations. Get free estimates for kitchen remodels, bathroom upgrades, and interior improvements from experienced Hudson County contractors.",
    featuredProjects: ["Kitchen Renovations", "Bathroom Remodeling", "Interior Updates"],
    localInsights: [
      "Compact urban homes benefit from smart design",
      "Kitchen and bathroom updates add significant value",
      "Bilingual contractors available"
    ]
  },
  {
    name: "North Bergen",
    slug: "north-bergen",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07047"],
    population: "63,361",
    medianHomeValue: "$395,000",
    metaTitle: "North Bergen NJ Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Professional home renovations in North Bergen, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "North Bergen Home Renovation Services",
    introText: "North Bergen homeowners trust SmartReno for quality renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and interior improvements from experienced Hudson County contractors.",
    localInsights: [
      "Diverse property types from single-family to condos",
      "Kitchen and bathroom updates add value",
      "Township contractors provide local expertise"
    ]
  },
  {
    name: "West New York",
    slug: "west-new-york",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07093"],
    population: "52,912",
    medianHomeValue: "$385,000",
    metaTitle: "West New York NJ Home Renovations | Kitchen & Bathroom Remodeling",
    metaDescription: "Quality home renovations in West New York, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "West New York Home Renovation Contractors",
    introText: "West New York residents choose SmartReno for affordable, quality renovations. From kitchen remodels to bathroom upgrades, get competitive bids from Hudson County's experienced contractors.",
    localInsights: [
      "Urban density requires specialized expertise",
      "Modern kitchen and bath updates most requested",
      "Bilingual contractors available for convenience"
    ]
  },
  {
    name: "Guttenberg",
    slug: "guttenberg",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07093"],
    population: "11,690",
    medianHomeValue: "$485,000",
    metaTitle: "Guttenberg NJ Condo Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Expert condo renovations in Guttenberg, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted local contractors.",
    h1: "Guttenberg Condo & Home Renovation Services",
    introText: "Guttenberg's waterfront properties deserve expert care. SmartReno connects you with Hudson County contractors specializing in condo kitchen remodels, bathroom renovations, and interior upgrades.",
    localInsights: [
      "Waterfront condos with Manhattan views",
      "Space-efficient renovation designs essential",
      "Condo association guidelines navigated smoothly"
    ]
  },
  {
    name: "Secaucus",
    slug: "secaucus",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07094"],
    population: "22,181",
    medianHomeValue: "$525,000",
    metaTitle: "Secaucus NJ Home Renovations | Kitchen & Bathroom Remodeling Contractors",
    metaDescription: "Professional home renovations in Secaucus, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Secaucus Home Renovation Experts",
    introText: "Secaucus homeowners trust SmartReno for quality renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and interior improvements from Hudson County's best contractors.",
    localInsights: [
      "Mix of townhomes and single-family properties",
      "Modern kitchen and bathroom updates popular",
      "Town ensures quality construction standards"
    ]
  },
  {
    name: "Kearny",
    slug: "kearny",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07032"],
    population: "42,876",
    medianHomeValue: "$375,000",
    metaTitle: "Kearny NJ Home Renovation Services | Kitchen & Bathroom Remodeling",
    metaDescription: "Quality home renovations in Kearny, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted local contractors.",
    h1: "Kearny Home Renovation Contractors",
    introText: "Kearny homeowners choose SmartReno for affordable, quality renovations. Get free estimates for kitchen remodels, bathroom upgrades, and interior improvements from Hudson County contractors.",
    localInsights: [
      "Historic homes require specialized expertise",
      "Kitchen and bathroom modernizations add value",
      "Town contractors know local requirements"
    ]
  },
  {
    name: "Harrison",
    slug: "harrison",
    county: "Hudson County",
    countySlug: "hudson",
    zipCodes: ["07029"],
    population: "19,450",
    medianHomeValue: "$425,000",
    metaTitle: "Harrison NJ Home Renovations | Kitchen & Bathroom Remodeling Services",
    metaDescription: "Expert home renovations in Harrison, Hudson County. Free estimates for kitchen, bathroom and interior projects from vetted contractors.",
    h1: "Harrison Home Renovation Services",
    introText: "Harrison's redeveloping neighborhoods benefit from SmartReno renovations. Get competitive bids for kitchen remodels, bathroom upgrades, and interior improvements from Hudson County contractors.",
    localInsights: [
      "Waterfront redevelopment area with new opportunities",
      "Modern condo and townhome renovations",
      "Town embraces quality residential improvements"
    ]
  }
];

// Master lookup for all towns
export const allTowns: TownData[] = [
  ...bergenTowns,
  ...passaicTowns,
  ...morrisTowns,
  ...hudsonTowns,
  ...essexTowns
];

// Helper function to find town by slug
export function getTownBySlug(countySlug: string, townSlug: string): TownData | undefined {
  return allTowns.find(
    town => town.countySlug === countySlug && town.slug === townSlug
  );
}

// Helper function to get all towns for a county
export function getTownsByCounty(countySlug: string): TownData[] {
  return allTowns.filter(town => town.countySlug === countySlug);
}
