# Admin Guide — Fresh Nest Co.
**For:** Lauren (Owner/Admin)  
**Updated:** 2026-06-10

---

## Accessing the Admin Dashboard

Navigate to [lilypad-freshnest.web.app/admin](https://lilypad-freshnest.web.app/admin) and sign in with your authorized Google account. 

The dashboard is split into four tabs:
1. **Bookings Management:** Track and manage operational client bookings.
2. **Analytics & Metrics:** Monitor business, marketing, and operational metrics.
3. **Staff Registry:** Manage staff profiles, roles, and registration.
4. **Pay Rate Management:** Configure and monitor hourly pay rates per role.

---

## Viewing and Managing Bookings

### Booking Statuses
| Status | Meaning |
| :--- | :--- |
| `pending` | New booking submitted, not yet confirmed |
| `confirmed` | Booking confirmed and scheduled |
| `completed` | Clean completed |
| `cancelled` | Booking cancelled by client or owner |

### Updating a Booking
1. Find the booking in the dashboard table.
2. Click the booking row to expand the detail panel.
3. Use the **Status** dropdown to update the status.
4. Use the **Assigned To** field to assign a cleaner by name (or click custom to type a custom name).
5. **Referral Metadata:** If a referral code was applied, it is highlighted under the booking metadata in this panel (shows referral code used).

---

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

## Automated Recurring Booking Auto-Renewal

To maximize retention and ensure cleaning consistency, a scheduled daily background script runs at **2:00 AM UTC**:
1. **Target Identification:** The function identifies bookings marked as `confirmed` or `completed` with a frequency of `weekly`, `biweekly`, or `monthly`.
2. **Next Date Window:** It projects the next occurrence (+7, +14, or +30 days). If that next date is within a 14-day window from today, it initiates renewal.
3. **De-duplication Check:** The system verifies that no active booking already exists for that user on that specific date.
4. **Draft Generation:** If clear, a new booking is generated with status `pending`, copying all property parameters, preferences, notes, and preferred cleaners.
5. **Client Alerts:** Upon creation, bilingual emails and SMS notifications are automatically sent to notify the client of their upcoming reservation in their chosen language (`en` or `fr`).

---

## Firestore Databases

| Environment | Database | Used For |
| :--- | :--- | :--- |
| Production | `(default)` | Real client bookings |
| Development | `freshnest-dev` | Testing and preview PRs |

To view databases: [Firebase Console → Firestore](https://console.firebase.google.com/project/freshnest-aa51e/firestore)

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
