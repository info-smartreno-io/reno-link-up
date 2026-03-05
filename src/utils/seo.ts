/**
 * SEO Utilities - Framework Agnostic
 * Centralized SEO helpers for titles, descriptions, and metadata
 */

interface LocationData {
  county: string;
  town?: string;
  state?: string;
}

interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  type?: string;
  image?: string;
}

const SITE_NAME = "SmartReno";
const SITE_URL = "https://smartreno.io";
const DEFAULT_STATE = "New Jersey";
const DEFAULT_REGION = "Northern NJ";

/**
 * Build location-aware page titles
 */
export function buildTitle(
  base: string,
  location?: LocationData,
  suffix: boolean = true
): string {
  let title = base;
  
  if (location) {
    if (location.town && location.county) {
      title = `${base} in ${location.town}, ${location.county} County, NJ`;
    } else if (location.county) {
      title = `${base} in ${location.county} County, NJ`;
    }
  }
  
  return suffix ? `${title} | ${SITE_NAME}` : title;
}

/**
 * Build location-aware descriptions
 */
export function buildDescription(
  base: string,
  location?: LocationData
): string {
  if (!location) return base;
  
  let desc = base;
  if (location.town && location.county) {
    desc += ` Serving ${location.town} and ${location.county} County, ${DEFAULT_STATE}.`;
  } else if (location.county) {
    desc += ` Serving ${location.county} County, ${DEFAULT_STATE}.`;
  }
  
  return desc.length > 160 ? desc.substring(0, 157) + "..." : desc;
}

/**
 * Generate canonical URL
 */
export function buildCanonical(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Generate structured metadata object
 */
export function buildMetadata(
  base: string,
  path: string,
  location?: LocationData,
  overrides?: Partial<SEOMetadata>
): SEOMetadata {
  return {
    title: buildTitle(base, location),
    description: buildDescription(
      overrides?.description || base,
      location
    ),
    canonical: buildCanonical(path),
    type: overrides?.type || "website",
    image: overrides?.image || `${SITE_URL}/og/default.jpg`,
    keywords: overrides?.keywords || [],
  };
}

/**
 * County-specific SEO data
 */
export const COUNTY_SEO_DATA: Record<string, { name: string; description: string; keywords: string[] }> = {
  bergen: {
    name: "Bergen County",
    description: "Expert home renovation services across Bergen County's 70+ towns. From Paramus to Ridgewood, Hackensack to Fort Lee.",
    keywords: ["Bergen County renovations", "Bergen County contractors", "Northern NJ remodeling"],
  },
  passaic: {
    name: "Passaic County",
    description: "Professional renovation contractors serving Passaic County communities including Wayne, Clifton, and Paterson.",
    keywords: ["Passaic County renovations", "Wayne contractors", "Clifton remodeling"],
  },
  morris: {
    name: "Morris County",
    description: "Trusted renovation experts for Morris County homeowners in Morristown, Parsippany, and surrounding areas.",
    keywords: ["Morris County renovations", "Morristown contractors", "Morris County remodeling"],
  },
  essex: {
    name: "Essex County",
    description: "Quality home renovations in Essex County, serving Newark, Montclair, West Orange, and neighboring towns.",
    keywords: ["Essex County renovations", "Montclair contractors", "West Orange remodeling"],
  },
  hudson: {
    name: "Hudson County",
    description: "Modern renovation solutions for Hudson County homes in Jersey City, Hoboken, Bayonne, and beyond.",
    keywords: ["Hudson County renovations", "Jersey City contractors", "Hoboken remodeling"],
  },
};

/**
 * Generate breadcrumb list for JSON-LD
 */
export function generateBreadcrumbList(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": buildCanonical(item.url),
    })),
  };
}

/**
 * Get site-wide constants
 */
export const SEO_CONSTANTS = {
  SITE_NAME,
  SITE_URL,
  DEFAULT_STATE,
  DEFAULT_REGION,
  DEFAULT_IMAGE: `${SITE_URL}/og/default.jpg`,
  BUSINESS_PHONE: "(973) 555-RENO",
  BUSINESS_EMAIL: "hello@smartreno.io",
};
