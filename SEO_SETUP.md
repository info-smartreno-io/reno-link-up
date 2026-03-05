# SmartReno SEO Configuration

This project implements comprehensive SEO optimization for maximum search engine visibility.

## Features Implemented

### 1. Static Prerendering
- **Plugin**: `vite-plugin-prerender` with Puppeteer renderer
- **Routes prerendered at build time**:
  - Landing pages: `/`, `/homeowners`, `/contractors`, `/architects`, `/interiordesigners`
  - About & info pages: `/about`, `/careers`, `/get-estimate`
  - Blog: `/blog`
  - Locations: `/locations` + all county pages
- **Benefits**: Search engines see fully-rendered HTML instead of empty React shells

### 2. Enhanced Meta Tags
All landing pages now include:
- **Title tags**: Optimized with primary keywords, under 60 characters
- **Meta descriptions**: 150-160 characters with natural keyword integration
- **Canonical URLs**: Prevent duplicate content issues
- **Open Graph tags**: Optimized social media sharing (Facebook, LinkedIn)
- **Twitter Cards**: Enhanced Twitter/X sharing
- **Structured Data (JSON-LD)**: Schema.org markup for rich search results

### 3. Sitemap Generation
- **Script**: `scripts/generateSitemap.ts`
- **Output**: `public/sitemap.xml`
- **Includes**:
  - All static pages with appropriate priorities
  - County pages (Bergen, Passaic, Morris, Essex, Hudson)
  - All blog posts with publication dates
  - Blog categories
- **URL**: Accessible at `https://smartreno.io/sitemap.xml`

### 4. Robots.txt
- Updated to reference sitemap
- Allows all search engine crawlers
- Location: `public/robots.txt`

## Build Process

### Development
```bash
npm run dev
```
No prerendering in development for faster builds.

### Production Build
```bash
npm run build
```
This automatically:
1. Generates sitemap (`scripts/generateSitemap.ts`)
2. Builds application with Vite
3. Prerenders all configured routes
4. Optimizes HTML with deferred scripts

Or use the build script:
```bash
bash scripts/build.sh
```

## SEO Best Practices Implemented

### Page-Level Optimization
✅ Single H1 per page matching primary intent  
✅ Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`)  
✅ Descriptive alt attributes on all images  
✅ Clean, crawlable URLs  
✅ Mobile-responsive design with proper viewport meta tags  

### Technical SEO
✅ Canonical tags on all pages  
✅ XML sitemap with proper priorities and change frequencies  
✅ Robots.txt configuration  
✅ Structured data (JSON-LD) for business information  
✅ Pre-rendered HTML for search engine crawlers  
✅ Lazy loading for images (where applicable)  

### Content Hierarchy
- **Priority 1.0**: Homepage (/)
- **Priority 0.9**: Main landing pages (homeowners, locations, contractors, get-estimate)
- **Priority 0.85**: County pages
- **Priority 0.8**: Blog index, architects, interior designers
- **Priority 0.7**: Individual blog posts, about page
- **Priority 0.6**: Blog categories, careers

## Maintaining SEO

### Adding New Pages
1. Add SEO meta tags using `react-helmet-async`:
```tsx
import { Helmet } from "react-helmet-async";

<Helmet>
  <title>Page Title | SmartReno</title>
  <meta name="description" content="..." />
  <link rel="canonical" href="https://smartreno.io/your-page" />
  <meta property="og:title" content="..." />
  <meta property="og:description" content="..." />
  <meta property="og:url" content="https://smartreno.io/your-page" />
</Helmet>
```

2. Add route to `vite.config.ts` prerender array
3. Add URL to `scripts/generateSitemap.ts`
4. Rebuild sitemap: `npx tsx scripts/generateSitemap.ts`

### Adding New Blog Posts
Blog posts are automatically included in the sitemap from `src/data/blogPosts.ts`. Just ensure:
- Slug is defined
- Date is set
- Helmet meta tags are in the MDX file

## Performance Monitoring

### Tools to Use
- **Google Search Console**: Monitor indexing, crawl errors
- **Google PageSpeed Insights**: Check performance scores
- **Screaming Frog**: Audit sitemap and meta tags
- **Ahrefs/SEMrush**: Track keyword rankings

### Key Metrics
- Core Web Vitals (LCP, FID, CLS)
- Mobile-friendliness
- Indexing coverage
- Backlink profile

## Deployment

When deploying to production, ensure:
1. Base URL is set correctly in `scripts/generateSitemap.ts`
2. Canonical URLs match your production domain
3. Sitemap is accessible at `/sitemap.xml`
4. Robots.txt is accessible at `/robots.txt`
5. Submit sitemap to Google Search Console

## Future Enhancements

- [ ] Add more structured data types (FAQs, How-Tos)
- [ ] Implement breadcrumb structured data
- [ ] Add hreflang tags for multi-language support (if needed)
- [ ] Generate separate sitemaps for blog vs. pages
- [ ] Add image sitemap for better image SEO
- [ ] Implement automatic social media card image generation
