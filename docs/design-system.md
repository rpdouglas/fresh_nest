# Fresh Nest Co. — Design System

**Version:** 2.0 | **Updated:** 2026-06-06
**Status:** Active — Reference before writing any CSS or Tailwind classes

> [!IMPORTANT]
> This document is the single source of truth for all visual tokens, typography, spacing, and component patterns. Brand_Auditor subagent validates every PR against this file.

---

## 1. Brand Colors

All tokens are defined in `tailwind.config.js` under `theme.extend.colors`. Use the Tailwind class names exactly as listed — never use raw hex values in component code.

| Token | Hex | Tailwind Class (bg) | Usage |
|---|---|---|---|
| `slate-brand` | `#5b7e8f` | `bg-slate-brand` | Primary CTAs, active states, icons |
| `slate-dark` | `#3f5f6e` | `bg-slate-dark` | Hover states, nav active, dark backgrounds |
| `slate-light` | `#7fa0b0` | `bg-slate-light` | Muted accents, secondary icons |
| `slate-pale` | `#d6e5ec` | `bg-slate-pale` | Card backgrounds, circles, highlights |
| `cream` | `#f7f3ee` | `bg-cream` | Alternate section backgrounds |
| `warm-white` | `#fdfaf6` | `bg-warm-white` | Default page background |
| `sand` | `#e8ddd0` | `bg-sand` | Borders, dividers, card borders |
| `sand-dark` | `#c4b09a` | `bg-sand-dark` | Decorative accent lines |
| `charcoal` | `#2c3a40` | `bg-charcoal` | Headings, footer background |
| `text-muted` | `#7a8f96` | `text-text-muted` | Body copy, labels |

### Color Usage Examples

```html
<!-- Primary CTA button -->
<button class="bg-slate-brand hover:bg-slate-dark text-white ...">Book Now</button>

<!-- Section background alternation -->
<section class="bg-warm-white">...</section>
<section class="bg-cream">...</section>

<!-- Card -->
<div class="bg-white border border-sand ...">...</div>

<!-- Heading -->
<h2 class="text-charcoal font-display ...">Our Services</h2>

<!-- Muted label / body copy -->
<p class="text-text-muted font-body ...">Available in your area</p>
```

### Contrast Compliance (WCAG AA — 4.5:1 minimum)

| Foreground | Background | Ratio | Status |
|---|---|---|---|
| `charcoal` `#2c3a40` | `warm-white` `#fdfaf6` | ~11.5:1 | ✅ Pass |
| `charcoal` `#2c3a40` | `cream` `#f7f3ee` | ~11.1:1 | ✅ Pass |
| `white` | `slate-brand` `#5b7e8f` | ~4.6:1 | ✅ Pass |
| `white` | `slate-dark` `#3f5f6e` | ~6.2:1 | ✅ Pass |
| `text-muted` `#7a8f96` | `warm-white` `#fdfaf6` | ~4.5:1 | ✅ Pass |
| `slate-brand` `#5b7e8f` | `warm-white` `#fdfaf6` | ~4.6:1 | ✅ Pass |

> [!WARNING]
> Never place `slate-light` text on `warm-white` backgrounds — contrast is insufficient for WCAG AA.

---

## 2. Typography

### Font Families

| Role | Font | Tailwind Class | Google Fonts Weights |
|---|---|---|---|
| Display / H1–H3 | Cormorant Garamond | `font-display` | 300, 400, 400 italic, 600, 700, 600 italic, 700 italic |
| Subheadings | Marcellus | `font-sub` | 400 |
| Body / UI / CTAs | DM Sans | `font-body` | 300, 400, 500, 600, 700 |

### Font Loading

Load via Google Fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600;1,700&family=Marcellus&family=DM+Sans:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Typographic Scale

| Element | Classes | Notes |
|---|---|---|
| Page title / H1 | `font-display text-5xl text-charcoal` | Cormorant Garamond 700 (forced bold globally in index.css) |
| Section heading / H2 | `font-display text-4xl text-charcoal` | Cormorant Garamond 700 (forced bold globally in index.css) |
| Card heading / H3 | `font-sub text-2xl text-charcoal` | Marcellus 400 |
| Subheading / H4 | `font-sub text-xl text-charcoal` | Marcellus 400 |
| Body copy | `font-body text-base text-charcoal` | DM Sans 300 — minimum 16px |
| Muted label | `font-body text-sm text-text-muted` | DM Sans 300 — minimum 14px labels only |
| CTA / button | `font-body font-medium` | DM Sans 500 |

> [!IMPORTANT]
> **Margaret persona requirement:** Body text must be a minimum of `text-base` (16px) across all viewport sizes. Never use `text-sm` for body copy.

---

## 3. Spacing & Layout

### Grid & Container

| Token | Value | Tailwind |
|---|---|---|
| Max content width | 1240px | `max-w-content` (custom) |
| Section padding — desktop | `py-20 px-6` | — |
| Section padding — mobile | `py-12 px-4` | — |

Apply responsive section padding with:
```html
<section class="py-12 px-4 md:py-20 md:px-6">
```

### Spacing Scale (common usage)

| Purpose | Value | Tailwind |
|---|---|---|
| Component gap (tight) | 8px | `gap-2` |
| Component gap (standard) | 16px | `gap-4` |
| Component gap (loose) | 24px | `gap-6` |
| Card padding | 24px | `p-6` |
| Section inner margin | 48px | `mb-12` |
| Stack gap (page-level) | 80px | `space-y-20` |

### Touch Targets

> [!IMPORTANT]
> **Margaret persona requirement:** All interactive elements (buttons, links, inputs, checkboxes) must have a minimum height of 48px (`min-h-[48px]`). This applies across all viewport sizes.

```html
<!-- Correct — 48px minimum -->
<button class="min-h-[48px] px-6 font-body font-medium ...">Book Now</button>

<!-- Incorrect — do not use h-10 (40px) for tappable elements -->
<button class="h-10 px-6 ...">Book Now</button>
```

---

## 4. Component Conventions

### Buttons

#### Primary Button
```html
<button class="bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200">
  Book a Clean
</button>
```

#### Secondary Button (Outlined)
```html
<button class="border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200">
  Learn More
</button>
```

> [!CAUTION]
> Border radius for all brand elements is `rounded` (4px). Do **NOT** use `rounded-lg`, `rounded-xl`, or `rounded-full` on primary buttons or cards.

### Cards

```html
<div class="bg-white rounded border border-sand shadow-sm p-6">
  <!-- card content -->
</div>
```

Alternate card on coloured section backgrounds:
```html
<div class="bg-slate-pale rounded border border-sand shadow-sm p-6">
  <!-- card content -->
</div>
```

### Section Headers

```html
<h2 class="font-display text-4xl text-charcoal mb-4">Our Services</h2>
<p class="font-body text-base text-text-muted max-w-xl">
  Professional cleaning for Cornwall and surrounding communities.
</p>
```

### Navigation

```html
<!-- Nav link — default -->
<a class="font-body text-base text-charcoal hover:text-slate-brand transition-colors">Services</a>

<!-- Nav link — active -->
<a class="font-body text-base text-slate-dark font-medium border-b-2 border-slate-brand">Services</a>
```

### Form Inputs

All inputs must have a visible `<label>` — never placeholder-only (WCAG 2.1 AA requirement).

```html
<label class="block font-body text-base text-charcoal mb-1" for="email">
  Email Address
</label>
<input
  id="email"
  type="email"
  class="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
  placeholder="you@example.com"
/>
```

### Phone Number (Tappable — Margaret & CASL requirement)

```html
<!-- In nav and footer — must be a tappable tel: link -->
<a href="tel:+16135551234" class="font-body text-base text-slate-brand hover:text-slate-dark">
  (613) 555-1234
</a>
```

---

## 5. Critical Tailwind v3 Rules

> [!CAUTION]
> This project uses **Tailwind CSS v3.4.x**. The following are hard prohibitions:

| ❌ Do NOT use | Reason |
|---|---|
| `@import "tailwindcss"` | v4 syntax only |
| `@theme { ... }` blocks | v4 syntax only |
| `@tailwindcss/vite` plugin | v4 only |
| `rounded-lg` on brand buttons/cards | Breaks brand border-radius convention |
| Inline hex values in className | Use Tailwind token classes only |
| `text-sm` for body copy | Violates Margaret's 16px minimum |

### ✅ Correct CSS Entry Point

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### ✅ Correct tailwind.config.js Shape

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'slate-brand': '#5b7e8f',
        'slate-dark':  '#3f5f6e',
        'slate-light': '#7fa0b0',
        'slate-pale':  '#d6e5ec',
        'cream':       '#f7f3ee',
        'warm-white':  '#fdfaf6',
        'sand':        '#e8ddd0',
        'sand-dark':   '#c4b09a',
        'charcoal':    '#2c3a40',
        'text-muted':  '#7a8f96',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sub:     ['Marcellus', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
}
```

---

## 6. Brand Auditor Checklist

Run against every PR before merge:

- [ ] All colour classes use token names (no inline hex)
- [ ] All headings use `font-display` or `font-sub`
- [ ] All body copy uses `font-body text-base` (min 16px)
- [ ] All buttons use `rounded` not `rounded-lg`
- [ ] All interactive elements have `min-h-[48px]`
- [ ] All form inputs have a visible `<label>`
- [ ] Phone number rendered as `<a href="tel:...">` in nav and footer
- [ ] No v4 Tailwind syntax in CSS files

---

*End of Design System — do not add tokens without updating `tailwind.config.js` and this document together.*
