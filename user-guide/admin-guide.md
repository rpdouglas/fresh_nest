# Admin Guide — Fresh Nest Co.
**For:** Lauren (Owner) and Managers  
**Updated:** 2026-10-27

---

## Accessing the Admin Dashboard

Navigate to [lilypad-freshnest.web.app/admin](https://lilypad-freshnest.web.app/admin) and click the sign-in button, then choose your Google account. Only **Owners** and **Managers** get in; any other account sees an "access denied" screen.

**Owner and Manager (P3-E35).** Both have the same access to everything in the admin panel, including pay. The only difference: Owners also see the **Team & roles** tab and are the only ones who can give or take away the Owner and Manager roles. See [Team & Roles](#team--roles-owners-only).

The dashboard is split into seven tabs:
1. **Bookings Management:** Track and manage operational client bookings.
2. **Visual Dispatch Board:** Visual drag-and-drop daily calendar schedule and dispatch grid for managing cleaner assignments.
3. **Analytics & Metrics:** Monitor business, marketing, and operational metrics.
4. **Staff Registry:** Manage staff profiles, roles, and registration.
5. **Pay Rate Management:** Configure and monitor hourly pay rates per role.
6. **Audit Logs:** View administrative security override tracking (e.g., travel buffers, earnings caps, and blocked windows overrides).
7. **Reviews Moderation:** Approve or reject submitted client reviews before they appear publicly on the website.

---

## Using the Admin Panel on a Phone

The admin panel works in a phone browser (P3-E33). On screens narrower than a tablet:

- **Section switcher:** the tab strip is replaced by a **Section** dropdown at the top of the page. It stays visible as you scroll. Tap it and pick any section.
- **Links to a section:** the address bar shows the section you are on, e.g. `/admin?tab=dispatch`. Refreshing, going back, or bookmarking keeps you on that section. On a computer the tabs work the same way.
- **No website footer or cookie banner** on admin pages on a phone. On a computer they still show as before.
- **Dialogs** (New Booking, Register Staff, Export, Override) fill the screen. **Cancel / Save** stay pinned to the bottom, and **✕** at the top closes them. On a computer with a keyboard, **Esc** closes any dialog.
- Wide tables (bookings, staff, audit logs) still scroll sideways inside their card. Phone-friendly card lists come in a later update.

---

## Checking for New Quote Requests

Every request sent from the website arrives as a **Pending Confirmation** booking. You are alerted two ways:

- **Text message** to the owner's mobile, within seconds of the request:
  `Fresh Nest Co.: New quote request — Diane Lafleur, Standard Clean, 2026-10-15, 6135550100. Ref #ABCD1234. Follow up within 24 hours.`
  The `Ref #` matches the "Request reference" the client sees on their thank-you page, so you can find their request if they call.
  Alerts go to **(613) 861-8812** unless an `OWNER_PHONE` environment variable is set for the Cloud Functions. That number must be able to receive texts. If it is a landline, set `OWNER_PHONE` to the owner's mobile (E.164 format, e.g. `+16135550100`).
- **"New quote request" email** to the owner inbox, with every detail of the request.

> **Email is not being delivered at the moment** (P3-E30: Resend key and domain setup pending). Until it is fixed, the **text message and the admin panel are the only places new requests appear**. Check the pending list at least once a day, ideally morning and afternoon, to keep the 24-hour promise.

### Finding pending requests
1. Sign in at `/admin` and open the **Bookings** tab.
2. Set **Booking Status** to **Pending Confirmation**. Everything already handled drops out of the list.
3. Set **Sort By** to **Submitted At** and **Sort Order** to **Descending**, so the newest requests are at the top. (The default sorts by the client's preferred cleaning date, which buries new requests.)
4. Leave **Start Date / End Date** as they are. They filter on the **preferred cleaning date** (90 days back to 180 days ahead), so new requests are always included.
5. The list loads 50 bookings at a time. Sorting only reorders what is loaded, so if **Load More** shows at the bottom, click it until it reads "No more bookings".
6. To find one client, type their name, email, phone or address in the search box. Use the `Ref #` from the text to match the request with the **Booking ID** shown in its detail panel (the reference is the ID's first 8 characters).

### Working a request
1. Click the row to open its details: contact information, property, add-ons, notes, and the client's **language**.
2. Call or email the client with a quote **in their language** (EN or FR) within 24 hours. No price is ever shown on the website (P3-E29), so this is where pricing is agreed.
3. **Client accepts** → change **Status** to **Confirmed**, then click **Confirm booking** in the box that asks you to check. This creates the job for the Dispatch Board. It does **not** message the client, so agree the date and time with them directly. They get the day-before reminder text automatically.
4. **Client declines** → change **Status** to **Cancelled**, then click **Cancel booking** in the box that asks you to check. This sends the owner a cancellation text; nothing is sent to the client.

---

## Creating a Phone-In or Walk-In Booking

When a client calls or walks in, you can enter their booking directly from the admin dashboard without them needing to use the website.

1. Go to the **Bookings** tab.
2. Click the **New Booking** button (top-right of the bookings panel).
3. Fill in the three sections:
   - **Service & Property** — service type, property type, bedrooms/bathrooms, pets, add-ons
   - **Schedule & Contact** — preferred date, client name/email/phone/address, frequency, notes
   - **Admin Controls** — communication language, lead source (`Phone Call` or `Walk-In`), assign a cleaner (optional), set the initial status, and the **Checklist** (optional — leave it on **Automatic** to use the saved list for the service type; see [Checklists on Jobs](#checklists-on-jobs))
4. **Status options:**
   - `Pending Confirmation` — creates the booking as a **quote request**. The client immediately receives a "we received your request — we'll follow up with a quote" email/SMS (P3-E29). Use this when the price still needs to be agreed.
   - `Confirmed` — creates the booking, immediately sends a "your booking is confirmed" email/SMS to the client, and creates a job document. Use this when the price was agreed on the call. A warning banner appears if no cleaner is assigned yet.
5. **Marketing consent** — only check this box if the client explicitly opted in during the call.
6. Click **Create Booking**. The booking appears at the top of the bookings list.

> **Note:** Phone-in and walk-in bookings do **not** trigger the owner text alert, since you entered them yourself.
> **Note:** Client email/SMS is sent **once, when a booking is created** — wording depends on the status at creation (`pending` → "quote request received", `confirmed` → "booking confirmed").
> **Changing a booking from `pending` to `confirmed` later does not send any message to the client** (it creates the job only). After a client accepts a quote, confirm the date and time with them directly by phone or email.

---

## Viewing and Managing Bookings

### Booking Statuses
| Status | Meaning |
| :--- | :--- |
| `pending` | **Quote request** — the website shows no prices (P3-E29). Call or email the client within 24 hours with a quote, then set to `confirmed` once they accept |
| `confirmed` | Booking confirmed and scheduled |
| `completed` | Clean completed |
| `cancelled` | Booking cancelled by client or owner |

### Updating a Booking
1. Find the booking in the dashboard table.
2. Click the booking row to expand the detail panel.
3. Use the **Status** dropdown to update the status. Changing to **Confirmed** or **Cancelled** first shows a box naming the client and date. Click the confirm button to go ahead, or **Keep booking** to leave the status as it was.
   *   **Checklist:** under the cleaner assignment, **Change checklist** sets the job's task list. See [Checklists on Jobs](#checklists-on-jobs).
4. Use the **Assigned To** field to assign a cleaner by name (or click custom to type a custom name).
    *   **Constraint Intercepts:** The system automatically checks cleaner constraints (monthly earnings cap, travel buffers, and **Blocked Windows**). If a violation occurs, a modal prompts you for a mandatory override reason. Overrides are recorded in the audit logs.
    *   **Privacy Safeguard:** Blocked window labels (e.g. "Recovery meeting") remain strictly confidential and are never exposed in the override warning.
5. **Referral Metadata:** If a referral code was applied, it is highlighted under the booking metadata in this panel (shows referral code used).

---

## Visual Dispatch Board

The **Visual Dispatch Board** tab provides a daily grid view where you can manage shifts and assignments using drag-and-drop:
*   **Daily Schedule Grid:** Each column represents an active staff member (cleaner or lead) with their role. The rows show the hours from 8:00 AM to 6:00 PM.
*   **Unassigned Sidebar:** A docked, collapsible panel on the left displays unassigned jobs for the selected day.
*   **Drag-and-Drop Assignment:** Drag any job card from the unassigned sidebar and drop it onto a staff column. The card will automatically span the scheduled time slot in that cleaner's column.
*   **Availability & Buffer Audits:** Dropping a job automatically triggers real-time scheduling intelligence audits:
    *   **Earnings Cap Warning:** Flags if the cleaner's projected monthly earnings will exceed their ODSP/financial limit.
    *   **Transit Buffer Check:** Flags if the gap between shifts violates the travel buffer (e.g., 30m for drivers, 60m for transit users), unless both addresses share the same postal prefix (FSA).
    *   **Blocked Windows Conflict:** Flags if a cleaner has blocked out that day/time block.
*   **Override and Audit Logging:** Any detected conflict prompts the **Administrator Override Required** modal. Confirming the assignment requires an override reason, which is automatically saved to the `auditLog` collection. Cancelling the modal returns the card to its original position.
*   **Safe to Earn Meter:** Each column header features a color-coded bar (green/amber/red) indicating the cleaner's monthly progress towards their monthly earnings cap.

---

## Checklists on Jobs

Every job has a checklist: the tasks the cleaner ticks off in the staff app, with photo proof where required. Saved lists are managed on the **Checklist Templates** tab. A job gets one automatically (the active saved list for its service type), and you can change it before work starts.

**Where to change it**
- **Bookings tab:** open the booking, then **Checklist → Change checklist** (under the cleaner assignment).
- **Dispatch Board:** click the **📋** chip on a job card. The number is how many tasks the job has.
- **New Booking dialog:** the optional **Checklist** field.

**In the Checklist dialog**
- **Saved list:** pick a list. Its tasks are shown before you save.
- **Custom list:** build a list for this job only. Start from a blank list or a copy of a saved one, then add, remove or drag tasks into order. Every task needs an English **and** a French name, because cleaners see the list in their own language.
  - Tick **Save as a new saved list** (and give it a name) to reuse it later. It then appears on the Checklist Templates tab.
- **Use this list for future visits** (recurring bookings only): later visits created by the auto-renewal get the same list. A custom list must be saved as a saved list for this.
- **Save checklist** applies it.

**Good to know**
- **The job keeps its own copy.** Editing or deactivating a saved list later does **not** change jobs that already have it. To update an upcoming job, open its checklist and pick the list again.
- **Locked once work starts.** After the cleaner checks in or completes a task, the checklist can't be changed. The dialog says so and only shows the tasks.
- **Before a job exists** (pending booking), the choice is stored on the booking. The job gets it when the booking is confirmed.

---

## Team & Roles (Owners only)

The **Team & roles** tab lists everyone with office access and lets an Owner change it.

- **Give access:** enter the person's email, choose **Manager** or **Owner**, then click **Give access**. The person must have signed in to the site once with that email first.
- **Make Owner / Make Manager:** switches someone between the two roles.
- **Remove access:** asks you to confirm, then takes away office access. Someone who is also on staff keeps the staff app.
- **You can't change your own role.** Ask another Owner, so there is always at least one Owner.
- **After any change,** the person needs to **sign out and sign in again** before the new access applies.
- Every change is recorded in **Audit Logs**: who made it, when, and the old and new role.

## Analytics & Metrics Tab

The **Analytics & Metrics** tab contains two sub-tabs to segment marketing/sales performance from operations:

### A. Marketing & Sales
*   **KPI Cards:** Track estimated total bookings count, estimated revenues (calculated dynamically in-memory based on property specs), average booking values, and **Referred Bookings** (total volume of cleans generated via referral codes).
*   **Time Range Filter:** Filter your charts by *All Time*, *Last 30 Days*, *Last 90 Days*, *Year to Date (YTD)*, or *This Month*.
*   **Lead Source Distribution:** A visual donut chart showing booking distribution by marketing channels (organic, google ads, referrals, facebook ads, direct).
*   **Monthly Trends:** A bar chart tracking estimated revenues month-over-month.
*   **Performance Table:** Shows booking count, total estimated revenue, average value, and percentage conversion share for each lead channel.

### B. Operations & Fulfillment
*   **KPI Cards:** Track **Job Completion Rate** (percentage of completed vs scheduled jobs), **Shifts Completed** (total jobs finished), **Total Labor Cost** (payroll expenses calculated using job scheduled durations and snapshot rates), and **Avg Job Duration** (average check-in to check-out time).
*   **Time Range Filter:** Filter metrics by *Today*, *This Week*, *This Month*, or *Custom Range* (using date-pickers).
*   **Fulfillment Share Chart:** A visual chart of jobs breakdown (completed, in-progress, assigned, unassigned).
*   **Labor Cost Breakdown:** A chart dividing labor expenses by cleaner roles.
*   **Staff Utilization Breakdown:** A table listing each active cleaner, their assigned shifts, completed shifts, and completion rate.

---

## Staff Registry Tab

*   **View Registry:** Lists all employees with their names, roles, statuses, and contact information.
*   **Register New Staff:** Click **Register New Staff** to open the creation modal. Fill in the employee's name, email, phone, role (cleaner, lead, supervisor), default transport mode, transit buffer minutes, and monthly earnings limit (useful for ODSP tracking). Creating the profile registers the staff email to allow secure login.

---

## Pay Rate Management Tab

*   **Active Pay Rates:** Displays the current active hourly rate in CAD for Cleaners, Lead Cleaners, and Supervisors.
*   **Configure New Rate:** Set a new hourly rate for any role. You can choose to have it take **Immediate Effect** or uncheck it to select a custom future date and time for scheduled rate adjustments.
*   **Chronological Rate History:** A table listing all configured rates sorted by effective date, displaying their status (Active, Scheduled, or Historical) and who created them.


---

## Reviews Moderation Tab

*   **View Pending Reviews:** Lists all customer reviews that have been submitted but not yet moderated. Shows reviewer name, location (automatically formatted based on address), selected language, rating (1-5 stars), review text, and submission date.
*   **Approve Review:** Click **Approve** to immediately make the review public on the `/reviews` page.
*   **Reject Review:** Click **Reject** to hide the review. For compliance and auditability (P12 Sarah), rejected reviews are flagged in Firestore as `rejected: true` but are not deleted from the database.


---

## Automated Recurring Booking Auto-Renewal

To maximize retention and ensure cleaning consistency, a scheduled daily background script runs at **2:00 AM UTC**:
1. **Target Identification:** The function identifies bookings marked as `confirmed` or `completed` with a frequency of `weekly`, `biweekly`, or `monthly`.
2. **Next Date Window:** It projects the next occurrence (+7, +14, or +30 days). If that next date is within a 14-day window from today, it initiates renewal.
3. **De-duplication Check:** The system verifies that no active booking already exists for that user on that specific date.
4. **Draft Generation:** If clear, a new booking is generated with status `pending`, copying all property parameters, preferences, notes, preferred cleaners, the client's existing referral code and the checklist chosen for future visits (if any). It is marked as a renewal (`createdBy: system:recurring-renewal`).
5. **Owner Alert:** The owner gets a **"Recurring renewal"** text and email asking them to confirm the visit. The client is **not** sent a "quote request received" email or SMS, and no new referral code is created.
6. **Confirm to schedule:** Set the renewal to `confirmed` in the admin panel. That creates the job for dispatch, and the client then gets the usual day-before reminder SMS.

> **Reminder SMS:** the day-before reminder goes only to `confirmed` bookings. A `pending` quote request or unconfirmed renewal gets no "your cleaning is tomorrow" text.

---

## Firestore Databases

| Environment | Database | Used For |
| :--- | :--- | :--- |
| Production | `(default)` | Real client bookings |
| Development | `freshnest-dev` | Testing and preview PRs |

To view databases: [Firebase Console → Firestore](https://console.firebase.google.com/project/freshnest-aa51e/firestore)

---

## Managing the Before & After Gallery

The **Gallery** tab on the admin page is where photo pairs are added and managed. It works on a phone.

**To add a pair**

1. Open the admin page, choose the **Gallery** tab, then **Add a pair**.
2. Pick the service and type a caption in English and in French. Do not include the client's name or address.
3. Choose **Choose or take a photo** for the before photo, then again for the after photo.
4. Use the slider under each photo to choose what stays in frame. The shaded edges are trimmed in the grid view.
5. Tick the box confirming the client agreed to the photos being shown, then choose **Save pair**.

Every photo is fitted to the same square shape and shrunk for fast loading. Its location data is removed
before it leaves your phone. A new pair is saved as **Not published** so you can check it first.

**On each pair you can**

| Button | What it does |
|---|---|
| Publish / Unpublish | Shows or hides the pair on the public gallery |
| Show on home page / Remove from home page | Adds or removes it from the home page preview |
| Move up / Move down | Changes the order pairs appear in |
| Edit | Change the captions or service, or replace a photo |
| Delete | Removes the pair and its photos for good |

**If a photo is refused:** it is either not a JPEG/PNG (pick it on a phone, which converts it for you),
could not be opened, or is smaller than 600 pixels on its shorter side.

Published pairs only appear to visitors once the gallery itself is switched on (see below).

---

## Showing the Gallery, Team and Reviews Sections

These three sections are hidden on the customer site until their content is ready (P3-E31).
Each has a switch in `apps/customer/src/lib/config.ts`:

| Switch | What it shows when set to `true` |
|---|---|
| `SHOW_GALLERY` | Before/after section on the home page, the footer Gallery link, and the `/gallery` page |
| `SHOW_TEAM` | Meet the Team on the home page and the About page |
| `SHOW_REVIEWS` | Reviews on the home page, the footer Reviews link, the `/reviews` page, the "4.9 / 5 Google Rating" trust bar item, and the rating shown to search engines |

To show a section: change its switch from `false` to `true`, update the expected values in
`apps/customer/src/lib/sectionFlags.test.tsx`, open a PR, and merge it (merging deploys).
While a page is hidden, `/gallery` and `/reviews` send visitors to the home page.

---

## Deploying Updates

### Automatic (Recommended)
- Push commits to `main` → GitHub Actions automatically builds and deploys to production.
- Open a PR → GitHub Actions creates an ephemeral preview URL (7-day expiry).

### Manual (Emergency)
```bash
npm run build
firebase deploy --only hosting:freshnest-prod
```

---

## Critical Rules

- **Never commit `.env.local`** — it contains private credentials.
- **Never modify `firestore.rules` without human review** — security changes require approval.
- **Never run `git push` directly** — always create a PR for review.
- **Always run `npm run build` before any deploy** — catch TypeScript errors before CI.
