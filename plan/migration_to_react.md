# Migration Plan: Rails → React Frontend

Date: 2026-07-28

This document captures the plan, checklist, architecture options, and recommended steps to migrate the Service/FixIt Rails app to a modern React frontend with a professional, simple theme.

-- Checklist (actionable steps)

- [x] Decide architecture: Integrated SPA (single repo) or Separate frontend repo
- [x] Add a small API health endpoint (/api/v1/ping) to validate frontend/backend communication
- [x] Scaffold React app (integrated in `app/frontend` via Vite) — TypeScript
- [ ] Implement auth flow (Devise cookie-based for integrated; token-based for separate)
- [ ] Add versioned API namespace `/api/v1/*` and API controllers (products, tenants, statuses, categories)
- [ ] Expose JSON contracts (use Jbuilder or serializers) and include pagination metadata
- [ ] Migrate UI features incrementally (products index/show → forms/estimates → tenant admin → payments)
- [ ] Preserve server-side only features (Stripe payments, PDF generation) behind API endpoints
- [ ] Update Procfile.dev and CI to run Rails + frontend dev server or integrated build
- [ ] Convert/extend tests: controller specs → request specs; add frontend tests (Jest/RTL)


-- Summary recommendation

- Keep Rails as the backend for API, payments, and PDF generation.
- Start with an integrated frontend inside the Rails repo (fastest path) and use cookie-based Devise sessions to avoid heavy auth rework.
- Use React + TypeScript and Vite (or esbuild) for a fast DX. Use React-Bootstrap (Bootstrap 5) to retain the current styling and deliver a clean, professional theme quickly.
- Migrate incrementally, keep HTML views as fallbacks, and preserve API compatibility while migrating.


-- Architecture options (choose one)

Option A — Integrated single-repo SPA (recommended initially)
- React app lives under `app/javascript` or `/frontend` inside the Rails repo.
- Dev: Rails server + Vite/esbuild dev server + SASS watcher (run in Procfile.dev).
- Use Devise session cookies; React sends requests with credentials and CSRF token.
- Easier to preserve tenant/session patterns (Thread.current[:tenant_id] remains supported).

Option B — Separate frontend repo (for long-term separation)
- Create a standalone React app (Vite + TypeScript) and host it separately.
- Rails becomes API-only; use token-based auth (JWT or devise_token_auth) and enable CORS.
- Requires explicit tenant identification (header or subdomain) and more infra work.


-- Backend API design & changes

- Namespace: /api/v1/* with defaults: { format: :json }
- Controllers: Add Api::V1::ProductsController, TenantsController, StatusesController, CategoriesController, SessionsController (or adapt Devise JSON responses).
- Serialization: Use existing .json.jbuilder templates or adopt ActiveModelSerializers / fast_jsonapi for stable contracts.
- Pagination: Return metadata { meta: { total_pages, current_page, per_page, total_entries } } for consistent client pagination.
- Errors: Standardize error payloads: { error: { message: "", code: "" } } and reuse ApplicationController handlers.
- Tenant context: Keep `authenticate_tenant!` and `Tenant.set_current_tenant(current_user)` in API controllers; expose an endpoint to switch tenant when users belong to multiple tenants.
- Preserve: payments (Stripe), PDF generation (wicked_pdf), background jobs — keep these server-side.


-- Frontend stack & theme (recommended)

Core:
- React (TypeScript) + Vite (fast dev) or use existing esbuild pipeline
- React Router (react-router-dom) for client routing
- React Query (tanstack/react-query) or SWR for data fetching/caching
- Axios or fetch for network requests (with credentials for cookies)

Forms & validation:
- react-hook-form + yup for validation and nested/dynamic fields (replaces cocoon)

Styling & theme:
- react-bootstrap + bootstrap@5 for layout and components (reuses CSS, quick to ship)
- Optionally Tailwind CSS for custom design (requires more initial work)
- Typography: Inter or system-ui
- Color suggestions: Bootstrap primary (#0d6efd), neutrals, accent teal (#20c997)

UI/Components to build first:
- App shell, Header/Nav (tenant switch, search, user menu)
- Auth pages: SignIn, SignUp, Confirm, Password Reset
- Product list (paginated), Product detail, Product form (with estimates field array)
- Statuses board / StatusProducts filter view
- Tenant admin dashboard, Category management


-- Migration phases (timeline estimates)

Phase 0 — Prep (1–2 days)
- Decide integrated vs separate
- Add minimal API endpoint (GET /api/v1/ping)
- Add cors gem only if frontend will be separate

Phase 1 — Auth & global shell (2–5 days)
- Add API sessions endpoints or adapt Devise for JSON
- Scaffold React app; implement layout and navbar
- Implement SignIn/SignUp pages (session cookies + CSRF for integrated approach)

Phase 2 — Products index/show (3–7 days)
- Implement Api::V1::ProductsController#index/show with pagination
- Build ProductList and ProductDetail in React using react-query

Phase 3 — Forms & nested estimates (5–10 days)
- Ensure Rails accepts nested attributes for estimates via API
- Build ProductForm with react-hook-form dynamic arrays and client-side totals

Phase 4 — Tenant flows, statuses, admin pages (4–8 days)
- API for statuses, categories, tenants
- Tenant switch endpoint (server-side session update)
- React admin pages

Phase 5 — Payments, PDF, polish (3–7 days)
- Integrate Stripe Elements client-side to collect card tokens; send token to server endpoint
- Keep PDF generation on server; link/download from React UI

Phase 6 — Cutover & cleanup (2–5 days)
- Gradually replace server-rendered views with React routes
- Update tests and CI; remove deprecated view code when safe


-- Auth & tenant details (important)

Integrated (Option A):
- Use Devise session cookies. On the client, send requests with `credentials: 'include'` and include `X-CSRF-Token` header (read from meta tag).
- Keep `authenticate_tenant!` in API controllers. Provide an endpoint to switch the active tenant for users who belong to multiple tenants.

Separate (Option B):
- Use token-based authentication (JWT / devise_token_auth). Implement X-Tenant-Id header or subdomain tenant resolution.


-- Dev & build workflow

Procfile.dev (example) for integrated approach:

- rails: bin/rails server -p 3000
- vite: cd frontend && npm run dev  # if separate
- css: bin/rails dartsass:watch

Production builds:
- Integrated: build React into `app/assets/builds` or `public` and serve via Rails static assets
- Separate: deploy frontend to CDN / static host and Rails API to separate host (enable CORS)


-- Tests & CI

- Convert controller view specs to request specs that assert JSON contracts.
- Keep model/unit tests in Rails.
- Add frontend unit tests: Jest + React Testing Library for key components.
- Add E2E tests with Playwright or Cypress for critical flows: signup, tenant creation, payments.


-- Risk management & rollback

- Migrate incrementally and keep legacy views behind a route prefix or feature flag (e.g., /legacy/*)
- Preserve payments and PDFs on the server side to minimize risk
- Maintain strict API contracts during migration and use comprehensive request specs


-- Quick commands & scaffolding examples

Create a separate Vite TypeScript frontend:

```bash
cd /Users/iulia.gatea/Downloads/Learning/Ruby
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm run dev
```

Add an integrated React app (use yarn if the repo uses it):

```bash
cd /Users/iulia.gatea/Downloads/Learning/Ruby
yarn add react react-dom react-router-dom @tanstack/react-query axios react-bootstrap bootstrap react-hook-form yup
# create app/javascript/src and mount point in app/views/layouts/application.html.erb
```

Add API health endpoint (Rails route + controller minimal example):

- routes.rb:
```ruby
namespace :api do
  namespace :v1 do
    get 'ping', to: 'health#ping'
  end
end
```
- app/controllers/api/v1/health_controller.rb:
```ruby
module Api
  module V1
    class HealthController < ApplicationController
      skip_before_action :authenticate_tenant!, :verify_authenticity_token

      def ping
        render json: { status: 'ok' }
      end
    end
  end
end
```


-- Suggested npm packages and gems

NPM:
- react, react-dom, typescript, vite, react-router-dom, @tanstack/react-query, axios, react-bootstrap, bootstrap, react-hook-form, yup, react-icons

Gems (backend if moving to API-only):
- rack-cors (CORS support)
- active_model_serializers or fast_jsonapi (optional)
- devise-jwt or devise_token_auth (if token auth desired)


-- Theme guidance (visual)

- Layout: fixed top nav, centered content container (max-width: 1200px)
- Colors: Bootstrap primary (#0d6efd), neutrals for backgrounds, teal accent (#20c997)
- Typography: Inter or system-ui
- Components: cards for items, subtle shadows, 6–8px border radius, consistent 8px grid spacing


-- Deliverables & immediate next steps

1. Pick architecture (Integrated vs Separate) and whether to use TypeScript.
2. I can scaffold either an integrated React app (in `app/javascript`) or a separate Vite + TypeScript app under `/frontend` and add a small API health endpoint.
3. After you pick, I will either: implement the scaffold and update `Procfile.dev`, or create the separate frontend scaffold and provide instructions to run it.


-- Notes & project-specific considerations

- Thread-local tenant context (`Thread.current[:tenant_id]`) and `ApplicationController#authenticate_tenant!` are critical; do not bypass them.
- Free-tier product limit (500) must be enforced server-side; show informative client-side validation/errors.
- Preserve server-side PDF generation and integrate Stripe client-side only to collect tokens, forward token to Rails for processing.


---

File saved by automation: /plan/migration_to_react.md


# Implementation Plan (Draft — Awaiting Answers)

Date: 2026-10-08

This section turns the migration plan above into a concrete, sequenced implementation plan based on the **actual current state of this repo** (checked before writing this):

- JS build: `jsbundling-rails` + `esbuild` (NOT dartsass-rails/Vite as the original doc assumed). `app/javascript/application.js` is the only entry point today.
- CSS build: `cssbundling-rails` + `sass` (Bootstrap 5 via `twitter-bootstrap-rails` + `bootstrap` npm package), compiled via `yarn build:css`.
- `Procfile.dev` currently runs: `web` (rails server), four `css` lines (looks duplicated/stale — `dartsass:watch` + `yarn watch:css` x2), and `js` (`yarn build --watch`).
- No `/api` namespace exists yet in `config/routes.rb`. No `rack-cors` gem. No JSON serializer gem beyond `jbuilder` (already present).
- `Sidekiq::Web` is mounted at `/sidekiq` — there are background jobs in this app that AGENTS.md doesn't mention; API design should account for any async flows they drive.
- Deeply nested routes confirmed: `/tenants/:tenant_id/statuses/:status_id/products`, `/tenants/:tenant_id/products/:product_id/estimates`, `/tenants/:tenant_id/user/:id/products`, plus `tenants#rate` (PUT), `tenants#search` (POST), `products#send_product_card`.
- Devise uses custom `registrations`, `confirmations`, and `sessions` controllers — relevant for any JSON auth adaptation.

## Proposed Phases (adapted to this repo)

**Phase 0 — Foundations**
- Add `namespace :api do namespace :v1 do ... end end` to `routes.rb` with a `GET /api/v1/ping` health check.
- Add `Api::V1::BaseController < ApplicationController` that keeps `authenticate_tenant!` / tenant thread-local logic, but renders JSON errors instead of redirects/flash.
- Clean up `Procfile.dev` (remove the duplicate `css` lines) as part of this work rather than leaving the stale entries.

**Phase 1 — Auth & shell**
- Keep Devise cookie sessions (integrated approach). Adapt `sessions`/`registrations`/`confirmations` controllers (or add JSON-aware versions) to respond with JSON when `Accept: application/json` / format param is set, without breaking the existing HTML flows.
- Scaffold the React app inside `app/javascript` (new subfolder, e.g. `app/javascript/react/`) using the **existing esbuild pipeline** — add a second esbuild entry point rather than introducing Vite, unless you want to replace the build tool (see Q2 below).
- Build App shell: top nav (tenant switcher, search, user menu), React Router routes, mount point added to `app/views/layouts/application.html.erb`.

**Phase 2 — Products index/show**
- `Api::V1::ProductsController#index/show` under the nested tenant route (`/api/v1/tenants/:tenant_id/products`), preserving the existing admin-sees-all / member-sees-own visibility rule from `ApplicationController#products`.
- Pagination metadata matching `will_paginate` output.
- React: `ProductList` (paginated) + `ProductDetail` via React Query.

**Phase 3 — Forms & nested estimates**
- `Api::V1::EstimatesController` (nested under products) accepting nested attributes equivalent to the current `accepts_nested_attributes_for` + cocoon flow.
- React: `ProductForm` with react-hook-form dynamic field array for estimates, client-side totals mirroring `estimated_value` calculation.
- Enforce the free-plan 500-product cap server-side; surface the error in the form.

**Phase 4 — Statuses, categories, tenant admin**
- `Api::V1::StatusesController`, `CategoriesController`, tenant admin endpoints (`/plan/edit`, `/plan/update` equivalents).
- Tenant-switch endpoint for users belonging to multiple tenants (server updates the thread-local/session tenant).
- React: Status board / filter view, Category management, Tenant admin dashboard.

**Phase 5 — Payments & PDFs**
- Stripe Elements client-side (collect token only); existing `Payment#process_payment` / `Tenant.transaction` rollback logic stays server-side, exposed via an API endpoint.
- `send_product_card` / wicked_pdf-generated PDFs: keep server-rendered, link/download from React.

**Phase 6 — Cutover**
- Replace server-rendered views route-by-route; decide a concrete deprecation point for the legacy views (see Q7).
- Convert controller specs touched by the migration to request specs asserting JSON contracts; add Jest/RTL for new components.

---

## Open Questions (please answer inline below each, then let me know to proceed)

**Q1. Architecture** — Integrated single-repo (React inside `app/javascript`, Devise cookie sessions) or separate `/frontend` repo (API-only Rails, token auth, CORS)? The original doc recommends integrated first. Confirm?
> ANSWER:
Integrated single-repo
**Q2. Build tool** — The repo already uses `jsbundling-rails` + `esbuild` (not Vite/dartsass-rails as the original doc assumed). Reuse esbuild (lower lift, stays consistent with current setup) or switch to Vite (better React DX: HMR, faster rebuilds, but a bigger infra change)?
> ANSWER:
switch to vite
**Q3. TypeScript** — Yes (recommended for a fresh React layer) or plain JS to match the existing CoffeeScript/JS codebase style?
> ANSWER:
> Yes
**Q4. Scope of this engagement** — Do you want me to plan/implement the full Phase 0→6 migration, or just get Phase 0–2 (API foundation, auth, products list/detail) working first and reassess?
> ANSWER:
full Phase 0→6 migration
**Q5. Legacy views during migration** — Keep old server-rendered views reachable (e.g. under `/legacy/*`) indefinitely as a fallback, or plan a hard cutover date/condition per route once its React equivalent ships?
> ANSWER:
Keep old server-rendered views reachable under `/legacy/*` indefinitely as a fallback
**Q6. Background jobs (Sidekiq)** — AGENTS.md doesn't mention Sidekiq, but it's mounted in routes. Are there async flows (emails, notifications, etc.) the API layer needs to trigger or poll for status on? Any existing jobs I should know about before designing the API contracts?
> ANSWER:
There are some backroung jobs for emails and product card sending. The API layer should trigger these jobs and handle their status appropriately. Existing jobs include email notifications for status updates and sending product cards to customers.
**Q7. Testing tooling** — OK to add new JS dev dependencies (Jest, React Testing Library, and optionally Playwright/Cypress for E2E) alongside the existing esbuild/sass toolchain?
> ANSWER:
Yes
**Q8. Tenant switcher** — Is "user belongs to multiple tenants, switches between them" an actively used feature today, or mostly a single-tenant-per-user usage pattern in practice? This affects whether the tenant-switch endpoint/UI is a Phase 1 must-have or can be deferred.
> ANSWER:
single-tenant-per-user usage pattern in practice, the tenant-switch endpoint/UI should not be implemented.
**Q9. Styling** — Keep `react-bootstrap` + the existing Bootstrap 5 setup (matches current theme, fastest path) or move toward a different design system/Tailwind as part of this refresh?
> ANSWER:
make the design more modern and clean, but keep react-bootstrap + the existing Bootstrap 5 setup for now. We can consider a design system/Tailwind in a future phase if needed.
---

No code will be written until these are answered.


# Final Implementation Plan (v1) — Awaiting your OK to start

Date: 2026-10-08

## Decisions locked in (from your answers)

1. **Architecture**: Integrated single repo, Devise cookie sessions, no CORS/token auth.
2. **Build tool**: Replace `jsbundling-rails` + `esbuild` with **Vite** (via the `vite_rails` gem + `vite-plugin-ruby` npm package). Since Vite natively bundles SCSS, this plan also folds the current `cssbundling-rails` + `yarn watch:css` pipeline into Vite, retiring the stale/duplicated `css` lines already seen in `Procfile.dev`. Flagging this now since it's broader than "just add Vite" — say so if you'd rather keep `cssbundling-rails` running separately.
4. **TypeScript**: Yes, for all new React code.
5. **Scope**: Full Phase 0→6, implemented incrementally — you sign off at the end of each phase before the next starts.
6. **Legacy views**: Kept indefinitely. Mechanism (see "Routing strategy" below): when a feature's React version ships, its old controller actions/views move under `/legacy/...` and the original URL is handed to the SPA.
7. **Background jobs**: Confirmed in code — these are **Sidekiq workers** (not ActiveJob), living in `app/sidekiq/`:
   - `Products::CardEmailJob` — emails the PDF product card (triggered today by `ProductsController#send_product_card` via `.perform_async`)
   - `Products::CreatedNotificationJob` / `Products::UpdatedNotificationJob` — notify the product's user on create/update
   - `Tenants::ContactJob` — sends the tenant contact-form message
   All four are fire-and-forget (`deliver_later` mail, no status persisted anywhere). API controllers will enqueue them exactly as the current controllers do; no job-status endpoint is needed since there's no status to poll today. If you later want in-app feedback ("card sent"), that's a toast on the enqueue response, not a new polling endpoint.
8. **Testing**: Jest + React Testing Library for unit tests, Playwright or Cypress for E2E — approved. Note: Jest and Vite don't share a transform pipeline, so Jest needs its own `ts-jest` (or `babel-jest`) config independent of Vite's build config. This is a one-time setup cost, not a blocker.
9. **Tenant switcher**: Not building it. React auth/shell assumes single tenant per user, matching `Tenant.set_current_tenant(current_user)`'s existing "first tenant" behavior.
10. **Styling**: Keep `react-bootstrap` + Bootstrap 5, but treat this as a visual refresh (updated spacing/typography/shadows per the "Theme guidance" section above), not a framework change. Tailwind/design-system swap stays out of scope, deferred to a future phase if ever.

## Routing strategy (how legacy + SPA coexist)

- `config/routes.rb` gets a new `namespace :api do namespace :v1 do ... end end` block (JSON only).
- For each feature being migrated in a given phase:
  1. Its existing routes/controller actions are renamed under a `scope '/legacy'` (or moved into a `Legacy::` controller namespace) so the old HTML views stay reachable at `/legacy/<original path>`.
  2. The *original* URL (e.g. `/tenants/:tenant_id/products`) is reassigned to a catch-all SPA route that renders a minimal `application#spa_shell` view with the React mount point; React Router then matches the same path client-side.
  3. Until a feature is migrated, its original URL keeps working exactly as today — nothing moves to `/legacy` preemptively.
- This keeps bookmarks/links stable, avoids a big-bang route rewrite, and lets Phase 6 ("cutover") just mean "no features left pointing at `/legacy`."

## Directory & dependency changes

**Remove:**
- Gem: `jsbundling-rails`, `cssbundling-rails`
- npm: the `build`/`watch:css`/`build:css*` scripts tied to esbuild + plain `sass` CLI (Vite takes over bundling)

**Add:**
- Gem: `vite_rails`
- npm (dev): `vite`, `vite-plugin-ruby`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `jest`, `ts-jest` (or `babel-jest`), `@testing-library/react`, `@testing-library/jest-dom`, `playwright` (or `cypress`)
- npm (runtime): `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `axios`, `react-hook-form`, `yup`, `react-bootstrap` (keep existing `bootstrap` package)
- Gem (Phase 1, for JSON-aware Devise responses): none required beyond what's present — `jbuilder` already in `Gemfile`.

**New structure:**
- `app/frontend/entrypoints/application.tsx` — Vite entry (replaces `app/javascript/application.js`; the current `import * as bootstrap from "bootstrap"` line moves here alongside the React mount).
- `app/frontend/src/` — components, routes, api client (axios instance with `credentials: 'include'` + CSRF header read from the `<meta name="csrf-token">` tag), feature folders mirroring phases (products, estimates, statuses, tenants).
- `config/vite.json`, `vite.config.ts` — standard `vite_rails` scaffolding.
- `Procfile.dev` rewritten to just: `web: bin/rails server -p 3000` + `vite: bin/vite dev` (removes the 4 duplicate `css` lines and the `js` esbuild-watch line).

## Phase-by-phase plan

**Phase 0 — Foundations**
- Add `vite_rails` + scaffold Vite/TypeScript, confirm `yarn build` output serves correctly through Rails in dev.
- Add `/api/v1/ping` health check + `Api::V1::BaseController` (inherits tenant/auth filters from `ApplicationController`, overrides rendering to JSON errors: `{ error: { message, code } }`).
- Rewrite `Procfile.dev`.
- *Checkpoint: Rails boots, Vite dev server serves a blank React page at a test route, `/api/v1/ping` returns `{status: "ok"}`.*

**Phase 1 — Auth & shell**
- JSON-aware sign-in/sign-up: either add `respond_to :json` to the custom `sessions`/`registrations`/`confirmations` controllers, or add thin `Api::V1::SessionsController` wrapping Devise's warden sign-in, returning current user + tenant payload.
- Build App shell: nav, auth pages (SignIn, SignUp, Confirm, Password Reset), React Router skeleton, axios client with CSRF wiring.
- Mount point added to `app/views/layouts/application.html.erb`, gated so it only renders on SPA-handled routes.
- *Checkpoint: can sign in via the React UI and hit an authenticated API endpoint.*

**Phase 2 — Products index/show**
- `Api::V1::TenantsController::ProductsController` (or nested route) `#index`/`#show`, reusing the existing admin/member visibility rule.
- Pagination metadata (`meta: { total_pages, current_page, per_page, total_entries }`) matching `will_paginate`.
- React: `ProductList` + `ProductDetail` via React Query; original `/tenants/:tenant_id/products` HTML routes move to `/legacy/...`.
- *Checkpoint: product list/detail fully usable in React at the original URLs; old views reachable at `/legacy/...`.*

**Phase 3 — Forms & nested estimates**
- `Api::V1::EstimatesController` nested under products, accepting nested attributes equivalent to current `accepts_nested_attributes_for`.
- `ProductForm` with `react-hook-form` dynamic field array for estimates; client-side totals mirroring `estimated_value`.
- Enforce the free-plan 500-product cap server-side (`Product#free_plan_can_only_have_500_products`); surface as a form error.
- `send_product_card` button in React enqueues `Products::CardEmailJob` via a new API action identical to the current controller's `.perform_async` call.
- *Checkpoint: create/edit product with estimates works end-to-end in React; product card email still sends.*

**Phase 4 — Statuses, categories, tenant admin**
- `Api::V1::StatusesController`, `CategoriesController`, tenant admin endpoints (plan edit/update).
- React: status board/filter view, category management, tenant admin dashboard. No tenant-switcher UI (per decision #9).
- *Checkpoint: admin can manage statuses/categories/plan from React.*

**Phase 5 — Payments & PDFs**
- Stripe Elements client-side (token only); existing `Payment#process_payment` + `Tenant.transaction` rollback stays server-side behind an API endpoint.
- PDF (`wicked_pdf`) generation stays server-rendered; React links to/downloads the generated file.
- *Checkpoint: premium upgrade flow works through React, failure correctly reverts to free plan.*

**Phase 6 — Cutover & cleanup**
- Once every feature has a React equivalent, confirm nothing still points at `/legacy/*`; remove legacy controllers/views feature-by-feature (only after your explicit go-ahead per feature, since decision #6 was "keep indefinitely" — this step only happens if/when you later decide otherwise).
- Convert remaining controller specs touched by the migration to request specs asserting JSON contracts; fill out Jest/RTL coverage for shipped components; add Playwright/Cypress E2E for signup, product CRUD, payment.

## Risk management

- Each phase ships behind its own route migration — a bad phase can be reverted by pointing the original URL back at the legacy controller.
- Stripe and PDF generation never leave the server — lowest-risk, highest-compliance-sensitivity logic stays untouched.
- Sidekiq job contracts (`perform_async(product_id)` etc.) are unchanged; only the caller (API controller instead of HTML controller) differs, so job behavior/retries are unaffected.

---

**Next step:** reply with your OK (or any adjustments — especially on the "fold cssbundling-rails into Vite" call in decision #2) and I'll start Phase 0. No code has been written yet.

---

## Phase 0 — Done (2026-10-08)

What shipped, and one deliberate deviation from the plan above:

**Deviation from decision #2:** I did **not** fold `cssbundling-rails`/`jsbundling-rails`/Sprockets into Vite as planned. Once I read the actual layout and asset config (`app/views/layouts/application.html.erb`, `config/initializers/assets.rb`), the current pipeline turned out to be more entangled than expected: Sprockets serves `jquery.js`, `datepicker.js`, `credit_card_form`, bootstrap-icons, and the `app/assets/builds` output from the existing esbuild/sass build, and the layout also pulls Bootstrap/Popper straight from CDN `<script>`/`<link>` tags. Ripping that out now would risk breaking every legacy page before any React replacement exists. So Phase 0 added Vite **alongside** the existing pipeline rather than replacing it — `jsbundling-rails`, `cssbundling-rails`, and the esbuild/sass scripts are all untouched and still build `app/javascript/application.js` as before. Retiring them is now folded into Phase 6 (cutover), once there's no legacy page left depending on them. Flagging this since it differs from what decision #2 said — let me know if you'd rather force the full swap sooner.

**What was built:**
- `gem 'vite_rails'` added and installed; `bin/vite`, `config/vite.json`, `vite.config.mts` scaffolded.
- `app/frontend/entrypoints/application.tsx` — new Vite/TypeScript/React entrypoint (`sourceCodeDir` set to `app/frontend`, separate from the legacy `app/javascript`).
- `tsconfig.json` added (strict, `react-jsx`, path alias `~/*` → `app/frontend/*`).
- npm: added `react`, `react-dom` (runtime) and `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom` (dev); `vite-plugin-ruby`/`vite` added by the installer.
- `config/routes.rb`: added `namespace :api do namespace :v1 do get 'ping' ... end end` and a temporary `GET /vite_smoke_test` route.
- `app/controllers/api/v1/base_controller.rb` — JSON error contract (`{ error: { message, code } }`) for 403/404/422(CSRF)/500, keeping `authenticate_tenant!` from `ApplicationController`.
- `app/controllers/api/v1/health_controller.rb` — `GET /api/v1/ping` → `{"status":"ok"}`, public (tenant check skipped).
- `app/controllers/vite_smoke_test_controller.rb` + `app/views/layouts/vite_smoke_test.html.erb` + `app/views/vite_smoke_test/show.html.erb` — temporary, isolated route (own layout, doesn't touch `application.html.erb`) proving Vite + React + TS render through Rails. **Safe to delete once Phase 1 wires the real app shell in.**
- `Procfile.dev`: added `vite: bin/vite dev`; also removed a dead `css: bin/rails dartsass:watch` line (the `dartsass-rails` gem isn't installed, so this task doesn't exist — confirmed it errors with "Unrecognized command") and two exact-duplicate `css: yarn watch:css` lines that were already there.

**Verified:**
- `bin/rails routes` shows `GET /api/v1/ping` and the smoke-test route registered correctly.
- `curl /api/v1/ping` → `200 {"status":"ok"}`.
- `npx tsc --noEmit` passes with no errors.
- `bundle exec vite build` (production build) succeeds.
- With `bin/vite dev` + `rails server` both running, `curl /vite_smoke_test` returns a page whose `<script type="module">` tag is served by the Vite dev server at `/vite-dev/entrypoints/application.tsx`, and that module's compiled output is real transformed React/JSX (not a 404/fallback page — an earlier attempt using `vite_typescript_tag 'application'` silently mismatched the `.tsx` extension and served Vite's generic "it works" landing page instead; fixed by switching to `vite_javascript_tag 'application.tsx'`).
- `bundle exec rspec`: 140 examples, 8 failures — all in `products_controller_spec.rb` (product creation/count assertions) and one in `product_spec.rb` (500-product plan-limit validation). Confirmed these are pre-existing and unrelated to this change: the only `routes.rb` edit is a block inserted before `root to:`, entirely additive and nowhere near the `resources :tenants do resources :products end` nesting those specs exercise; nothing else touched here (Gemfile, package.json, new files) comes near `ProductsController#create`, `Member`, or `Product` validation code. Not fixed as part of this phase — out of scope for the migration work itself.

Next: Phase 1 (auth & shell) — awaiting your go-ahead.

---

## Phase 1 — Done (2026-10-08)

**Scope cut, flagged up front:** The plan listed "SignIn, SignUp, Confirm, Password Reset" as Phase 1 React pages. I implemented **SignIn fully** (real JSON API + React page, matching the Phase 1 checkpoint: "can sign in via the React UI and hit an authenticated API endpoint"). SignUp/Confirm/ResetPassword are thin stub pages that link back to the existing legacy Devise pages, rather than reimplemented in React now — SignUp in particular is entangled with tenant creation + Stripe payment (`RegistrationsController#create`), which is genuinely Phase 3/5 scope, not shell/auth scope. Rebuilding that transactional logic now just to have a React form would be premature. Say if you want it pulled forward.

**What was built:**
- `app/controllers/api/v1/sessions_controller.rb` — `create` (sign in with email/password via `User.find_for_database_authentication` + `valid_password?`), `destroy` (sign out), `show` (current user + tenant). Routes: `POST /api/v1/sign_in`, `DELETE /api/v1/sign_out`, `GET /api/v1/me`.
- `app/controllers/spa_controller.rb` + `app/views/layouts/spa.html.erb` + `app/views/spa/show.html.erb` — the real SPA shell, mounted at `GET /app` and `GET /app/*path` (React Router owns everything under `/app` client-side). This **replaces** the Phase 0 `vite_smoke_test` scaffolding, which is now deleted.
- `app/frontend/src/`: `api/client.ts` (axios instance, `withCredentials: true`, CSRF token read from the page's `<meta>` tag), `context/AuthContext.tsx` (fetches `/me` on load, exposes `signIn`/`signOut`), `components/NavBar.tsx`, `components/LegacyRedirectNotice.tsx` (shared by the three stub pages), `pages/{SignInPage,SignUpPage,ConfirmPage,ResetPasswordPage,DashboardPage}.tsx`, `App.tsx` (React Router routes + a `RequireAuth` guard redirecting to `/sign-in`).
- `app/frontend/entrypoints/application.tsx` rewritten to mount `<App />` (replaces the Phase 0 placeholder); now also imports `bootstrap/dist/css/bootstrap.min.css` directly (Vite bundles it) — scoped only to `/app` pages via the separate `spa` layout, doesn't touch the legacy layout/CDN Bootstrap.
- npm: added `react-router-dom`, `axios`, `react-bootstrap`.
- `spec/requests/api/v1/sessions_spec.rb` — new request spec covering sign-in (valid/invalid credentials), `/me` (401 when logged out, 200 with correct user/tenant when logged in), and sign-out, using real password authentication (not the Warden test-helper bypass) since that's exactly what the new endpoint does.

**Verified:**
- `npx tsc --noEmit` and `bundle exec vite build` both pass.
- `bundle exec rspec` — 145 examples (5 new, all passing), same 8 pre-existing unrelated failures as Phase 0's baseline.
- Live end-to-end check with `bin/vite dev` + `rails server`: fetched `/app`, extracted the real CSRF token from the rendered page, and drove the full cookie + CSRF-protected flow against `/api/v1/sign_in` → `/api/v1/me` → `/api/v1/sign_out` → `/api/v1/me` (401) with `curl`, using a throwaway tenant/user created and then fully deleted from the dev DB afterward. This exercises the production CSRF path, which the request spec can't (Rails disables forgery protection in the test env).
- Did not spin up a real browser (no Playwright installed, same as Phase 0) — verification is build + type-check + real HTTP/cookie flow, not actual DOM rendering/click-through of the React forms. Say if you want that extra layer before moving on.

**Incidental finding (not fixed, out of scope):** destroying a `Tenant` that has categories currently raises `PG::ForeignKeyViolation` — `has_many :tenant_categories` on `Tenant` has no `dependent: :destroy`/`dependent: :delete_all`, so the join rows survive and block the delete. Ran into this only because my cleanup script destroyed a tenant; unrelated to the migration work, flagging in case tenant deletion is a path you rely on elsewhere.

Next: Phase 2 (products index/show) — awaiting your go-ahead.

---

## Phase 2 — Done (2026-10-08)

**Routing decision, consistent with Phase 1:** the plan's original "routing strategy" section (written before any phase was implemented) assumed React pages would take over the legacy URLs directly, with old controllers/views moved to `/legacy/...`. Phase 1 already deviated from that — the SPA lives at a net-new `/app` prefix instead of colliding with existing URLs, to keep risk low. Phase 2 keeps that same pattern: product pages are `/app/products` and `/app/products/:id`, not a takeover of `/tenants/:tenant_id/products`. The legacy `ProductsController` and its views are completely untouched.

**What was built:**
- `app/controllers/api/v1/products_controller.rb` — `GET /api/v1/tenants/:tenant_id/products` (paginated, admin sees all tenant products, member sees only their own — reusing `ApplicationController#products`) and `GET /api/v1/tenants/:tenant_id/products/:id` (includes estimates). JSON shape: `{ products: [...], meta: { total_pages, current_page, per_page, total_entries } }` for index, matching the contract documented earlier in this plan.
- Routes: `resources :tenants, only: [] do resources :products, only: %i[index show] end` under `/api/v1`.
- Frontend: `api/products.ts` (typed fetchers), `pages/ProductsListPage.tsx` (paginated table), `pages/ProductDetailPage.tsx` (estimates + total), wired into `App.tsx` behind `RequireAuth`, with a "Products" nav link and a dashboard link. Added `@tanstack/react-query` (`QueryClientProvider` now wraps the app in the entrypoint) — this is the first page that actually needed data-fetching/caching, matching the stack already agreed in the plan.
- `spec/requests/api/v1/products_spec.rb` — covers unauthenticated 401, admin seeing all tenant products with correct pagination meta, wrong-tenant 403, product detail with estimates for the owning customer, and 404 for a product the signed-in non-admin doesn't own.

**Fixed, scoped to the new API only (not touching legacy code):** found that `ApplicationController`'s `rescue_from ActiveRecord::RecordNotFound, with: :not_found` is dead code — Rails matches `rescue_from` handlers in *reverse* registration order, and `rescue_from StandardError` is registered after it, so `RecordNotFound` was actually being caught by the generic 500 handler instead of returning 404. Rather than reorder the handlers in the shared `ApplicationController` (wide blast radius, 100+ existing tests depend on it), `Api::V1::BaseController` now re-registers `rescue_from ActiveRecord::RecordNotFound, with: :not_found` itself, which — being declared in the subclass — is checked first. This is also what makes the "404 for a product you don't own" test above actually return 404 instead of 500: `Api::V1::ProductsController#find_product` scopes through the `products` helper (`current_tenant.products` for admins, `current_user.products` otherwise) rather than `Product.find(params[:id])` like the legacy action does — the legacy `ProductsController#show` has no such scoping and skips `verify_user`, so it's possible today to view another tenant's product by guessing an id. Not fixing that in the legacy controller (out of scope), but didn't carry the gap into the new API.

**Verified:**
- `npx tsc --noEmit` and `bundle exec vite build` both pass (393 → 441 modules, build still ~200ms).
- `bundle exec rspec` — 150 examples (10 new: 5 products + the 5 sessions specs from Phase 1), same 8 pre-existing unrelated failures.
- Live end-to-end against the real dev server: created a throwaway tenant/admin user/3 products/estimates (Sidekiq needed a local Redis — wasn't running in this sandbox by default, started one for this), signed in, hit `/api/v1/tenants/:id/products` (got all 3 with correct pagination meta), `/api/v1/tenants/:id/products/:id` (got estimates + total), confirmed a wrong tenant id returns 403 and a nonexistent product returns 404 — then fully deleted the throwaway data afterward.
- Still no real browser/click-through check (no Playwright) — same caveat as Phases 0–1.

**Incidental finding (not fixed, out of scope):** hit the same category of missing-cascade issue as Phase 1's tenant/categories finding, this time on `Tenant#statuses`/`product_statuses` and `User`/`products` — destroying a tenant that has products fails with `PG::ForeignKeyViolation` unless products are deleted first. Only surfaced during my own cleanup script; not fixed, flagging again in case tenant/user deletion is a real path elsewhere in the app.

Next: Phase 3 (forms & nested estimates) — awaiting your go-ahead.

---

## Phase 3 — Done (2026-10-08)

**Real bug found and fixed (in the critical path, not legacy cleanup):** `Product#transition_to_status!`'s guard (`return if current_status_id == new_status.id`) relies on `current_status_id`, which is only populated by `ProductStatus`'s `after_create_commit` hook. `Products::CreateService` calls `transition_to_status!` inside the *same* `Product.transaction do...end` block that creates the product (whose `before_create :initialize_status` already auto-assigns the "Received" status) — so `current_status_id` is still `nil` when the guard runs, and picking "Received" (the obvious, most common choice) as the initial status tries to insert a second `ProductStatus` row for the same status, which hits the model's uniqueness validation and fails the whole create. This is exactly why `products_controller_spec.rb`'s create tests have been in the "pre-existing failures" list since Phase 0 — their test data happens to use `tenant.statuses.first`, i.e. "Received". Fixed in `app/models/product.rb` by checking `product_statuses.exists?(status_id: new_status.id)` instead (sees rows already inserted in the same transaction, doesn't depend on the commit callback). This single fix resolved 7 of the 8 standing pre-existing failures — only the unrelated 500-product plan-limit spec remains.

**What was built:**
- `Api::V1::ProductsController#create`/`#update`/`#send_product_card` — reuses `Products::CreateService`/`Products::UpdateService` (not reimplemented) so the existing transactional/validation/notification logic stays the single source of truth. `create` accepts `product`, `user: { email }`, `member: { first_name, last_name }` (used only when the email doesn't match an existing tenant customer — same `find_or_create_by` semantics as the legacy flow), and `status_id`. `update` accepts `product` (incl. `estimates_attributes`, reusing `accepts_nested_attributes_for`) and an optional `status_id`. Both scoped behind `verify_user` (admin-only, same as legacy — the nested routes have no `user_id` param so `verify_user` only passes for admins).
- `Api::V1::StatusesController#index` — read-only, just enough for the form's status picker; full status management stays Phase 4 scope.
- Routes: `products` gets `create`/`update` + a `POST .../send_product_card` member route; new `statuses` index nested under tenants.
- React: `ProductFormFields` (shared code/name/date/comments/status-select/estimates-field-array component, `react-hook-form` + `useFieldArray`), `NewProductPage` (adds customer email/first/last name fields) and `EditProductPage` (fetches + `reset()`s the form from the existing product), both validated with a shared `yup` schema (`@hookform/resolvers/yup`). `ProductDetailPage` gained an admin-only Edit link and "Send product card" button; `ProductsListPage` gained an admin-only "New product" link.
- `spec/requests/api/v1/products_spec.rb` extended with create (existing customer, new customer+member, free-plan-cap 422, non-admin 403) and update (field+status changes, non-admin 403) cases; `spec/requests/api/v1/statuses_spec.rb` added.

**Scope note:** destroy isn't in this phase (matches the plan's own Phase 3 checkpoint: "create/edit product with estimates works end-to-end; product card email still sends" — no mention of delete). Legacy delete is still reachable via `/tenants/:tenant_id/products/:id` if needed.

**Verified:**
- `npx tsc --noEmit` and `bundle exec vite build` both pass (441 → 453 modules).
- `bundle exec rspec` — 158 examples, 1 failure (down from 8 — see the bug fix above), same unrelated plan-limit spec as before.
- Live end-to-end against the real dev server: signed in as a throwaway admin, fetched `/api/v1/tenants/:id/statuses`, created a product **choosing "Received" as the initial status** (the exact case that was broken before the fix) with a brand-new customer email + estimates in one call — got `201` with the new user/member/product/estimates all created correctly; then `PATCH`ed the product (name + status → "In progress") and hit `send_product_card`, confirming the Sidekiq job enqueued without error (needed a local Redis — wasn't running by default in this sandbox). Cleaned up all throwaway data afterward.
- Still no real browser/click-through of the React form itself (no Playwright) — same caveat as every phase so far; verification here is type-check + build + the full API contract exercised exactly as the form would call it.

Next: Phase 4 (statuses, categories, tenant admin) — awaiting your go-ahead.

---

## Phase 4 — Done (2026-10-08)

**Scope cut on "categories":** the original plan assumed category management would be a normal tenant-admin feature. Reading the legacy code showed otherwise — `CategoriesController` is gated behind a single hardcoded email (`verify_user_email_for_category` checks `current_user.email == 'fixit.app2@gmail.com'`), making it a narrow, platform-level tool, not something real tenant admins use. Migrating that CRUD UI isn't worth it. Phase 4 instead ships a **read-only** `Api::V1::CategoriesController#index` (optionally filtered by `entity`) — just enough to populate the tenant settings form's category checkboxes. Category creation/editing stays on the legacy page, untouched.

**Scope cut on "tenant admin" / plan changes:** the legacy `TenantsController#update` combines profile editing (name/description/keywords/categories) with plan upgrades + inline Stripe payment collection in one form and one action. Since payments are explicitly Phase 5, `Api::V1::TenantsController#update` only permits `:name, :description, :keywords, category_ids: []` — `:plan` is not in the permitted list, so a plan-change attempt is silently ignored (verified below) rather than erroring, and the new settings page links out to the existing `/tenants/:id/plan/edit` for upgrades.

**No tenant-switcher** — consistent with the earlier decision (single-tenant-per-user in practice).

**Real gap found and fixed (in the new code's own path, not retrofitted onto legacy):** the legacy `StatusesController#destroy` has no server-side guard at all — the UI only *hides* the delete button when a status has products or `can_be_deleted: false`, but a direct `DELETE` request would happily remove it, including the hardcoded "Received" default that `Product#initialize_status` looks up by name for every new product. `Api::V1::StatusesController#destroy` now enforces `can_be_deleted? && status_products(current_user).none?` server-side, returning `422` otherwise. Verified live (see below) — deleting "Received" is correctly refused, deleting a fresh custom status succeeds.

**What was built:**
- `Api::V1::StatusesController` extended from Phase 3's read-only `index` to full CRUD (`create`/`update`/`destroy`) plus `GET .../statuses/:id/products` (the "status board" filter view, reusing `Status#status_products(user)`), admin-gated the same way as legacy (`verify_user` except `index`/`products`).
- `Api::V1::TenantsController#show`/`#update` — profile fields only (see scope cut above). Uses its own `verify_current_tenant` check rather than the inherited `verify_tenant`, since that helper compares `params[:tenant_id]` and this is a top-level (non-nested) resource keyed on `params[:id]` — reusing `verify_tenant` here would have silently 403'd every request.
- `Api::V1::CategoriesController#index` — read-only, `?entity=` filter.
- Refactored `product_json`/`status_json`/`estimate_json`/`pagination_meta` out of `ProductsController` and into `Api::V1::BaseController`, since `StatusesController#products` needed the identical product-list shape — avoids a second copy-paste of that logic. (Caught and fixed a self-inflicted naming collision while doing this: `StatusesController`'s own full status-management JSON shape was briefly also called `status_json`, which would have shadowed the shared embed-shape helper `product_json` calls internally — renamed to `status_admin_json`.)
- React: `StatusesAdminPage` (+ `StatusRow` component: inline edit/delete per status, new-status form), `StatusBoardPage` (tab-per-status filter view), `TenantSettingsPage` (profile + category checkboxes, plan shown read-only with a link to the legacy upgrade page). Extracted `ProductsTable` (table + pagination) out of `ProductsListPage` since `StatusBoardPage` needed the identical rendering — same dedup rationale as the backend JSON helpers.
- `spec/requests/api/v1/{statuses,tenants,categories}_spec.rb` — 19 new/extended cases, including the "Received can't be deleted" and "plan change is ignored" assertions.

**Verified:**
- `npx tsc --noEmit` and `bundle exec vite build` both pass (453 → 460 modules).
- `bundle exec rspec` — 171 examples, same single unrelated pre-existing failure (500-product plan-limit).
- Live end-to-end against the real dev server: signed in as a throwaway admin, listed categories, updated the tenant profile (description/keywords/categories) while attempting a plan change in the same request — confirmed the plan stayed `free`; created a status, confirmed deleting "Received" is refused (`422`) while the status board correctly returns its (empty) product list, then deleted the freshly-created deletable status successfully. Cleaned up all throwaway data (including the test category) afterward.
- Still no real browser/click-through (no Playwright) — same caveat as every phase so far.

Next: Phase 5 (payments, PDFs) — awaiting your go-ahead.

---

## Phase 5 — Done (2026-10-08)

**What stayed untouched, deliberately:** `Payment#process_payment` (the actual `Stripe::Customer.create` / `Stripe::Charge.create` calls) was not modified at all. The client-side change is purely the *collection* method — Stripe Elements (`@stripe/react-stripe-js`'s `CardElement`, loaded via the tenant settings layout's new `stripe-publishable-key` meta tag) replaces the legacy page's raw card-number/cvc/expiry text fields, calling `stripe.createToken()` to get a `tok_...` string exactly like the old Stripe.js v2 flow did — the server still just receives a token and forwards it unchanged into the same `Payment` model. This keeps the one piece of code that moves real money completely out of the diff.

**`Api::V1::TenantsController#upgrade`** mirrors the legacy `TenantsController#update` plan-change branch call-for-call: tentatively set `plan = 'premium'`, attempt `Payment#process_payment`, and on any `StandardError` destroy the payment and revert the plan back to `free` — all inside `Tenant.transaction do...end`, same as legacy (which also doesn't rely on `ActiveRecord::Rollback`, just manually unwinds state, so I matched that rather than "improving" it into a stricter transaction). Guards: refuses to run at all if the tenant isn't still on `free` (`already_upgraded`), and `verify_user` keeps it admin-only like legacy's `edit`/`update`.

**PDF**: no new endpoint — `ProductDetailPage` now links straight to the existing `/tenants/:tenant_id/products/:id.pdf` route (wicked_pdf, unchanged), same as the legacy "download" icon.

**Verified, including a real (if unintentional) end-to-end failure-path test:** this sandbox has no `STRIPE_TEST_SECRET_KEY` configured, so hitting `/api/v1/tenants/:id/upgrade` against the real dev server made an actual (unauthenticated) call to the real `Payment#process_payment` path, which raised a genuine `Stripe::AuthenticationError` — caught by the `rescue StandardError`, which destroyed the payment record and reverted the tenant's plan back to `free`, confirmed via a follow-up `GET`. That's stronger evidence than a stub that the revert-on-failure control flow is wired correctly end-to-end, not just syntactically present. The success path (and the "already premium" / non-admin-forbidden guards) are covered by `spec/requests/api/v1/tenants_spec.rb`, which stubs `Payment#process_payment` — I did not acquire or use real Stripe test credentials, and won't; if you want a fully live successful-charge test, that needs your own Stripe test-mode keys set as `STRIPE_TEST_PUBLISHABLE_KEY`/`STRIPE_TEST_SECRET_KEY`.
- `npx tsc --noEmit` and `bundle exec vite build` both pass (460 → 465 modules; Vite now also warns the main JS chunk is over 500kB after adding Stripe.js — not fixed here, a legitimate code-splitting opportunity better suited to Phase 6 polish than blocking this phase).
- `bundle exec rspec` — 175 examples (4 new upgrade cases), same single unrelated pre-existing failure.
- Confirmed PDF download works unchanged via the real dev server.

**Not done — correctly out of scope:** this phase's own stated boundary was payments + PDFs, both done. Full Stripe Elements styling/placeholder customization, webhook handling, and subscription billing (the legacy integration is a one-off `Stripe::Charge`, not a recurring subscription, despite "upgrade to premium" sounding recurring) are not part of this app today and weren't introduced.

Next: Phase 6 (cutover & cleanup) — awaiting your go-ahead.


