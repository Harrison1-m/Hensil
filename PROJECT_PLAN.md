# Hensil Studio - Project Plan & Execution Roadmap

This document serves as the persistent source of truth for the Hensil creative photography and media production studio web application project. It outlines completed milestones, current progress, and upcoming implementation stages.

---

## Project Status Overview

- **Stage 1 — Database Schema & Initialization:** COMPLETED
- **Stage 2 — Environment Configuration:** COMPLETED
- **Stage 3 — Frontend API Configuration & Flexibility:** COMPLETED
- **Stage 4 — Admin Real-Time Events / Polling:** COMPLETED
- **Stage 5 — Automated Testing & Validation:** COMPLETED
- **Stage 6 — Production Deployment & Runtime Validation:** COMPLETED (HTTPS via IP certificate 2026-10-11; domain pending)
- **Stage 7 — Split Hosting: Frontend on GitHub Pages, Backend on VPS:** IN PROGRESS

---

## Stage Details & Roadmap

### Stage 1 — Database Schema & Initialization (COMPLETED)
- **Objective:** Establish the persistent PostgreSQL database schema and connection pool configuration for storing client bookings and inquiries.
- **Requirements:**
  - Create the `bookings` table with fields: `id`, `name`, `email`, `phone`, `service`, `booking_date`, `message`, `status` (default 'pending'), and `created_at`.
  - Add indexes for performance optimization (`idx_bookings_status`, `idx_bookings_created_at`, `idx_bookings_booking_date`).
  - Configure PostgreSQL connection pool (`back/src/db.js`) using environment variables.
- **Files Involved:**
  - `back/schema.sql`
  - `back/src/db.js`
- **Verification Criteria:**
  - Successful execution of `schema.sql` against a PostgreSQL instance.
  - Successful connection pool initialization without connection errors.

### Stage 2 — Environment Configuration (COMPLETED)
- **Objective:** Securely manage backend environment variables, server port settings, database credentials, and admin tokens.
- **Requirements:**
  - Provide `.env.example` template with required configuration keys (`PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `ADMIN_TOKEN`).
  - Utilize `dotenv` in `back/src/server.js` to load configuration into `process.env`.
  - Secure admin authorization using timing-safe token comparison (`back/src/middleware/adminAuth.js`).
- **Files Involved:**
  - `back/.env.example`
  - `back/src/server.js`
  - `back/src/middleware/adminAuth.js`
- **Verification Criteria:**
  - Environment variables load correctly upon server startup.
  - Protected API routes correctly validate `Authorization: Bearer <token>` requests using constant-time string comparison.

### Stage 3 — Frontend API Configuration & Flexibility (COMPLETED)
- **Objective:** Configure frontend client scripts (`script.js` and `admin.js`) to communicate with the backend REST API endpoints (`/api/contact`, `/api/bookings`) with flexibility across production and local environments.
- **Requirements:**
  - Replace hardcoded API base URLs with dynamic host detection (`localhost`/`127.0.0.1` vs production relative `/api`).
  - Ensure form submission feedback and admin dashboard rendering handle network errors and responses gracefully.
- **Files Involved:**
  - `script.js`
  - `admin.js`
  - `admin.html`
- **Verification Criteria:**
  - Client contact form and admin dashboard correctly resolve API base URLs dynamically based on current window hostname.

### Stage 4 — Admin Real-Time Events / Polling (COMPLETED)
- **Objective:** Implement and verify real-time updates for the admin dashboard when new bookings or inquiries arrive.
- **Requirements:**
  - Review Server-Sent Events (SSE) notification setup (`back/src/notifications.js`, `back/src/server.js`).
  - Configure admin client connection to receive live SSE events or robust authenticated polling intervals.
  - Test live dashboard updates upon new client submissions.
- **Files Involved:**
  - `back/src/notifications.js`
  - `back/src/server.js`
  - `admin.js`
- **Verification Criteria:**
  - Admin dashboard automatically polls and syncs booking updates every 30 seconds using authenticated requests.

### Stage 5 — Automated Testing & Validation (COMPLETED)
- **Objective:** Add unit and integration tests for backend API routes and database interactions.
- **Requirements:**
  - Configure test runner (`node --test`) in `back/package.json`.
  - Write test suites for `/api/contact`, `/api/bookings`, health check, and authentication middleware.
  - Validate security, authentication middleware, and input validation without requiring a production database.
- **Files Involved:**
  - `back/package.json`
  - `back/test/api.test.js`
  - `back/src/server.js`
- **Verification Criteria:**
  - All 8 automated test suites execute and pass successfully via `npm test`.

### Stage 6 — Production Deployment & Runtime Validation (COMPLETED - Pending Domain & HTTPS)
- **Objective:** Deploy the Hensil web application and backend REST API to a production server environment with robust database persistence, reverse proxy, process management, and runtime verification. Note: HTTPS and custom domain configuration remain pending as no production domain has been configured yet.
- **Detailed Deployment Checklist & Status:**
  1. **PostgreSQL Installation/Configuration:** COMPLETED (PostgreSQL installed and running on target host).
  2. **Hensil Database & User Creation:** COMPLETED (Dedicated production database and secure user created).
  3. **Applying Schema:** COMPLETED (`schema.sql` applied successfully to initialize `bookings` table and indexes).
  4. **Production `.env` Configuration:** COMPLETED (Configured with production DB credentials and secure `ADMIN_TOKEN`).
  5. **Strong `ADMIN_TOKEN` Generation:** COMPLETED (Cryptographically secure admin token configured).
  6. **Backend Dependency Installation:** COMPLETED (Dependencies installed in `back/`).
  7. **Starting Express Backend with PM2:** COMPLETED (Managed via PM2 `hensil` process, auto-restarting).
  8. **Backend Health Verification:** COMPLETED (`GET /api/health` returns `200 OK`).
  9. **Real Database Booking Verification:** COMPLETED (Inquiries and bookings successfully persist and retrieve from PostgreSQL).
  10. **Nginx Reverse Proxy Configuration:** COMPLETED (Configured in `/etc/nginx/sites-available/hensil`, proxying `/api` to `127.0.0.1:5000` and serving static frontend from `/var/www/hensil`).
  11. **Frontend / API Production Routing:** COMPLETED (`script.js` and `admin.js` configured to use `/api` in production).
  12. **Backend Localhost-Only Binding:** COMPLETED (`app.listen` bound strictly to `127.0.0.1:5000` for security).
  13. **HTTPS / Domain Configuration:** HTTPS COMPLETED 2026-10-11 via a Let's Encrypt IP-address certificate (https://178.162.254.195, HTTP redirects; 6-day cert auto-renewed by `certbot-renew.timer`; details in `~/ops/https/README.md`). Custom domain still PENDING (user decided not to buy one yet).
  14. **Final Live Application Test:** COMPLETED (Frontend and API endpoints verified responding with HTTP 200).
  15. **Final `npm test` Execution:** COMPLETED (All automated test suites passing).
  16. **Git Commit & GitHub Push:** PENDING (Final step remaining).
- **Rollback & Safety Considerations:**
  - Keep database backups before applying migrations or updates.
  - Never expose database ports publicly; bind PostgreSQL and Node backend strictly to `localhost` (`127.0.0.1`).
  - `ADMIN_TOKEN` is now transmitted over HTTPS (IP certificate, 2026-10-11).
- **Files Involved:**
  - `back/schema.sql`
  - `back/.env.example`
  - `back/src/`
  - `script.js`
  - `admin.js`
  - `/etc/nginx/sites-available/hensil`
  - `/var/www/hensil/`
- **Verification Criteria:**
  - All production deployment steps (database, Nginx, PM2, API routing, localhost backend binding, health checks) successfully completed and verified. HTTPS/domain setup is pending domain procurement.

### Stage 7 — Split Hosting: Frontend on GitHub Pages, Backend on VPS (IN PROGRESS)
- **Objective:** Serve the public frontend from GitHub Pages and keep the API, database and admin data on the VPS.
- **Decision (2026-10-11, owner's request):**
  - Frontend: https://harrison1-m.github.io/Hensil/ (GitHub Pages, built from `main` branch root). Deploy = push to `main`.
  - Backend: https://178.162.254.195/api (nginx HTTPS -> pm2 `hensil` on 127.0.0.1:5000), PostgreSQL on the VPS.
  - `script.js` / `admin.js` call `https://178.162.254.195/api` cross-origin (localhost still uses `http://localhost:5000/api`).
    The API address lives in those two files; change both when a domain is bought.
  - CORS allows `https://harrison1-m.github.io` (+ localhost:8001 for development). Preflight allows the admin `Authorization` header.
  - The VPS stops serving its own copy of the frontend: `/` redirects (302) to GitHub Pages, so there is one canonical site.
    302 rather than 301 so browsers don't cache it permanently (reversible if the site moves back or to a domain).
- **Backend refactor:** the Express app moved to `back/src/app.js` (exported); `back/src/server.js` only listens. This also fixed
  the test suite, which required `src/server` as an app and had been broken since the Stage 6 localhost-binding change.
- **Known risks:**
  - The API certificate is a 6-day IP certificate; if renewal fails, the GitHub Pages site cannot reach the API (browser TLS error).
  - The repository is public, so GitHub Pages also serves `back/` source files (no secrets are committed; `.env` is git-ignored).
  - pm2 runs the backend directly from this git working tree: checking out another branch changes what runs on the next restart.
  - `/api/contact` is public with no rate limiting (unchanged by this stage; candidate follow-up).
- **Verification Criteria:**
  - `npm test` passes (11 tests, including CORS tests for the Pages origin).
  - A booking submitted on the GitHub Pages site is stored in PostgreSQL; the admin page on Pages can list/update bookings.
  - http(s)://178.162.254.195/ redirects to GitHub Pages; /api keeps working.

---

## Changelog

- **2026-10-03:** Initialized project structure, PostgreSQL database schema (`schema.sql`), Express backend (`server.js`, `db.js`, routes for contact and bookings), admin authentication middleware, and frontend client/admin scripts (`script.js`, `admin.js`). Created `PROJECT_PLAN.md`.
- **2026-10-03:** Completed Stage 3 (Frontend API Configuration & Flexibility) by implementing dynamic host-based API URL resolution in `script.js` and `admin.js`.
- **2026-10-03:** Completed Stage 4 (Admin Real-Time Events / Polling) by verifying authenticated polling and SSE backend notification structures.
- **2026-10-03:** Completed Stage 5 (Automated Testing & Validation) by implementing test runner configuration in `back/package.json`, creating comprehensive automated test suite (`back/test/api.test.js`), updating `README.md`, and successfully executing `npm test` (all 8 tests passed). *(2026-10-11 note: the suite was later found broken after Stage 6 changed `server.js` to listen instead of exporting the app; fixed in Stage 7.)*
- **2026-10-03:** Completed Stage 6 (Production Deployment & Runtime Validation) including Nginx reverse proxy configuration, frontend static asset deployment to `/var/www/hensil`, production `/api` routing update in `script.js` and `admin.js`, backend localhost-only binding (`127.0.0.1:5000`) in `back/src/server.js`, PM2 process management, and live health/frontend verification. Note: HTTPS and custom domain configuration remain pending.
- **2026-10-11:** HTTPS enabled without a domain: Let's Encrypt IP-address certificate (shortlived profile, 6-day validity) via certbot 5.8.0 (/opt/certbot), nginx serves the site on :443 with HTTP->HTTPS redirect, adds `X-Forwarded-Proto` to `/api` and basic security headers. Renewal: systemd `certbot-renew.timer` every 6h. Custom domain remains pending; switching later only needs new server_name/cert paths.
- **2026-10-11:** Stage 7 started: frontend moved to GitHub Pages, API called cross-origin at https://178.162.254.195/api; backend split into `app.js` + `server.js`; test suite repaired and CORS tests added (11/11 passing).

---

## Next Action

Finish Stage 7: verify a real booking from the GitHub Pages site end-to-end, then redirect the VPS root to GitHub Pages (nginx, needs sudo).
