# FormForge: Overall System & Architecture Guide

> **FormForge is a modular, database-agnostic form-building, rendering, validation, and data collection platform inspired by KoboToolbox and ODK.**

---

## 1. What is FormForge?

FormForge operates in two complementary modes:

1. **A Modular Library (`packages/`)**:
   - Decoupled packages you can import into any React, Angular, Vue, or backend project.
   - Core validation engine with zero external dependencies.
   - Pluggable storage adapters (`MemoryStorageAdapter`, `RestApiStorageAdapter`, `PostgresStorageAdapter`, `SupabaseStorageAdapter`).
2. **A Full-Stack Hosted Application (`src/` + `server/`)**:
   - Visual drag-and-drop form builder with live preview.
   - Versioned schema management (v1, v2, v3 with changelogs).
   - Public respondent link rendering and iframe embeds.
   - Submissions database with CSV exports.
   - Live Database Explorer and connection diagnostics.

---

## 2. Quick Start (Run Locally in 60 Seconds)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Step 3: Run Automated Verification Tests
```bash
npm test
```
All **40 tests** (22 adapter & POC tests + 18 backend & auth tests) run and pass.

---

## 3. Database Architecture (Zero Manual SQL)

FormForge features an **automatic schema migration engine** in `server/db.ts`. On startup, it automatically creates all required tables and indexes:
* `users`: Account credentials (bcrypt hashed)
* `forms`: Master form definitions, settings, and status
* `form_versions`: Immutable schema snapshots linked to versions
* `submissions`: Respondent answers, metadata, and timestamps
* `integrations` & `delivery_logs`: Webhook and third-party sync rules

### Two Database Modes Supported Out of the Box:

| Mode | Configuration | Where Data Goes |
| :--- | :--- | :--- |
| **Local Embedded (Default)** | Zero configuration needed | Saved to disk in `./data/postgres` via PGlite. |
| **External PostgreSQL / Supabase** | Set `DATABASE_URL` in `.env` | Automatically connects via `pg.Pool`, migrates tables, and stores data in your cloud DB. |

### Connecting Supabase or External PostgreSQL:
In your `.env` file:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```
Restart the server. The top header badge will change to **`🟢 PostgreSQL (Cloud)`**.

---

## 4. Authentication & Security (Simplified)

* **Public Survey Respondents:** **Zero tokens or login required.** Anyone can fill out forms anonymously.
* **Embedded Library Mode (`<FormRenderer />`):** **Zero tokens required.**
* **Hosted Admin Dashboard:** Uses standard JSON Web Tokens (JWT) stored automatically in `localStorage`. The database does **not** process JWTs; the Node.js server inspects the user ID and performs standard parameterized SQL queries.

---

## 5. Production Hosting

### Option A: Render / Railway / Fly.io (Recommended)
1. Push repository to GitHub.
2. Create **Web Service**:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** `JWT_SECRET=your_32_char_secret`, `DATABASE_URL=...` (optional)
3. Deploy!

### Option B: Docker Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

---

## 6. Project Commands Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start full-stack development server on port 3000 |
| `npm test` | Run all 40 automated tests across core, adapters, and server |
| `npm run build` | Build production client bundle with Vite |
| `npm run lint` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm start` | Run production full-stack server (`tsx server.ts`) |
