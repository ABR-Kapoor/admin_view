# AuraSutra Admin Dashboard

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![Port](https://img.shields.io/badge/Port-3003-green)
![License](https://img.shields.io/badge/License-Private-red)

The **Admin Dashboard** is the back-office management console for the **AuraSutra Ayurvedic Healthcare Platform**. It provides a centralized interface for administrators to manage doctors, patients, clinics, appointments, prescriptions, the medicine marketplace, orders, delivery logistics, and financial transactions.

> **IMPORTANT: No authentication is currently implemented.** The dashboard is completely open-access. Kinde Auth (`@kinde-oss/kinde-auth-nextjs`) is listed as a dependency but is not wired into any middleware, route guards, or login pages. **Do not deploy this application to a public-facing environment without implementing proper authentication and authorization.**

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Dashboard Overview](#dashboard-overview)
  - [Statistics and Analytics](#statistics-and-analytics)
  - [Doctors Management](#doctors-management)
  - [Patients Management](#patients-management)
  - [Clinics Management](#clinics-management)
  - [Appointments Management](#appointments-management)
  - [Prescriptions Management](#prescriptions-management)
  - [Marketplace](#marketplace)
  - [Orders Management](#orders-management)
  - [Payments and Finance](#payments-and-finance)
  - [Delivery Agents](#delivery-agents)
  - [CSV Export](#csv-export)
- [API Reference](#api-reference)
- [Reusable Components](#reusable-components)
- [Database Schema](#database-schema)
- [Entity CRUD Pattern](#entity-crud-pattern)
- [TypeScript Interfaces](#typescript-interfaces)
- [Authentication Status](#authentication-status)
- [Scripts](#scripts)

---

## Architecture Overview

```
+-------------------------------------------------------------------+
|                        BROWSER (Port 3003)                        |
+-------------------------------------------------------------------+
|                                                                   |
|   +------------------+    +------------------------------------+  |
|   |     Sidebar      |    |          Main Content Area         |  |
|   |                  |    |                                    |  |
|   |  [Main Menu]     |    |  /dashboard          -> Overview   |  |
|   |   - Dashboard    |    |  /dashboard/analytics -> Charts    |  |
|   |   - Users        |    |  /dashboard/doctors   -> CRUD      |  |
|   |   - Payments     |    |  /dashboard/patients  -> CRUD      |  |
|   |   - Statistics   |    |  /dashboard/clinics   -> CRUD      |  |
|   |                  |    |  /dashboard/appointments -> List   |  |
|   |  [Management]    |    |  /dashboard/prescriptions -> List  |  |
|   |   - Appointments |    |  /dashboard/orders    -> Manage    |  |
|   |   - Prescriptions|    |  /dashboard/marketplace -> Tabbed  |  |
|   |   - Orders       |    |  /dashboard/payments  -> Finance   |  |
|   |   - Marketplace  |    |  /dashboard/delivery-boys -> List  |  |
|   |                  |    |                                    |  |
|   |  [Teams]         |    +------------------------------------+  |
|   |   - Doctors      |                                            |
|   |   - Clinics      |                                            |
|   |   - Delivery     |                                            |
|   +------------------+                                            |
+-------------------------------------------------------------------+
         |                              |
         v                              v
+-------------------+      +-------------------------+
|  Next.js API      |      |   Nhost Storage         |
|  Routes           |      |   (Image Uploads)       |
|  /api/admin/*     |      +-------------------------+
+-------------------+
         |
         v
+-------------------+
|  PostgreSQL       |
|  (Neon Database)  |
|  11 tables        |
+-------------------+
```

### Request Flow

```
Browser (React Client Components)
    |
    |  fetch('/api/admin/...')
    v
Next.js API Route Handlers (app/api/admin/*)
    |
    |  SQL via postgres.js
    v
PostgreSQL (Neon) --- 11 tables
    |
    |  JSON response
    v
Client-side filtering, search, pagination, sorting
    |
    v
DataTable<T> + StatusBadge + Pagination (rendered)
```

---

## Tech Stack

| Category           | Technology                                  | Version   |
|--------------------|---------------------------------------------|-----------|
| Framework          | Next.js (App Router)                        | 16.1.6    |
| UI Library         | React                                       | 19.2.3    |
| Language           | TypeScript                                  | 5.x       |
| Styling            | Tailwind CSS                                | 4.x       |
| Database           | PostgreSQL via Neon                          | --        |
| DB Client          | `postgres` (porsager/postgres)              | 3.4.8     |
| File Storage       | Nhost Storage (S3-compatible)               | 4.5.0     |
| Charts             | Recharts                                    | 3.7.0     |
| Icons              | Lucide React                                | 0.563.0   |
| Notifications      | react-hot-toast                             | 2.6.0     |
| Date Utilities     | date-fns                                    | 4.1.0     |
| Auth (unused)      | Kinde Auth for Next.js                      | 2.11.0    |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn** or **pnpm**
- A **PostgreSQL** database (Neon recommended)
- An **Nhost** project for file storage
- Access to the AuraSutra database schema (11 tables must exist)

### Installation

```bash
# Clone the repository (if applicable)
git clone <repository-url>

# Navigate to the admin_view directory
cd admin_view

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the `admin_view/` root directory with the following variables:

```env
# -----------------------------------------------
# Database Connection (PostgreSQL / Neon)
# -----------------------------------------------
DATABASE_URL=postgres://<user>:<password>@<host>:5432/<database>

# -----------------------------------------------
# Nhost Storage (Image Uploads)
# -----------------------------------------------
NHOST_STORAGE_URL=https://<subdomain>.storage.<region>.nhost.run/v1
NHOST_ADMIN_SECRET=<your-nhost-admin-secret>
NEXT_PUBLIC_NHOST_SUBDOMAIN=<your-nhost-subdomain>
NEXT_PUBLIC_NHOST_REGION=<your-nhost-region>

# -----------------------------------------------
# Application Config
# -----------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3003
NODE_ENV=development
```

| Variable                        | Required | Description                                       |
|---------------------------------|----------|---------------------------------------------------|
| `DATABASE_URL`                  | Yes      | PostgreSQL connection string (Neon format)         |
| `NHOST_STORAGE_URL`            | Yes      | Nhost storage endpoint for file uploads            |
| `NHOST_ADMIN_SECRET`           | Yes      | Nhost admin secret for authenticated uploads       |
| `NEXT_PUBLIC_NHOST_SUBDOMAIN`  | Yes      | Nhost project subdomain                            |
| `NEXT_PUBLIC_NHOST_REGION`     | Yes      | Nhost project region (e.g., `ap-south-1`)          |
| `NEXT_PUBLIC_APP_URL`          | No       | Application URL (defaults to `http://localhost:3003`) |
| `NODE_ENV`                     | No       | Environment mode (`development` or `production`)   |

### Running the Application

```bash
# Development server (port 3003)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint the codebase
npm run lint
```

The application will be available at **http://localhost:3003**. The root path redirects to `/dashboard`.

---

## Project Structure

```
admin_view/
|
+-- app/
|   +-- api/admin/                    # --- API Route Handlers ---
|   |   +-- stats/route.ts           # GET  - Dashboard statistics (comprehensive)
|   |   +-- appointments/route.ts    # GET  - All appointments with joins
|   |   +-- clinics/
|   |   |   +-- route.ts             # GET/POST - List and create clinics
|   |   |   +-- [id]/route.ts        # GET/PATCH/DELETE - Single clinic ops
|   |   +-- delivery-agents/
|   |   |   +-- route.ts             # GET  - List delivery agents
|   |   |   +-- [id]/route.ts        # PATCH/DELETE - Toggle active, delete
|   |   +-- doctors/
|   |   |   +-- route.ts             # GET/POST - List and create doctors
|   |   |   +-- [id]/route.ts        # GET/PATCH/DELETE - Single doctor ops
|   |   +-- marketplace/
|   |   |   +-- orders/route.ts      # GET  - Marketplace orders with filters
|   |   +-- medicines/
|   |   |   +-- route.ts             # GET/POST - List and create medicines
|   |   |   +-- [id]/route.ts        # GET/PATCH/DELETE - Single medicine ops
|   |   +-- orders/
|   |   |   +-- route.ts             # GET  - All orders listing
|   |   |   +-- [id]/route.ts        # GET/PATCH - Order detail and update
|   |   |   +-- assign/route.ts      # POST - Assign delivery agent to order
|   |   +-- patients/
|   |   |   +-- route.ts             # GET/POST - List and create patients
|   |   |   +-- [id]/route.ts        # GET/PATCH/DELETE - Single patient ops
|   |   +-- prescriptions/route.ts   # GET  - All prescriptions with joins
|   |   +-- transactions/route.ts    # GET  - Finance transactions listing
|   |   +-- upload/route.ts          # POST - Nhost image upload endpoint
|   |
|   +-- dashboard/                    # --- Frontend Pages ---
|   |   +-- layout.tsx               # Dashboard shell (Sidebar + content)
|   |   +-- page.tsx                 # Main dashboard overview
|   |   +-- analytics/page.tsx       # Statistics with 3 large charts
|   |   +-- appointments/page.tsx    # Appointments listing
|   |   +-- clinics/
|   |   |   +-- page.tsx             # Clinics list
|   |   |   +-- new/page.tsx         # Create clinic form
|   |   |   +-- [id]/edit/page.tsx   # Edit clinic form
|   |   +-- delivery-boys/page.tsx   # Delivery agents management
|   |   +-- doctors/
|   |   |   +-- page.tsx             # Doctors list
|   |   |   +-- new/page.tsx         # Create doctor form
|   |   |   +-- [id]/edit/page.tsx   # Edit doctor form
|   |   +-- marketplace/
|   |   |   +-- page.tsx             # Tabbed view (Medicines + Orders)
|   |   |   +-- add/page.tsx         # Add new medicine
|   |   |   +-- new/page.tsx         # Alternative create medicine page
|   |   |   +-- [id]/edit/page.tsx   # Edit medicine
|   |   +-- orders/
|   |   |   +-- page.tsx             # Orders listing
|   |   |   +-- [id]/page.tsx        # Order detail view
|   |   +-- patients/
|   |   |   +-- page.tsx             # Patients list
|   |   |   +-- new/page.tsx         # Create patient form
|   |   |   +-- [id]/edit/page.tsx   # Edit patient form
|   |   +-- payments/page.tsx        # Finance and transactions
|   |   +-- prescriptions/page.tsx   # Prescriptions listing
|
+-- components/                       # --- Reusable UI Components ---
|   +-- Sidebar.tsx                  # Navigation sidebar (3 sections)
|   +-- DataTable.tsx                # Generic sortable table (TypeScript generics)
|   +-- SearchBar.tsx                # Search input with clear button
|   +-- StatusBadge.tsx              # Color-coded status pills
|   +-- Pagination.tsx               # Full pagination with page size selector
|   +-- ConfirmDialog.tsx            # Modal confirmation dialog
|   +-- ProfileImage.tsx             # Avatar with initial letter fallback
|   +-- ImageModal.tsx               # Full-screen image viewer overlay
|   +-- MedicineForm.tsx             # Medicine create/edit form with image upload
|   +-- OrdersTable.tsx              # Self-contained orders management table
|   +-- LoadingSpinner.tsx           # Animated loading spinner
|
+-- lib/                              # --- Utilities and Configuration ---
|   +-- db.ts                        # PostgreSQL connection (postgres.js + Neon)
|   +-- types.ts                     # TypeScript interfaces (20+ entity types)
|   +-- exportCSV.ts                 # Generic CSV export utility
|   +-- upload.ts                    # Client-side image upload helper
|
+-- public/
|   +-- images/logos/                # Logo assets
|
+-- .env.local                       # Environment variables (not committed)
+-- next.config.ts                   # Next.js configuration (image domains)
+-- package.json                     # Dependencies and scripts
+-- tsconfig.json                    # TypeScript configuration
```

---

## Features

### Dashboard Overview

**Route:** `/dashboard`

The main dashboard provides a comprehensive overview of the entire platform at a glance:

- **4 Primary Stat Cards** -- Total Users, Total Doctors, Total Patients, Total Clinics
- **User Growth Area Chart** -- Registration trends over the last 6 months
- **Appointments and Medical Section** -- Total/today appointments count, prescriptions count, plus a 7-day bar chart
- **E-commerce and Marketplace Section** -- Medicines count, low stock alerts, total/pending orders, plus a 7-day bar chart
- **Finance and Delivery Section** -- Total revenue, delivery agent counts (total and active), plus a 7-day revenue line chart
- **Quick Actions** -- One-click navigation to Appointments, Orders, Marketplace, and Payments

All data is fetched from a single comprehensive API endpoint (`GET /api/admin/stats`).

### Statistics and Analytics

**Route:** `/dashboard/analytics`

A dedicated analytics page with three large charts covering 6-month historical data:

| Chart                  | Type          | Data                                      |
|------------------------|---------------|-------------------------------------------|
| Overall Appointments   | Area Chart    | Monthly appointment volume (6 months)     |
| Market Purchases       | Bar Chart     | Monthly order volume (6 months)           |
| Transactions           | Composed Chart| Transaction count (bars) + Revenue (line) |

### Doctors Management

**Route:** `/dashboard/doctors`

Full CRUD management for doctors on the platform:

- **List View** -- Sortable DataTable with doctor profiles, specializations, experience, fees
- **Search** -- Real-time search across doctor name, email, specialization
- **Filters** -- Specialization dropdown, verified status filter
- **Create** -- `/dashboard/doctors/new` -- Form creates a `users` record (role: doctor) and a linked `doctors` record in a single transaction
- **Edit** -- `/dashboard/doctors/[id]/edit` -- Pre-filled form, PATCH updates
- **Delete** -- Confirmation dialog, removes doctor record (user record preserved)
- **CSV Export** -- Export filtered results with column mapping

### Patients Management

**Route:** `/dashboard/patients`

Full CRUD management for patients:

- **List View** -- DataTable with patient profiles, contact info, medical details
- **Search** -- Search by name, email, phone
- **Filters** -- Gender filter dropdown
- **Create** -- `/dashboard/patients/new` -- Transaction creates user + patient
- **Edit** -- `/dashboard/patients/[id]/edit`
- **Delete** -- Confirmation dialog, removes patient record
- **CSV Export** -- Full data export

### Clinics Management

**Route:** `/dashboard/clinics`

Full CRUD management for clinics:

- **List View** -- DataTable with clinic details, location, contact
- **Search** -- Search by clinic name, email, city
- **Create** -- `/dashboard/clinics/new` -- Transaction creates user + clinic
- **Edit** -- `/dashboard/clinics/[id]/edit`
- **Delete** -- Confirmation dialog
- **CSV Export** -- Full data export

### Appointments Management

**Route:** `/dashboard/appointments`

Read-only listing of all appointments on the platform:

- **DataTable** -- Shows appointment details with linked patient and doctor profiles (names, avatars)
- **Filters** -- Status filter (scheduled, confirmed, completed, cancelled, etc.), Mode filter (online, offline, in_person)
- **StatusBadge** -- Color-coded appointment status pills
- **CSV Export** -- Export appointment data

### Prescriptions Management

**Route:** `/dashboard/prescriptions`

Read-only listing of all prescriptions:

- **DataTable** -- Prescription details with patient/doctor information
- **Filters** -- Active status filter, sent-to-patient filter, AI-generated flag tracking
- **CSV Export** -- Export prescription data

### Marketplace

**Route:** `/dashboard/marketplace`

A tabbed interface combining medicine inventory and marketplace orders:

**Medicines Tab:**
- Full CRUD for the medicine catalog
- Image upload via Nhost Storage
- Category and stock level filters
- Add (`/dashboard/marketplace/add`) and Edit (`/dashboard/marketplace/[id]/edit`) pages
- MedicineForm component with image preview and upload

**Orders Tab:**
- Marketplace order listing
- Delivery agent assignment functionality
- Status tracking with StatusBadge

### Orders Management

**Route:** `/dashboard/orders`

Comprehensive order management:

- **List View** -- All orders with customer details, amounts, statuses
- **Detail View** -- `/dashboard/orders/[id]` -- Full order detail with line items
- **Delivery Agent Assignment** -- Modal to assign/reassign delivery agents to orders
- **Status Tracking** -- Visual status progression (pending -> paid -> delivery stages -> delivered)
- **CSV Export** -- Export order data

### Payments and Finance

**Route:** `/dashboard/payments`

Financial transaction management:

- **Transaction Listing** -- All finance transactions with amounts, statuses, dates
- **Revenue Statistics** -- Aggregated revenue figures
- **Filters** -- Transaction status (pending, paid, failed, refunded), transaction type (consultation, refund, cancellation_charge)
- **StatusBadge** -- Payment-specific color coding
- **CSV Export** -- Export financial data

### Delivery Agents

**Route:** `/dashboard/delivery-boys`

Delivery agent management:

- **Agent Listing** -- All delivery agents with profile details
- **Activate/Deactivate Toggle** -- PATCH endpoint toggles `is_active` status
- **Delete** -- Remove delivery agent with confirmation dialog

### CSV Export

Every listing page includes CSV export functionality powered by a generic utility:

```typescript
exportToCSV<T>(data: T[], filename: string, columns?: { key: keyof T; label: string }[])
```

- Automatically handles arrays, objects, null values, and special characters
- Downloads with timestamp-based filenames (e.g., `doctors_2026-03-07.csv`)
- Includes helper functions for date formatting (`formatDateForCSV`, `formatDateTimeForCSV`)

---

## API Reference

All API routes are located under `/api/admin/` and return JSON responses in the format `{ success: true, data: ... }` or `{ error: "message" }`.

### Dashboard and Statistics

| Method | Endpoint                | Description                                       |
|--------|-------------------------|---------------------------------------------------|
| GET    | `/api/admin/stats`      | Comprehensive dashboard statistics, chart data, trend aggregations |

### Doctors

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/api/admin/doctors`        | List all doctors with joined user data         |
| POST   | `/api/admin/doctors`        | Create doctor (transaction: user + doctor)     |
| GET    | `/api/admin/doctors/[id]`   | Get single doctor by ID                        |
| PATCH  | `/api/admin/doctors/[id]`   | Update doctor fields                           |
| DELETE | `/api/admin/doctors/[id]`   | Delete doctor record                           |

### Patients

| Method | Endpoint                     | Description                                   |
|--------|------------------------------|-----------------------------------------------|
| GET    | `/api/admin/patients`        | List all patients with joined user data        |
| POST   | `/api/admin/patients`        | Create patient (transaction: user + patient)   |
| GET    | `/api/admin/patients/[id]`   | Get single patient by ID                       |
| PATCH  | `/api/admin/patients/[id]`   | Update patient fields                          |
| DELETE | `/api/admin/patients/[id]`   | Delete patient record                          |

### Clinics

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/api/admin/clinics`        | List all clinics with joined user data         |
| POST   | `/api/admin/clinics`        | Create clinic (transaction: user + clinic)     |
| GET    | `/api/admin/clinics/[id]`   | Get single clinic by ID                        |
| PATCH  | `/api/admin/clinics/[id]`   | Update clinic fields                           |
| DELETE | `/api/admin/clinics/[id]`   | Delete clinic record                           |

### Appointments and Prescriptions

| Method | Endpoint                       | Description                                |
|--------|--------------------------------|--------------------------------------------|
| GET    | `/api/admin/appointments`      | List all appointments with patient/doctor   |
| GET    | `/api/admin/prescriptions`     | List all prescriptions with patient/doctor  |

### Medicines

| Method | Endpoint                      | Description                                 |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/api/admin/medicines`        | List all medicines in catalog               |
| POST   | `/api/admin/medicines`        | Create new medicine                         |
| GET    | `/api/admin/medicines/[id]`   | Get single medicine by ID                   |
| PATCH  | `/api/admin/medicines/[id]`   | Update medicine fields                      |
| DELETE | `/api/admin/medicines/[id]`   | Delete medicine                             |

### Orders

| Method | Endpoint                          | Description                                |
|--------|-----------------------------------|--------------------------------------------|
| GET    | `/api/admin/orders`               | List all orders                            |
| GET    | `/api/admin/orders/[id]`          | Get order detail with line items           |
| PATCH  | `/api/admin/orders/[id]`          | Update order status                        |
| POST   | `/api/admin/orders/assign`        | Assign delivery agent to an order          |
| GET    | `/api/admin/marketplace/orders`   | List marketplace orders with status filter |

### Delivery Agents

| Method | Endpoint                            | Description                              |
|--------|-------------------------------------|------------------------------------------|
| GET    | `/api/admin/delivery-agents`        | List all delivery agents                 |
| PATCH  | `/api/admin/delivery-agents/[id]`   | Toggle active/inactive status            |
| DELETE | `/api/admin/delivery-agents/[id]`   | Delete delivery agent                    |

### Finance

| Method | Endpoint                     | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | `/api/admin/transactions`    | List all finance transactions            |

### File Upload

| Method | Endpoint               | Description                                       |
|--------|------------------------|---------------------------------------------------|
| POST   | `/api/admin/upload`    | Upload image to Nhost Storage (multipart/form-data) |

**Total: 24 API endpoints across 12 resource groups.**

---

## Reusable Components

### DataTable\<T\>

A fully generic, type-safe sortable table component that accepts any data shape via TypeScript generics.

```typescript
interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;   // Custom cell renderer
  sortable?: boolean;                        // Enable column sorting
  className?: string;                        // Custom CSS classes
}
```

Features:
- Column sorting (ascending/descending toggle)
- Custom cell renderers for complex content (avatars, badges, formatted dates)
- Built-in action buttons (View, Edit, Delete) with optional toggling
- Empty state messaging
- Loading state via LoadingSpinner

### StatusBadge

Color-coded status pills with type-specific palettes:

| Type          | Statuses Supported                                              |
|---------------|-----------------------------------------------------------------|
| `appointment` | confirmed, scheduled, pending, cancelled, completed, in_progress |
| `order`       | paid, delivered, pending, pending_delivery, accepted_for_delivery, out_for_delivery, cancelled |
| `payment`     | paid, success, pending, failed, refunded                        |
| `default`     | active, verified, success, inactive, pending, error, failed     |

### Pagination

Full-featured pagination component:
- Page navigation (first, previous, numbered pages, next, last)
- Configurable items per page (10, 25, 50, 100)
- "Showing X to Y of Z results" display
- Smart page number window (shows up to 5 page buttons centered on current page)

### Other Components

| Component        | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `Sidebar`        | Three-section navigation (Main Menu, Management, Teams) with active state highlighting |
| `SearchBar`      | Debounced search input with clear button                        |
| `ConfirmDialog`  | Modal dialog for delete confirmations with cancel/confirm actions|
| `ProfileImage`   | Avatar component with fallback to initial letter when no image  |
| `ImageModal`     | Full-screen overlay for viewing uploaded images                 |
| `MedicineForm`   | Create/edit form for medicines with Nhost image upload integration |
| `OrdersTable`    | Self-contained orders table with built-in delivery agent assignment |
| `LoadingSpinner` | Animated CSS spinner for loading states                         |

---

## Database Schema

The admin dashboard reads from and writes to the following 11 PostgreSQL tables:

```
+------------------+     +------------------+     +------------------+
|      users       |     |     doctors      |     |    patients      |
|------------------|     |------------------|     |------------------|
| uid (PK)         |<-+--| uid (FK)         |  +--| uid (FK)         |
| email            |  |  | did (PK)         |  |  | pid (PK)         |
| phone            |  |  | specialization[] |  |  | date_of_birth    |
| role             |  |  | qualification    |  |  | gender           |
| name             |  |  | consultation_fee |  |  | blood_group      |
| is_verified      |  |  | is_verified      |  |  | allergies[]      |
| is_active        |  |  | clinic_id (FK)   |  |  | city, state      |
| created_at       |  |  +------------------+  |  +------------------+
+------------------+  |                         |
        |             |  +------------------+   |  +------------------+
        |             +--| clinics          |   +--| appointments     |
        |                |------------------|      |------------------|
        |                | clinic_id (PK)   |      | aid (PK)         |
        |                | uid (FK)         |      | pid (FK)         |
        |                | clinic_name      |      | did (FK)         |
        |                | city, state      |      | mode             |
        |                | is_verified      |      | status           |
        |                +------------------+      | scheduled_date   |
        |                                          +------------------+
        |                                                  |
        |  +------------------+     +------------------+   |
        |  | prescriptions    |     |    medicines     |   |
        |  |------------------|     |------------------|   |
        |  | prescription_id  |     | id (PK)          |   |
        |  | aid (FK)         |-----| name             |   |
        |  | pid (FK)         |     | category         |   |
        |  | did (FK)         |     | price            |   |
        |  | diagnosis        |     | stock_quantity   |   |
        |  | ai_generated     |     | image_url        |   |
        |  +------------------+     +------------------+   |
        |                                   |              |
        |  +------------------+     +------------------+   |
        |  |     orders       |     |   order_items    |   |
        |  |------------------|     |------------------|   |
        +--| user_id (FK)     |     | order_id (FK)    |   |
           | status           |     | medicine_id (FK) |   |
           | total_amount     |     | quantity         |   |
           | shipping_address |     | price_at_purchase|   |
           | assigned_to_     |     +------------------+   |
           |  delivery_boy_id |                            |
           +------------------+                            |
                                                           |
        +------------------+     +-------------------------+
        | delivery_agents  |     | finance_transactions    |
        |------------------|     |-------------------------|
        | id (PK)          |     | transaction_id (PK)     |
        | name             |     | aid (FK)                |
        | email            |     | pid (FK)                |
        | is_active        |     | did (FK)                |
        | profile_image_url|     | amount                  |
        +------------------+     | status                  |
                                 | razorpay_order_id       |
                                 +-------------------------+
```

---

## Entity CRUD Pattern

All entity management pages (Doctors, Patients, Clinics, Medicines) follow a consistent pattern:

```
+-------------------+         +-------------------+         +------------------+
|   LIST PAGE       |         |   CREATE PAGE     |         |   EDIT PAGE      |
|                   |         |                   |         |                  |
| GET /api/admin/X  |         | POST /api/admin/X |         | GET /api/admin/  |
|        |          |         |        |          |         |   X/[id]         |
|        v          |         |        v          |         |      |           |
| Client-side:      |  "New"  | Form submit -->   |         |      v           |
| - Search filter   | ------> | Transaction:      |         | Pre-fill form    |
| - Dropdown filter |         |   1. INSERT user  |         |      |           |
| - Pagination      | <------ |   2. INSERT entity|         |      v           |
| - Sort columns    | redirect|                   |         | PATCH /api/admin/|
|        |          |         +-------------------+         |   X/[id]         |
|        v          |                                       +------------------+
| DataTable<T>      |
| + StatusBadge     |         +-------------------+
| + ProfileImage    |         |   DELETE          |
|        |          |         |                   |
|        v          |  click  | ConfirmDialog     |
| [Edit] [Delete]   | ------> | --> DELETE /api/   |
|                   |         |    admin/X/[id]   |
+-------------------+         | (entity only,     |
                              |  user preserved)  |
                              +-------------------+
```

**Key behavior notes:**
- **Create** operations use database transactions to atomically create both a `users` row and the entity row
- **Delete** operations remove only the entity record (doctor, patient, clinic); the associated `users` row is preserved
- All list pages perform **client-side** filtering, searching, and pagination after fetching the full dataset from the API

---

## TypeScript Interfaces

The `lib/types.ts` file defines 20+ TypeScript interfaces organized into categories:

| Category               | Interfaces                                                                |
|------------------------|---------------------------------------------------------------------------|
| Core User Management   | `User`, `Doctor`, `Patient`, `Clinic`                                     |
| Appointments & Medical | `Appointment`, `Prescription`, `DoctorAvailability`, `DoctorPatientRelationship` |
| Medication Tracking    | `MedicationAdherence`, `MedicationReminder`                               |
| E-Commerce             | `Medicine`, `Cart`, `CartItem`, `Order`, `OrderItem`, `DeliveryAgent`, `OrderDeliveryAssignment`, `IgnoredOrder` |
| Financial              | `FinanceTransaction`, `Receipt`                                           |
| System                 | `AppTranslation`, `SyncQueue`                                             |
| Views                  | `AdherenceProgress`                                                       |
| Legacy Aliases         | `Product` (extends Medicine), `DeliveryBoy` (extends DeliveryAgent)       |

---

## Authentication Status

```
+-----------------------------------------------------------------------+
|                        *** SECURITY NOTICE ***                        |
|                                                                       |
|  Authentication: NOT IMPLEMENTED                                      |
|  Authorization:  NOT IMPLEMENTED                                      |
|  Middleware:     NONE                                                  |
|  Login Page:     NONE                                                  |
|  Route Guards:   NONE                                                  |
|                                                                       |
|  The Kinde Auth package (@kinde-oss/kinde-auth-nextjs v2.11.0) is     |
|  listed in package.json but is NOT integrated into any part of the    |
|  application. There are no auth middleware files, no login/logout      |
|  routes, and no session validation on any API endpoint.               |
|                                                                       |
|  ALL API routes and dashboard pages are publicly accessible.          |
|                                                                       |
|  Before deploying to production, implement:                           |
|    1. Authentication middleware (e.g., Kinde, NextAuth, Clerk)        |
|    2. Role-based authorization (admin-only access)                    |
|    3. API route protection                                            |
|    4. CSRF protection                                                 |
+-----------------------------------------------------------------------+
```

---

## Scripts

| Script         | Command              | Description                                  |
|----------------|----------------------|----------------------------------------------|
| `dev`          | `next dev -p 3003`   | Start development server on port 3003        |
| `build`        | `next build`         | Create optimized production build            |
| `start`        | `next start`         | Start production server                      |
| `lint`         | `eslint`             | Run ESLint across the codebase               |

---

## Image Configuration

The `next.config.ts` file configures Next.js Image optimization with the following allowed remote image sources:

| Hostname                                              | Purpose                |
|-------------------------------------------------------|------------------------|
| `placehold.co`                                        | Placeholder images     |
| `ynwkhelqhehjlxlhhjfj.storage.ap-south-1.nhost.run`  | Nhost Storage (uploads)|
| `images.unsplash.com`                                 | Stock photography      |

SVG images are allowed via `dangerouslyAllowSVG: true`.

---

## Database Connection

The PostgreSQL connection (`lib/db.ts`) uses the `postgres` npm package with the following configuration:

| Setting            | Value                 | Description                                |
|--------------------|-----------------------|--------------------------------------------|
| SSL                | Enabled               | `rejectUnauthorized: false` for Neon       |
| Max connections    | 10                    | Connection pool size                       |
| Idle timeout       | 20 seconds            | Close idle connections after 20s           |
| Connect timeout    | 10 seconds            | Fail connection attempt after 10s          |

The connection URL is parsed manually to handle special characters in passwords (URL-encoded `%40` for `@` is decoded for SCRAM-SHA-256 authentication compatibility).
