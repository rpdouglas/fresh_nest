// P2-E2: Global configuration constants
export const GOOGLE_BUSINESS_PROFILE_URL = 'https://g.page/r/freshnest-review/review'

// Business contact details — the single source for the customer site (updated 2026-10-01).
// Keep in sync with the `phone`, `footer.email` and `offline.phoneNumber` i18n strings and
// with functions/src/emailTemplates.ts + smsTemplates.ts.
export const BUSINESS_PHONE_DISPLAY = '(613) 861-8812'
export const BUSINESS_PHONE_HREF = 'tel:+16138618812'
export const BUSINESS_PHONE_E164 = '+1-613-861-8812'
export const BUSINESS_EMAIL = 'hello@freshnestco.ca'

// P3-E31: sections hidden until their content is ready. Set a flag to true and deploy to show it.
// SHOW_GALLERY — home before/after section, footer link, /gallery page
// SHOW_TEAM    — Meet the Team on the home and About pages
// SHOW_REVIEWS — home reviews section, footer link, /reviews page, trust bar rating, rating JSON-LD
export const SHOW_GALLERY: boolean = false
export const SHOW_TEAM: boolean = false
export const SHOW_REVIEWS: boolean = false
