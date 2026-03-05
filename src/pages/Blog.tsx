import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { getAllPosts, getCategories } from "@/data/blogLoader";
import type { Post } from "@/types/blog";
import PostCard from "@/components/blog/PostCard";
import SearchBar from "@/components/blog/SearchBar";
import RssSubscribe from "@/components/blog/RssSubscribe";
import NewsletterSignup from "@/components/blog/NewsletterSignup";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatReadingTime } from "@/lib/readingTime";

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    getAllPosts().then(p => {
      setPosts(p);
      setCategories(getCategories(p));
    });
  }, []);

  const filteredPosts = activeCategory === "all" 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <>
      <Helmet>
        <title>SmartReno Blog - Smart Insights for Smarter Renovations</title>
        <meta
          name="description"
          content="Expert advice on home renovations, contractor selection, financing options, and project management from the SmartReno team."
        />
        <meta property="og:title" content="SmartReno Blog" />
        <meta
          property="og:description"
          content="Expert advice on home renovations, contractor selection, financing options, and project management."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://smartreno.io/blog" />
        <link rel="alternate" type="application/rss+xml" title="SmartReno Blog RSS Feed" href="https://smartreno.io/rss.xml" />
        <link rel="alternate" type="application/atom+xml" title="SmartReno Blog Atom Feed" href="https://smartreno.io/atom.xml" />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Header */}
        <header className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
          <div className="container mx-auto px-4 py-12 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                ← Back to Home
              </Link>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                SmartReno Blog
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Guides, insights, and real renovation data from North Jersey's most trusted renovation network.
              </p>
              <div className="max-w-md mx-auto">
                <SearchBar />
              </div>
            </div>
          </div>
        </header>

        {/* Category Filter Tabs */}
        <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={activeCategory === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="whitespace-nowrap"
              >
                All Posts
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="container mx-auto px-4 py-12 lg:py-16">
            <Link 
              to={featuredPost.url}
              className="group block max-w-5xl mx-auto"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <div className="aspect-[21/9] lg:aspect-[21/9] overflow-hidden bg-muted">
                  <img
                    src={featuredPost.hero}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&h=600&fit=crop";
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                      {featuredPost.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(featuredPost.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </div>
                    {featuredPost.readingTime && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatReadingTime(featuredPost.readingTime)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-4xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground text-sm lg:text-base max-w-3xl line-clamp-2">
                    {featuredPost.description}
                  </p>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Posts Grid */}
        <section className="container mx-auto px-4 pb-16 lg:pb-24">
          {/* Newsletter Signup */}
          <div className="mb-12 max-w-4xl mx-auto">
            <NewsletterSignup source="blog_index" />
          </div>

          {/* RSS Subscribe Banner */}
          <div className="mb-12 max-w-4xl mx-auto">
            <RssSubscribe />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {remainingPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No blog posts found in this category.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
