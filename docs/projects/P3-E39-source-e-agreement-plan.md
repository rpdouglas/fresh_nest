# E-Agreement Master Project Plan

Nov 20, 2026 · @Ryan

## Goal and scope

Goal: a client opens a private link, reviews their own agreement, signs it with a checkbox and typed name, and both they and Fresh Nest receive a copy by email, with every signature stored as a record.

**In scope**

- Tokenized signing page for residential and commercial clients, based on Draft v3 of the Service Agreements.
- Admin screen to create a client's agreement and link (type, Appendix A details, rates).
- Signed record in the database, with timestamp, agreement version and typed name.
- Emailed copy to the client and to Fresh Nest.
- English and French versions of the signing page and agreements.

**Out of scope for launch**

- Online payments and invoicing.
- Automatic renewals and reminders for unsigned links.
- Drawn (handwritten) signatures.
- Syncing signed clients into the scheduling module (planned after launch).

**Assumption:** the site uses React, Vite and Firebase, matching your other projects. Tell me if the website runs on something else.

## How it works

Each client gets a one-time link that opens their own agreement, and signing it triggers two emails.

1. You open the admin screen and choose residential or commercial, then enter the client's name, address, services, frequency and rate.
2. The system creates an agreement record and a long random token, and gives you a link such as `<your website>/agreement/<token>` to text or email.
3. The client opens the link. The page looks up the token, shows their details, the Master Terms and the matching schedule in their chosen language.
4. The client fills in their phone, entry details, pets or alarm info, special instructions and valuables to disclose.
5. The client ticks "I have read and agree", types their full name, and submits.
6. A server function checks the token is valid and unused, locks the record, stores the timestamp and agreement version, and generates a PDF copy.
7. The client and Fresh Nest each get an email with the PDF. The link then shows a "Signed, thank you" page and cannot be signed again.

## Architecture and data model

The signing page is a public route, and all reading and signing goes through server functions so clients never touch the database directly.

| Piece | What it does |
| --- | --- |
| Signing page (`/agreement/:token`) | Public React route; loads one agreement by token, shows terms, collects answers and signature |
| Admin page (`/admin/agreements`) | Sign-in required; create agreements, copy links, see status (sent, viewed, signed) |
| `getAgreement` function | Looks up the token, returns only that client's data, marks it viewed |
| `signAgreement` function | Validates the token and form, stores the signature, builds the PDF, sends both emails |
| Firestore `agreements` | One document per client agreement (fields below) |
| Firestore `agreementVersions` | Frozen text of each published version, in English and French |
| Cloud Storage | Signed PDF copies |
| Email service | Sends the client copy and the Fresh Nest copy (Firebase Trigger Email or Resend) |

**Fields on each agreement record**

| Field | Notes |
| --- | --- |
| `token` | At least 32 random characters; used as the document id or a hashed lookup |
| `type` | `residential` or `commercial` |
| `versionId` | Points to the frozen text the client saw |
| `language` | `en` or `fr` |
| `prefill` | Name, address, services, frequency, start date, rate |
| `answers` | Phone, email, entry method, pets, instructions, valuables |
| `status` | `draft`, `sent`, `viewed`, `signed`, `expired` |
| `signedName`, `signedAt`, `ip`, `userAgent` | Evidence of consent |
| `expiresAt` | Link expiry, for example 30 days after creation |
| `pdfPath` | Storage location of the signed copy |

## Phases

Eight phases (0 to 7) take the agreement from final wording to live use. Effort figures are rough estimates for one person building with Claude Code, not commitments.

| Phase | Main tasks | Done when | Rough effort |
| --- | --- | --- | --- |
| 0. Final content | Close open items in Draft v3; lawyer review of late fee, governing law and the whole text; French translation reviewed by a fluent speaker | Version 1 text approved in English and French | Mostly waiting on review |
| 1. Foundation | Firebase project and rules; `agreements` and `agreementVersions` collections; token generation; load version 1 text | A test agreement can be created and read only by its token | 1 day |
| 2. Signing page | React route; prefilled details; residential and commercial forms; language toggle; checkbox, typed name, validation; mobile layout | A test client can complete the page on a phone | 2 to 3 days |
| 3. Sign, PDF and email | `signAgreement` function; one-time lock; PDF with signature block and audit line; emails to client and Fresh Nest | Both inboxes receive the correct PDF within a minute | 2 days |
| 4. Admin | Staff sign-in; create-agreement form; copy-link button; status list; resend and expire | You can create and track an agreement without touching the database | 2 days |
| 5. Test and pilot | Test with staff on iPhone, Android and desktop; accessibility check; try expired, reused and wrong tokens; pilot with 3 real clients | Pilot clients sign with no help; no errors in logs | 1 week |
| 6. Launch | Send links to existing clients in batches; retire the paper V2 documents; add the link to the new-client onboarding steps | All active clients signed or scheduled | 2 to 4 weeks, client dependent |
| 7. After launch | Sync signed details into the scheduling module; reminders for unsigned links; annual re-acceptance of new versions | Signed clients appear in the scheduling module | Later |

## Security, privacy and legal checks

The agreement stores door and alarm codes, so the build treats the data as sensitive.

- **Tokens:** random and unguessable; expire after a set time; unusable once signed. No client list or search is ever public.
- **Access:** Firestore rules deny all direct client reads and writes; only the server functions and signed-in staff can touch agreements.
- **Door and alarm codes:** stored in the record, hidden from the emailed PDF, and visible only to signed-in staff.
- **Abuse:** rate limiting and a hidden honeypot field on the signing page; no personal details in the URL.
- **Evidence of consent:** typed name, timestamp, IP address, browser, language and exact version stored with each signature.
- **Privacy:** collect only what the agreement needs, as the Master Terms say; give staff a way to delete a client's record on request.
- **Legal:** a lawyer reviews the final wording, including the 2% late fee, Ontario governing law for work on Akwesasne territory, and e-signature consent. Ontario's Electronic Commerce Act recognizes electronic signatures, but I am not a lawyer.
- **Backups:** signed PDFs are kept in storage separate from the database.

## Risks and open decisions

**Risks**

| Risk | Likelihood | Response |
| --- | --- | --- |
| Legal review finds changes after the page is built | Medium | Keep agreement text in `agreementVersions`, not in code, so wording changes need no rebuild |
| Clients ignore or lose the link | High | Staff can resend or reissue a link from the admin screen; add reminders after launch |
| Emails land in spam | Medium | Send from a verified domain with SPF and DKIM set up; ask clients to check junk folders |
| Link forwarded to someone else | Low | One-time use, expiry, and the signer's typed name stored with each record |
| French wording is wrong or stiff | Medium | Have a fluent reader review before launch |
| Door and alarm codes leak | Low | Restricted access, hidden from PDFs, no codes in emails |

**Open decisions**

- [ ] Confirm the exact legal business name ("Fresh Nest Co." assumed).
- [ ] Pick the email service and the sending address (hr.freshnest@gmail.com is the current contact).
- [ ] Confirm how long a link stays valid (30 days proposed).
- [ ] Confirm who in the team can create agreements in the admin screen.
- [ ] Decide whether existing clients must sign, or only new ones plus anyone who changes service.
- [ ] Confirm the website's current stack, since this plan assumes React, Vite and Firebase.
