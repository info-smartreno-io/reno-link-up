import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getAllPosts, filterByCategory } from "@/data/blogLoader";
import type { Post } from "@/types/blog";
import PostCard from "@/components/blog/PostCard";
import CategoryRss from "@/components/blog/CategoryRss";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Home } from "lucide-react";

export default function BlogCategory() {
  const { category } = useParams<{ category: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    if (category) {
      const categoryName = category.replace(/-/g, " ");
      getAllPosts().then(p => setPosts(filterByCategory(p, categoryName)));
    }
  }, [category]);
  
  if (!category) {
    return <Navigate to="/blog" replace />;
  }
  
  const categoryName = category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const categorySlug = category;

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
        name: categoryName,
        item: `https://smartreno.io/blog/categories/${category}`,
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{categoryName} | SmartReno Blog</title>
        <meta
          name="description"
          content={`Read our latest articles about ${categoryName.toLowerCase()}.`}
        />
        <link rel="canonical" href={`https://smartreno.io/blog/categories/${category}`} />
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title={`${categoryName} - SmartReno Blog RSS Feed`} 
          href={`https://smartreno.io/rss/${categorySlug}.xml`} 
        />
        <link 
          rel="alternate" 
          type="application/atom+xml" 
          title={`${categoryName} - SmartReno Blog Atom Feed`} 
          href={`https://smartreno.io/rss/${categorySlug}-atom.xml`} 
        />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumb className="mb-6">
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
                  <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {categoryName}
            </h1>
            <p className="text-muted-foreground mb-6">
              {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
            </p>

            {/* Category-specific RSS */}
            <CategoryRss category={categoryName} categorySlug={categorySlug} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No posts found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
