# 0031. Names may be sent to the AI for campaign drafts, for now

- Date: 2026-10-13
- Decided by: Owner
- Status: In force, to be looked at again when the campaign helper is built

## Decision

The AI helper for social media campaigns (`../social-campaigns-spec.md`) may send client and staff names, kudos
text, campaign details and figures from the reports to the outside AI service. It never sends phone numbers,
email addresses, street addresses, or pay or billing amounts for a person.

## Why

The owner's answer to the question decision [0030](0030-ai-morning-brief.md) left open for any AI feature: sending
names to an outside service is a new kind of sharing and needs the owner's yes. Drafts that thank a client by
first name or quote a review need the name; stand-ins swapped back in the browser would add work for little gain
here. "For now": the owner may narrow it once the AI service is chosen and its data terms are known.

## Where it lives

`docs/social-campaigns-spec.md` (rules: "What is sent to the AI").
