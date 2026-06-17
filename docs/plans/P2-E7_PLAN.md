# Phase A Plan: P2-E7 PWA Configuration

This plan outlines three strategies for configuring the customer app as an installable Progressive Web App (PWA) with static asset caching and offline support.

---

## Strategy 1: `generateSW` Workbox Caching, Custom React Install Toast, and Localized Offline Route (Recommended)

This strategy registers `vite-plugin-pwa` in `apps/customer/vite.config.ts` using the auto-generated Service Worker (`generateSW`) approach. It sets up caching rules for CSS, JS, fonts, and images. It intercepts the `beforeinstallprompt` event to show a dismissible, slide-in bottom toast on the user's second page view (delayed by 5 seconds). Finally, it creates a localized `/offline` page with Margaret-accessible phone link targets.

### Files Changed

- **[apps/customer/vite.config.ts](file:///workspaces/fresh_nest/apps/customer/vite.config.ts)**:
  - Import and configure `VitePWA` plugin with `generateSW` strategy.
  - Define Workbox options, including `globPatterns` and `runtimeCaching` for Google Fonts.
- **[apps/customer/src/App.tsx](file:///workspaces/fresh_nest/apps/customer/src/App.tsx)**:
  - Register the `/offline` route.
- **[apps/customer/src/pages/OfflinePage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/OfflinePage.tsx)**:
  - Create a new, fully localized offline fallback screen.
  - Render a clear explanation, tappable phone number `tel:` link, and navigation to cached sections.
- **[apps/customer/src/components/layout/InstallPrompt.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/layout/InstallPrompt.tsx)**:
  - Intercept the `beforeinstallprompt` event and store the deferred prompt.
  - Render a slide-in bottom prompt after a 5-second delay on the second session visit.
- **[apps/customer/src/components/layout/Navbar.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/layout/Navbar.tsx)** (or main layout wrapper):
  - Mount the `InstallPrompt` component.
- **[apps/customer/src/i18n/locales/en.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/en.json)** and **[apps/customer/src/i18n/locales/fr.json](file:///workspaces/fresh_nest/apps/customer/src/i18n/locales/fr.json)**:
  - Add translation keys for the offline fallback page and the custom install prompt.

### Persona Impact
- **P2 Travis McLeod**: High impact. The app becomes installable on his iPhone/Android, and can be accessed with a single tap on his home screen. The delayed prompt on the second visit prevents interrupting his fast, under-3-minute booking flow.
- **P3 Margaret Storey**: High impact. The custom localized offline page provides a prominent, 48px tappable phone number link so she can easily call if she loses connectivity.
- **FSM Cleaners**: Medium impact. Fast web app shell loads and remains functional under spotty connections.

### Risks & Mitigations
- *Risk*: The `beforeinstallprompt` event is only supported on Chromium-based browsers (Android Chrome, Desktop Chrome/Edge). iOS Safari does not support this event, so the custom toast will not appear on Apple devices.
  - *Mitigation*: The component will check if `beforeinstallprompt` fired. If not, it will remain hidden, preventing broken UI or errors. iOS users can still install the app manually via the Safari "Add to Home Screen" sharing menu, which is supported by the index.html Apple meta tags.

### Schema Audit
- **Schema changes:** None.
- **firestore.rules changes:** None.
- **firestore.indexes.json changes:** None.

---

## Strategy 2: `injectManifest` with Custom Service Worker (Precise Cache Control)

This strategy uses `injectManifest` mode, requiring developers to write a manual `sw.js` file. This offers absolute control over caching headers and advanced offline capabilities (e.g. background sync) but increases build complexity.

### Files Changed
- **[apps/customer/vite.config.ts](file:///workspaces/fresh_nest/apps/customer/vite.config.ts)**: Configure `VitePWA` in `injectManifest` mode.
- **[apps/customer/src/sw.js](file:///workspaces/fresh_nest/apps/customer/src/sw.js)**: Create custom Service Worker script, configuring precaching and routing.
- Component and route files as listed in Strategy 1.

### Persona Impact
- Similar to Strategy 1, but with slightly higher developer risk if custom Service Worker logic has bugs.

### Risks & Mitigations
- *Risk*: Mistakes in manual Service Worker code could cause caching failures, stale asset states, or infinite reloading loops.
  - *Mitigation*: Ensure comprehensive test suites and manual validation before deployment.

### Schema Audit
- **Schema changes:** None.
- **firestore.rules changes:** None.
- **firestore.indexes.json changes:** None.

---

## Strategy 3: Default Browser Prompt and Auto-Update (Minimal Code Changes)

This strategy uses `vite-plugin-pwa` default configurations without a custom React install banner or custom offline pages. It relies entirely on the default browser prompt and registers the service worker with `autoUpdate` enabled.

### Files Changed
- **[apps/customer/vite.config.ts](file:///workspaces/fresh_nest/apps/customer/vite.config.ts)**: Simple PWA plugin configuration.

### Persona Impact
- **P3 Margaret Storey**: Poor experience. If she loses connection and tries to open the app, she sees the standard browser "No Internet" screen, with no helpful links or tappable phone number.
- **P2 Travis McLeod**: Less engaging. Lacks a customized install banner, relying entirely on the browser's native install indicator which is easily missed.

### Risks & Mitigations
- *Risk*: Mid-session auto-updates can reload the app in the middle of a booking, causing Travis to lose his booking progress and violate his 3-minute booking constraint.
  - *Mitigation*: None.

### Schema Audit
- **Schema changes:** None.
- **firestore.rules changes:** None.
- **firestore.indexes.json changes:** None.

---

## Recommended Strategy

We recommend **Strategy 1**. It balances custom UX branding (install banner delay, localized offline page) with the safety and reliability of Workbox auto-generated caching rules.
