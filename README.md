<div align="center">

# 🏢 GK CRM
### Multi-Tenant Business Management SaaS

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white" />
</p>

A production multi-tenant CRM platform for service businesses — lead pipeline management, HR & attendance, billing, and role-based analytics on a single shared codebase with strict per-tenant data isolation.

[Live Site](https://gkdigitalsolutions.in) · [Report an Issue](../../issues)

</div>

---

## 📋 Overview

GK CRM is built to serve multiple independent companies ("tenants") from one deployment, without any tenant able to see another's data — enforced at the PostgreSQL row level, not just in application code. It started as a CRM for an interior design business and grew into a general-purpose business management platform.

**Currently in commercial use**, actively iterated on based on real client and team feedback.

---

## ✨ Core Modules

| Module | Description |
|---|---|
| 🎯 **Lead Management** | Multi-stage pipeline (New → Follow Up → Site Visit → Quotation → Won/Lost), claim-based lead ownership, real-time updates via Supabase subscriptions |
| 👥 **HRMS** | Employee management, IST-aware attendance tracking, automated leave accrual (`pg_cron`), PDF payslip generation |
| 💰 **Finance** | Invoices, quotations with room-wise calculations, expense tracking, Razorpay subscription billing (4-tier plans) |
| 🔐 **Access Control** | Tenant admin vs. staff role separation, enforced via PostgreSQL Row Level Security policies |
| 📊 **Analytics** | Live pipeline dashboards, team performance tracking, revenue reporting |
| 🏗️ **Projects** | Milestone-based payment tracker, auto-created on deal close via database trigger |
| 🛠️ **Super Admin** | Tenant management, subscription oversight, revenue dashboard, support ticketing, system monitoring |

---

## 🏛️ Architecture Notes

- **Multi-tenancy via `company_id` + RLS** — every table scoped to a tenant, enforced at the database layer
- **Claim-on-first-action lead ownership** — a `BEFORE UPDATE` trigger assigns `owner_id` when a team member first acts on a lead, keeping visibility rules and UI state in sync
- **Webhook-driven subscription state** — Razorpay webhooks are the single source of truth for plan activation, avoiding client-side trust issues
- **Paginated data access** — custom fetch utilities work around platform row-limit caps for tenants with large datasets

---

## 🧰 Tech Stack

**Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
**Backend:** Supabase (PostgreSQL, Auth, Realtime, RLS), Node.js
**Payments:** Razorpay Subscriptions API
**Hosting:** Vercel

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/nandareddy-dev/business-management-portal.git
cd business-management-portal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Razorpay credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

---

## 📄 License

Proprietary — All rights reserved. This codebase is not open for redistribution.

---

<div align="center">

Built by [Nanda Kumar Reddy](https://gkdigitalsolutions.in) · GKA1 Enterprises Pvt Ltd

</div>
