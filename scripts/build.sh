#!/bin/bash

# Build script that generates sitemap and builds the app

echo "🗺️  Generating sitemap..."
npx tsx scripts/generateSitemap.ts

echo "🏗️  Building application..."
vite build

echo "✅ Build complete!"
