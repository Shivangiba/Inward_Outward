# 🛠 Setup Guide: Inward-Outward Management System

This guide will walk you through setting up a fresh development environment for the **Inward-Outward Tracking System**. 

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: Version 20.x or higher is required.
- **npm**: Version 10.x or higher (comes with Node.js).
- **Database**: A PostgreSQL instance (local or via [Neon.tech](https://neon.tech)).
- **Prisma CLI**: (Optional, will be installed via `npm install`).

---

## 🚀 Step 1: Clone & Install

```bash
# Clone the repository from GitHub
git clone https://github.com/Shivangiba/Inward_Outward.git

# Navigate into the project folder
cd Inward_Outward

# Install all required dependencies
npm install
```

---

## ⚙️ Step 2: Environment Variables

Create a new file named `.env` in the root directory. You can copy the values from `.env.shared` as a template:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | The PostgreSQL connection string | `postgresql://neondb_owner:YOUR_PASS@ep-floral-poetry.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | A secret string for signing JWT tokens | `any-random-long-secure-string-here` |
| `NEXT_PUBLIC_API_URL`| (Optional) Frontend API base | `/api` |

> [!WARNING]
> Never commit your actual `.env` file to version control. Ensure it is listed in your `.gitignore`.

---

## 🗄 Step 3: Database Initialization

This project uses **Prisma** as its ORM. Follow these commands to set up your database schema:

```bash
# Generate the Prisma Client
npx prisma generate

# Pushing the schema to your database (Migrations)
npx prisma migrate dev --name init

# [Optional] Seed the initial data (Roles, Teams, Test Users)
npx prisma db seed
```

---

## 🔑 Step 4: Default Login Credentials

If you ran the seed script, you can log in with these default accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `super@123.com` | `super123` |
| **Admin** | `admin@123.com` | `admin123` |
| **Clerk** | `clerk@123.com` | `clerk123` |

---

## ▶️ Step 5: Run the Project

```bash
# To start the development server:
npm run dev

# To build for production:
npm run build

# To start the production server:
npm run start
```
The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 📁 Folder Structure Explained

| Folder | Responsibility |
| :--- | :--- |
| `app/api` | **Backend API Routes**: Handles all server-side logic, auth, and DB queries. |
| `app/masters` | **Master Management**: Pages for managing Offices, Couriers, and Modes. |
| `app/reports` | **Reporting**: Dynamic data tables with Excel/PDF export logic. |
| `app/transactions`| **Transaction Registry**: Forms and lists for Inward/Outward entries. |
| `lib/` | **Core Libs**: Shared logic for database connection, auth, and audit logging. |
| `prisma/` | **Database**: Schema definitions and seeding instructions. |
| `components/` | **Modern UI**: Clean, reusable React components styled with Tailwind CSS. |

---

## ✍️ Coding Patterns & Robustness

To ensure the application remains stable, always follow these patterns when adding new features:

### 🔴 Frontend Pattern (Crash Prevention)
Never treat an API response as an array without validation. Error responses are typically objects:
```typescript
const res = await fetch(`/api/endpoint`, { cache: "no-store" });
if (!res.ok) {
    setData([]); // Graceful fallback
    return;
}
const data = await res.json();
if (Array.isArray(data)) {
    setData(data);
} else {
    setData([]); // Safe default if data is an error object
}
```

### 🔐 API Route Pattern (Security)
Always validate the user session server-side:
```typescript
import { getServerSession, getTeamFilter } from "@/lib/auth-server";

export const dynamic = "force-dynamic"; // Standard for data-heavy apps
export const revalidate = 0;

export async function GET() {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamFilter = await getTeamFilter();
    const data = await prisma.model.findMany({ where: teamFilter });
    return NextResponse.json(data);
}
```

---

## 🧪 Testing Procedures

### 🔄 Admin Testing Flow
1. Login with **Admin** credentials.
2. Check the **Dashboard** for team-specific counts.
3. Add a new **Office** or **Courier** and verify it appears instantly (Optimistic UI).
4. Logout and log back in to ensure the session persists.

### 👥 Team Isolation Test
1. Create a record as **Admin A** (Team 1).
2. Logout and login as **Admin B** (Team 2).
3. Verify that **Admin B** cannot see the record created by **Admin A**.

---

## 🔍 Troubleshooting & Debugging

### 🏁 Console Logging Logs
Check the terminal (server) and browser console (client) for these diagnostic tags:
- `[AUTH]`: Logs every session validation and token check.
- `[FILTER]`: Shows the team-based filtering applied to the query.

### 🚫 Common Issues
- **Problem**: `401 Unauthorized` on all pages.
  - **Fix**: Clear browser cookies or check if `JWT_SECRET` matches your signing key.
- **Problem**: Dashboard shows "0" (Empty) but records exist.
  - **Fix**: Verify the `teamId` is correctly assigned to your user in the database.
- **Problem**: `.filter is not a function` JS runtime error.
  - **Fix**: This usually indicates an API error returned an object `{error: "..."}` instead of an array. The system now handles this gracefully, but check the API response in the Network tab.

---

## 🚢 Deployment Notes

- **Vercel**: Recommended for hosting. Simply connect your GitHub repository and set the environment variables in the Vercel Dashboard.
- **Environment**: Ensure `DATABASE_URL` is accessible by your deployment server.
- **Production Build**: Always run `npm run build` to ensure type-safety and performance optimizations before shipping.

---

## 🧪 Testing

The project includes basic connectivity tests. To check your API health, visit:
- `http://localhost:3000/api/debug` (if implemented)
- `http://localhost:3000/api/auth/profile` (must be logged in)
