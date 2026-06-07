# E13 — Service Areas + /locations/* Pages · Implementation Plan

## Phase A — Planning Gate

**Epic:** E13 — Service Areas + /locations/* Pages  
**Phase:** 2 (Content & Conversion)  
**Date:** 2026-06-07

---

## Persona Identification

| Persona | Need | Key Requirement |
|---|---|---|
| **P4 Kahnawà:ke Baptiste** (primary) | `/locations/akwesasne` exists; "We serve Cornwall Island" stated explicitly — not just "Akwesasne area" | Island-explicit callout band on Akwesasne page; community language; no tourism tropes |
| **P5 Sophie Tremblay-Gagnon** (primary) | `/locations/snye-qc` exists; full French copy when FR is active; explicit Quebec provincial border statement | `"Nous servons Akwesasne, côté Québec"` in French; FR-first page copy; eco/baby-safe mention |
| **P2 Travis McLeod** (primary) | `/locations/long-sault` exists confirming South Stormont coverage; booking CTA accessible fast | CTA to `/booking` on every location page |
| **P1 Diane Lafleur** | Location pages in French | All page strings via `t()`; FR copy complete for all 5 pages |
| **P3 Margaret Storey** | Finds service area info; phone number visible | Phone in Navbar (already present); 16px text; 48px CTA |

**Persona tests (Phase C gate):**
- **Kahnawà:ke:** Navigates to `/locations/akwesasne` → reads "We serve Cornwall Island" as a distinct, prominent callout — not buried in body text.
- **Sophie:** Visits `/locations/snye-qc` with FR locale → all page copy in French; explicit "Nous servons Akwesasne, côté Québec" visible; eco-product mention present.
- **Travis:** `/locations/long-sault` exists, loads without error, confirms "South Stormont" coverage, and has a booking CTA.

---

## Scope

Six pages total:
- `/locations` — hub/overview page listing all 5 service areas
- `/locations/cornwall-on` — primary market
- `/locations/akwesasne` — Kahnawà:ke gate; "Cornwall Island" explicit
- `/locations/snye-qc` — Sophie gate; French-primary; cross-border explicit
- `/locations/long-sault` — Travis gate; South Stormont
- `/locations/morrisburg` — SDG County catchment

All pages: page heading, subhead, short description, services-available tags, Google Maps iframe, booking CTA. Akwesasne and Snye QC additionally receive a persona-specific callout band. All page content via `t()`. SEO `<title>` + `<meta name="description">` via React 19 native head hoisting (no library).

**Not in scope:** the booking form `notes` field placeholder text for island logistics (E15), commercial service pages (E20/E21), Google Maps API key upgrade (deferred to Phase 4).

---

## Route Fix

App.tsx currently defines `/locations/cornwall` — master plan specifies `/locations/cornwall-on`. Phase B **must update** this route slug. No redirect needed (the old placeholder was never live-linked).

---

## Files Affected

| File | Action |
|---|---|
| `src/lib/locationData.ts` | **Create** — `LocationConfig` interface + 5 named config exports |
| `src/pages/LocationPage.tsx` | **Create** — shared location page component |
| `src/pages/LocationsOverview.tsx` | **Create** — `/locations` hub page |
| `src/App.tsx` | **Modify** — swap 6 PlaceholderPages for real components; fix `cornwall` → `cornwall-on` |
| `src/i18n/locales/en.json` | **Modify** — add `locations.*` block |
| `src/i18n/locales/fr.json` | **Modify** — add `locations.*` block |

No Tailwind config changes. No Firestore ops. No new npm dependencies.

---

## Schema Audit

Zero Firestore reads/writes. All data is static `LocationConfig` objects and i18n strings.

---

## `LocationConfig` Interface (`src/lib/locationData.ts`)

```ts
import type { ServiceType } from '@/types'

export interface LocationConfig {
  slug: string
  headingKey: string
  subheadKey: string
  descriptionKey: string
  pageTitleKey: string
  metaDescKey: string
  mapQuery: string
  calloutKey?: string       // optional — Akwesasne + Snye QC only
  services: ServiceType[]
}
```

**Five named exports** (imported individually by App.tsx routes):

```ts
export const CORNWALL_ON: LocationConfig = {
  slug: 'cornwall-on',
  headingKey: 'locations.cornwallOn.heading',
  subheadKey: 'locations.cornwallOn.subhead',
  descriptionKey: 'locations.cornwallOn.description',
  pageTitleKey: 'locations.cornwallOn.pageTitle',
  metaDescKey: 'locations.cornwallOn.metaDesc',
  mapQuery: 'Cornwall+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial'],
}

export const AKWESASNE: LocationConfig = {
  slug: 'akwesasne',
  headingKey: 'locations.akwesasne.heading',
  subheadKey: 'locations.akwesasne.subhead',
  descriptionKey: 'locations.akwesasne.description',
  pageTitleKey: 'locations.akwesasne.pageTitle',
  metaDescKey: 'locations.akwesasne.metaDesc',
  mapQuery: 'Cornwall+Island+Akwesasne+Ontario',
  calloutKey: 'locations.akwesasne.islandNote',
  services: ['standard', 'deep', 'moveout', 'postconstruction'],
}

export const SNYE_QC: LocationConfig = {
  slug: 'snye-qc',
  headingKey: 'locations.snyeQc.heading',
  subheadKey: 'locations.snyeQc.subhead',
  descriptionKey: 'locations.snyeQc.description',
  pageTitleKey: 'locations.snyeQc.pageTitle',
  metaDescKey: 'locations.snyeQc.metaDesc',
  mapQuery: 'Snye+Quebec+Akwesasne',
  calloutKey: 'locations.snyeQc.borderNote',
  services: ['standard', 'deep', 'moveout'],
}

export const LONG_SAULT: LocationConfig = {
  slug: 'long-sault',
  headingKey: 'locations.longSault.heading',
  subheadKey: 'locations.longSault.subhead',
  descriptionKey: 'locations.longSault.description',
  pageTitleKey: 'locations.longSault.pageTitle',
  metaDescKey: 'locations.longSault.metaDesc',
  mapQuery: 'Long+Sault+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'airbnb'],
}

export const MORRISBURG: LocationConfig = {
  slug: 'morrisburg',
  headingKey: 'locations.morrisburg.heading',
  subheadKey: 'locations.morrisburg.subhead',
  descriptionKey: 'locations.morrisburg.description',
  pageTitleKey: 'locations.morrisburg.pageTitle',
  metaDescKey: 'locations.morrisburg.metaDesc',
  mapQuery: 'Morrisburg+Ontario+Canada',
  services: ['standard', 'deep', 'moveout'],
}

export const ALL_LOCATIONS: LocationConfig[] = [
  CORNWALL_ON, AKWESASNE, SNYE_QC, LONG_SAULT, MORRISBURG,
]
```

**Services rationale (Phase 2 assumption — needs business owner confirmation before launch):**
- Cornwall ON: full suite including commercial (HQ city)
- Akwesasne: residential only (no commercial; post-construction included for new builds on island)
- Snye QC: standard residential only (cross-border logistics; no commercial)
- Long Sault: residential + Airbnb (waterfront tourism area)
- Morrisburg: residential only (small-town, lower volume)

---

## i18n Keys (`locations.*`)

**en.json** additions:

```json
"locations": {
  "ariaLabel":         "Service areas",
  "servicesHeading":   "Services Available Here",
  "mapLabel":          "Map of {{location}}",
  "bookCta":           "Book a Cleaning in {{location}}",
  "bookAriaLabel":     "Book a cleaning in {{location}}",
  "overview": {
    "pageTitle":       "Service Areas | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. serves Cornwall ON, Akwesasne, Snye QC, Long Sault, and Morrisburg. Professional bilingual cleaning services.",
    "heading":         "Our Service Areas",
    "subhead":         "We proudly serve Cornwall and surrounding communities — including Akwesasne, Snye QC, Long Sault, and Morrisburg.",
    "viewLocation":    "View details →"
  },
  "cornwallOn": {
    "pageTitle":       "Professional Cleaning in Cornwall, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. offers bilingual professional cleaning services in Cornwall, ON — standard, deep, move-out, post-construction, Airbnb turnover, and commercial.",
    "heading":         "Cleaning Services in Cornwall, ON",
    "subhead":         "Cornwall's trusted bilingual cleaning team — residential, commercial, and Airbnb.",
    "description":     "Fresh Nest Co. is based in Cornwall and serves the full city including the east and west ends, the waterfront, and surrounding residential neighbourhoods. We offer standard, deep, move-out, post-construction, Airbnb turnover, and commercial cleaning — all in English and French."
  },
  "akwesasne": {
    "pageTitle":       "Professional Cleaning in Akwesasne | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. serves Akwesasne including Cornwall Island. We cross the Seaway International Bridge — standard, deep, and move-out cleaning available.",
    "heading":         "Cleaning Services in Akwesasne",
    "subhead":         "We serve the full Akwesasne community — including Cornwall Island.",
    "description":     "We cross the Seaway International Bridge to serve Cornwall Island and the broader Akwesasne community. Standard, deep clean, and move-out cleans available. Please include island address and access details in your booking notes.",
    "islandNote":      "We serve Cornwall Island — we cross the bridge. Please include your island address and any access instructions in your booking notes."
  },
  "snyeQc": {
    "pageTitle":       "Professional Cleaning in Snye, QC | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. serves Snye, Quebec — on the Quebec side of Akwesasne. Bilingual, eco-friendly cleaning. Standard, deep, and move-out.",
    "heading":         "Cleaning Services in Snye, QC",
    "subhead":         "We serve the Quebec side of Akwesasne, including Snye.",
    "description":     "Fresh Nest Co. travels across the provincial border to serve clients in Snye and the Quebec side of Akwesasne. We use eco-friendly, baby-safe products on all cleans. Standard, deep clean, and move-out cleaning available. Fully bilingual service — book in French or English.",
    "borderNote":      "We serve Akwesasne, Quebec side (Snye) — we cross the provincial border. Eco-friendly, baby-safe products used on every clean."
  },
  "longSault": {
    "pageTitle":       "Professional Cleaning in Long Sault, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. serves Long Sault and South Stormont, ON. Professional residential and Airbnb turnover cleaning.",
    "heading":         "Cleaning Services in Long Sault",
    "subhead":         "Serving Long Sault and South Stormont — including waterfront Airbnb properties.",
    "description":     "Long Sault and South Stormont residents count on Fresh Nest Co. for reliable residential cleaning. We also serve waterfront Airbnb and cottage properties in the area. Standard, deep clean, move-out, and Airbnb turnover cleaning available."
  },
  "morrisburg": {
    "pageTitle":       "Professional Cleaning in Morrisburg, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. serves Morrisburg and South Dundas, ON. Professional residential cleaning — standard, deep, and move-out.",
    "heading":         "Cleaning Services in Morrisburg",
    "subhead":         "Serving Morrisburg and South Dundas County.",
    "description":     "Morrisburg and the surrounding South Dundas area are within our regular service zone. Standard, deep clean, and move-out cleaning available. Contact us to confirm scheduling for your specific address."
  }
}
```

**fr.json** additions — all keys translated, including the Snye QC borderNote in French as the explicit persona gate:

```json
"locations": {
  "ariaLabel":         "Zones desservies",
  "servicesHeading":   "Services disponibles ici",
  "mapLabel":          "Carte de {{location}}",
  "bookCta":           "Réserver un nettoyage à {{location}}",
  "bookAriaLabel":     "Réserver un nettoyage à {{location}}",
  "overview": {
    "pageTitle":       "Zones desservies | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. dessert Cornwall ON, Akwesasne, Snye QC, Long Sault et Morrisburg. Services de nettoyage professionnels bilingues.",
    "heading":         "Nos zones desservies",
    "subhead":         "Nous desservons fièrement Cornwall et les communautés environnantes — notamment Akwesasne, Snye QC, Long Sault et Morrisburg.",
    "viewLocation":    "Voir les détails →"
  },
  "cornwallOn": {
    "pageTitle":       "Nettoyage professionnel à Cornwall, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. offre des services de nettoyage bilingues à Cornwall, ON — standard, en profondeur, déménagement, post-construction, rotation Airbnb et commercial.",
    "heading":         "Services de nettoyage à Cornwall, ON",
    "subhead":         "L'équipe de nettoyage bilingue de confiance à Cornwall — résidentiel, commercial et Airbnb.",
    "description":     "Fresh Nest Co. est basé à Cornwall et dessert l'ensemble de la ville, incluant les secteurs est et ouest, le bord de l'eau et les quartiers résidentiels avoisinants. Nous offrons le nettoyage standard, en profondeur, de déménagement, post-construction, la rotation Airbnb et le nettoyage commercial — en anglais et en français."
  },
  "akwesasne": {
    "pageTitle":       "Nettoyage professionnel à Akwesasne | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. dessert Akwesasne, incluant l'île de Cornwall. Nous traversons le pont international Seaway — nettoyage standard, en profondeur et de déménagement disponibles.",
    "heading":         "Services de nettoyage à Akwesasne",
    "subhead":         "Nous desservons l'ensemble de la communauté d'Akwesasne — incluant l'île de Cornwall.",
    "description":     "Nous traversons le pont international Seaway pour desservir l'île de Cornwall et la communauté d'Akwesasne. Nettoyage standard, en profondeur et de déménagement disponibles. Veuillez indiquer votre adresse sur l'île et les instructions d'accès dans les notes de réservation.",
    "islandNote":      "Nous desservons l'île de Cornwall — nous traversons le pont. Veuillez indiquer votre adresse sur l'île et les instructions d'accès dans les notes de réservation."
  },
  "snyeQc": {
    "pageTitle":       "Nettoyage professionnel à Snye, QC | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. dessert Snye, Québec — côté québécois d'Akwesasne. Service bilingue, produits écologiques. Standard, en profondeur et déménagement.",
    "heading":         "Services de nettoyage à Snye, QC",
    "subhead":         "Nous desservons Akwesasne, côté Québec, incluant Snye.",
    "description":     "Fresh Nest Co. se déplace au-delà de la frontière provinciale pour desservir les clients à Snye et du côté québécois d'Akwesasne. Nous utilisons des produits écologiques et sûrs pour les bébés sur tous nos nettoyages. Nettoyage standard, en profondeur et de déménagement disponibles. Service entièrement bilingue — réservez en français ou en anglais.",
    "borderNote":      "Nous servons Akwesasne, côté Québec (Snye) — nous traversons la frontière provinciale. Produits écologiques et sûrs pour les bébés utilisés à chaque nettoyage."
  },
  "longSault": {
    "pageTitle":       "Nettoyage professionnel à Long Sault, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. dessert Long Sault et South Stormont, ON. Nettoyage résidentiel professionnel et rotation Airbnb.",
    "heading":         "Services de nettoyage à Long Sault",
    "subhead":         "Desservant Long Sault et South Stormont — incluant les propriétés Airbnb en bord de l'eau.",
    "description":     "Les résidents de Long Sault et South Stormont comptent sur Fresh Nest Co. pour un nettoyage résidentiel fiable. Nous desservons également les propriétés Airbnb et les chalets en bord du Saint-Laurent. Nettoyage standard, en profondeur, de déménagement et rotation Airbnb disponibles."
  },
  "morrisburg": {
    "pageTitle":       "Nettoyage professionnel à Morrisburg, ON | Fresh Nest Co.",
    "metaDesc":        "Fresh Nest Co. dessert Morrisburg et South Dundas, ON. Nettoyage résidentiel professionnel — standard, en profondeur et déménagement.",
    "heading":         "Services de nettoyage à Morrisburg",
    "subhead":         "Desservant Morrisburg et le comté de South Dundas.",
    "description":     "Morrisburg et la région de South Dundas environnante font partie de notre zone de service régulière. Nettoyage standard, en profondeur et de déménagement disponibles. Contactez-nous pour confirmer la disponibilité pour votre adresse spécifique."
  }
}
```

**FR copy notes:**
- Snye QC `borderNote`: "Nous servons Akwesasne, côté Québec" — verbatim master plan requirement ✓
- Akwesasne `islandNote`: "l'île de Cornwall" — correct bilingual name for Cornwall Island ✓
- `bookCta` uses `{{location}}` interpolation — same pattern as other CTA keys ✓

---

## Strategy 1 — Shared `LocationPage` Component (Recommended)

### Description

One `LocationPage` component renders all 5 location pages. Each route in App.tsx passes a typed `LocationConfig` object as the `config` prop. The component renders: React 19 head tags, page hero, optional callout band (when `config.calloutKey` is set), services-available chip row, Google Maps iframe, and booking CTA. Zero layout duplication across the 5 pages — only the data differs.

### Page Structure

```
<title> + <meta name="description">   ← React 19 native head hoisting

[bg-warm-white]  Page hero
  H1: {t(config.headingKey)}
  p:  {t(config.subheadKey)}

[Optional callout — bg-slate-pale border border-sand]
  Icon + {t(config.calloutKey)}       ← Akwesasne + Snye QC only

[bg-cream]  Services available
  Heading: "Services Available Here"
  Chips: service tag per config.services entry (reuses service name keys)

[bg-warm-white]  Map + CTA
  <iframe> Google Maps embed
  CTA: "Book a Cleaning in {{location}}" → /booking
```

### `LocationPage` Component Structure

```tsx
// src/pages/LocationPage.tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LocationConfig } from '@/lib/locationData'

export default function LocationPage({ config }: { config: LocationConfig }) {
  const { t } = useTranslation()
  const locationName = t(config.headingKey)

  return (
    <>
      {/* React 19 native head hoisting */}
      <title>{t(config.pageTitleKey)}</title>
      <meta name="description" content={t(config.metaDescKey)} />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}>
            <h1 className="font-display text-5xl text-charcoal mb-4">{t(config.headingKey)}</h1>
            <p className="font-body text-base text-text-muted mb-6">{t(config.subheadKey)}</p>
            <p className="font-body text-base text-charcoal max-w-2xl">{t(config.descriptionKey)}</p>
          </motion.div>

          {/* Optional callout band */}
          {config.calloutKey && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-8 flex items-start gap-4 bg-slate-pale border border-sand rounded p-5">
              <div className="shrink-0 mt-0.5" aria-hidden="true">
                {/* Location pin icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                  className="w-5 h-5 text-slate-brand">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="font-body text-base text-charcoal">{t(config.calloutKey)}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Services available */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          <h2 className="font-sub text-2xl text-charcoal mb-6">{t('locations.servicesHeading')}</h2>
          <ul className="flex flex-wrap gap-3" role="list">
            {config.services.map(service => (
              <li key={service}>
                <Link
                  to={`/booking?serviceType=${service}`}
                  className="inline-flex items-center font-body text-base text-slate-brand
                             border border-slate-brand rounded px-4 min-h-[48px]
                             hover:bg-slate-brand hover:text-white
                             transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  {t(`services.${service}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Map + CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          {/* Google Maps iframe */}
          <div className="rounded overflow-hidden border border-sand mb-10">
            <iframe
              title={t('locations.mapLabel', { location: locationName })}
              src={`https://maps.google.com/maps?q=${config.mapQuery}&output=embed`}
              className="w-full h-64 md:h-96 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Booking CTA */}
          <div className="text-center">
            <Link
              to="/booking"
              aria-label={t('locations.bookAriaLabel', { location: locationName })}
              className="inline-flex items-center justify-center font-body font-medium text-base
                         bg-slate-brand text-white hover:bg-slate-dark
                         rounded px-8 min-h-[48px] transition-colors
                         focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
            >
              {t('locations.bookCta', { location: locationName })}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
```

**Animation note:** Page hero uses `animate` (not `whileInView`) — it's the first above-fold element, consistent with the Hero section pattern. Services and map sections don't use Framer Motion — they're below fold but the static render is acceptable for location pages (no stagger pattern needed on a short page).

**`allowFullScreen` on iframe:** Omitted intentionally. Google Maps embed iframes work without `allowFullScreen`. The attribute is only needed for full-screen map mode which isn't a requirement here.

**`referrerPolicy="no-referrer-when-downgrade"`:** Standard for Google Maps embeds to ensure the referrer is sent correctly to the Maps CDN.

### `LocationsOverview` Component

```tsx
// src/pages/LocationsOverview.tsx
// Hub page at /locations — lists all 5 service areas with links
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ALL_LOCATIONS } from '@/lib/locationData'

export default function LocationsOverview() {
  const { t } = useTranslation()
  return (
    <>
      <title>{t('locations.overview.pageTitle')}</title>
      <meta name="description" content={t('locations.overview.metaDesc')} />

      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }} className="mb-10">
            <h1 className="font-display text-5xl text-charcoal mb-4">
              {t('locations.overview.heading')}
            </h1>
            <p className="font-body text-base text-text-muted">
              {t('locations.overview.subhead')}
            </p>
          </motion.div>

          <motion.ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            {ALL_LOCATIONS.map(loc => (
              <li key={loc.slug}>
                <Link
                  to={`/locations/${loc.slug}`}
                  className="block bg-white border border-sand rounded shadow-sm p-6
                             hover:border-slate-brand hover:shadow-md
                             transition-all focus:outline-none focus:ring-2 focus:ring-slate-brand
                             min-h-[48px]"
                >
                  <h2 className="font-sub text-xl text-charcoal mb-2">{t(loc.headingKey)}</h2>
                  <p className="font-body text-base text-text-muted mb-4">{t(loc.subheadKey)}</p>
                  <span className="font-body text-base text-slate-brand underline underline-offset-2">
                    {t('locations.overview.viewLocation')}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>
    </>
  )
}
```

### App.tsx Changes (Phase B)

Replace 6 PlaceholderPage entries under `// ── Locations ──`:

```tsx
import {
  CORNWALL_ON, AKWESASNE, SNYE_QC, LONG_SAULT, MORRISBURG,
} from '@/lib/locationData'
import LocationPage from '@/pages/LocationPage'
import LocationsOverview from '@/pages/LocationsOverview'

// Routes:
{ path: 'locations',            element: <LocationsOverview /> },
{ path: 'locations/cornwall-on', element: <LocationPage config={CORNWALL_ON} /> },
{ path: 'locations/akwesasne',   element: <LocationPage config={AKWESASNE} /> },
{ path: 'locations/snye-qc',     element: <LocationPage config={SNYE_QC} /> },
{ path: 'locations/long-sault',  element: <LocationPage config={LONG_SAULT} /> },
{ path: 'locations/morrisburg',  element: <LocationPage config={MORRISBURG} /> },
```

Note: the old `/locations/cornwall` route is removed (no redirect needed — it was a PlaceholderPage with no live links pointing to it).

### Persona Impact

| Persona | Impact |
|---|---|
| Kahnawà:ke (P4) | `/locations/akwesasne` renders with `calloutKey = 'locations.akwesasne.islandNote'` → a `bg-slate-pale` callout band with pin icon reads: "We serve Cornwall Island — we cross the bridge." Not buried in body text — it's the first visible element after the page heading. |
| Sophie (P5) | `/locations/snye-qc` renders in FR: heading "Services de nettoyage à Snye, QC"; `borderNote` callout "Nous servons Akwesasne, côté Québec (Snye) — nous traversons la frontière provinciale." Eco-product mention in `description` and `borderNote`. |
| Travis (P2) | `/locations/long-sault` confirms "Long Sault and South Stormont" in heading + subhead; booking CTA present. |
| Diane (P1) | All 6 pages fully translated in `fr.json`; all strings via `t()`; no English fallbacks. |
| Margaret (P3) | All text ≥ 16px; booking CTA `min-h-[48px]`; service chips `min-h-[48px]`. |

### Risks
- Google Maps iframe `q=` parameter may not resolve perfectly for Snye QC and Cornwall Island (less well-known addresses). Mitigation: tested queries are close to real place names; Phase 4 can upgrade to Maps Embed API with precise lat/lng.
- Service availability list is an assumption (all 5 lists marked "needs business owner confirmation before launch" in close report).
- React 19 `<title>` hoisting works in client-side rendering but initial HTML served by Firebase will have a static `<title>`. Google can render JavaScript — acceptable for Phase 2 local SEO.

---

## Strategy 2 — Individual Page Files per Location

### Description

Six page files: `CornwallOnPage.tsx`, `AkwesasnePage.tsx`, `SnyeQcPage.tsx`, `LongSaultPage.tsx`, `MorrisburgPage.tsx`, `LocationsOverview.tsx`. Each imports a shared `LocationPageLayout` component and passes props. The extra files make each page's unique requirements explicit and give future editors a clear "one file per location" mental model.

### Difference from Strategy 1

Instead of `<LocationPage config={CORNWALL_ON} />`, App.tsx imports `<CornwallOnPage />` directly. Each page file is 10–15 lines — just a config pass-through to `LocationPageLayout`. The structural logic is identical to Strategy 1; this is purely an organisational choice.

### Persona Impact

Same as Strategy 1 — identical rendered output.

### Risks
- 6 additional files with minimal per-file content — boilerplate-heavy
- Each new location added in future requires creating a new file rather than adding a config entry
- No structural benefit over Strategy 1

---

## Strategy 3 — Dynamic Routing via `useParams`

### Description

Single `LocationPage` component reads `const { locationSlug } = useParams<{ locationSlug: string }>()` and loads config from `LOCATION_CONFIGS[locationSlug]`. App.tsx has one dynamic route: `{ path: 'locations/:locationSlug', element: <LocationPage /> }`. The `LocationsOverview` component is separate.

### Difference from Strategy 1

Removes all explicit route entries except `/locations` and `/locations/:locationSlug`. Five fewer lines in App.tsx. The trade-off is that `locationSlug` may not match any config key — requires a 404/fallback for unknown slugs. Also hides location-specific routing from App.tsx (harder to audit).

### Persona Impact

Same rendered output as Strategy 1 when the slug matches. Unknown slugs show a fallback or error state.

### Risks
- TypeScript cannot guarantee `locationSlug` is a valid key at compile time — requires runtime guard and fallback
- Master plan enumerates individual routes explicitly — dynamic routing obscures the intent
- Harder to add location-specific logic (e.g., a future `/locations/akwesasne` section with photos)

---

## Recommended Strategy: **Strategy 1 — Shared `LocationPage` Component**

**Why over Strategy 2:** Individual page files are pure boilerplate — 10-line wrappers that add no structure or clarity beyond what the config object already provides. Adding a new location in Strategy 1 requires 1 export in `locationData.ts` + 1 route in App.tsx. Strategy 2 requires those same changes plus a new file.

**Why over Strategy 3:** Dynamic routing loses compile-time safety and obscures the route table. The master plan lists each location explicitly — Strategy 1 respects that intent.

---

## Subagent Pre-checks (Phase B)

**Brand_Auditor:**
- Hero: `bg-warm-white` ✓
- Callout: `bg-slate-pale border border-sand rounded` ✓ (4px radius, valid tokens)
- Services section: `bg-cream` ✓
- Map/CTA section: `bg-warm-white` ✓
- H1: `font-display text-5xl text-charcoal` — ≥ 16px ✓
- H2 (services heading): `font-sub text-2xl text-charcoal` ✓
- Body copy: `font-body text-base` — 16px ✓
- Service chips: `border border-slate-brand rounded px-4 min-h-[48px]` — Margaret 48px gate ✓; `rounded` (4px) ✓
- Booking CTA: `bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]` ✓
- Overview cards: `bg-white border border-sand rounded shadow-sm` ✓; hover `border-slate-brand` ✓

**Data_Steward:** Zero Firestore ops ✓; no invented fields ✓

**Linguistic_Auditor:**
- All UI strings via `t()` ✓
- `bookCta` + `bookAriaLabel` + `mapLabel` use `{{location}}` interpolation from `t(config.headingKey)` ✓
- `services.${service}.title` reuses existing `services.*` keys — no new hardcoded strings ✓
- FR `snyeQc.borderNote` verbatim: "Nous servons Akwesasne, côté Québec" ✓
- FR `akwesasne.islandNote`: "l'île de Cornwall" ✓

---

## Verification Checklist (Phase C gate)

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Kahnawà:ke test:** `/locations/akwesasne` → `bg-slate-pale` callout band visible with "We serve Cornwall Island" text; pin icon; full EN/FR bilingual ✓
4. **Sophie test (FR locale):** `/locations/snye-qc` → heading "Services de nettoyage à Snye, QC"; callout = "Nous servons Akwesasne, côté Québec…"; eco-product mention in description; no English-only text
5. **Travis test:** `/locations/long-sault` loads without error; "Long Sault and South Stormont" visible; booking CTA present
6. **All 6 pages load without error:** `/locations`, `/locations/cornwall-on`, `/locations/akwesasne`, `/locations/snye-qc`, `/locations/long-sault`, `/locations/morrisburg`
7. **Route fix verified:** `/locations/cornwall` (old) no longer in App.tsx; `/locations/cornwall-on` (new) resolves to CornwallOnPage
8. **Google Maps:** All 5 iframes render (may show Google Maps UI in iframe)
9. **Services chips:** Each chip links to `/booking?serviceType=...`; `min-h-[48px]` ✓
10. **Mobile (375px):** No horizontal scroll; H1 text wraps cleanly; map iframe renders at `h-64`
11. **Tablet (768px):** Overview grid: 2 columns; no horizontal scroll on any location page
12. **FR toggle:** All 6 pages switch to French; `snyeQc.borderNote` in FR visible on Snye page
13. **React 19 title hoisting:** `<title>` tag in browser `<head>` updates when navigating between location pages

---

## HALT — Awaiting Human Approval

Strategies presented. Recommend Strategy 1 — Shared `LocationPage` Component with `LocationConfig` props. Awaiting approval before Phase B execution.
