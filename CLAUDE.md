# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@acodeninja/persist` is a JSON-based data modelling and persistence library (ESM, pure JavaScript, no build step, no TypeScript). Consumers declare `Model` classes, register a `Connection` backed by a pluggable `StorageEngine` (S3 or HTTP), and get CRUD, structured queries, and fuzzy search. Designed with static site generation in mind, so it must run in both Node and the browser.

## Commands

Node version is pinned in `mise.toml` (24); the project uses [mise](https://mise.jdx.dev) for tool management. Developer commands are defined as mise tasks in `mise.toml` (run `mise tasks` to list them); each wraps the underlying npm script. Tests require the experimental VM modules flag (already wired into the npm scripts).

- `mise run init` — install dependencies
- `mise run test` / `npm test` — run all tests
- `mise run test:watch` / `npm run test:watch` — watch mode
- `mise run test:coverage` / `npm run test:coverage` — run with coverage (enforced, see below)
- Run a single test file: `node --experimental-vm-modules node_modules/jest/bin/jest.js src/data/Model.test.js`
- Filter by name: append `-t "partial test name"`
- `mise run lint` / `npm run lint` — ESLint; `mise run lint:fix` to autofix
- `mise run commit:pre` — the pre-commit gate: runs `lint` then `test:coverage`

Coverage thresholds are **100%** for branches, functions, lines, and statements (`jest.config.cjs`). New code must be fully covered or the suite fails. Tests are colocated as `*.test.js` next to the source file.

Commits are validated by commitlint with `@commitlint/config-conventional` (husky hooks in `.husky/`). Use Conventional Commit messages (`feat:`, `fix:`, `docs:`, `refactor:` …); releases are automated via semantic-release from commit history.

ESLint style is enforced, not just advisory: single quotes, semicolons required, trailing commas on multiline, `sort-imports`, and `quote-props: as-needed`. Prefix intentionally-unused vars/args with `_`.

## Branching and releases

`next` is the default branch and the only one work lands on. `main` is the
published branch and only ever moves by fast-forward, so a published commit keeps
the SHA its tests ran under.

- Push to `next` → the `release-pr` job regenerates the body of the standing
  `release next to production` pull request from `scripts/release-notes.mjs`, and
  semantic-release publishes a prerelease to the npm `next` tag.
- Approving that pull request → `.github/workflows/promote-release.yml`
  fast-forwards `main` to `next`, then dispatches `workflow.yml` on `main`,
  because a push made with `GITHUB_TOKEN` raises no events.
- Push or dispatch on `main` → semantic-release publishes to npm `latest`, pushes
  the `v*` tag and creates the GitHub release.

**Never press a merge button on the release pull request.** All three rewrite or
add commits. Rebase-and-merge duplicated five commits onto `main` in September
2026 and left the branches forked for a month, with the stable and prerelease tags
on separate strands. Approving is the whole interaction; the fast-forward is the
only way `main` is allowed to move.

Nothing enforces that. Restricting who may update `main` needs the Actions app as
a ruleset bypass actor, which GitHub only allows on organisation-owned
repositories. What exists instead is detection: the `release-pr` job fails on the
next push to `next` if `main` has stopped being an ancestor, and the promotion
refuses rather than merging. Recovery is a force-push of `main` back onto `next`,
which means disabling the `main-integrity` ruleset for the duration.

Rulesets: `keep-next` holds `next` linear and undeletable, `main-integrity` blocks
any rewrite of `main` with no bypass, and `no-delete-default-branches` covers both.

semantic-release never commits back — there is no `@semantic-release/git` — so
`package.json` stays at `version: 0.0.1` and the git tags plus npm are the only
record of what shipped. `scripts/release-notes.mjs` has to keep its `.mjs`
extension: as `.js` it would fall under `collectCoverageFrom` with no test and
fail the 100% gate.

## Architecture

The dependency flow is: **Persist** (facade) → **Connection** (orchestration) → **StorageEngine** (persistence) + **Schema** (validation) + **FindIndex**/**SearchIndex** (querying), all operating over **Model** instances whose fields are **Property** types.

- `src/Persist.js` — the facade and public entry (re-exported by `exports/default.js`). Holds a static registry of named connections (`registerConnection`/`getConnection`) and exposes `Model`, `Property`, `Connection`, and `Errors`.
- `src/data/Model.js` — base class for all models. Fields are declared in a `static {}` block by assigning `Property` types (see below). Key responsibilities: id generation (`<ModelName>/<ULID>`), serialization (`toData`), and deriving index/search projections (`toIndexData`/`toSearchData`). `isModel` / `isDryModel` distinguish full instances from stub references (`{id}` only).
- `src/data/Property.js` + `src/data/properties/*` — the type system (`String`, `Number`, `Boolean`, `Date`, `Array`, `Slug`, `Custom`, `Any`, plus `ResolvedType`). Each extends `Type` (`properties/Type.js`), which provides the chainable modifiers `.required` and `.default(value)` by returning subclasses with `_required` / `_default` flags. Type metadata lives on `_`-prefixed statics (`_type`, `_items`, `_required`, `_resolved`, `_schema`).
- `src/Connection.js` — the workhorse. `put` walks the object graph, validates, diffs against stored data (only writes changed models), and updates find/search indexes transactionally. `get` returns a possibly-dry model; `hydrate` recursively resolves linked stub models (with a cache to break cycles). `delete` traces inbound/outbound relationships (`#findLinkedModelClasses`) and refuses to proceed if it would cause unintended cascade deletes/updates unless they're listed in `propagateTo`. `transaction()` returns a proxied connection that queues operations and rolls them back on a failed `commit`.
- `src/engine/storage/StorageEngine.js` — abstract base defining the engine contract: `getModel`/`putModel`/`deleteModel`, `getIndex`/`putIndex`, `getSearchIndex`/`putSearchIndex`. Also houses the transactional engine wrapper and the storage error hierarchy. Concrete engines: `S3StorageEngine.js` and `HTTPStorageEngine.js`.
- `src/Schema.js` — compiles a model class into a JSON Schema and validates instances with AJV (`ajv` + `ajv-errors` + `ajv-formats`). Throws `ValidationError` (carrying `.errors` and `.data`) on failure. `Model.validate()` calls into this.
- `src/data/FindIndex.js` — evaluates structured queries (`$is`, `$contains`, nested) against a model's flat index (`data/<Model>/_index.json`).
- `src/data/SearchIndex.js` — fuzzy search over the search index using fuse.js.

### Indexes

Each model has two derived, per-model index documents that the engine persists alongside the raw model bodies: a **find index** (fields from `static indexedProperties()`) and a **search index** (fields from `static searchProperties()`). `Connection.put`/`delete` keep these in sync. Linked-model ids are always indexed automatically (`indexedPropertiesResolved` adds `<link>.id` / `<link>.[*].id`).

### Relationships and the arrow-function idiom

Models reference other models to form one-to-one and one-to-many links. **Circular or forward references must be declared lazily as arrow functions** (`Model.other = () => OtherModel;`) — a bare reference throws `ReferenceError: Cannot access 'X' before initialization`. `Connection`'s `resolveModels` and `Model.indexedPropertiesResolved` call these thunks to resolve the real class. When editing relationship-handling code, preserve support for both bare-class and arrow-function forms.

### Browser / minification quirks (see `docs/code-quirks.md`)

- Model class names are the storage namespace. Minifiers that mangle class names break persistence — use `Model.withName('Name')` in the `static {}` block to pin the name.
- The `HTTP` engine in a browser needs `fetch: fetch.bind(window)` passed in its configuration.

## Public API surface

`package.json` `exports` deliberately exposes only two paths: `.` → `exports/default.js` (the `Persist` facade) and `./storage/*` → `exports/storage/*.js` (engines: `s3`, `http`). Anything under `src/` is internal. When adding a public capability, wire it through these export files. `@aws-sdk/client-s3` is an **optional** dependency — the S3 engine takes a pre-constructed client, so don't make core code hard-depend on it.

## Docs

`docs/` contains consumer-facing documentation (defining models, property types, models-as-properties, structured/search queries, storage engines, transactions, code quirks) and `docs/http.openapi.yml` specifying the contract the HTTP engine expects from a backend. Keep these in sync when changing public behavior.