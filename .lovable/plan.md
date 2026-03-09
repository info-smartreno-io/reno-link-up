

## Architect Profile Page UI Fix

### Problem
The architect profile page currently shows a "Portfolio" section with hardcoded sample images (kitchen, bathroom, basement, addition). These are generic stock photos, not the architect's actual work. Per your request, remove portfolio images entirely — architects will update their own profiles later.

### Changes

**File: `src/pages/ArchitectProfile.tsx`**

1. **Remove sample photo imports** (lines 23-26) — delete the 4 image imports
2. **Remove `SAMPLE_PHOTOS` array** (lines 196-201)
3. **Replace the Portfolio card** (lines 340-351) with a clean empty-state placeholder:
   - "Portfolio" heading stays
   - Show a subtle message like "This architect hasn't added portfolio items yet"
   - Use a muted icon + text, consistent with the premium card design
4. **Apply the updated card system** — ensure all cards use `rounded-2xl` with softer shadows per the brand refresh
5. **Refine overall spacing and typography** to match the premium proptech design direction (consistent padding, border colors from the design system)

### Result
A clean, polished architect profile page with no fake portfolio images. The portfolio section shows a professional empty state that invites the architect to claim/update their profile.

