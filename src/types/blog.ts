export type PostFrontmatter = {
  title: string
  description: string
  date: string
  updated?: string
  author: string
  category: string
  tags?: string[]
  hero: string
  published?: boolean
  canonical?: string
}

export type Post = PostFrontmatter & {
  slug: string
  url: string
  readingTime?: number
  Component?: React.ComponentType<any>
}
