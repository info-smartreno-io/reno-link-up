

## Plan: Expand Hero Section on Homepage

The current hero section (lines 95-143 in `src/pages/Index.tsx`) uses `py-16 md:py-24` padding and the hero image is `h-[400px] lg:h-[500px]`. The goal is to make this top section more visually dominant.

### Changes to `src/pages/Index.tsx`

1. **Increase hero padding** — Change `py-16 md:py-24` to `py-20 md:py-32 lg:py-40` for more vertical space.

2. **Enlarge hero image** — Change `h-[400px] lg:h-[500px]` to `h-[450px] lg:h-[600px]` for a taller image.

3. **Increase heading size** — Bump from `lg:text-6xl` to `lg:text-7xl` for more visual impact.

4. **Increase subtext spacing** — Slightly more margin between headline and description.

5. **Add a subtle background gradient** to the hero section to give it more visual weight: `bg-gradient-to-b from-muted/30 to-background`.

These are purely CSS/class changes in one file — no structural or logic changes needed.

