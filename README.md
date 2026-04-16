# 📥 Inward-Outward Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.3.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade digital correspondence tracking system designed to replace traditional physical registers. This system provides a centralized platform for managing all incoming (Inward) and outgoing (Outward) documents, letters, and parcels with full traceability and role-based access control.

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [User Roles & Permissions](#user-roles--permissions)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Known Limitations / TODOs](#known-limitations--todos)

---

## ✨ Features

### 🔐 Multi-Role Authentication
- Secure JWT-based authentication with bcrypt password hashing.
- Three tiers of access: **Super Admin**, **Admin**, and **Clerk**.
- Persistent sessions using HTTP-only cookies.

### 📁 Document Management
- **Inward Entry**: Digitally record incoming letters/parcels with auto-generated IDs (`INW/YYYY/NNN`).
- **Outward Entry**: Track dispatches with courier details and delivery status (`OUT/YYYY/NNN`).
- **Unified Transactions**: A "All Transactions" screen to view both inward and outward history in one place.
- **Traceability**: Link outward dispatches to their corresponding inward documents.

### 🛠 Master Data Management
- **Office Master**: Configure multiple offices/institutes with opening sequence numbers.
- **Mode Master**: Define delivery modes (e.g., Speed Post, Hand Delivery, Courier).
- **Courier Master**: Maintain a registry of courier companies with contact info and rates.
- **Contact Master**: Global registry for frequent 'From' and 'To' addresses.

### 📊 Reports & Dashboard
- **Visual Analytics**: Interactive charts showing monthly inward vs. outward trends using Recharts.
- **Exporting**: Generate and download reports in **Excel (.xlsx)** and **PDF** formats.
- **Filtering**: Search by subject, letter number, date range, or sender/receiver.

### 🕵️ Audit Trail
- Automated logging of all critical actions (CRUD, Login/Logout) with IP tracking and user-agent details.

---

## 💻 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16.1.1](https://nextjs.org/) | React framework with App Router for SSR & dynamic routing. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety and enhanced developer experience. |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) | Modern utility-first CSS for premium UI design. |
| **Database** | [PostgreSQL (Neon)](https://neon.tech/) | Cloud-native relational database for reliable storage. |
| **ORM** | [Prisma 7.3.0](https://www.prisma.io/) | Type-safe database client and migration management. |
| **Auth** | [JWT](https://jwt.io/) & [bcrypt](https://www.npmjs.com/package/bcryptjs) | Secure token-based auth and password encryption. |
| **UI Components** | [Lucide React](https://lucide.dev/) | Clean, consistent iconography. |
| **State/Data** | [Axios](https://axios-http.com/) & [Zod](https://zod.dev/) | API communication and schema validation. |
| **Reporting** | [SheetJS (xlsx)](https://sheetjs.com/) | Client-side Excel generation. |

---

## 🏗️ System Architecture

The system follows a modern **Full-Stack Next.js** architecture with a strong emphasis on server-side security and team-based data isolation.

### 🔐 Authentication & Security
- **JWT Strategy**: Secure tokens are generated upon login and stored in HTTP-only cookies.
- **Middleware Protection**: All routes under `/dashboard`, `/masters`, and `/transactions` are protected by `middleware.ts` which validates the JWT signature and expiration.
- **Server-Side Sessions**: The backend never trusts client-sent IDs. It extracts the `userId` and `teamId` directly from the secure cookie for every database query.

### 🛡️ Team-Based Data Isolation
Data is filtered at the database level using a sophisticated "Filter Provider" pattern:
- **Super Admin**: Global access to all records across all teams.
- **Admin**: Restricted to records belonging to their specific `TeamID`.
- **Clerk**: Restricted to records belonging to their specific `TeamID`.

### 🚀 Data Fetching Pattern
To prevent "Stale Data" issues, the system implements a strict **No-Cache Policy**:
- **API Routes**: Forced dynamic rendering (`revalidate = 0`) with explicit `Cache-Control` headers.
- **Client Fetches**: Uses `cache: "no-store"` to ensure the browser always receives the latest data from the server.

---

## 📂 Project Structure

```text
├── actions/             # Server Actions for form handling and data mutations
├── app/                 # Next.js App Router (Pages & API Routes)
│   ├── api/             # Backend logic: /auth, /masters, /transactions, /dashboard
│   ├── dashboard/       # Main statistical overview page
│   ├── masters/         # Management pages for offices, couriers, modes, users
│   ├── transactions/    # Inward, Outward, and Unified transaction screens
│   ├── reports/         # Dynamic report generation and export interface
│   ├── login/           # Authentication portal
│   └── layout.tsx       # Global layout with Navigation and providers
├── components/          # Reusable UI components (Modals, Tables, Forms)
├── lib/                 # Core utilities: axios, prisma, auth-server, sequence logic
├── prisma/              # Database schema definition and seed scripts
├── public/              # Static assets (images, icons)
├── middleware.ts        # Route protection and session validation
└── .env                 # Environment configuration (secrets)
```

---

## 🗄 Database Schema Overview

The system uses a highly relational schema to ensure data integrity and team-based isolation:

- **User**: Core entity with `Email`, `Password`, and `RoleID`.
- **Role**: Defines permissions (`Super Admin`, `Admin`, `Clerk`).
- **Team**: Enables organizational isolation; users belong to a team (except Super Admins).
- **Inward**: Tracks incoming documents. Fields: `InwardNo`, `Subject`, `InwardDate`, `ToInwardOutwardOfficeID`.
- **Outward**: Tracks outgoing documents. Fields: `OutwardNo`, `CourierCompanyID`, `TrackingID`, `DeliveryStatus`.
- **InwardOutwardOffice**: Master table for institutes participating in the system.
- **AuditLog**: Stores every change for security compliance.

---

## 🔌 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and set token cookie | No |
| `GET` | `/api/dashboard` | Fetch statistical data for the dashboard | Yes |
| `GET` | `/api/masters/office` | List all registered offices | Yes |
| `POST` | `/api/transactions/inward` | Create a new inward entry | Yes |
| `POST` | `/api/transactions/outward` | Create a new outward entry | Yes |
| `GET` | `/api/transactions` | Fetch unified history of all activity | Yes |
| `GET` | `/api/reports` | Export data to Excel/PDF | Yes |

*Base URL: `/api` (referenced as `/api/v1` in internal documentation)*

---

## 👥 User Roles & Permissions

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Super Admin** | Full System | Manage Teams, Roles, and view global audit logs. Control across all offices. |
| **Admin** | Team/Office Level | Manage office masters, add users to their team, view team reports. |
| **Clerk** | Entry Level | Perform Inward/Outward entries and view their own/team history. |

---

## ⚙️ Environment Variables

Copy `.env.shared` or create a `.env` file in the root:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Neon) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing tokens | `a_super_secure_random_string` |
| `NEXT_PUBLIC_API_URL`| (Optional) Frontend API endpoint | `/api` |

---

## 🛠 Installation

```bash
# Clone the repository
git clone https://github.com/Shivangiba/Inward_Outward.git

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

---

## ⚠️ Known Limitations / TODOs

- 🔳 **Document Preview**: PDF and Image preview modals are currently under implementation.
- 🔳 **Email Notifications**: Automated alerts for high-priority inward documents.
- 🔳 **Mobile App**: PWA support for scanning courier barcodes via phone camera.
- 🔳 **Advanced Search**: Implementation of ElasticSearch for multi-field full-text search.

---

## 📄 License
This project is licensed under the MIT License.