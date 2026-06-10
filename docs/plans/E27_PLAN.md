# Epic 27: Real Photography (Placeholder/Generated Assets Pass)
**Goal:** Replace the current image placeholders in the Before/After Gallery and the Meet Your Team section with high-quality, cohesive, generated/placeholder photography assets. Translate and update all team profile copy to match the updated owner (Lauren S.) and new lead cleaner (Sarah M.).

**Primary Persona(s) Served:**
- **P5 Sophie Tremblay-Gagnon:** Demands French UX and high-quality visual proof (before/after gallery) to trust the eco-friendly/premium service.
- **P6 Gallagher (Airbnb):** Seeks visual turnover reliability and proof of detail-oriented cleaning.
- **P1 Diane Lafleur:** Desires a consistent, trusted local team; seeing genuine faces (owner Lauren S., cleaner Sarah M.) establishes familiarity and trust.

---

## Strategy 1: Local Generated High-End Realistic Photography (Recommended)
**Description:** Use the AI image generation tool to produce high-resolution, professional-grade interior photography assets for the gallery and professional headshots for team profiles. Save these files locally in `/public/images/gallery/` and `/public/images/team/` in JPG/WebP formats, configure width/height bounds to prevent CLS, and update component references.

**Files Changed:**
1. `src/lib/galleryData.ts`: Replace `null` before/after image sources with local paths.
2. `src/components/home/MeetTheTeam.tsx`: Replace `null` team photo sources with local paths.
3. `src/components/ui/GalleryImage.tsx`: Add explicit `width` and `height` attributes to the rendered `<img>` tag to optimize CLS (Cumulative Layout Shift) now that images are populated.
4. `src/i18n/locales/en.json` & `src/i18n/locales/fr.json`:
   - Replace owner name "Ryan D." with "Lauren S.", updating bios in English/French (owner is Lauren S. — bubbly, blonde, bohemian style).
   - Replace "Cleaner Name" with "Sarah M." (Lead Professional Cleaner — experienced, meticulous, friendly) and write a custom bio in English/French.
   - Update booking step 4 preferred cleaner placeholder from "Ryan D." to "Lauren S."

**Persona Impact:**
- Highest trust conversion for P1 Diane, P5 Sophie, and P6 Gallagher. Beautiful, realistic images showcase the quality of the cleaning.
- Zero external runtime dependencies or latency.

**Risks:**
- Asset size overhead: Must optimize the generated images using lightweight compression.

**Schema Audit:**
- No database schema changes. The data model (`beforeSrc`, `afterSrc`, `photoSrc` as optional strings) is already fully compatible.

---

## Strategy 2: Dynamic Stock Imagery (Unsplash Source API)
**Description:** Load placeholder images dynamically from Unsplash's source API using query tags (e.g. `https://images.unsplash.com/.../kitchen-clean`).
**Files Changed:** `src/lib/galleryData.ts`, `src/components/home/MeetTheTeam.tsx` (reference external URLs).
**Risks:**
- Dynamic URLs can break or load slowly, violating Travis's need for fast mobile load times and Margaret's accessibility stability (CLS shifts).
- Relies on external network requests, which can fail.

---

## Strategy 3: CSS/SVG Stylized Art Illustrations
**Description:** Instead of photography, design modern, elegant SVG illustrations representing clean vs dirty rooms and minimalist stylized avatars.
**Files Changed:** `src/lib/galleryData.ts`, `src/components/home/MeetTheTeam.tsx`.
**Risks:**
- Harder to convey "high-contrast" cleaning results than real photographs, which might fail to convince P5 Sophie or P6 Gallagher of the service's thoroughness.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, as decided during our `/grill-me` session. We will:
1. Generate the 10 gallery images (5 before/after pairs representing kitchen, airbnb, bathroom, move-out, and post-construction) using realistic high-contrast descriptions.
2. Generate 2 team profile photos (Lauren S. and Sarah M.).
3. Update the data arrays, translation files, and set up the layouts.

**Awaiting your explicit human approval to execute Strategy 1!**
