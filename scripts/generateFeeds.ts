import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'
import { globby } from 'globby'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const ROOT       = resolve(__dirname, '..')
const CONTENT    = resolve(ROOT, 'content', 'blog')
const PUB        = resolve(ROOT, 'public')
const RSS_DIR    = resolve(PUB, 'rss')

const SITE = process.env.SITE_URL || 'https://smartreno.io'

function slugFromPath(absPath: string) {
  const rel = relative(CONTENT, absPath).replace(/\\/g, '/')
  return rel.replace(/\.mdx$/, '')
}

function slugifyCategory(category: string) {
  return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

;(async () => {
  // Ensure /public and /public/rss exists
  if (!existsSync(PUB)) mkdirSync(PUB, { recursive: true })
  if (!existsSync(RSS_DIR)) mkdirSync(RSS_DIR, { recursive: true })

  // Read frontmatter from MDX files directly (no Vite/import.meta.glob)
  const files = await globby(['**/*.mdx'], { cwd: CONTENT, absolute: true })
  const posts = files
    .map(full => {
      const src = readFileSync(full, 'utf8')
      const { data } = matter(src)
      const slug = slugFromPath(full)
      const url  = `/blog/${slug}`
      const fm: any = data || {}
      if (fm.published === false) return null
      return {
        slug, url,
        title: fm.title || slug,
        description: fm.description || '',
        category: fm.category || '',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        date: fm.date || new Date().toISOString(),
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date))

  // RSS 2.0 Feed
  const rssItems = posts.map((p: any) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE}${p.url}</link>
      <guid isPermaLink="true">${SITE}${p.url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
      <category><![CDATA[${p.category}]]></category>
      ${p.tags.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('\n      ')}
    </item>`).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SmartReno Blog</title>
    <link>${SITE}/blog</link>
    <description>Expert renovation guides, cost breakdowns, and design trends for North Jersey homeowners</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`

  writeFileSync(resolve(PUB, 'rss.xml'), rss)

  // Atom Feed
  const atomEntries = posts.map((p: any) => `
  <entry>
    <title>${p.title}</title>
    <link href="${SITE}${p.url}" />
    <id>${SITE}${p.url}</id>
    <updated>${new Date(p.date).toISOString()}</updated>
    <summary>${p.description}</summary>
    <category term="${p.category}" />
    ${p.tags.map((tag: string) => `<category term="${tag}" />`).join('\n    ')}
  </entry>`).join('')

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SmartReno Blog</title>
  <link href="${SITE}/blog" />
  <link href="${SITE}/atom.xml" rel="self" />
  <updated>${new Date().toISOString()}</updated>
  <id>${SITE}/blog</id>
  <subtitle>Expert renovation guides, cost breakdowns, and design trends for North Jersey homeowners</subtitle>
  ${atomEntries}
</feed>`

  writeFileSync(resolve(PUB, 'atom.xml'), atom)

  // Get all unique categories
  const categories = new Set<string>()
  posts.forEach(p => {
    if (p.category) categories.add(p.category)
  })

  // Generate category-specific feeds
  let categoryFeedCount = 0
  for (const category of categories) {
    const categoryPosts = posts.filter(p => p.category === category)
    const categorySlug = slugifyCategory(category)

    // Category RSS Feed
    const categoryRssItems = categoryPosts.map((p: any) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE}${p.url}</link>
      <guid isPermaLink="true">${SITE}${p.url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
      <category><![CDATA[${p.category}]]></category>
      ${p.tags.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('\n      ')}
    </item>`).join('')

    const categoryRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SmartReno Blog - ${category}</title>
    <link>${SITE}/blog/categories/${categorySlug}</link>
    <description>${category} articles from SmartReno: Expert renovation guides for North Jersey homeowners</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss/${categorySlug}.xml" rel="self" type="application/rss+xml" />
    ${categoryRssItems}
  </channel>
</rss>`

    writeFileSync(resolve(RSS_DIR, `${categorySlug}.xml`), categoryRss)

    // Category Atom Feed
    const categoryAtomEntries = categoryPosts.map((p: any) => `
  <entry>
    <title>${p.title}</title>
    <link href="${SITE}${p.url}" />
    <id>${SITE}${p.url}</id>
    <updated>${new Date(p.date).toISOString()}</updated>
    <summary>${p.description}</summary>
    <category term="${p.category}" />
    ${p.tags.map((tag: string) => `<category term="${tag}" />`).join('\n    ')}
  </entry>`).join('')

    const categoryAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SmartReno Blog - ${category}</title>
  <link href="${SITE}/blog/categories/${categorySlug}" />
  <link href="${SITE}/rss/${categorySlug}-atom.xml" rel="self" />
  <updated>${new Date().toISOString()}</updated>
  <id>${SITE}/blog/categories/${categorySlug}</id>
  <subtitle>${category} articles from SmartReno: Expert renovation guides for North Jersey homeowners</subtitle>
  ${categoryAtomEntries}
</feed>`

    writeFileSync(resolve(RSS_DIR, `${categorySlug}-atom.xml`), categoryAtom)
    categoryFeedCount++
  }

  // Sitemap with lastmod
  const blogUrls = posts.map((p: any) => `
  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${new Date(p.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const staticUrls = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE}/blog`, priority: '0.9', changefreq: 'daily' },
  ].map(u => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${blogUrls}
</urlset>`

  writeFileSync(resolve(PUB, 'sitemap.xml'), sitemap)

  // JSON index
  writeFileSync(resolve(PUB, 'api-posts.json'), JSON.stringify({ posts }, null, 2))

  console.log(`✓ Generated RSS (${posts.length} posts)`)
  console.log(`✓ Generated Atom feed`)
  console.log(`✓ Generated ${categoryFeedCount} category-specific feeds`)
  console.log(`✓ Generated sitemap.xml`)
  console.log(`✓ Generated api-posts.json`)
})().catch(err => {
  console.error('Feed generation failed:', err)
  process.exit(1)
})
