# Deployed Web Security Assessment

**Target:** `https://smart-tracker-8c48c.web.app`  
**Date:** 2026-10-18  
**Assessment type:** Limited, non-destructive manual assessment from the current workspace

## Scope and limitations

The assessment covered the deployed Firebase Hosting site, its public asset responses, and read-only Firebase Authentication/Firestore checks using the authorized test account. No data was created, changed, deleted, or enumerated outside the authorized account.

Strix was not used because this environment does not have a configured Strix LLM provider. This is therefore **not a full Strix or browser-based penetration test**. It did not cover UI-driven XSS testing, authenticated route crawling, CSRF behavior, password-reset flows, account recovery, or mobile/PWA runtime behavior.

Credentials were used only for the authenticated checks and are not included in this report.

## Summary

No high- or critical-severity issue was confirmed during this limited assessment.

The strongest positive result was that unauthenticated Firestore reads were denied, an unfiltered authenticated collection read was denied, and an authenticated query scoped to the test account was accepted. The site also has HSTS, clickjacking protection, MIME-sniffing protection, a CSP, and a restrictive referrer policy.

## Findings

### LOW — CSP allows `unsafe-inline` and `unsafe-eval`

The deployed HTML response includes a Content-Security-Policy with:

```text
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
style-src 'self' 'unsafe-inline'
```

This weakens the browser's protection against cross-site scripting if an injection bug is introduced elsewhere. It was not independently exploitable during this limited check.

**Recommendation:** Remove `unsafe-eval` if the application does not require it. Replace inline scripts with external scripts or nonce/hash-based CSP allowances. Remove `unsafe-inline` from `script-src`; keep any necessary inline-style allowance narrowly scoped or migrate styles to generated/external CSS.

### INFORMATIONAL — Modern isolation headers are not present

The response contains `X-Frame-Options: DENY`, which is good clickjacking protection, but no `Permissions-Policy`, `Cross-Origin-Opener-Policy`, or `Cross-Origin-Resource-Policy` header was observed.

These are defense-in-depth controls rather than evidence of an exploit in this application.

**Recommendation:** Add a restrictive `Permissions-Policy` appropriate for the features used. Consider `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` after verifying compatibility with Firebase authentication and any embedded services.

### INFORMATIONAL — SPA fallback returns the app shell for unknown paths

Requests for paths such as `/.env`, `/firebase.json`, `/firestore.rules`, `package.json`, `robots.txt`, and source-map-looking asset paths returned the normal HTML application shell rather than those files. No contents of those files were disclosed.

This is common for single-page-app rewrites, but it means missing resources return HTTP 200 HTML instead of a 404 and can make monitoring or automated scanning less precise.

**Recommendation:** Keep sensitive files out of the deploy directory and consider explicit 404 handling for paths that should never be SPA-routed.

## Checks that passed

- HTTP requests redirect to HTTPS with a 301 response.
- HSTS is enabled with `max-age=31556926; includeSubDomains; preload`.
- `X-Content-Type-Options: nosniff` is present.
- `X-Frame-Options: DENY` is present.
- `Referrer-Policy: strict-origin-when-cross-origin` is present.
- A Content-Security-Policy is present.
- Anonymous reads of Firestore `goals` and `users` collections returned `403`.
- An authenticated unfiltered `goals` collection read returned `403`.
- An authenticated goals query filtered to the signed-in account returned `200`.
- The public Firebase web API configuration was visible in the client bundle, as expected for Firebase web apps; no private service-account key was observed in the checked response.

## Recommended next steps

1. Tighten the CSP, starting with removing `unsafe-eval`.
2. Add and verify `Permissions-Policy` and, where compatible, cross-origin isolation headers.
3. Run a browser-based authenticated scan with a configured Strix LLM provider or a local model.
4. Rotate the test-account password because it was shared during setup.
