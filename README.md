<div align="center">
  <img src="public\Inward_Outward Banner.png" alt="Inward Outward Management System" width="100%"/>
</div>

<br/>

<img src="https://img.shields.io/badge/STATUS-PRODUCTION%20READY-6366f1?style=for-the-badge&labelColor=0a0a14&color=6366f1" />
<img src="https://img.shields.io/badge/LICENSE-MIT-8b5cf6?style=for-the-badge&labelColor=0a0a14&color=8b5cf6" />
<img src="https://img.shields.io/badge/NEXT.JS-16.1.1-ffffff?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0a0a14" />
<img src="https://img.shields.io/badge/PRISMA-7.3.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white&labelColor=0a0a14" />
<img src="https://img.shields.io/badge/POSTGRESQL-NEON-336791?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=0a0a14" />

<br/><br/>

# 📬 Inward-Outward Management System

### Enterprise-grade digital correspondence tracking — built to replace the physical register.

<br/>

[🚀 Live Demo](https://inward-outward.vercel.app/login) · [📖 Setup Guide](SETUP.md) · [📊 Project Summary](SUMMARY.md) · [🐛 Report Bug](https://github.com/Shivangiba/Inward_Outward/issues)

<br/>

## 🔐 Demo Access

To explore the application, use the following credentials:

```bash
Username: Trial_Admin
Password: 098765

</div>

---

## 🌟 What Is This?

> **Every office has a register.** A big book where incoming letters get stamped, numbered, and logged by hand — then someone searches through 200 pages to find a document from last month.
>
> This system **replaces that book** with a fast, searchable, secure, and role-controlled digital platform. Every letter in. Every parcel out. Every action tracked. One dashboard.

<br/>

---

## 📋 Table of Contents

| # | Section |
|---|---------|
| 1 | [✨ Features](#-features) |
| 2 | [💻 Tech Stack](#-tech-stack) |
| 3 | [🏗️ Architecture](#%EF%B8%8F-system-architecture) |
| 4 | [📂 Project Structure](#-project-structure) |
| 5 | [🗄️ Database Schema](#%EF%B8%8F-database-schema) |
| 6 | [🔌 API Reference](#-api-reference) |
| 7 | [👥 User Roles](#-user-roles--permissions) |
| 8 | [⚙️ Environment Variables](#%EF%B8%8F-environment-variables) |
| 9 | [🚀 Installation](#-installation) |
| 10 | [⚠️ Known Limitations](#%EF%B8%8F-known-limitations--todos) |

<br/>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Multi-Role Authentication
- JWT tokens stored in **HTTP-only cookies**
- Passwords hashed with **bcrypt**
- **3-tier access**: Super Admin → Admin → Clerk
- Session validated **server-side** on every request

</td>
<td width="50%">

### 📁 Smart Document Entry
- Auto-generated IDs: `INW/2026/001`, `OUT/2026/001`
- Full **inward ↔ outward traceability** (link replies to originals)
- Unified "All Transactions" view across both types
- Document upload with file management

</td>
</tr>
<tr>
<td width="50%">

### 🛠️ Master Data Management
- **Office Master** — multi-institute support with opening sequences
- **Mode Master** — Speed Post, Hand Delivery, Courier, etc.
- **Courier Master** — company registry with contact & rate info
- **Contact Master** — global From/To address directory

</td>
<td width="50%">

### 📊 Reports & Analytics
- Interactive **bar + donut charts** (Recharts)
- Filter by subject, letter no., date range, sender/receiver
- One-click export to **Excel (.xlsx)** and **PDF**
- Monthly inward vs. outward trend visualization

</td>
</tr>
<tr>
<td width="50%">

### 🕵️ Audit Trail
- Every **CRUD action** logged automatically
- Captures **IP address** and user-agent
- Login/Logout events tracked
- Full history per record available to admins

</td>
<td width="50%">

### 🛡️ Team-Based Data Isolation
- Data siloed by **TeamID** at the database level
- Super Admin sees everything; Admin/Clerk see only their team
- No cross-team data leakage possible
- Built-in "Filter Provider" pattern

</td>
</tr>
</table>

<br/>

---

## 💻 Tech Stack

<div align="center">

| Layer | Technology | Why |
|:---:|:---|:---|
| 🖥️ **Frontend** | Next.js 16.1.1 (App Router) | SSR, dynamic routing, full-stack in one framework |
| 🔷 **Language** | TypeScript | Type safety catches bugs before runtime |
| 🎨 **Styling** | Tailwind CSS 4.0 | Utility-first, consistent, fast to build |
| 🗃️ **Database** | PostgreSQL via [Neon](https://neon.tech) | Serverless, scalable, cloud-native |
| 🔗 **ORM** | Prisma 7.3.0 | Type-safe queries, migrations, schema management |
| 🔑 **Auth** | JWT + bcrypt.js | Industry-standard token auth + secure hashing |
| 📡 **HTTP** | Axios + Zod | Typed API calls with schema validation |
| 📈 **Charts** | Recharts | Responsive, composable chart library |
| 📤 **Export** | SheetJS (xlsx) | Client-side Excel generation |
| 🎯 **Icons** | Lucide React | Clean, consistent SVG icon set |

</div>

<br/>

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│         Next.js Pages + React Components                 │
│              Axios → /api/* routes                       │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (JWT Cookie)
┌──────────────────────▼──────────────────────────────────┐
│                  MIDDLEWARE LAYER                         │
│    middleware.ts — validates JWT on every request        │
│    Blocks: /dashboard, /masters, /transactions           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               API ROUTES (Next.js)                       │
│  /api/auth  /api/masters  /api/transactions  /api/reports│
│       ↓ getServerSession() + getTeamFilter()             │
│       ↓ Never trusts client-sent IDs                     │
└──────────────────────┬──────────────────────────────────┘
                       │  Prisma ORM
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL (Neon Cloud)                     │
│   Team-filtered queries → no cross-team data leakage    │
└─────────────────────────────────────────────────────────┘
```

### 🔑 Key Design Decisions

| Decision | Implementation |
|:---|:---|
| **No stale data** | `revalidate = 0` on all API routes + `cache: "no-store"` on fetches |
| **Server-side trust** | `userId` and `teamId` always extracted from secure cookie, never from request body |
| **Crash prevention** | All API responses validated as arrays before `.map()` — graceful fallback to `[]` |
| **Role isolation** | Filter Provider pattern injects `WHERE teamId = ?` at query level for non-Super-Admins |

<br/>

---

## 📂 Project Structure

```bash
inward-outward/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # All backend logic lives here
│   │   ├── auth/login/route.ts      # JWT generation + bcrypt verify
│   │   ├── transactions/
│   │   │   ├── inward/route.ts      # Inward CRUD + auto-numbering
│   │   │   └── outward/route.ts     # Outward CRUD + delivery status
│   │   ├── masters/                 # Office, Mode, Courier, FromTo APIs
│   │   ├── dashboard/route.ts       # Stats aggregation
│   │   ├── reports/route.ts         # Excel/PDF generation
│   │   ├── upload/route.ts          # File upload handler
│   │   └── files/[type]/[filename]/ # File serving
│   │
│   ├── 📁 dashboard/page.tsx        # Analytics overview
│   ├── 📁 transactions/
│   │   ├── inward/page.tsx          # Inward list + entry form
│   │   └── outward/page.tsx         # Outward list + entry form
│   ├── 📁 masters/
│   │   ├── office/                  # Office management
│   │   ├── courier-companies/       # Courier registry
│   │   ├── modes/                   # Mode management
│   │   ├── from-to/                 # Contact directory
│   │   ├── admin-master/            # User management
│   │   └── audit-logs/              # Action history
│   ├── 📁 reports/page.tsx          # Export interface
│   └── 📁 login/page.tsx            # Auth portal
│
├── 📁 actions/                      # Reusable server-action helpers
├── 📁 components/                   # Shared UI: Sidebar, Modals, Tables
├── 📁 lib/
│   ├── prisma.ts                    # Prisma client singleton
│   ├── auth-server.ts               # getServerSession, getTeamFilter
│   └── sequence.ts                  # Auto-number generation logic
├── 📁 prisma/
│   ├── schema.prisma                # Full DB schema
│   └── seed.ts                      # Default roles, teams, users
│
├── middleware.ts                    # Route protection
├── SETUP.md                         # Developer setup guide
├── SUMMARY.md                       # Non-technical overview
└── ARCHITECTURE.md                  # Deep architectural notes
```

<br/>

---

## 🗄️ Database Schema

```
┌──────────┐     ┌──────────┐     ┌──────────────────────┐
│   Role   │────▶│   User   │────▶│        Team          │
│          │     │  Email   │     │  ManagerUserID       │
│ SuperAdmin     │  Password│     └──────────────────────┘
│ Admin    │     │  RoleID  │
│ Clerk    │     │  TeamID  │
└──────────┘     └────┬─────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │  Inward  │ │ Outward  │ │  AuditLog    │
    │ InwardNo │ │OutwardNo │ │  Action      │
    │ Subject  │ │CourierID │ │  UserID      │
    │ ModeID   │ │TrackingID│ │  IPAddress   │
    │ OfficeID │ │InwardID? │ │  Timestamp   │
    └──────────┘ └──────────┘ └──────────────┘
          │           │
          ▼           ▼
    ┌────────────────────────────┐
    │     Master Tables          │
    │  InwardOutwardOffice       │
    │  InOutwardMode             │
    │  InOutwardFromTo           │
    │  CourierCompany            │
    └────────────────────────────┘
```

> **Key relationship**: `Outward.InwardID` is optional — when set, it creates a traceable thread linking a reply to its original incoming document.

<br/>

---

## 🔌 API Reference

### 🔐 Auth
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `POST` | `/api/auth/login` | Authenticate + set JWT cookie | ❌ |
| `POST` | `/api/auth/logout` | Clear session cookie | ✅ |
| `GET` | `/api/auth/profile` | Current user info | ✅ |

### 📥 Transactions
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/transactions/inward` | List inward entries (team-filtered) | ✅ |
| `POST` | `/api/transactions/inward` | Create inward entry + auto-number | ✅ |
| `PUT` | `/api/transactions/inward` | Update inward entry | ✅ |
| `GET` | `/api/transactions/outward` | List outward entries (team-filtered) | ✅ |
| `POST` | `/api/transactions/outward` | Create outward entry + auto-number | ✅ |
| `PUT` | `/api/transactions/outward` | Update + delivery status | ✅ |

### 🛠️ Masters
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET/POST/PUT/DELETE` | `/api/masters/office` | Office CRUD | ✅ |
| `GET/POST/PUT/DELETE` | `/api/masters/mode` | Mode CRUD | ✅ |
| `GET/POST/PUT/DELETE` | `/api/masters/courier` | Courier CRUD | ✅ |
| `GET/POST/PUT/DELETE` | `/api/masters/from-to` | Contact CRUD | ✅ |

### 📊 Reports & Dashboard
| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/dashboard` | Stats summary (counts, trends) | ✅ |
| `GET` | `/api/reports` | Generate Excel/PDF export | ✅ |
| `POST` | `/api/upload` | Upload document file | ✅ |

<br/>

---

## 👥 User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 SUPER ADMIN — Global Access                              │
│  ✅ All teams  ✅ All records  ✅ System settings            │
│  ✅ Manage all users  ✅ View all audit logs                 │
├─────────────────────────────────────────────────────────────┤
│  🟡 ADMIN — Team/Office Level                                │
│  ✅ Own team's records  ✅ Manage office masters             │
│  ✅ Add clerks to team  ✅ Team reports & exports            │
├─────────────────────────────────────────────────────────────┤
│  🟢 CLERK — Entry Level                                      │
│  ✅ Create inward/outward entries                            │
│  ✅ View own team's history  ❌ Cannot manage masters        │
└─────────────────────────────────────────────────────────────┘
```

<br/>

---

## ⚙️ Environment Variables

Create a `.env` file in the root (use `.env.shared` as template):

```env
# ─── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ─── Authentication ────────────────────────────────────────
JWT_SECRET="your-super-long-random-secret-key-here"

# ─── Optional ──────────────────────────────────────────────
NEXT_PUBLIC_API_URL="/api"
```

> ⚠️ **Never commit your `.env` file.** It is in `.gitignore` by default.

<br/>

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/Shivangiba/Inward_Outward.git
cd Inward_Outward

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.shared .env
# → Edit .env and add your DATABASE_URL and JWT_SECRET

# 4. Set up the database
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed default data (Roles, Teams, Test Users)
npx prisma db seed

# 6. Start the development server
npm run dev
```

🌐 Open **[http://localhost:3000](http://localhost:3000)**

### 🔑 Default Login Credentials (after seed)

| Role | Email | Password |
|:---:|:---|:---|
| 🔴 Super Admin | `super@123.com` | `super123` |
| 🟡 Admin | `admin@123.com` | `admin123` |
| 🟢 Clerk | `clerk@123.com` | `clerk123` |

<br/>

---

## ⚠️ Known Limitations / TODOs

| Status | Feature | Notes |
|:---:|:---|:---|
| 🔄 In Progress | **Document Preview** | PDF/Image preview modals being implemented |
| 📋 Planned | **Email Notifications** | Alerts for high-priority inward documents |
| 📋 Planned | **PWA / Mobile** | Barcode scanning via phone camera |
| 📋 Planned | **Advanced Search** | Full-text search with ElasticSearch |
| 📋 Planned | **AI Subject Extraction** | Auto-fill subject from scanned document |

<br/>

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, fork, and build on it.

---

<div align="center">

**Built with 💜 by [Shivangiba Jadeja](https://github.com/Shivangiba)**

⭐ If this project helped you, consider giving it a star!

[![GitHub stars](https://img.shields.io/github/stars/Shivangiba/Inward_Outward?style=social)](https://github.com/Shivangiba/Inward_Outward/stargazers)

</div>
