/**
 * Northern NJ Location Data for Programmatic SEO
 * Bergen, Passaic, Morris, Essex, and Hudson Counties
 */

export interface Town {
  name: string;
  slug: string;
  zipCodes: string[];
  population: number;
  medianIncome: number;
  avgHomeValue: number;
}

export interface County {
  name: string;
  slug: string;
  state: string;
  towns: Town[];
}

// Bergen County (70+ towns)
export const BERGEN_COUNTY: County = {
  name: "Bergen County",
  slug: "bergen-county",
  state: "New Jersey",
  towns: [
    { name: "Ridgewood", slug: "ridgewood", zipCodes: ["07450"], population: 25550, medianIncome: 167600, avgHomeValue: 825000 },
    { name: "Paramus", slug: "paramus", zipCodes: ["07652", "07653"], population: 26698, medianIncome: 118300, avgHomeValue: 565000 },
    { name: "Hackensack", slug: "hackensack", zipCodes: ["07601"], population: 46030, medianIncome: 68200, avgHomeValue: 385000 },
    { name: "Fort Lee", slug: "fort-lee", zipCodes: ["07024"], population: 40191, medianIncome: 82500, avgHomeValue: 485000 },
    { name: "Fair Lawn", slug: "fair-lawn", zipCodes: ["07410"], population: 34927, medianIncome: 98700, avgHomeValue: 465000 },
    { name: "Bergenfield", slug: "bergenfield", zipCodes: ["07621"], population: 28321, medianIncome: 76800, avgHomeValue: 385000 },
    { name: "Englewood", slug: "englewood", zipCodes: ["07631"], population: 29308, medianIncome: 85400, avgHomeValue: 495000 },
    { name: "Teaneck", slug: "teaneck", zipCodes: ["07666"], population: 41246, medianIncome: 96500, avgHomeValue: 475000 },
    { name: "Mahwah", slug: "mahwah", zipCodes: ["07430"], population: 26484, medianIncome: 135800, avgHomeValue: 625000 },
    { name: "Wyckoff", slug: "wyckoff", zipCodes: ["07481"], population: 17207, medianIncome: 178600, avgHomeValue: 785000 },
    { name: "Glen Rock", slug: "glen-rock", zipCodes: ["07452"], population: 12133, medianIncome: 172400, avgHomeValue: 725000 },
    { name: "Saddle Brook", slug: "saddle-brook", zipCodes: ["07663"], population: 14294, medianIncome: 84300, avgHomeValue: 385000 },
    { name: "Ramsey", slug: "ramsey", zipCodes: ["07446"], population: 15314, medianIncome: 146200, avgHomeValue: 625000 },
    { name: "Waldwick", slug: "waldwick", zipCodes: ["07463"], population: 10258, medianIncome: 128500, avgHomeValue: 545000 },
    { name: "Ho-Ho-Kus", slug: "ho-ho-kus", zipCodes: ["07423"], population: 4336, medianIncome: 213400, avgHomeValue: 985000 },
  ],
};

// Passaic County (40+ towns)
export const PASSAIC_COUNTY: County = {
  name: "Passaic County",
  slug: "passaic-county",
  state: "New Jersey",
  towns: [
    { name: "Wayne", slug: "wayne", zipCodes: ["07470"], population: 54838, medianIncome: 112300, avgHomeValue: 485000 },
    { name: "Clifton", slug: "clifton", zipCodes: ["07011", "07012", "07013"], population: 90296, medianIncome: 78600, avgHomeValue: 385000 },
    { name: "Paterson", slug: "paterson", zipCodes: ["07501", "07502", "07503", "07504", "07505"], population: 159732, medianIncome: 42100, avgHomeValue: 285000 },
    { name: "Passaic", slug: "passaic", zipCodes: ["07055"], population: 70537, medianIncome: 48300, avgHomeValue: 295000 },
    { name: "West Milford", slug: "west-milford", zipCodes: ["07480"], population: 24862, medianIncome: 108700, avgHomeValue: 425000 },
    { name: "Little Falls", slug: "little-falls", zipCodes: ["07424"], population: 10802, medianIncome: 91200, avgHomeValue: 395000 },
    { name: "Pompton Lakes", slug: "pompton-lakes", zipCodes: ["07442"], population: 11127, medianIncome: 92800, avgHomeValue: 385000 },
    { name: "Ringwood", slug: "ringwood", zipCodes: ["07456"], population: 11747, medianIncome: 119600, avgHomeValue: 485000 },
    { name: "Totowa", slug: "totowa", zipCodes: ["07512"], population: 11116, medianIncome: 85300, avgHomeValue: 385000 },
    { name: "Hawthorne", slug: "hawthorne", zipCodes: ["07506"], population: 19637, medianIncome: 84700, avgHomeValue: 385000 },
  ],
};

// Morris County (40+ towns)
export const MORRIS_COUNTY: County = {
  name: "Morris County",
  slug: "morris-county",
  state: "New Jersey",
  towns: [
    { name: "Morristown", slug: "morristown", zipCodes: ["07960"], population: 19065, medianIncome: 112500, avgHomeValue: 585000 },
    { name: "Parsippany", slug: "parsippany", zipCodes: ["07054"], population: 56162, medianIncome: 98400, avgHomeValue: 445000 },
    { name: "Randolph", slug: "randolph", zipCodes: ["07869"], population: 26252, medianIncome: 147800, avgHomeValue: 585000 },
    { name: "Dover", slug: "dover", zipCodes: ["07801"], population: 18157, medianIncome: 62300, avgHomeValue: 325000 },
    { name: "Madison", slug: "madison", zipCodes: ["07940"], population: 16937, medianIncome: 167300, avgHomeValue: 725000 },
    { name: "Chatham", slug: "chatham", zipCodes: ["07928"], population: 9129, medianIncome: 198400, avgHomeValue: 825000 },
    { name: "Denville", slug: "denville", zipCodes: ["07834"], population: 17107, medianIncome: 131200, avgHomeValue: 525000 },
    { name: "Florham Park", slug: "florham-park", zipCodes: ["07932"], population: 13202, medianIncome: 156800, avgHomeValue: 685000 },
    { name: "Hanover", slug: "hanover", zipCodes: ["07927", "07936"], population: 14819, medianIncome: 142600, avgHomeValue: 585000 },
    { name: "Morris Plains", slug: "morris-plains", zipCodes: ["07950"], population: 6028, medianIncome: 128500, avgHomeValue: 545000 },
  ],
};

// Essex County (30+ towns)
export const ESSEX_COUNTY: County = {
  name: "Essex County",
  slug: "essex-county",
  state: "New Jersey",
  towns: [
    { name: "Newark", slug: "newark", zipCodes: ["07101", "07102", "07103", "07104", "07105", "07106", "07107", "07108"], population: 311549, medianIncome: 42100, avgHomeValue: 285000 },
    { name: "Montclair", slug: "montclair", zipCodes: ["07042"], population: 40921, medianIncome: 127800, avgHomeValue: 625000 },
    { name: "West Orange", slug: "west-orange", zipCodes: ["07052"], population: 48843, medianIncome: 98700, avgHomeValue: 485000 },
    { name: "Livingston", slug: "livingston", zipCodes: ["07039"], population: 31028, medianIncome: 178600, avgHomeValue: 725000 },
    { name: "Millburn", slug: "millburn", zipCodes: ["07041"], population: 21798, medianIncome: 228400, avgHomeValue: 1025000 },
    { name: "South Orange", slug: "south-orange", zipCodes: ["07079"], population: 17950, medianIncome: 142300, avgHomeValue: 625000 },
    { name: "Maplewood", slug: "maplewood", zipCodes: ["07040"], population: 25684, medianIncome: 147500, avgHomeValue: 625000 },
    { name: "Bloomfield", slug: "bloomfield", zipCodes: ["07003"], population: 51452, medianIncome: 72800, avgHomeValue: 365000 },
    { name: "Nutley", slug: "nutley", zipCodes: ["07110"], population: 30143, medianIncome: 91200, avgHomeValue: 445000 },
    { name: "Belleville", slug: "belleville", zipCodes: ["07109"], population: 37034, medianIncome: 68500, avgHomeValue: 345000 },
  ],
};

// Hudson County (20+ towns)
export const HUDSON_COUNTY: County = {
  name: "Hudson County",
  slug: "hudson-county",
  state: "New Jersey",
  towns: [
    { name: "Jersey City", slug: "jersey-city", zipCodes: ["07302", "07304", "07305", "07306"], population: 292449, medianIncome: 78600, avgHomeValue: 485000 },
    { name: "Hoboken", slug: "hoboken", zipCodes: ["07030"], population: 60419, medianIncome: 147800, avgHomeValue: 685000 },
    { name: "Bayonne", slug: "bayonne", zipCodes: ["07002"], population: 71686, medianIncome: 68200, avgHomeValue: 385000 },
    { name: "Union City", slug: "union-city", zipCodes: ["07087"], population: 68589, medianIncome: 52800, avgHomeValue: 345000 },
    { name: "Weehawken", slug: "weehawken", zipCodes: ["07086"], population: 17197, medianIncome: 112500, avgHomeValue: 585000 },
    { name: "North Bergen", slug: "north-bergen", zipCodes: ["07047"], population: 63361, medianIncome: 62100, avgHomeValue: 385000 },
    { name: "West New York", slug: "west-new-york", zipCodes: ["07093"], population: 54227, medianIncome: 54200, avgHomeValue: 365000 },
    { name: "Harrison", slug: "harrison", zipCodes: ["07029"], population: 19450, medianIncome: 78300, avgHomeValue: 425000 },
    { name: "Kearny", slug: "kearny", zipCodes: ["07032"], population: 42876, medianIncome: 72500, avgHomeValue: 365000 },
    { name: "Secaucus", slug: "secaucus", zipCodes: ["07094"], population: 22181, medianIncome: 98700, avgHomeValue: 485000 },
  ],
};

export const ALL_COUNTIES = [
  BERGEN_COUNTY,
  PASSAIC_COUNTY,
  MORRIS_COUNTY,
  ESSEX_COUNTY,
  HUDSON_COUNTY,
];

export const ALL_TOWNS = ALL_COUNTIES.flatMap(county => 
  county.towns.map(town => ({ ...town, county: county.name, countySlug: county.slug }))
);

/**
 * Project types for SEO pages
 */
export const PROJECT_TYPES = [
  { name: "Kitchen Remodeling", slug: "kitchen-remodeling", avgCost: 45000, timeline: "6-12 weeks" },
  { name: "Bathroom Renovation", slug: "bathroom-renovation", avgCost: 28000, timeline: "4-8 weeks" },
  { name: "Home Addition", slug: "home-addition", avgCost: 125000, timeline: "4-8 months" },
  { name: "Basement Finishing", slug: "basement-finishing", avgCost: 38000, timeline: "6-10 weeks" },
  { name: "Deck Building", slug: "deck-building", avgCost: 18000, timeline: "2-4 weeks" },
  { name: "Roofing", slug: "roofing", avgCost: 12000, timeline: "1-2 weeks" },
  { name: "Siding", slug: "siding", avgCost: 15000, timeline: "2-3 weeks" },
  { name: "Window Replacement", slug: "window-replacement", avgCost: 8000, timeline: "1-2 weeks" },
];
