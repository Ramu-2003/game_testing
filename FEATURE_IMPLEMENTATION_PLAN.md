# Leaderboard, Tournament, and Bug Hunter Delivery

## Implemented

- Added one shared rank-tier catalog for the existing nine rank names and thresholds. The existing `User.rankPoints` field remains the competitive RP balance so profile data and earned RP are preserved.
- Added persistent match results and paginated, filterable leaderboards for Computer Mode, per-course Levels Mode, and Human-v-Human results. Match outcomes come from finalized server records; level counts are deduplicated from completed course/phase/level entries.
- Added XP/RP reward transactions with unique idempotency keys. Daily claims, level rewards, XP conversion, Bug Hunter rewards, and tournament results write their balance change and ledger row atomically. XP changes do not touch RP.
- Added season 0 initialization, 90-day configurable seasons, standings snapshots, scheduled rollover, configurable RP carryover, and active queue/match cleanup.
- Added persistent matchmaking for equal language/difficulty, server-owned challenge selection, a first-correct submission result, timeout/draw/disconnect rules, and RP rewards by difficulty. Socket notifications are backed by client polling.
- Added a versioned 15-challenge Bug Hunter catalog covering five languages and three difficulties. Attempts, hints, completion time, and one-time XP awards are persisted.
- Added responsive, protected leaderboard, tournament, and Bug Hunter pages; reachable navigation; and profile stats plus separate XP/RP histories.
- Added focused tests for reward streaks and separation, shared rank thresholds, challenge coverage/privacy, exact repair checks, pagination, and insert-only match recording.

## Verification and operational requirements

- Run `npm test` and `npm run build` from the repository root after changes.
- Run `npm run lint --prefix frontend`; existing lint debt is tracked in `PROJECT_AUDIT.md`.
- Multi-document transactions require MongoDB Atlas or another replica-set deployment. A standalone MongoDB server cannot safely run these reward and rollover flows.
- The service must be connected to MongoDB before testing tournament, reward, or profile-history APIs. This implementation was not started against the configured live database.

## Deliberate validation limit

Bug Hunter and Tournament use deterministic comparisons against private, server-owned curated repairs. They do not execute submitted code. This keeps untrusted code out of the Express process, but it also means these are source-repair puzzles rather than general-purpose coding sandboxes. Supporting arbitrary runnable code requires a separate isolated, resource-limited runner; it must not run inside the API server.

## Historical records

Existing RP balances remain untouched at rollout and form the opening balance in season 0. Existing XP balances also remain untouched. The new transaction history starts with transactions written by this feature; the application does not fabricate dated history from old balances. Legacy per-bot win/loss arrays remain available on profiles but are not inserted into global match leaderboards because they have no verified match time, language, or match identifier.
