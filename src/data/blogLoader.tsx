import type { Post } from '@/types/blog'
import { calculateReadingTime } from '@/lib/readingTime'

// Use only eager imports to avoid mixing with dynamic imports
const mdxModules = import.meta.glob('/content/blog/**/*.mdx', { eager: true })
const rawModules = import.meta.glob('/content/blog/**/*.mdx', { eager: true, query: '?raw', import: 'default' })

function slugFromPath(p: string) {
  return p.replace('/content/blog/', '').replace(/\.mdx$/, '')
}

export async function getAllPosts(): Promise<Post[]> {
  const entries = Object.entries(mdxModules).map(([path, mod]: any) => {
    const fm = mod?.frontmatter || {}
    if (fm.published === false) return null
    
    const slug = slugFromPath(path)
    const url = `/blog/${slug}`
    
    // Get raw content for reading time calculation
    const rawContent = rawModules[path + '?raw'] as string || ''
    const readingTime = calculateReadingTime(rawContent)
    
    const Comp = mod.default
    
    return { ...fm, slug, url, readingTime, Component: Comp } as Post
  })
  
  return (entries.filter(Boolean) as Post[]).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  )
}

export async function getPostBySlug(slug: string) {
  const path = `/content/blog/${slug}.mdx`
  
  const mod: any = mdxModules[path]
  if (!mod) return null
  
  const fm = mod.frontmatter || {}
  
  // Get raw content for reading time
  const rawContent = rawModules[path + '?raw'] as string || ''
  const readingTime = calculateReadingTime(rawContent)
  
  const Comp = mod.default
  
  return { ...fm, slug, url: `/blog/${slug}`, readingTime, Component: Comp } as Post
}

export function getCategories(posts: Post[]): string[] {
  const cats = new Set(posts.map(p => p.category))
  return Array.from(cats).sort()
}

export function getTags(posts: Post[]): string[] {
  const tags = new Set<string>()
  posts.forEach(p => p.tags?.forEach(t => tags.add(t)))
  return Array.from(tags).sort()
}

export function filterByCategory(posts: Post[], category: string) {
  return posts.filter(p => p.category.toLowerCase() === category.toLowerCase())
}

export function filterByTag(posts: Post[], tag: string) {
  return posts.filter(p => (p.tags || []).map(t => t.toLowerCase()).includes(tag.toLowerCase()))
}
