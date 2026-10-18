# FormForge: Codebase Map & AI Modification Guide

> **This document is designed for AI coding assistants and developers. It provides an exact map of every file and folder in FormForge, their responsibilities, and a quick decision guide for making changes.**

---

## 🗺️ 1. Directory Structure Overview

```
formforge/
├── packages/                  # Reusable npm packages (library mode)
│   ├── core/                  # Schemas, validation rules, FormStorageAdapter interface
│   ├── react/                 # React <FormRenderer /> & input components
│   ├── adapters/              # Storage adapters (Memory, REST API, Webhook, Postgres, Supabase)
│   ├── builder/               # Visual schema builder
│   ├── web-component/         # Framework-neutral <formforge-form> Custom Element
│   └── server/                # Express middleware & server validation processor
├── server/                    # Hosted full-stack backend
│   ├── api.ts                 # Express REST API routes (/api/auth, /api/forms, /api/public, /api/database)
│   ├── auth.ts                # JWT authentication, bcrypt passwords, user sessions
│   ├── db.ts                  # Database client (pg.Pool + PGlite dual engine) & auto-migrations
│   └── validation.ts          # Server-side submission validation rules
├── src/                       # Hosted frontend application (React 19 + Tailwind CSS)
│   ├── App.tsx                # Main router, header navigation, and modal management
│   ├── components/            # Global UI widgets (DatabaseStatusBadge, DatabaseExplorerModal)
│   ├── lib/                   # Frontend API client (src/lib/api.ts)
│   ├── modules/               # App feature views
│   │   ├── auth/              # Login, Signup, and Demo account modal
│   │   ├── builder/           # Visual form builder & live respondent simulator
│   │   ├── dashboard/         # User forms dashboard, status badges, actions
│   │   ├── docs/              # In-app architecture & documentation modal
│   │   ├── embed/             # Clean embed view for iframes (#embed/:slug)
│   │   ├── playground/        # Framework Lab (test Memory, REST, Custom adapters interactively)
│   │   ├── public/            # Public respondent survey page (#form/:slug)
│   │   └── responses/         # Submissions drawer, table view, and CSV export
│   └── types/                 # Shared TypeScript interfaces for forms and submissions
├── scripts/                   # Automated verification test suites
│   ├── test_poc.ts            # Phase 0: 22 tests for core validation, memory adapter & REST API
│   └── test_phase1.ts         # Phase 1: 18 tests for auth, schemas, publishing, submissions & CSV
├── docs/                      # Clean documentation files
│   ├── 1_OVERALL_GUIDE.md     # Architecture, quickstart, database, and hosting
│   ├── 2_CODEBASE_MAP_FOR_AI.md # This file (complete file-by-file map for AI)
│   └── 3_HOW_TO_EMBED.md      # Embedding in React, Web Component, iframe, REST API
├── server.ts                  # Server entry point (mounts Express + Vite middleware)
├── index.html                 # HTML single-page entry point
├── package.json               # Dependencies, scripts, and npm workspaces
├── tsconfig.json              # TypeScript compilation configuration
└── vite.config.ts             # Vite build & Tailwind CSS plugin configuration
```

---

## 📄 2. Detailed File-by-File Responsibilities

### Backend Files (`server/`):
* **`server.ts`**: The main entry point for the backend. Boots Express, runs `initDatabase()`, mounts the API router at `/api`, and mounts Vite dev middleware in development.
* **`server/db.ts`**: The database abstraction layer. Detects `DATABASE_URL` (external PostgreSQL or Supabase) or defaults to local embedded PGlite. Auto-executes `CREATE TABLE IF NOT EXISTS` for all 6 tables on startup.
* **`server/api.ts`**: Contains all HTTP endpoints:
  - `/api/auth/*`: Registration, login, current user session.
  - `/api/forms/*`: CRUD for surveys, publishing, cloning, version history.
  - `/api/public/forms/:slug`: Public form retrieval and anonymous submissions.
  - `/api/database/*`: Live diagnostics and table row inspection.
* **`server/auth.ts`**: User authentication logic using JWT tokens (`jsonwebtoken`) and password hashing (`bcryptjs`).
* **`server/validation.ts`**: Server-side data validation logic. Re-checks all submitted fields against the form's schema constraints before inserting into the database.

### Frontend Files (`src/`):
* **`src/App.tsx`**: Root React component. Implements hash routing (`#dashboard`, `#builder/:id`, `#responses/:id`, `#playground`, `#form/:slug`, `#embed/:slug`), navigation bar, and state modals.
* **`src/lib/api.ts`**: Frontend HTTP client with automatic JWT token attachment from `localStorage` and error handling.
* **`src/components/DatabaseStatusBadge.tsx`**: Top navigation badge showing live DB connection state, latency, and opening the database explorer.
* **`src/components/DatabaseExplorerModal.tsx`**: Database table inspector modal allowing users to view real rows and columns in the database.
* **`src/modules/builder/FormBuilder.tsx`**: The visual form designer. Allows adding, editing, reordering questions, setting validation rules, and viewing a real-time respondent preview.
* **`src/modules/dashboard/FormsDashboard.tsx`**: Main dashboard showing user forms, publication status, submission counts, quick actions (edit, view responses, share link, clone, archive).
* **`src/modules/responses/ResponsesDashboard.tsx`**: Submissions manager with search, filtering, JSON inspector, and CSV export.
* **`src/modules/public/PublicFormPage.tsx`**: Full-page standalone respondent view for taking surveys without requiring an account.
* **`src/modules/embed/EmbedFormPage.tsx`**: Minimalist container for embedding forms into iframes with zero outer header chrome.
* **`src/modules/playground/IntegrationPlayground.tsx`**: Framework Lab where developers test storage adapters (`MemoryStorageAdapter`, `RestApiStorageAdapter`, Custom Adapter).
* **`src/modules/auth/AuthContext.tsx` & `AuthModal.tsx`**: Authentication state management and login/signup dialog.

### Modular Library Packages (`packages/`):
* **`packages/core/src/index.ts`**: Core definitions of `FormField`, `FormSchema`, `FormStorageAdapter`, and the framework-neutral `validateSubmission` function.
* **`packages/react/src/index.ts`**: The `<FormRenderer />` React component and modular field inputs (`TextField`, `SelectField`, `CheckboxField`, `RatingField`, etc.).
* **`packages/adapters/src/index.ts`**: Storage adapters:
  - `MemoryStorageAdapter`: In-memory RAM storage (zero DB).
  - `RestApiStorageAdapter`: Forwards submissions to any custom HTTP API.
  - `WebhookStorageAdapter`: Dispatches webhooks upon submission.
  - `PostgresStorageAdapter`: Direct PostgreSQL persistence.
  - `SupabaseStorageAdapter`: Direct Supabase database persistence.
* **`packages/web-component/src/index.ts`**: Native `<formforge-form>` Custom Element for embedding without React.
* **`packages/server/src/index.ts`**: Reusable Express middleware and submission processor for external Node.js apps.

---

## 🎯 3. AI Modification Decision Guide (Where to Make Changes)

When you ask an AI or developer to modify the app, use this quick cheat-sheet:

| What You Want to Do | Exact Files to Edit |
| :--- | :--- |
| **Add a new Question/Field Type** (e.g., File Upload, Signature, Rating) | 1. `packages/core/src/types.ts` (add field type)<br>2. `packages/core/src/validation.ts` (validation rule)<br>3. `packages/react/src/fields/` (render component)<br>4. `src/modules/builder/FormBuilder.tsx` (builder palette) |
| **Add or Modify a Database Table / Column** | 1. `server/db.ts` (update `initDatabase()` SQL schema)<br>2. `server/api.ts` (update queries) |
| **Change Validation Rules on Submit** | 1. `packages/core/src/validation.ts` (client-side)<br>2. `server/validation.ts` (server-side) |
| **Add a New Storage Adapter** (e.g. Firebase, MongoDB, Airtable) | 1. Create `packages/adapters/src/your-adapter.ts` implementing `FormStorageAdapter`<br>2. Export from `packages/adapters/src/index.ts` |
| **Change Navigation, Routes or Header** | `src/App.tsx` |
| **Change Styling, Theme or Brand Colors** | `src/index.css` and Tailwind classes in target components |
| **Add a New API Route** | `server/api.ts` |
| **Change User Authentication or Token Expiration** | `server/auth.ts` |
| **Add Automated Tests** | `scripts/test_poc.ts` or `scripts/test_phase1.ts` |
