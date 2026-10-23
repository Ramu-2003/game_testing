# Project Audit and Delivery Status

Updated: 2026-10-23

## Status

The project has stronger server-side progression, reward checks, multiplayer identity checks, competitive pages, and an optional isolated code-runner service. The current catalog contains **795 lessons** (175 HTML and 155 in each other course); the UI and progression model support up to 100 lessons in each of ten phases, but this does not fulfill the requested 1,000 lessons per course. Browser-based end-to-end play, production database flows, and real container execution are not verified. The project is **in progress**, not release-complete.

## Product and architecture

- **Frontend:** React 19 and Vite, with protected game routes, five course tracks, solo and room-based modes, leaderboard, tournament, Bug Hunter, profile, and public `/learn` page.
- **Backend:** Express 5, MongoDB/Mongoose, JWT authentication, Socket.IO, server-owned challenge/reward decisions, persistent competitive records, and Groq-backed source review where configured.
- **Code runner:** Separate bearer-authenticated service for JavaScript, Python, and Java. It requires a dedicated host with Docker and gVisor `runsc`; no runner URL is configured or live container execution verified here. Runtime output does not grant rewards.
- **Current curriculum:** ten phases per course, up to 100 supported levels per phase. The server catalog has 175 HTML lessons and 155 lessons in each other course (795 total), while the requested target is 1,000 per course (5,000 total).
- **Curriculum delivery:** one shared exporter writes the server validation registry and 50 static course-and-phase JSON files. The browser requests only the phase a learner opens, rather than bundling every lesson into the initial app payload.

## Implemented integrity and product fixes

- Level completion uses signed proofs bound to the player, challenge, and submitted code; server-side progression is sequential across levels and phases, and duplicate rewards are idempotent.
- Server-owned curriculum data drives validation and reward proofs. Course totals and phase counts are derived from that catalog rather than displayed as a fixed 100.
- Computer and Custom room creation deduct one G-THUNDER atomically when creation succeeds. Creation screens explain that the fee is non-refundable if the creator leaves or does not play.
- Socket identity comes from JWT authentication; room membership and host actions are checked server-side. Active in-memory challenge state expires after a bounded time.
- Solo bot outcomes are browser-simulated and do not award persistent match rewards. Competitive results use server records.
- HTML/CSS preview is sandboxed and blocks scripts/network access. JavaScript, Python, and Java have an isolated runner path distinct from source-rubric level validation.
- The runner now uses Docker `--pull=never`; the execution image must be built on its dedicated host before startup, preventing a learner request from causing an implicit registry pull. The boundary test asserts this launch option.
- The authenticated isolated-run endpoint now allows up to eight runs per user per minute and one concurrent run per user in a backend process; the runner separately caps total active containers. The per-user limiter is in-memory and must be replaced or backed by shared storage if the backend is scaled across processes.
- Tournament and Bug Hunter countdowns expose named timer roles to assistive technology; the per-second text changes are not announced as a live region.
- Leaderboard, Tournament, Bug Hunter, XP/RP history, rank tiers, and competitive reward transactions have backend models and routes. Tournament and Bug Hunter repair challenges compare against private curated answers; they do not execute submitted source.
- Public course discovery is available at `/learn`; its React content is prerendered into the production HTML for search and social crawlers. Account and game routes are excluded in `robots.txt`.
- Room and challenge state remains in memory. Use shared persistence before running multiple backend instances or promising recovery after a server restart.
- Authentication now normalizes new email addresses, preserves case-insensitive lookup for older accounts, uses generic sign-in failures, bounds new passwords to bcrypt's 72-byte limit, hashes reset tokens at rest (while accepting legacy unexpired tokens), escapes names in reset email HTML, and avoids writing account emails or reset URLs/tokens to application logs. Profile writes now validate field types/lengths and accept only curated avatar asset paths; profile fields have explicit labels and matching client-side length limits.
- The API and production frontend now send restrictive Content-Security-Policy headers. The frontend policy allows the app's bundled code, Google Fonts, image assets, the configured HTTPS API, secure WebSockets, and same-origin sandbox previews.
- Both Groq-backed validators use one shared fallback list of currently documented production model IDs. The previous list included retired models. Model availability was checked against [Groq's supported model list](https://console.groq.com/docs/models) and [deprecation schedule](https://console.groq.com/docs/deprecations) on 2026-10-22; provider credentials and live requests were not exercised here.

## Curriculum audit

The source curriculum has 795 addressable challenges: HTML 175, CSS 155, JavaScript 155, Python 155, and Java 155. The curriculum audit classifies 465 authored-batch lessons, 200 template-expanded lessons needing review, and 130 older lessons without the authored metadata standard. The audit found no remaining generic legacy prompts; the 130 lessons without metadata still need content review. Addressable count and `contentStatus` do not prove correctness, depth, or tested outputs.

The target requires 825 additional HTML lessons and 845 additional lessons in each other course (4,205 total). Recent authored work adds advanced HTML form controls, CSS design-system layouts, defensive JavaScript, Python collection algorithms, and Java streams, alongside landmark accessibility, responsive CSS, JavaScript value and function foundations, Python numeric conversion, Java methods, classes and records, DOM events, and file handling. The former generic prompt blocks in CSS phase 10, JavaScript phases 2 and 6, Python phase 2, and Java phases 5 and 6 have been replaced with topic-specific lessons. Earlier batches added media, animation, forms, Grid, object, dictionary, and array topics. Content should continue in reviewed topic-aligned batches with clear teaching notes, varied tasks, meaningful checks, useful failure feedback, and verified expected outputs. Avoid copying prompts or counting generated variants as authored lessons.

The topic-by-phase expansion plan is in [CURRICULUM_BLUEPRINT.md](CURRICULUM_BLUEPRINT.md). The curriculum audit now checks phase continuity, lesson core fields, authored teaching metadata, and exact duplicate titles. Its current run found **zero structural issues**, **zero authored-metadata gaps** across the 465 explicitly authored lessons, **zero duplicate-title groups**, and **zero generic legacy prompts**. These checks do not execute code or prove every expected result correct.

Run `npm run audit:curriculum` from `frontend` to inspect per-course counts and the remaining gap.

## Verification recorded

- Full `npm test` on the 795-lesson catalog: **60 passed** (5 runner-boundary, 41 backend, 14 frontend). These suites do not start Docker containers or connect to MongoDB, Groq, SMTP, or production sockets.
- Production frontend build passed in 20.81 seconds with 795 lessons and prerendered `/learn` HTML. The shared challenge timer chunk is 1.58 kB (0.75 kB gzip). The build still reports an outdated Browserslist data notice.
- Latest curriculum export and audit: 795 lessons exported to the server registry and 50 browser phase assets; zero structural issues, authored-metadata gaps, or duplicate-title groups were found.
- Latest frontend lint: passed with zero errors and warnings. Backend runtime limiter and route files pass Node syntax checks; the backend package does not define a lint script.
- Local interactive browser review was attempted again. Vite reported ready on `127.0.0.1:5173`, but the isolated in-app browser timed out connecting to that loopback address; the temporary frontend server was stopped. Visual and responsive browser checks remain outstanding.
- Static `/learn` output checks confirmed its course copy, Open Graph and robots metadata, separate page header/main/footer landmarks, keyboard skip link, hydration assets, and Vercel route configuration.
- The current task has not started the backend and has not tested authenticated flows against MongoDB, Groq, SMTP, sockets, or a deployed runner. Port 3000 should remain stopped.
- Docker and gVisor are unavailable in this environment, so only runner request/security boundaries—not container startup or real program execution—have been checked. A current environment check found neither `docker` nor `runsc` on PATH.
- The React PropTypes rule is intentionally disabled for this JavaScript-only frontend; component prop contracts are not statically checked and should be addressed during a typed migration. API payloads still need explicit boundary validation.
- Fixed a real TLS weakness by restoring SMTP certificate verification and fixed the solo bot timer interval, which had been restarted by the 16 ms display timer before it could tick.

## Remaining work

1. Author and review 4,205 additional lessons, continuing with all five courses and explicit learning objectives; validate each batch and keep actual content counts visible.
2. Deploy the runner on a dedicated rootless Docker host with gVisor `runsc`, connect it over a private network, and verify runtime isolation, timeout, output bounds, and cleanup.
3. Complete keyboard, screen-reader, responsive, slow-network, and authenticated end-to-end browser flows against a replica-set MongoDB deployment.
4. Make solo match outcomes server-authoritative before enabling profile rewards for those matches.
5. Finish the security review with shared rate limiting for multi-process deployment, proxy/trust settings, secret rotation, and live CSP/browser checks. The new CSP has been checked for compatibility with the source configuration and production build, but not against a deployed domain.
6. Add canonical URLs and a sitemap once the production domain is confirmed. The static learning page now includes initial course content and share metadata, but cannot publish an accurate canonical URL without the domain.
7. Decide whether room and active challenge state needs Redis or another shared store for the intended deployment topology.

## Commands

From the repository root:

```powershell
npm test
npm run build
npm run lint --prefix frontend
```

For curriculum audit and export, run `npm run audit:curriculum` or `npm run export:curriculum` from `frontend`. Multi-document reward/season transactions require MongoDB Atlas or another replica-set deployment.
