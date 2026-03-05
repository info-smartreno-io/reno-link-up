import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getPostBySlug, getAllPosts } from "@/data/blogLoader";
import type { Post } from "@/types/blog";
import Prose from "@/components/blog/Prose";
import CTABlock from "@/components/blog/CTABlock";
import RelatedPosts from "@/components/blog/RelatedPosts";
import SocialShare from "@/components/blog/SocialShare";
import TableOfContents from "@/components/blog/TableOfContents";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import NewsletterSignup from "@/components/blog/NewsletterSignup";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { ArticleNavigation } from "@/components/blog/ArticleNavigation";
import { ArticleStats } from "@/components/blog/ArticleStats";
import { Callout, CTA } from "@/components/blog/MdxComponents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar, User, ArrowLeft, Tag, Clock, Share2 } from "lucide-react";
import { formatReadingTime } from "@/lib/readingTime";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      const p = await getPostBySlug(slug);
      if (isMounted) {
        setPost(p || null);
        setLoading(false);
      }
    }

    loadPost();

    getAllPosts().then((posts) => {
      if (isMounted) {
        setAllPosts(posts);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading article…</p>
      </main>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Find previous and next posts
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : undefined;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : undefined;

  const ogImage = `/blog/og/${post.slug}.jpg`;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `https://smartreno.io${ogImage}`,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "SmartReno",
      logo: {
        "@type": "ImageObject",
        url: "https://smartreno.io/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://smartreno.io/blog/${post.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartreno.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://smartreno.io/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `https://smartreno.io/blog/categories/${post.category.toLowerCase().replace(/\s+/g, "-")}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: `https://smartreno.io/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <ReadingProgressBar />
      
      <Helmet>
        <title>{post.title} | SmartReno Blog</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`https://smartreno.io${ogImage}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={`https://smartreno.io${ogImage}`} />
        <meta property="article:published_time" content={post.date} />
        {post.updated && <meta property="article:modified_time" content={post.updated} />}
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={post.category} />
        {post.tags && post.tags.length > 0 && post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        {post.canonical && <link rel="canonical" href={post.canonical} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Breadcrumbs & Navigation */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/blog">Blog</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/blog/categories/${post.category.toLowerCase().replace(/\s+/g, "-")}`}>
                        {post.category}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-[200px] truncate">
                      {post.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex gap-2">
                <Button variant="ghost" asChild size="sm">
                  <Link to="/blog" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Blog</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Article with TOC */}
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-12">
            {/* Main Content */}
            <article className="mx-auto max-w-4xl min-w-0">{/* min-w-0 prevents grid overflow */}
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="secondary">{post.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                {post.readingTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatReadingTime(post.readingTime)}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {post.author}
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.description}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-6 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog/tags/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Hero Image */}
              <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-2xl">
                <img
                  src={post.hero}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop";
                  }}
                />
              </div>
            </header>

            {/* Content */}
            <div className="mb-12">
              <Prose>
                {post.Component && <post.Component components={{ Callout, CTA }} />}
              </Prose>
            </div>

            <Separator className="my-8" />

            {/* Author Bio */}
            <div className="mb-8">
              <AuthorBio author={post.author} date={post.date} />
            </div>

            {/* Social Share */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Share this article</h3>
              </div>
              <SocialShare 
                title={post.title}
                description={post.description}
                url={post.url}
              />
            </div>

            <Separator className="my-8" />

            {/* Article Navigation */}
            <ArticleNavigation prevPost={prevPost} nextPost={nextPost} />

            {/* Newsletter Signup */}
            <div className="mb-8">
              <NewsletterSignup source="blog_post" />
            </div>

            {/* CTA */}
            <CTABlock />

            {/* Related Posts */}
            <RelatedPosts currentPost={post} />

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Written by {post.author}</p>
                  <p className="text-xs text-muted-foreground">
                    Published on {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/blog">View All Posts</Link>
                </Button>
              </div>
            </footer>
            </article>

            {/* Table of Contents & Stats Sidebar */}
            <aside className="hidden xl:block space-y-6 sticky top-24">
              <TableOfContents />
              <ArticleStats 
                date={post.date}
                readingTime={post.readingTime}
                category={post.category}
              />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
