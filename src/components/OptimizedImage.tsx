import React from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  webpSrc?: string;
}

/**
 * OptimizedImage component with lazy loading and performance optimizations
 * - WebP format support with automatic fallback to PNG/JPG
 * - Lazy loading for images below the fold
 * - Proper width/height attributes to prevent layout shift
 * - Decoding async for better performance
 * - Priority prop to disable lazy loading for above-fold images
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  webpSrc,
  ...props
}: OptimizedImageProps) {
  // Auto-generate WebP source if not provided
  const autoWebpSrc = webpSrc || src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  
  // Check if we should use picture element (when webp is different from src)
  const useWebP = webpSrc || src.match(/\.(png|jpg|jpeg)$/i);

  if (useWebP) {
    return (
      <picture>
        <source 
          srcSet={autoWebpSrc} 
          type="image/webp"
        />
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(className)}
          {...props}
        />
      </picture>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(className)}
      {...props}
    />
  );
}
