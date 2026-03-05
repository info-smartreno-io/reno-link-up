import { useEffect, useState } from "react";

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // Get the article element for accurate progress tracking
      const article = document.querySelector("article");
      if (!article) return;

      const scrollTop = window.scrollY;
      const articleTop = article.offsetTop;
      const articleHeight = article.scrollHeight;
      const viewportHeight = window.innerHeight;

      // Calculate progress relative to article content
      const scrollDistance = scrollTop - articleTop;
      const totalScrollableDistance = articleHeight - viewportHeight;

      if (scrollDistance <= 0) {
        setProgress(0);
      } else if (scrollDistance >= totalScrollableDistance) {
        setProgress(100);
      } else {
        const percentage = (scrollDistance / totalScrollableDistance) * 100;
        setProgress(Math.min(100, Math.max(0, percentage)));
      }
    };

    // Update on mount
    updateProgress();

    // Throttle scroll events for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border/20">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}
