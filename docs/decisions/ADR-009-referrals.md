# ADR-009 — Referral Coupon Datastore & Verification Logic
**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Dev Team, Ryan (Owner)

## Context
For the Referral Program (**Epic E31**), we need to allow new clients to enter a referral code on the public booking form and immediately receive a $20 discount. At the same time, we must protect existing clients' private booking data (PII) under PIPEDA and Quebec Law 25. 

Under our production Firestore security rules (**ADR-007**), unauthenticated users are denied `read` access to the `/bookings` collection. Thus, the client-side booking wizard cannot directly query existing bookings to verify if a referral code exists without hitting a `403 Forbidden` error.

## Decision
1. Create a dedicated public-read Firestore collection `/referrals` that contains only non-sensitive referral code records.
2. The schema for each `/referrals/{referralCode}` document will be:
   - `ownerName` (string) e.g., `'Margaret S.'`
   - `bookingId` (string, the booking that generated this referral link)
   - `active` (boolean)
   - `createdAt` (timestamp)
3. Generate referral codes on the server: implement a Firebase Cloud Function trigger `onBookingCreate` that runs in the background. It generates a unique code (e.g., `FIRSTNAME-LAST4OFPHONE` or `FIRSTNAME-ZIP`) when a booking is created, writes it to `/referrals/{code}`, and writes the code to the parent booking.
4. Update `firestore.rules` and `firestore.dev.rules` to allow public `get` requests (read-by-ID) on `/referrals/{referralCode}`, but completely deny list/query operations and write/delete operations to unauthenticated clients.

## Rationale
- **Security & Privacy compliance**: It keeps all client PII (address, email, phone, notes) strictly locked inside the `/bookings` collection while providing a public hook for code verification.
- **Form responsiveness**: The client-side booking wizard can verify codes with a simple, direct `get` document request in real-time, displaying immediate feedback ("$20 Referral Code Applied") without running complex server-side function round-trips.

## Consequences
- **Positive:** Resolves the public-read restriction while fully satisfying PIPEDA data isolation.
- **Negative:** Adds a new collection `/referrals` to Firestore that must be cleaned or disabled when a booking is permanently removed.
- **Neutral:** The generation is done in the background (`onBookingCreate`), which means there might be a few seconds of latency before a user can share their link on the Thank-You screen. (We will handle this gracefully in the UI by displaying a skeleton or calculating it client-side for immediate display, knowing the server will match it).

## Alternatives Considered
- **Direct `/bookings` querying**: Rejected. Direct public reads of `/bookings` violate PIPEDA and expose clients' private data.
- **HTTPS Cloud Function validation endpoint (`validateReferral`)**: Rejected. Runs a full Firebase Function instance cycle for every keypress/validation, increasing latency and operational costs compared to direct cached firestore `get` requests.
