# ADR-010 — Customer Authentication: Magic-Link and Google Sign-In
**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Dev Team, Ryan (Owner)

## Context
For the Customer Account Portal (**Epic P2-E1**), we need an authentication method for customers to log in, view their booking history, manage their subscription schedules, and initiate cancellations. 
The system must cater to two competing needs:
1. **Low Friction:** Cleaning services are booked occasionally by many users. Requiring customers to create and remember passwords leads to account lockout requests, password-reset friction, and abandoned portals.
2. **Security & Privacy:** Because the portal exposes PII (addresses, contact info, booking history), we must ensure robust authentication to prevent unauthorized account access.

## Decision
1. Implement **Firebase Auth passwordless email link authentication (Magic-Link)** as the primary customer login mechanism.
2. Implement **Google Sign-In** as a secondary, one-click social authentication option.
3. Upon successful registration or login, the user is redirected to the customer portal routes (`/account/*`).
4. We will store an Auth state observer client-side, persisting the session in local storage to prevent frequent re-authentication prompts.

## Rationale
- **Frictionless Experience:** Users do not need to register a password. They enter their email, click the link sent to their inbox, and are securely logged in.
- **Enhanced Security:** Standard password auth is prone to credential stuffing and weak passwords. Magic-links delegate security to the user's email provider, which typically enforces MFA/device checks.
- **Low Overhead:** Firebase Auth native support for email links handles email formatting and link dispatch out of the box, with minimal custom backend code.

## Consequences
- **Positive:** No passwords to store, hash, or manage. Drastically reduces customer portal access friction.
- **Negative:** Requires the user to have active access to their email on the device they are using (or copy the link).
- **Neutral:** Email delivery times (typically 5–15 seconds) introduce a minor delay during the login flow.

## Alternatives Considered
- **Traditional Email and Password:** Rejected. Requires password strength validation, reset flows, and increases password fatigue.
- **Phone Number/SMS Verification:** Rejected. High operational cost due to Twilio SMS fees for verification codes, plus issues with international numbers.
