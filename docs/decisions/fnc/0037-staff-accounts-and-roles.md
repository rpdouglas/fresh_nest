# 0037. Cleaners get their own, narrower way in; the office keeps everything

- Date: 2026-10-13
- Decided by: Owner
- Status: Built (Sprint 1.7 on 2026-10-13; Sprint 1.8 on 2026-10-17 with Camelo's 6-digit emailed code in [0045](0045-cleaner-sign-in-by-camelo-code.md))

## Decision

The site will have two kinds of people.

- **Office**: the people on the list today. They see every report and can change timesheets, as now.
- **Cleaner**: someone who is an active person in Camelo, known by the email Camelo holds for them. They see
  **My week only**: their own visits (with who they are working with, the address and the visit's notes) and
  their own hours for the pay period. No other report, no other person's hours, no dollar figure.

In the first version a cleaner **only looks**. Nothing a cleaner does writes to Camelo or to the site's own
records. Anything they may do later is decided one action at a time.

Someone with no Google account signs in with **a link emailed to them**: no password. Google sign-in stays for
everyone who has it.

The email accounts are kept in **this Firebase project**, which is shared with the owner's other apps. Having an
account there lets nobody in: this site lets a person in only if their email is on the office list or belongs to
an active person in Camelo.

## Why

The owner wants to invite employees, some of whom have no Google account (2026-10-13). Sign-in is the small
part: everyone who can sign in today sees pay, billing and client prices and can approve timesheets, which cannot
be undone. So roles come first and the new way in second.

Read from Camelo on 2026-10-13, counts only: 13 active people, each with an email, all 13 different, 9 of them
Gmail addresses. So the site can tell which cleaner has signed in from Camelo's own list, with no second list to
keep, and someone made inactive in Camelo loses their way in without anyone remembering to remove them. About
four people need the emailed link; the rest could use Google.

Each choice was offered three ways and the owner chose: My week only (over adding Daily teams, or everything but
money); look only (over leaving a note on their own timesheet); this project (over a separate project for
sign-in); an emailed link (over a password, or both).

## What it replaces

Two sentences of 0003, once built: "Google sign-in is the only way in" and "everyone who can view can also
edit". The rest of 0003 stands: every route but the health check needs a sign-in, and there is no shared code.

## What it costs, and what is not yet known

- Every route has to say which kind of person it is for, and a mistake there shows pay or client details to
  staff. That is why the server decides, never the page, and why a cleaner is refused by every route that
  exists today.
- Switching on email sign-in is a setting for the whole shared project. If another app in it trusts "anyone
  who is signed in", it would be opened up. This has to be read and ruled out before the setting is touched
  (`../staff-accounts-plan.md`, step 1 of the sign-in sprint).
- A test account on the live site is not part of this: see the plan's Parked list.

## Where it lives

The design and the order of work: `docs/staff-accounts-plan.md`. The items: Sprints 1.7 and 1.8 in
`docs/project-plan.md`. Nothing in the code yet.
