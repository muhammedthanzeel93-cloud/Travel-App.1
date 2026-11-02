# Code Duplication Review and Refactoring Report

**Review date:** 2026-11-02  
**Scope:** Current tracked application source, route and permission wiring, test source, project scripts, and the existing duplication audit document.

## Summary

The current project contains a TypeScript/Express backend, a Next.js web client, and small native Android and iOS clients. The review found two confirmed, low-risk backend redundancies and refactored them. It did not find current cross-role duplicate implementations that could safely be combined without changing behavior. No role permission rules or application flows were intentionally changed.

The existing `docs/CODE_AND_DATABASE_DUPLICATION_AUDIT_REPORT.md` is stale relative to this checkout. It describes an older implementation (including an auth route that is now a backend proxy and several files/routes not present in the current source tree). Its claims were not treated as current findings.

## Project structure and reviewed files

- **Backend:** feature-based Express/Mongoose source under `backend/src`, with auth, admin operations, social, stays, shared middleware, configuration, sockets, and migration/bootstrap scripts.
- **Web:** Next.js app routes and pages, shared components, role/session helpers, API clients, and sound utility under `web/src`.
- **Android:** Kotlin/Compose app entry point and social feed, manifest, strings, and extraction rules under `mobile-android/app/src`.
- **iOS:** SwiftUI app entry point and social feed under `mobile-ios/TravelApp`.
- **Verification:** `backend/test`, `scripts/verify-all.ps1`, package manifests, `README.md`, and the existing audit report.

All source files under those application and test trees were included in the review:

<details>
<summary>Backend source and tests</summary>

- `backend/src/core/config/index.ts`
- `backend/src/core/sockets/operationsHub.ts`
- `backend/src/features/admin-operations/adminOperations.controller.ts`
- `backend/src/features/admin-operations/adminOperations.routes.ts`
- `backend/src/features/auth/auth.controller.ts`
- `backend/src/features/auth/auth.routes.ts`
- `backend/src/features/auth/authChallenge.model.ts`
- `backend/src/features/auth/otp.service.ts`
- `backend/src/features/auth/session.ts`
- `backend/src/features/auth/token.ts`
- `backend/src/features/auth/user.model.ts`
- `backend/src/features/social/social.controller.ts`
- `backend/src/features/social/social.model.ts`
- `backend/src/features/social/social.routes.ts`
- `backend/src/features/stays/stay.model.ts`
- `backend/src/features/stays/stays.controller.ts`
- `backend/src/features/stays/stays.routes.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/routes/api.routes.ts`
- `backend/src/scripts/bootstrap-admin.ts`
- `backend/src/scripts/migrate-social-content.ts`
- `backend/src/server.ts`
- `backend/test/security-regression.test.ts`
- `backend/test/social.test.ts`

</details>

<details>
<summary>Web source</summary>

- `web/src/app/admin/error.tsx`
- `web/src/app/admin/operations/layout.tsx`
- `web/src/app/admin/operations/page.tsx`
- `web/src/app/admin/operations/users/page.tsx`
- `web/src/app/admin/page.tsx`
- `web/src/app/api/admin/[...slug]/route.ts`
- `web/src/app/api/auth/[...slug]/route.ts`
- `web/src/app/error.tsx`
- `web/src/app/feed/page.tsx`
- `web/src/app/global-error.tsx`
- `web/src/app/globals.css`
- `web/src/app/layout.tsx`
- `web/src/app/not-found.tsx`
- `web/src/app/page.tsx`
- `web/src/components/ContentContainer.tsx`
- `web/src/components/Footer.tsx`
- `web/src/components/Header.tsx`
- `web/src/components/TravelLuggageBox.tsx`
- `web/src/features/admin/auth.ts`
- `web/src/features/admin/types.ts`
- `web/src/features/auth/userAuth.ts`
- `web/src/features/social/types.ts`
- `web/src/lib/api.ts`
- `web/src/lib/soundAlert.ts`

</details>

<details>
<summary>Native source and project verification files</summary>

- `mobile-android/app/src/main/AndroidManifest.xml`
- `mobile-android/app/src/main/java/com/travelapp/MainActivity.kt`
- `mobile-android/app/src/main/java/com/travelapp/features/social/ui/TravelFeedScreen.kt`
- `mobile-android/app/src/main/res/values/strings.xml`
- `mobile-android/app/src/main/res/xml/data_extraction_rules.xml`
- `mobile-ios/TravelApp/TravelApp.swift`
- `mobile-ios/TravelApp/Features/Social/Views/TravelFeedView.swift`
- `scripts/verify-all.ps1`
- `README.md`
- `backend/package.json`, `backend/tsconfig.json`
- `web/package.json`, `web/tsconfig.json`, `web/next.config.mjs`

</details>

## Confirmed duplication and changes

### 1. Session lookup duplicated across required and optional authentication

**Before:** `backend/src/middlewares/auth.middleware.ts` separately verified the JWT, looked up the user, rejected blocked or stale sessions, and assembled `req.user` in both `authenticateToken` and `optionalAuthenticateToken`.

**Change:** Added `resolveAuthenticatedUser` at line 20. Both middleware functions now share the database lookup and payload construction. The required middleware still returns its existing 401 for a missing/stale account and 403 for an invalid token. The optional middleware still permits public reads if a token is absent, invalid, or stale. The role comes from the current database user record, as before.

**Why it existed:** Required and optional auth have different response policies but need the same session validation and identity mapping.

### 2. Admin login forwarding method was a no-op wrapper

**Before:** `AdminOperationsController.loginAdmin` only awaited `validateAdminCredentials(req, res)`. The `/login` and `/login/validate` routes both exposed the same credential-validation/OTP behavior.

**Change:** Removed the forwarding method and mapped `/login` directly to `validateAdminCredentials` in `adminOperations.routes.ts`. Both public route paths remain available and retain the same controller behavior.

**Why it existed:** The wrapper retained a second controller entry point without adding any behavior.

## Role-wise access review

- The user model defines `USER`, `TRAVELER`, `TRAVEL_AGENCY`, `HOTEL_HOST`, `ADMIN`, and `SUPER_ADMIN` roles.
- Admin user listing, blocking, and deletion routes apply `authenticateToken` followed by `requireSuperAdmin`. The controllers also protect SUPER_ADMIN accounts from block/delete operations.
- Admin credential lookup, OTP completion, and token verification each query for an active `SUPER_ADMIN` account. The admin operations socket room separately verifies current SUPER_ADMIN status and session version.
- Social write, messaging, and stay booking routes require authentication. Public social reads remain public; feed reads optionally attach a valid user identity.
- Web session helpers keep user and admin profile state separate. The admin session parser only accepts `SUPER_ADMIN`. The operations layout checks the server-verified role before exposing the console.
- Android and iOS currently contain feed UI and no role-specific permission implementation to consolidate.

No cross-role copy of permission enforcement was found that should be merged: the shared backend role guard is already the common enforcement point, while admin UI checks complement rather than replace server authorization. The refactor does not change allowed roles or route middleware order.

## Other duplication candidates considered

- The admin and auth Next.js proxy routes share a forwarding shape, but differ in error handling and request options. They were left separate rather than hiding those behavior differences in a generic helper.
- `web/src/lib/soundAlert.ts` already provides the common sound implementation used by both operations pages; only small call-site wrappers remain, with different parameters. No second synthesizer implementation remains in the current source.
- User and admin session types and storage flows are similar, but intentionally have different roles, keys, validation, and logout behavior. Combining them would risk mixing privilege domains.
- Denormalized counts, snapshots, and stored identity labels in models were not classified as duplicate code: they serve persistence and response behavior and require data migration/product decisions to change.
- No additional code was removed as unused; the review did not establish any further source as safely dead.

## Verification

- `backend`: `npm run build` (TypeScript compiler) — **passed**.
- `web`: `npx tsc --noEmit` — **passed**.
- `web`: `npx next build --webpack` — **passed**, including type checking and static page generation for `/`, `/admin`, `/admin/operations`, `/admin/operations/users`, and `/feed`.
- `web`: default `npm run build` (Turbopack) — **failed in the build environment** while starting the CSS processing child process for `globals.css`; Turbopack reported an internal process-startup failure and no source diagnostic. The webpack production build passed.
- `backend/test/security-regression.test.ts` — **not run**: `SECURITY_TEST_MONGO_URI` is not configured. This suite refuses to run without a disposable localhost MongoDB database. Its existing checks cover generic auth responses, session revocation, bounded feed output, private poll data, and unique poll voting; it does not currently exercise the complete role matrix.
- `backend/test/social.test.ts` and `scripts/verify-all.ps1` are stale against the current implementation: the script references a missing `backend/test/auth.test.ts`, while the social test expects seeded fake feed data, obsolete admin OTP testing APIs, and mock request behavior that the current Mongo-backed controllers do not provide. They should be rewritten before being relied on as regression coverage; they were not deleted as part of this duplication cleanup.
- Native Android/iOS builds were not run; no Android Gradle wrapper or iOS/Xcode project is present in the reviewed source inventory, and the current edits are backend-only.

No live functional or database-backed role testing is claimed. The builds verify compilation and app generation, while permission preservation was checked by inspecting route middleware and the relevant role checks.

## Recommendations

1. Keep authentication identity resolution in one backend helper and add role matrix tests that assert both permitted and rejected roles for each protected route.
2. Keep the current audit report dated or versioned; reconcile or archive stale reports when route implementations change.
3. Keep common UI behavior in shared utilities (as already done for alert sound), but only merge route helpers after their differing failure semantics are explicitly represented and tested.
4. Add static checks for unused exports and duplicate code in CI, and run them against source rather than generated `dist`, `.next`, or dependency trees.
5. Update `scripts/verify-all.ps1` before relying on it: it references `backend/test/auth.test.ts`, which is not present, and `next lint`, which is no longer the configured web check in the current package scripts.
