import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getAllPosts, filterByTag } from "@/data/blogLoader";
import type { Post } from "@/types/blog";
import PostCard from "@/components/blog/PostCard";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Tag, Home } from "lucide-react";

export default function BlogTag() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    if (tag) {
      const tagName = tag.replace(/-/g, " ");
      getAllPosts().then(p => setPosts(filterByTag(p, tagName)));
    }
  }, [tag]);
  
  if (!tag) {
    return <Navigate to="/blog" replace />;
  }
  
  const tagName = tag.replace(/-/g, " ");

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
        name: `Tag: ${tagName}`,
        item: `https://smartreno.io/blog/tags/${tag}`,
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Posts tagged "{tagName}" | SmartReno Blog</title>
        <meta
          name="description"
          content={`Read our latest articles tagged with "${tagName}".`}
        />
        <link rel="canonical" href={`https://smartreno.io/blog/tags/${tag}`} />
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
                  <BreadcrumbPage>Tag: {tagName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-6 w-6 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                {tagName}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"} with this tag
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No posts found with this tag.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
