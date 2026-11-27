# StaySphere — 3D PG Accommodation & Management Platform

[![CI Pipeline](https://github.com/staysphere/staysphere/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](tsconfig.json)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20Prisma-336791.svg)](https://prisma.io/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20Verified-0c2340.svg)](https://razorpay.com/)

StaySphere is a production-grade Paying Guest (PG) Accommodation Discovery, 360° Virtual Tour, Bed Reservation, and Coliving Property Management Platform built with modern web technologies, strict security, and real external integrations.

---

## 🌟 Key Highlights & Capabilities

1. **WebGL 360° Panorama Virtual Tours**
   - High-fidelity spherical panorama viewer powered by Three.js.
   - Interactive hotspots indicating room orientation, window light, cupboards, and attached washrooms.
   - Eliminates blind visits and false advertisements.

2. **Specific Bed & Room Allocation (Zero Double-Booking)**
   - Interactive visual room-tier selector (Single, Double, Triple sharing).
   - Real-time bed occupancy status (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`).
   - Transactional isolation preventing double reservations.

3. **Google Maps Distance Matrix & Route Commute**
   - Live commute calculator (`How far from me?`) utilizing client geolocation.
   - Computes driving and walking distance (km) and estimated travel duration (minutes).
   - One-click navigation link opening Google Maps route to the PG address.

4. **Production-Ready Razorpay Integration**
   - Complete checkout modal flow for Token Advance (₹2,000), Security Deposit, and Monthly Rent.
   - Server-side cryptographic HMAC-SHA256 signature verification.
   - Webhook endpoint (`/api/payments/webhook`) handling async capture, refunds, and failures.

5. **Tenant & Owner Portals**
   - **Tenant Dashboard**: View active stay details, upcoming rent schedule, 1-click Razorpay rent payment, payment history, and raise maintenance tickets with photo uploads.
   - **Super Admin Console**: Responsive operator workspace with a command palette (`Ctrl/Cmd + K`), 7/30/90-day revenue analytics, full property verification queue (approve / reject with owner-visible reasons), resident and owner directory, ticket triage, CSV exports, filtered audit trail, platform settings, and rent-reminder delivery logs.

6. **Automated Rent Reminders & Worker**
   - BullMQ & Redis background worker scanning upcoming, due, and overdue rent schedules.
   - Automated email dispatch via Nodemailer / SMTP with HTML invoice templates.

---

## 📐 Architecture & Project Structure

```
pg/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI (lint, typecheck, test, build)
├── docker/
│   ├── Dockerfile               # Production multi-stage Next.js Dockerfile
│   └── docker-compose.yml       # PostgreSQL, Redis & App container orchestration
├── prisma/
│   ├── schema.prisma            # Production relational database schema
│   └── seed.ts                  # Seed data with Bangalore & Pune PGs, rooms, beds, users
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/           # Super Admin KPIs, approvals & reminder dispatch
│   │   │   ├── auth/            # JWT login, register, me, logout
│   │   │   ├── bookings/        # Bed reservation transactional endpoints
│   │   │   ├── health/          # Kubernetes / uptime probe endpoint
│   │   │   ├── maintenance/     # Tenant issue ticketing API
│   │   │   ├── maps/            # Distance matrix route calculation
│   │   │   ├── payments/        # Razorpay order, verify & webhook handlers
│   │   │   ├── properties/      # PG listings & detailed lookup
│   │   │   ├── rent/            # Tenant dues & payment schedules
│   │   │   ├── reviews/         # Verified resident reviews API
│   │   │   └── virtual-tours/   # 360° panoramas & hotspots API
│   │   ├── admin/               # Admin Management Dashboard
│   │   ├── dashboard/           # Tenant Coliving Portal
│   │   ├── login/               # User authentication
│   │   ├── register/            # Tenant / PG Owner onboarding
│   │   ├── properties/[id]/     # Public PG Details with 3D Tour & Bed Selection
│   │   ├── terms/               # Terms of Service
│   │   ├── privacy/             # Privacy Policy
│   │   ├── refund-policy/       # Refund & Cancellation Policy
│   │   ├── layout.tsx           # Global app layout & navigation
│   │   ├── page.tsx             # Public landing page with filters & featured PGs
│   │   └── globals.css          # Tailwind CSS styles
│   ├── components/
│   │   ├── booking/             # BedSelector & RazorpayCheckoutButton
│   │   ├── layout/              # Navbar & Footer
│   │   ├── maps/                # PGMap & DistanceCalculator
│   │   └── viewer-3d/           # Three.js 360° PanoramaViewer
│   ├── jobs/
│   │   └── rentReminderWorker.ts# BullMQ standalone cron worker
│   └── lib/
│       ├── auth/                # JWT sign, verify & RBAC middleware
│       ├── db/                  # Prisma client instance
│       ├── email/               # Nodemailer SMTP mailer
│       ├── maps/                # Google Maps distance matrix calculation
│       ├── payments/            # Razorpay SDK initialization & signature verify
│       ├── queue/               # BullMQ Redis queue definitions
│       └── validators/          # Zod schema definitions
├── tests/
│   └── unit/
│       ├── distance.test.ts     # Route distance & commute tests
│       ├── payment.test.ts      # HMAC SHA256 payment signature tests
│       └── reminders.test.ts    # Reminder scheduling rules tests
├── .env.example                 # Documented environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**
- **PostgreSQL**: Local instance or Docker container
- **Redis** (optional for dev, required for background queue worker)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://postgres:postgres@localhost:5432/staysphere_db`) |
| `REDIS_URL` | Redis connection URL (`redis://localhost:6379`) |
| `JWT_SECRET` | Secure cryptographic secret key for signing tokens |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID from Dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key for HMAC verification |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks |
| `GOOGLE_MAPS_API_KEY` | Google Cloud API key with Distance Matrix & Maps JavaScript enabled |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | SMTP email credentials for rent reminder dispatch |

### 3. Database Migration & Seeding
Generate Prisma Client and populate the database with realistic sample PG data (properties, rooms, beds, virtual tours, and users):
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npx prisma db push

# Seed initial test accounts, Bangalore & Pune PGs, 3D tours, and beds
npm run prisma:seed
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Demo Accounts (From Seed)

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Super Admin** | `admin@staysphere.in` | `AdminStaySphere2026!#` | `/admin` (Property Approvals, Reminders, Audit Logs) |
| **PG Owner** | `owner1@staysphere.in` | `StaySphere@2026!` | Owner PG Listings & Requests |
| **Tenant** | `tenant1@staysphere.in` | `StaySphere@2026!` | `/dashboard` (Rent Dues, Maintenance, Bed Info) |

*(One-click autofill buttons for these credentials are built right into `/login`)*

---

## 💳 Razorpay Payment & Webhook Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) in **Test Mode**.
2. Navigate to **Account & Settings** → **API Keys** → Generate `Key Id` and `Key Secret`.
3. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to your `.env`.
4. To test webhooks locally:
   - Run a tunnel: `ngrok http 3000`
   - In Razorpay Dashboard → **Webhooks** → Add New Webhook:
     - Webhook URL: `https://<your-ngrok-subdomain>.ngrok-free.app/api/payments/webhook`
     - Secret: Set any random string and mirror it in `.env` as `RAZORPAY_WEBHOOK_SECRET`
     - Active Events: `payment.captured`, `payment.failed`, `refund.processed`

---

## 🧪 Testing & Quality Assurance

Run the automated test suite powered by Vitest:
```bash
# Run unit tests
npm run test

# Run TypeScript strict typecheck
npx tsc --noEmit
```

---

## 🐳 Docker Production Deployment

To run the entire platform (Next.js App + PostgreSQL + Redis) using Docker Compose:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```
The application will be live at `http://localhost:3000`.
#   S t a y - S p h e r e  
 