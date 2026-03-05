/**
 * JSON-LD Structured Data Components
 * Framework-agnostic schema.org markup for SEO
 */

import React from "react";
import { Helmet } from "react-helmet-async";
import { SEO_CONSTANTS } from "@/utils/seo";

interface JsonLdProps {
  data: object;
}

/**
 * Base JSON-LD component
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

/**
 * Organization Schema
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SEO_CONSTANTS.SITE_NAME,
    "url": SEO_CONSTANTS.SITE_URL,
    "logo": `${SEO_CONSTANTS.SITE_URL}/logo.png`,
    "description": "SmartReno simplifies home renovations in Northern New Jersey with vetted contractors, transparent pricing, and expert project management.",
    "telephone": SEO_CONSTANTS.BUSINESS_PHONE,
    "email": SEO_CONSTANTS.BUSINESS_EMAIL,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Northern New Jersey",
      "addressRegion": "NJ",
      "addressCountry": "US",
    },
    "areaServed": [
      {
        "@type": "State",
        "name": "New Jersey",
      },
    ],
    "sameAs": [
      "https://www.facebook.com/smartreno",
      "https://www.linkedin.com/company/smartreno",
      "https://twitter.com/smartreno",
    ],
  };

  return <JsonLd data={schema} />;
}

/**
 * LocalBusiness Schema
 */
interface LocalBusinessSchemaProps {
  county?: string;
  priceRange?: string;
}

export function LocalBusinessSchema({ county, priceRange = "$$$" }: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": SEO_CONSTANTS.SITE_URL,
    "name": SEO_CONSTANTS.SITE_NAME,
    "image": `${SEO_CONSTANTS.SITE_URL}/og/default.jpg`,
    "description": `Professional home renovation services${county ? ` in ${county}` : " across Northern NJ"}. Get competitive bids from vetted local contractors.`,
    "telephone": SEO_CONSTANTS.BUSINESS_PHONE,
    "email": SEO_CONSTANTS.BUSINESS_EMAIL,
    "priceRange": priceRange,
    "url": SEO_CONSTANTS.SITE_URL,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": county || "Northern New Jersey",
      "addressRegion": "NJ",
      "addressCountry": "US",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "40.917577",
      "longitude": "-74.171547",
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "15:00",
      },
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "247",
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * FAQ Schema
 */
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return <JsonLd data={schema} />;
}

/**
 * Service Schema
 */
interface ServiceSchemaProps {
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string;
}

export function ServiceSchema({ name, description, serviceType, areaServed }: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceType,
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": SEO_CONSTANTS.SITE_NAME,
      "url": SEO_CONSTANTS.SITE_URL,
    },
    "areaServed": areaServed || "Northern New Jersey",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": `${SEO_CONSTANTS.SITE_URL}/get-estimate`,
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * Article/Blog Post Schema
 */
interface ArticleSchemaProps {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}

export function ArticleSchema({
  title,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image || SEO_CONSTANTS.DEFAULT_IMAGE,
    "author": {
      "@type": "Person",
      "name": author,
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONSTANTS.SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SEO_CONSTANTS.SITE_URL}/logo.png`,
      },
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return <JsonLd data={schema} />;
}
