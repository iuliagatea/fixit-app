# AGENTS.md

AI coding agent guide for the Service/FixIt Rails application - a multi-tenant service directory and product management platform with Stripe payments integration.

The app is in the middle of an incremental migration to a React + TypeScript frontend (see `plan/migration_to_react.md` for the full plan and phase-by-phase log). The legacy server-rendered app described throughout this file is untouched and still the primary surface for anything not explicitly listed in **React Frontend & API Layer** below.

## Architecture Overview

**Multi-Tenant SaaS with Thread-Local Tenant Context:**
- Tenants are service providers (businesses) that list products/services
- Users can be members of multiple tenants (many-to-many relationship)
- **Critical pattern**: Current tenant is set in `Thread.current[:tenant_id]` by `ApplicationController#authenticate_tenant!` on every request
  - Set via `Tenant.set_current_tenant(current_user)` using user's first tenant
  - Used implicitly throughout codebase (avoid bypassing this pattern)
- Default scope on Tenant model filters out child tenants: `default_scope { where("#{table_name}.tenant_id IS NULL") }`
- Plan-based feature restrictions: free tier limited to 500 products (`Product#free_plan_can_only_have_500_products`)

**Core Data Model:**
- **User** (Devise): has_many products, has_and_belongs_to_many tenants, has_one member
- **Tenant**: has_many products/users/statuses/estimates/reviews, has_many categories (through join)
- **Product**: belongs_to tenant/user, has_many statuses (through product_statuses), has_many estimates
- **Status**: workflow states (Received, In progress, Completed, Canceled, Waiting) auto-created per tenant with colors
- **Estimate**: price/quantity line items for products (calculates product estimated_value)
- **Member**: tenant user profile (first_name, last_name) - admin created by `Member.create_org_admin(user)`
- **Review**: user ratings of tenants (integrated with seems_rateable gem for star ratings)
- **Payment**: `belongs_to :tenant` (has_one on Tenant); created on premium upgrade via `Payment#process_payment` (Stripe)

## Developer Workflows

**Local Development:**
```bash
bin/setup              # One-time: install gems, db:setup, clear logs/tmp
yarn install            # One-time: JS deps (legacy esbuild/sass pipeline + React/Vite frontend)
bin/dev                # Daily: runs Procfile.dev via foreman - web (Rails), css (sass watch), js (esbuild watch), vite (React frontend dev server)
bundle exec rspec      # Rails test suite (RSpec + FactoryBot + Shoulda matchers)
yarn test              # Frontend test suite (Jest + React Testing Library)
bin/rails db:migrate   # After editing migrations
```

**Database & Schema:**
- PostgreSQL with pg_search for full-text search on Tenant (searches: name, description, keywords, associated categories)
- Key tables: users, tenants, products, statuses, product_statuses (join table), estimates, members, payments, reviews, seems_rateable_rates
- Migrations under `db/migrate/` - always run new migrations before testing

**Testing Setup:**
- `spec/rails_helper.rb`: includes FactoryBot, Devise test helpers, controller helpers
- Use factories from `spec/factories/*.rb` (tenant.rb provides :free/:premium traits)
- Transactional fixtures enabled: tests wrapped in DB transactions (fast, isolated)
- Pattern: `config.include ControllerHelpers, :type => :controller` for shared controller test utilities

## Routing & HTTP Patterns

**Nested Resource Structure** (`config/routes.rb`):
- Public routes: search, contact form, pages#about (skip `authenticate_tenant!`)
- Authenticated routes use thread-local tenant context via `verify_tenant` filter
- Deeply nested: `/tenants/:tenant_id/statuses/:status_id/products`
- Custom actions: `tenants/:id/rate` (PUT), `products/send_product_card` (GET), `tenant_member_products#index`
- Devise custom controllers override: registrations, confirmations (tenant signup flow in `Tenant.tenant_signup`)
- `/api/v1/*`: JSON API backing the React frontend (sessions, nested `tenants/:tenant_id/{products,statuses}`, top-level `tenants/:id`, `categories`). `/app` and `/app/*path`: catch-all serving the React SPA shell (`SpaController`), with React Router owning client-side routing from there.

## React Frontend & API Layer

The React frontend lives entirely under its own `/app` URL prefix - it does **not** replace or redirect any legacy URL. Legacy pages and the SPA coexist permanently (not a staged cutover); see `plan/migration_to_react.md` for the reasoning and the full per-phase log.

**Auth**: Devise cookie sessions, shared with the legacy app. `Api::V1::SessionsController` (`POST /api/v1/sign_in`, `DELETE /api/v1/sign_out`, `GET /api/v1/me`) wraps the same `User`/`Tenant` auth as `ApplicationController#authenticate_tenant!`. The frontend reads the CSRF token from a `<meta name="csrf-token">` tag (same pattern as Rails' own `csrf_meta_tags`) and a Stripe publishable key from `<meta name="stripe-publishable-key">`, both rendered by the `spa` layout.

**API conventions** (`Api::V1::BaseController`):
- JSON error shape: `{ error: { message, code } }`
- Re-registers `rescue_from ActiveRecord::RecordNotFound` - `ApplicationController` registers it *before* `rescue_from StandardError`, and Rails matches `rescue_from` in reverse-registration order, so inherited it's dead code (caught by the generic 500 handler instead). Any new `Api::V1::*` controller gets the fix for free via inheritance; do not "fix" this in `ApplicationController` itself - the legacy app's existing behavior there is unrelated and out of scope.
- Shared JSON builders (`product_json`, `status_json`, `estimate_json`, `pagination_meta`) live here, not duplicated per-controller - reuse them.
- Authorization reuses the legacy filters (`verify_user`, `verify_tenant`) where the param shape matches. **Exception**: the top-level `tenants/:id` resource is *not* nested, so `verify_tenant` (which checks `params[:tenant_id]`) doesn't apply - `Api::V1::TenantsController` has its own `verify_current_tenant` instead. Don't reuse `verify_tenant` on a non-nested resource; it will silently 403 every request.

**Plan/payment**: `Api::V1::TenantsController#update` never accepts `:plan` - only `#upgrade` can change it, mirroring the legacy `TenantsController#update` plan-change branch call-for-call (tentative `plan = 'premium'` → `Payment#process_payment` → revert + destroy payment on any `StandardError`, all inside `Tenant.transaction`). `Payment#process_payment` itself is untouched; the frontend only ever collects a Stripe token via `@stripe/react-stripe-js`'s `CardElement`.

**Frontend stack**: React 19 + TypeScript, Vite (`vite_rails`), React Router (`basename="/app"`), `@tanstack/react-query` for data fetching, `react-hook-form` + `yup` for forms (`ProductFormFields` is the shared code/name/date/estimates component used by both New and Edit product pages), `react-bootstrap` for UI. Every `react-bootstrap` `Form.Group` with a `Form.Label` + single control **must** have a `controlId` (or the control needs an explicit `id`) - without it the label isn't programmatically associated with the input (a real, previously-shipped a11y bug, fixed project-wide in Phase 6). For a group of several `Form.Check`s under one `Form.Group`, give each its own explicit `id` instead - a shared `controlId` would collide across all of them.

**Testing**: `jest.config.js` + `tsconfig.jest.json` (deliberately separate from the main `tsconfig.json` Vite/`tsc` use - keep it that way) run Jest + React Testing Library (`yarn test`). `typescript` is pinned to `5.9.3` - do not let it float to a `7.x` "TypeScript 7" release; `ts-jest` doesn't support the new native compiler's API yet.

## Key Patterns & Conventions

**Authorization Filters** (app/controllers/application_controller.rb):
- `verify_admin`: checks `current_user.is_admin`
- `verify_tenant`: ensures params[:tenant_id] matches Thread.current[:tenant_id]
- `verify_user`: validates user owns resource (or is admin)
- `must_be_customer`: validates current_user in tenant.users
- Always call these in controllers; never skip authentication on sensitive endpoints

**Query & Pagination:**
- Pagination helper: `paginate(resource, page, per_page=10)` returns will_paginate result
- Search: `TenantSearch.new(params).search` - uses pg_search and sorts by rating/name
- Products visible by role: admins see all; members see only their own via `ApplicationController#products` helper

**Tenant Signup Flow** (in Devise registrations override):
1. `Tenant.create_new_tenant(tenant_params)` sets Thread.current[:tenant_id], creates default statuses
2. `Member.create_org_admin(user)` creates member profile with DEFAULT_ADMIN name
3. Callback hook: `Tenant.tenant_signup(user, tenant, other)` for post-signup logic

**Payment Integration** (Stripe):
- Configured in `config/initializers/stripe.rb` (uses ENV vars: STRIPE_TEST_PUBLISHABLE_KEY, STRIPE_TEST_SECRET_KEY)
- Payment model: `Payment#process_payment` called in tenant update when upgrading to premium
- If payment fails: tenant reverted to 'free' plan, payment deleted, error flashed
- Pattern: wrap payment logic in `Tenant.transaction` to rollback on failure

**Logger Usage:**
- App logs to `application.log` (rotated at 100MB, 0 backup files) via `config/application.rb`
- Convention: prefix debug logs with ">>>>>" for agent-visibility (e.g., `logger.debug(">>>>>  #{action}")`)

## External Dependencies & Integration

**Critical Gems:**
- `devise`: auth + confirmable emails + password recovery
- `pg_search`: full-text search on Tenant model
- `seems_rateable`: star rating system for tenants (routes: `seems_rateable`)
- `stripe`: payment processing (legacy `Payment#process_payment`, untouched by the React migration - the new frontend only collects a token via Stripe Elements)
- `sidekiq`: background jobs, defined under `app/sidekiq/` (not `app/jobs/`) - e.g. `Products::CardEmailJob`, `Products::CreatedNotificationJob`, `Tenants::ContactJob`
- `cocoon`: dynamic nested forms (estimates in products, legacy views only)
- `chartkick + groupdate`: charts/analytics
- `wicked_pdf + wkhtmltopdf-binary`: PDF generation
- `twitter-bootstrap-rails`: CSS frameworks (legacy views)
- `vite_rails`: serves the React/TypeScript frontend under `app/frontend/`

**Asset Pipeline (legacy views):**
- Sprockets 3.0+ serving `jsbundling-rails`/`esbuild` and `cssbundling-rails`/`sass` build output (not dartsass-rails - that gem isn't installed)
- JS via jQuery/CoffeeScript, built by `yarn build` (esbuild)
- The React frontend (`app/frontend/`) is built separately by Vite (`vite_rails`) and does not go through Sprockets; see **React Frontend & API Layer** below

## File Navigation Essentials

- **Models** (`app/models/`): core domain logic; User/Tenant/Product most frequently edited
- **Controllers** (`app/controllers/`): ApplicationController is auth/tenant base; tenant/product/estimate controllers handle main flows (legacy, server-rendered)
- **API Controllers** (`app/controllers/api/v1/`): `Api::V1::BaseController` is the JSON equivalent of `ApplicationController` (shared JSON error rendering + `product_json`/`status_json`/`estimate_json`/`pagination_meta` helpers); `Sessions`, `Products`, `Statuses`, `Tenants`, `Categories` controllers back the React frontend. `StatusesController`'s own `status_admin_json` (full status management shape: `is_active`/`can_be_deleted`) is deliberately named differently from the inherited `status_json` (minimal embed shape used inside `product_json`) - don't rename either without checking both still resolve correctly.
- **Services** (`app/services/`): `Products::CreateService`/`UpdateService`, `Tenants::CreateService`/`SearchService` - extend for complex business logic; reused as-is by both legacy and API controllers
- **Background jobs** (`app/sidekiq/`): `Products::CardEmailJob`, `Products::CreatedNotificationJob`, `Products::UpdatedNotificationJob`, `Tenants::ContactJob` - Sidekiq workers, not ActiveJob
- **Mailers** (`app/mailers/`): UserNotifier sends contact form emails
- **Views** (`app/views/`): organized by controller; layouts/common for shared partials (legacy pages only)
- **React frontend** (`app/frontend/`): Vite + TypeScript + React 19, mounted at `/app` via `SpaController`/`spa` layout. `entrypoints/application.tsx` is the entry; `src/pages/` + `src/components/` + `src/api/` (one file per backend resource, e.g. `api/products.ts`) + `src/context/AuthContext.tsx` (current user/tenant, `/api/v1/me`). React Router's `basename` is `/app`, so routes are defined without the prefix (e.g. `/products`, not `/app/products`)

## Common Gotchas

1. **Always respect Thread.current[:tenant_id]**: Don't query tenants without verifying context
2. **Fixture transaction safety**: If modifying fixtures, ensure factory dependencies match schema
3. **Nested form attributes**: `accepts_nested_attributes_for` on Product for estimates (+ cocoon gem)
4. **CSRF protection**: `protect_from_forgery with: :exception` on ApplicationController
5. **Before-action ordering**: authenticate_tenant! must run before tenant-dependent filters
6. **Email configuration**: Devise mailer sender is 'do-not-reply@fixit.com' (update in devise.rb if needed)
7. **`has_many ..., dependent: :destroy` runs in declaration order**: on `Tenant`, `products` must be destroyed before `statuses` (products' `product_statuses` rows reference statuses; destroying a status first raises `PG::ForeignKeyViolation`). If you add a new `Tenant` association with cascading deletes, think about what it depends on and declare it in the right order - don't just alphabetize.
8. **`Product#transition_to_status!`**: its guard checks `product_statuses.exists?(status_id:)`, not `current_status_id` - the latter is only set by `ProductStatus`'s `after_create_commit` hook, which hasn't fired yet if you're calling `transition_to_status!` inside the same transaction as the product's own creation (e.g. `Products::CreateService`). Don't revert this to a `current_status_id` check.

