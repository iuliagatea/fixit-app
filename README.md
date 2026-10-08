A Rails 7.2 SaaS application that enables service providers (businesses) to manage and showcase their products/services with Stripe payments integration. Built with PostgreSQL, Devise authentication, and multi-tenant architecture using thread-local tenant context. Currently migrating incrementally to a React + TypeScript frontend (served from Rails via Vite) backed by a versioned JSON API, alongside the existing server-rendered pages — see `plan/migration_to_react.md`.

* **Framework** — Ruby on Rails 7.2.3.1
* **Database** — PostgreSQL with pg_search for full-text search
* **Authentication** — Devise with email confirmation
* **Payments** — Stripe (production ready)
* **Background Jobs** — Sidekiq (`app/sidekiq/`)
* **Legacy Frontend** — Bootstrap 5, jQuery, Turbo (server-rendered ERB views, kept indefinitely)
* **New Frontend** — React 19 + TypeScript, built with Vite (`vite_rails`), mounted at `/app`; React Router, TanStack Query, react-hook-form + yup, react-bootstrap, Stripe Elements for payment collection. See `plan/migration_to_react.md` for the full migration plan and phase-by-phase log.
* **API** — Versioned JSON API under `/api/v1/*` (sessions, tenants, products, statuses, categories), backing the React frontend
* **PDF** — WickedPDF with wkhtmltopdf
* **Testing** — RSpec 3.13, FactoryBot, Shoulda Matchers (Rails); Jest + React Testing Library (frontend)
* **Code Quality** — Rubocop, Rubocop-Rails, Rubocop-RSpec
  
---

### Core Features

* **Multi-Tenant Architecture** — Isolated business accounts with role-based access control
* **Product Management** — Create, track, and manage service products with statuses, estimates, and PDF generation
* **Customer Workflows** — Assign products to customers with status tracking (Received → In Progress → Completed → Canceled → Waiting)
* **Smart Estimates** — Build itemized cost estimates with automatic value calculations
* **Payment Processing** — Stripe-powered upgrade from free (500 products max) to premium tier
* **Full-Text Search** — Find service providers by name, description, keywords, and categories
* **Rating System** — Customer star ratings with seems_rateable gem integration
* **Email Notifications** — Async status updates and product cards via Sidekiq
* **Audit Logging** — Track product changes and status transitions

---

### Quick Start

1. **Setup Environment**
   bin/setup              # Install gems, create DB, seed data
   yarn install           # Install JS deps (esbuild/sass pipeline + the React/Vite frontend)

2. **Run Application**
   bin/dev               # Start everything via Procfile.dev: Rails server, css watcher, esbuild watch, and `vite dev` (React frontend)
   rails server          # Start Rails server (default: http://localhost:3000)
   redis-server          # Start Redis for Sidekiq (in separate terminal)
   pg_ctl -D /usr/local/var/postgres start  # Start PostgreSQL locally (if not using Docker)

   Legacy server-rendered pages are at their usual URLs; the React frontend is at `/app` (e.g. `/app/products`), calling the `/api/v1/*` JSON API.

3. **Run Tests**
   bundle exec rspec     # Full Rails test suite (models, request specs for /api/v1, etc.)
   bundle exec rspec spec/controllers/products_controller_spec.rb  # Specific file
   yarn test             # Frontend Jest/React Testing Library suite

4. **Database**
   bin/rails db:create   # Create database
   bin/rails db:migrate  # Run pending migrations
   bin/rails db:seed     # Seed sample data

6. **Debbugging**
   Use `rails console` to interact with models and test tenant scoping:
   ```ruby
   tenant = Tenant.first
   user = tenant.users.first
   Tenant.set_current_tenant(user)
   Product.all # Should return products scoped to tenant
   ```

   Use `byebug` in controllers/services to step through code during requests.

---

### Architecture Highlights

**Multi-Tenancy Pattern:**
- Tenant context set per-request via `ApplicationController#authenticate_tenant!`
- Stored in `Thread.current[:tenant_id]` and scoped globally via `Tenant.set_current_tenant(user)`
- Models include `Tenantable` concern for automatic tenant filtering

**Authorization:**
- Pundit policies (ProductPolicy, StatusPolicy) for declarative authorization
- Filters: `verify_admin`, `verify_tenant`, `verify_user`, `must_be_customer`
- Default scope on Tenant excludes child tenants: `where("#{table_name}.tenant_id IS NULL")`

**Key Models:**
- **User** — Devise-authenticated, can belong to multiple tenants via HABTM
- **Tenant** — Service provider business account with products/estimates/reviews
- **Product** — Service/product with status workflow and cost estimates
- **Status** — Workflow state (auto-created per tenant: Received, In Progress, Completed, Canceled, Waiting)
- **Estimate** — Line items for product pricing (quantity × price)
- **Member** — Tenant user profile (first_name, last_name)
- **Payment** — Stripe integration for plan upgrades

---

### Deployment

**Environment Variables (set in production):**
  STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
  STRIPE_TEST_SECRET_KEY=sk_test_...
  DATABASE_URL=postgres://user:pass@host/dbname
  RAILS_MASTER_KEY=<your-key>

**Procfile (Heroku/similar platforms):**
  web: bundle exec puma -t 5:5 -w 3 -b unix:///tmp/puma.sock
  worker: bundle exec sidekiq -c 5 -v

**Rails Console:**
  bin/rails console production

---

### File Structure

| File | Purpose |
|------|---------|
|   app/models/             | Domain logic (Product, Tenant, User, etc.)
|   app/controllers/        | Legacy request handlers (ProductsController, TenantsController)
|   app/controllers/api/v1/ | JSON API controllers backing the React frontend
|   app/services/           | Business logic encapsulation (Products::CreateService, etc.)
|   app/sidekiq/            | Background jobs (Products::CardEmailJob, etc.)
|   app/mailers/            | Email templates (UserNotifier)
|   app/views/              | ERB templates organized by controller (legacy pages)
|   app/frontend/           | React + TypeScript frontend (Vite), mounted at `/app`
|   spec/models/            | Model unit tests
|   spec/controllers/       | Legacy controller integration tests
|   spec/requests/api/v1/   | Request specs for the JSON API
|   spec/factories/         | FactoryBot factories for test data
|   spec/support/           | Shared examples, helpers
|   config/initializers/    | Stripe, Devise, Seemsrateable, etc.
|   config/environments/    | Environment-specific config
|   config/routes.rb        | REST routing (legacy + `/api/v1/*` + `/app` SPA shell)
|   plan/migration_to_react.md | React migration plan and phase-by-phase implementation log

---

### Contributing Guidelines

1. Write tests first (RSpec)
2. Follow Rubocop conventions (run: `rubocop`)
3. Use services for complex business logic
4. Use background jobs for email/heavy operations
5. Include migrations for schema changes

---

### Known Limitations

- Thread-local tenant context works for single-threaded servers; migrate to RequestStore for Thread.new operations
- Free plan limited to 500 products (hard limit enforced)
- Stripe keys stored as ENV vars; consider secrets manager for production
- React migration is incremental: only sign-in/sign-up-stub, products, statuses, tenant settings, and plan upgrade have React pages so far; everything else (reviews, search, contact, category admin) is still legacy-only. See `plan/migration_to_react.md` for what's done and what's intentionally out of scope.
- No E2E (Playwright/Cypress) coverage yet — deferred to avoid installing a browser toolchain without being asked; current coverage is request specs (Rails) + Jest/RTL (React)
