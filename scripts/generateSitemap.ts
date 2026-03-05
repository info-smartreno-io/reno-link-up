import fs from 'fs';
import path from 'path';
import { bergen, passaic, morris, essex, hudson } from '../src/data/towns';
import { blogPosts } from '../src/data/blogPosts';

const baseUrl = 'https://smartreno.io';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const currentDate = new Date().toISOString().split('T')[0];

// Static pages with their priorities
const staticPages: SitemapUrl[] = [
  { loc: '/', lastmod: currentDate, changefreq: 'weekly', priority: 1.0 },
  { loc: '/homeowners', lastmod: currentDate, changefreq: 'monthly', priority: 0.9 },
  { loc: '/contractors', lastmod: currentDate, changefreq: 'monthly', priority: 0.9 },
  { loc: '/architects', lastmod: currentDate, changefreq: 'monthly', priority: 0.8 },
  { loc: '/interiordesigners', lastmod: currentDate, changefreq: 'monthly', priority: 0.8 },
  { loc: '/about', lastmod: currentDate, changefreq: 'monthly', priority: 0.7 },
  { loc: '/blog', lastmod: currentDate, changefreq: 'daily', priority: 0.8 },
  { loc: '/locations', lastmod: currentDate, changefreq: 'weekly', priority: 0.9 },
  { loc: '/careers', lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
  { loc: '/get-estimate', lastmod: currentDate, changefreq: 'weekly', priority: 0.9 },
];

// County pages
const countyPages: SitemapUrl[] = [
  { loc: '/locations/bergen-county', lastmod: currentDate, changefreq: 'monthly', priority: 0.85 },
  { loc: '/locations/passaic-county', lastmod: currentDate, changefreq: 'monthly', priority: 0.85 },
  { loc: '/locations/morris-county', lastmod: currentDate, changefreq: 'monthly', priority: 0.85 },
  { loc: '/locations/essex-county', lastmod: currentDate, changefreq: 'monthly', priority: 0.85 },
  { loc: '/locations/hudson-county', lastmod: currentDate, changefreq: 'monthly', priority: 0.85 },
];

// Blog posts - import from blogPosts.ts
const blogPages: SitemapUrl[] = blogPosts.map(post => ({
  loc: `/blog/${post.slug}`,
  lastmod: post.date || currentDate,
  changefreq: 'monthly' as const,
  priority: 0.7
}));

// Blog categories
const blogCategories: SitemapUrl[] = [
  { loc: '/blog/category/guides', lastmod: currentDate, changefreq: 'weekly', priority: 0.6 },
  { loc: '/blog/category/tips', lastmod: currentDate, changefreq: 'weekly', priority: 0.6 },
  { loc: '/blog/category/county-guides', lastmod: currentDate, changefreq: 'weekly', priority: 0.6 },
];

// Combine all URLs
const allUrls: SitemapUrl[] = [
  ...staticPages,
  ...countyPages,
  ...blogPages,
  ...blogCategories
];

// Generate XML sitemap
const generateSitemap = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
};

// Write sitemap to public directory
const sitemap = generateSitemap();
const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, sitemap, 'utf-8');

console.log(`✅ Sitemap generated successfully with ${allUrls.length} URLs`);
console.log(`📍 Location: ${outputPath}`);
