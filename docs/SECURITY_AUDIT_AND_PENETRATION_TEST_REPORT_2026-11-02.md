+# Security Audit and Penetration Test Report

**Project:** Travel Buddy  
**Assessment date:** 2 November 2026  
**Overall risk:** **Critical — do not deploy the current web dependency set to production**  
**Assessment type:** Source review, dependency advisory scan, local security smoke checks, and controlled local concurrency runs

## Executive summary

The review covered the Express/MongoDB backend, Next.js web client and API routes, and the checked-in Android and iOS source. The highest risk is the web app’s installed Next.js 15.1.5: the current npm advisory scan reports one critical and two high severity vulnerable packages in the web dependency tree. The backend scan reports a high severity denial-of-service issue in body-parser 1.20.8.

Local checks confirmed that super-admin user-management routes reject anonymous requests. No account takeover or unauthorized administrative action was achieved. Two privacy issues were confirmed: public account checks reveal whether usernames exist, and the public story endpoint returns poll voter IDs and their choices. The feed also returns every embedded comment for up to 100 posts. With synthetic data, that produced about 62 MB of response data per burst and 12–25 second p95 response times.

The checked-in reports include claims that do not match the current source, including an OTP response leak, client-settable registration roles, and unauthenticated user deletion. The current source does not exhibit those specific issues: registration fixes the role to USER, admin user routes require SUPER_ADMIN, and OTPs are dispatched without being returned. This report records the current code and test evidence.

## Scope and safety

Reviewed source and configuration under backend/src, backend/test, web/src, web/next.config.mjs, mobile-android/app/src, and mobile-ios/TravelApp, plus npm lockfiles. Also checked the existing audit documents for claims that needed verification.

Dynamic tests used a fresh MongoDB 8.2.6 instance bound to 127.0.0.1:27018, a unique disposable database, and the backend on 127.0.0.1:5500. The application was given an ephemeral audit-only JWT secret; OTP delivery was disabled. The application’s existing backend/.env and web/.env.local were not used or inspected. Test records were synthetic. No production host, user account, data, email/SMS provider, or third-party service was contacted.

The 1,000, 1,500, and 2,000-client scenarios were parallel HTTP bursts from one local machine. Each request supplied a different X-Forwarded-For value; Express did not trust that header, so the limiter correctly counted the traffic as one source. This is a useful check of the current per-IP limiter and endpoint behavior, but it does not simulate 1,000 distinct network addresses or establish public-internet capacity.

## Method and evidence

- Reviewed route registration, controller validation, session handling, JWT checks, database schemas, socket authorization, web proxies, and mobile manifests/views.
- Ran TypeScript checks for backend and web.
- Ran the checked-in backend test command.
- Ran online npm advisory scans for backend and web lockfiles.
- Exercised anonymous user-management endpoints, public identifier checks, and public story output over HTTP.
- Ran health and database-backed feed bursts at 1,000, 1,500, and 2,000 simultaneous request starts against the disposable instance.
- Seeded 100 synthetic posts with five 256-character comments each, one synthetic account, and one synthetic poll story. No real account or content was used.

### Concurrency results

Each burst started with a fresh backend process to reset the in-memory rate limiter. Feed rounds included one health request during readiness polling, which consumed one request from the same source limit.

| Endpoint and clients | HTTP results | Client-observed latency | Response volume | Elapsed / offered rate |
|---|---:|---:|---:|---:|
| GET /health — 1,000 | 300 × 200, 700 × 429 | p50 1,674 ms; p95 1,960 ms; p99 1,989 ms; max 1,996 ms | — | 2.16 s / 463 req/s |
| GET /health — 1,500 | 299 × 200, 1,201 × 429 | p50 1,850 ms; p95 2,167 ms; p99 2,191 ms; max 2,198 ms | — | 2.28 s / 659 req/s |
| GET /health — 2,000 | 299 × 200, 1,701 × 429 | p50 1,309 ms; p95 1,551 ms; p99 1,587 ms; max 1,598 ms | — | 1.75 s / 1,145 req/s |
| GET /api/v1/social/feed — 1,000 | 299 × 200, 701 × 429 | p50 2,099 ms; p95 12,493 ms; p99 13,195 ms; max 13,471 ms | 61.8 MB total | 13.50 s / 74 req/s |
| GET /api/v1/social/feed — 1,500 | 299 × 200, 1,201 × 429 | p50 6,702 ms; p95 25,152 ms; p99 25,964 ms; max 26,301 ms | 61.9 MB total | 26.33 s / 57 req/s |
| GET /api/v1/social/feed — 2,000 | 299 × 200, 1,701 × 429 | p50 3,399 ms; p95 15,140 ms; p99 15,792 ms; max 16,140 ms | 61.9 MB total | 16.18 s / 124 req/s |

The feed timings vary between rounds and should be treated as a local stress signal, not a capacity benchmark. They show that the synthetic feed workload is expensive even after the limiter rejects most of the offered traffic. The health endpoint does little database work and is not representative of application workloads. The database’s final idle snapshot showed 24 MB resident memory and six connections; peak CPU, memory, disk I/O, and query latency were not instrumented, so those resource measurements remain inconclusive.

### Security smoke checks

| Check | Observed result |
|---|---|
| GET /api/v1/auth/users without a session | 401 |
| POST /api/v1/auth/users/delete without a session | 401 |
| Public availability check for seeded synthetic username | available=false |
| Same check for unknown synthetic username | available=true |
| Public GET /api/v1/social/stories | Returned poll.votedUserIds with a synthetic voter ObjectId and choice |
| Local /health | ONLINE |

### Build, tests, and dependency scans

- Backend TypeScript: passed with no diagnostics.
- Web TypeScript: passed with no diagnostics.
- Backend test:all: failed at its first assertion: expected 200, received 503 because its controller test does not establish a MongoDB connection. The checked-in tests also reference removed in-memory OTP helpers and expect tokens in JSON, while current sessions are HttpOnly cookies. Treat these tests as stale; they do not demonstrate current production behavior.
- Backend npm audit: one high severity package finding, body-parser <1.20.9; installed body-parser is 1.20.8 under Express 4.22.3.
- Web npm audit: one critical and two high severity vulnerable packages; installed Next.js 15.1.5, nested PostCSS 8.4.31, direct PostCSS 8.5.31, and Sharp 0.33.5. npm audit reports Next.js 15.5.28 as the available fix path. The advisory database was queried online on the assessment date.

## Findings

### F-01 — Critical: vulnerable Next.js release exposes the web app to remote code execution

**Affected component:** Web  
**Code:** [web/package.json](../web/package.json#L16), [web/package-lock.json](../web/package-lock.json#L1362), [web/next.config.mjs](../web/next.config.mjs)  
**Evidence:** Installed Next.js is 15.1.5. Online npm audit reports the React Flight protocol RCE advisory for versions below 15.1.9 and additional critical Next.js RCE advisories affecting this installed version. npm audit totals one critical and two high vulnerable packages in the web dependency tree. It also identifies vulnerable transitive PostCSS 8.4.31 and Sharp 0.33.5. See [GHSA-9qr9-h5gf-34mp](https://github.com/advisories/GHSA-9qr9-h5gf-34mp), [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36), [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849), and [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
**Attack path and impact:** The app uses the Next.js App Router. A remote attacker can target vulnerable React Server Component request handling on a reachable deployment. Depending on the specific advisory’s preconditions, impact includes unauthenticated server code execution, data disclosure, or service denial. No exploit was attempted in this audit.
**Root cause:** The locked framework version predates multiple security fixes.
**Remediation:** Upgrade Next.js to a currently supported patched release (npm audit identified 15.5.28 as the available fix), regenerate and review the lockfile, update nested PostCSS and Sharp resolutions, and rerun online npm audit plus deployment-specific checks before release.

### F-02 — High: body-parser denial of service through compressed request parsing

**Affected component:** Backend  
**Code:** [backend/src/server.ts](../backend/src/server.ts#L63), [backend/package-lock.json](../backend/package-lock.json#L733)  
**Evidence:** Express JSON parsing is enabled with a 20 KB body limit. The installed body-parser is 1.20.8; online npm audit reports the trailing-bytes-after-compressed-body denial-of-service issue for versions below 1.20.9, rated high. See [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).
**Attack path and impact:** An unauthenticated client can submit crafted compressed JSON requests to the public API parser. The body-size limit is useful but does not itself remediate parser behavior covered by the advisory. Repeated requests could degrade availability.
**Root cause:** A vulnerable transitive parser version is locked.
**Remediation:** Upgrade Express/body-parser to a release resolving body-parser 1.20.9 or later, verify the resolved version in the lockfile, and rerun the online advisory scan.

### F-03 — High: unbounded embedded social data inflates public feed queries and responses

**Affected component:** Backend social feed  
**Code:** [backend/src/features/social/social.model.ts](../backend/src/features/social/social.model.ts#L93), [backend/src/features/social/social.controller.ts](../backend/src/features/social/social.controller.ts#L20), [backend/src/features/social/social.controller.ts](../backend/src/features/social/social.controller.ts#L30), [backend/src/features/social/social.controller.ts](../backend/src/features/social/social.controller.ts#L98)
**Attack path and impact:** Any authenticated user can add comments to a post. Comment length is checked, but comments are pushed into an embedded array without a per-post cap or pagination. The public feed fetches up to 100 full post documents and serializes every comment. Likes and saved-user IDs are also embedded arrays. Authenticated users can grow these documents over time; distributed account activity can drive database reads, JSON serialization, network egress, and client latency upward. MongoDB’s per-document limit eventually causes writes to fail, but it does not prevent expensive reads before that limit.
**Evidence:** With only 100 synthetic posts and five comments per post, each 1,000–2,000-client feed burst returned about 61.8–61.9 MB across 299 successful responses. p95 client-observed latency ranged from 12.5 to 25.2 seconds. Most offered requests were rate-limited; this is not a test of sustained or distributed production traffic.
**Root cause:** User-generated collections are stored and returned as unbounded nested arrays; there is no feed pagination or response-size budget.
**Remediation:** Move comments/reactions to separately indexed collections or otherwise bound each post’s arrays; paginate comments and feed items; project only required fields; cap story poll/Q&A response collections; apply per-account write quotas and endpoint-specific throttles; monitor query duration, response bytes, event-loop delay, and database resource use.

### F-04 — Medium: public endpoints disclose account existence, role, and status

**Affected component:** Backend authentication  
**Code:** [backend/src/features/auth/auth.routes.ts](../backend/src/features/auth/auth.routes.ts#L8), [backend/src/features/auth/auth.routes.ts](../backend/src/features/auth/auth.routes.ts#L11), [backend/src/features/auth/auth.controller.ts](../backend/src/features/auth/auth.controller.ts#L27), [backend/src/features/auth/auth.controller.ts](../backend/src/features/auth/auth.controller.ts#L47)
**Attack path and impact:** An unauthenticated caller can enumerate usernames, emails, or phone numbers through differing availability responses. The status endpoint returns 404 for unknown identifiers and, for existing accounts, returns username, role, active/blocked status, and isBlocked. This supports targeted phishing and identification of privileged accounts.
**Evidence:** Local checks returned available=false for the synthetic existing username and available=true for an unknown name. A missing status lookup returned 404.
**Root cause:** These account lookup APIs are public and intentionally return distinguishable results.
**Remediation:** Use a generic response that does not confirm account existence or role/status, rate limit by source and identifier, and avoid exposing status unless the caller has a verified recovery flow.

### F-05 — Medium: public story API exposes poll voter identifiers and choices

**Affected component:** Backend social stories  
**Code:** [backend/src/features/social/social.controller.ts](../backend/src/features/social/social.controller.ts#L163), [backend/src/features/social/social.controller.ts](../backend/src/features/social/social.controller.ts#L166), [backend/src/features/social/social.model.ts](../backend/src/features/social/social.model.ts#L144)
**Attack path and impact:** The public stories response serializes the complete pollSticker object. That object contains votedUserIds entries with each voter’s database ObjectId and choice. A caller can collect poll participation and choice data without authentication.
**Evidence:** The synthetic public story response included a voter ObjectId and choice A.
**Root cause:** The controller returns a persistence object directly instead of constructing a public response with an explicit field allowlist.
**Remediation:** Return only question, option labels, and aggregate vote counts. Keep voter identifiers and per-user choices private unless a product requirement explicitly authorizes their disclosure.

### F-06 — Medium: rate limits are per-process and per-IP, not a distributed abuse control

**Affected component:** Backend request throttling  
**Code:** [backend/src/server.ts](../backend/src/server.ts#L37), [backend/src/server.ts](../backend/src/server.ts#L47), [backend/src/server.ts](../backend/src/server.ts#L55)
**Attack path and impact:** The global limiter permits 300 requests per 15 minutes per observed IP; the authentication limiter permits 30 on selected login/OTP paths. The default in-memory store is local to one process. Multiple instances do not share counters, and a botnet with many real source IPs gets a separate allowance per address. Conversely, behind a reverse proxy with Express’s default proxy trust disabled, legitimate users may all appear to come from the proxy address and share one quota. A single-host test cannot validate either deployment topology.
**Evidence:** Local bursts with distinct X-Forwarded-For values were counted as one source and capped at 300 accepted requests per fresh process. The rest received 429 responses.
**Root cause:** No shared limiter store or explicit trusted-proxy configuration is present; rate limits are not tied to account or target identifier.
**Remediation:** Put volumetric controls at a WAF/load balancer, use a shared limiter store such as Redis across app instances, configure only known trusted proxy hops, and add account/identifier-based thresholds for login, OTP delivery, and recovery endpoints. Keep global quotas high enough for legitimate traffic and test them through the real ingress path.

### F-07 — Medium: password reset does not revoke existing sessions

**Affected component:** Backend authentication  
**Code:** [backend/src/features/auth/auth.controller.ts](../backend/src/features/auth/auth.controller.ts#L215), [backend/src/features/auth/auth.controller.ts](../backend/src/features/auth/auth.controller.ts#L237), [backend/src/features/auth/auth.controller.ts](../backend/src/features/auth/auth.controller.ts#L187), [backend/src/middlewares/auth.middleware.ts](../backend/src/middlewares/auth.middleware.ts#L33)
**Attack path and impact:** A stolen session cookie remains valid after the account owner resets the password. User JWTs live for 24 hours, and authenticated middleware checks account existence and blocked status but does not compare a token version or password-change timestamp. A password reset therefore does not end already-issued sessions.
**Root cause:** Sessions are stateless JWTs without a revocation/version check.
**Remediation:** Increment a per-user session version on password reset and include/check it in JWTs, or maintain revocable sessions. Revoke all existing sessions after password changes and account recovery.

### F-08 — Medium: admin socket trusts the role claim captured at connection time

**Affected component:** Backend operations socket  
**Code:** [backend/src/core/sockets/operationsHub.ts](../backend/src/core/sockets/operationsHub.ts#L25), [backend/src/core/sockets/operationsHub.ts](../backend/src/core/sockets/operationsHub.ts#L39), [backend/src/middlewares/auth.middleware.ts](../backend/src/middlewares/auth.middleware.ts#L33)
**Attack path and impact:** Socket authentication verifies the JWT signature and stores its claims, then room authorization checks the stored SUPER_ADMIN claim. Unlike HTTP middleware, the socket path does not reload the user or check current status. If an operator disables or changes the admin account out-of-band, an existing socket can retain admin-room access until the connection/token expires. The current user-management handlers protect SUPER_ADMIN accounts from deletion and blocking, so this issue applies to out-of-band account changes and future lifecycle flows.
**Root cause:** Authorization is based only on JWT claims at connection time; there is no database revalidation or active-socket revocation.
**Remediation:** Load the current user and role during socket authentication, revalidate privileged joins, and disconnect/remove sockets when an admin is blocked, demoted, or deleted. Use short-lived socket credentials if appropriate.

## Mobile client assessment

The Android and iOS code checked into this project is a static feed UI prototype. It does not implement authentication, API calls, or session persistence, so account compromise and mobile API behavior could not be dynamically tested. Android’s manifest currently enables allowBackup; no credentials are stored by the reviewed prototype, but disable or narrowly configure backup before adding session or private user data. iOS networking, keychain, and transport-security behavior cannot be assessed until those flows exist.

## Recommendations by priority

1. **Before any production exposure:** Upgrade Next.js and its vulnerable dependency tree to a patched release; remediate body-parser; rerun online npm audit.
2. **Before broad traffic:** Bound and paginate social data, then repeat feed/load tests with representative data and real deployment topology.
3. **Before account scale-up:** Remove account enumeration responses, add shared/distributed abuse controls, and make password reset revoke sessions.
4. **Before relying on admin sockets:** Revalidate current admin state and revoke live privileged connections.
5. **Test readiness:** Replace stale controller tests with disposable-database integration tests that assert current cookie, OTP, RBAC, and API behavior.

## Limitations and final assessment

No production penetration test, external network scan, fuzzing campaign, mobile binary review, real distributed-source test, payment integration test, or sustained soak test was performed. Peak CPU/RAM/disk telemetry was not collected. The local results establish that the current rate limiter rejects excess same-source requests and that the synthetic feed workload has high response volume and latency; they do not establish safe production capacity.

The app has useful controls in place—Helmet headers, request-body limits, bcrypt password hashing, non-returned OTPs, HttpOnly/SameSite cookies, database-backed HTTP authorization, and protected admin user routes. Those controls do not offset the critical vulnerable web framework, high-risk parser advisory, privacy disclosures, and feed scaling weaknesses identified above.
