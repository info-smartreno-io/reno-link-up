# SmartReno AI Image Studio

## Overview

The AI Image Studio is an admin-only feature that allows you to generate, manage, and publish AI-powered images for your website. All image generation happens in the admin environment, and images are manually approved before going live on the public site.

## Features

- **AI Image Generation**: Generate on-brand renovation images using AI
- **Image Slot Management**: Organize images by their location on the site (home hero, kitchen page, etc.)
- **Manual Approval Workflow**: All AI-generated images must be manually approved before going live
- **Image Variants**: Keep multiple image options and switch between them easily
- **Stock Image Fallbacks**: Default stock images are used when no active image is set

## How It Works

### 1. Image Slots

Image slots define where images are used on the website:

- `home_hero` - Home page hero
- `kitchen_hero` - Kitchen renovations page
- `bathroom_hero` - Bathroom renovations page
- `interior_hero` - Interior renovations page
- `basement_hero` - Basement renovations page
- `additions_hero` - Home additions page
- `bergen_hero`, `passaic_hero`, etc. - County-specific pages
- `financing_hero`, `warranty_hero` - Service pages

### 2. Admin Workflow

1. Navigate to `/admin/ai-images`
2. Select an image slot to manage
3. Generate AI images using the form:
   - Describe what you want
   - Select room type (optional)
   - Choose style (Modern, Farmhouse, etc.)
4. Review generated variants
5. Click "Set Live" to publish an image to the public site

### 3. Public Site Integration

The public site uses the `useSlotImage` hook to fetch active images:

```tsx
import { useSlotImage } from "@/hooks/useSlotImage";

function MyComponent() {
  const { imageUrl } = useSlotImage("home_hero", "/stock/home-hero.jpg");
  
  return <img src={imageUrl} alt="Hero" />;
}
```

If no active image is set, it falls back to the stock image provided.

## AI Prompt Guidelines

The AI automatically adds safety constraints to all prompts:

- **No people, no faces**
- **No text overlays, no logos**
- **Professional residential renovation photography**
- **Clean, bright, realistic style**
- **High resolution**

Your prompt should describe:
- The room or space
- Key features (cabinets, fixtures, finishes)
- Lighting preferences
- Overall mood

Example prompts:
- "Modern kitchen with white shaker cabinets, marble countertops, and pendant lighting"
- "Luxury bathroom with walk-in shower, floating vanity, and large mirror"
- "Finished basement with comfortable seating area and recessed lighting"

## Database Schema

### `image_slots`
- Defines locations where images are used
- Contains active_image_id pointing to the current live image

### `image_assets`
- Stores all generated and uploaded images
- Tracks source (ai/manual), status (draft/approved/rejected), and metadata

## Edge Function

`ai-generate-image` handles the AI generation process:
1. Validates the slot
2. Builds a safe prompt with constraints
3. Calls Lovable AI (Gemini Flash Image model)
4. Uploads to Supabase Storage
5. Creates asset record
6. Logs to ai_agent_activity

## Security

- All admin routes require authentication
- Edge function requires JWT verification
- RLS policies ensure only authenticated users can modify images
- Public can only read approved images

## Stock Images

Default stock images are located in `/public/stock/`:
- `home-hero.jpg`
- `kitchen-hero.jpg`
- `bathroom-hero.jpg`
- `interior-hero.jpg`
- `basement-hero.jpg`

These serve as fallbacks when no active AI image is set.

## Future Enhancements

- Manual image upload support
- Batch generation for multiple slots
- A/B testing between image variants
- Analytics on image performance
- Custom aspect ratios per slot
