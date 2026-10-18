# FormForge

> **A reusable, database-agnostic form builder, validator, and data collection framework inspired by KoboToolbox & ODK.**

FormForge lets developers design versioned surveys, validate responses with zero-database dependencies, and collect submissions across any frontend framework or backend language.

---

## 🚀 Quick Start (Running Locally in 60 Seconds)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: (Optional) Set Up Environment File
FormForge runs out of the box with default zero-config settings. You can copy the example file:
```bash
cp .env.example .env
```

### Step 3: Start the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### Step 4: Run the Verification Tests
```bash
npm test
```
*(All 40 automated tests for validation, adapters, database, and auth will run and pass).*

---

## ❓ Frequently Asked Questions

### 1. Do I need to connect a database right now?
**NO!** 
* **In Embedded / Framework Mode:** You can use `MemoryStorageAdapter` (stores in RAM with zero database) or `RestApiStorageAdapter` (forwards submissions to any existing REST API).
* **In Hosted Mode (The Full Web Service):** The server has a built-in, embedded PostgreSQL engine powered by **PGlite** (`@electric-sql/pglite`) that automatically saves data to `./data/pglite`. You can create surveys, submit answers, and download CSVs immediately without creating any database accounts.

### 2. What environment variables do I need?
None are mandatory for local development!
* `PORT`: Server port (default: `3000`).
* `JWT_SECRET`: Secret key for signing session tokens (pre-filled with a secure default).
* `DATABASE_URL` or `SUPABASE_URL`: **Optional**. Only set if you want to connect an external PostgreSQL cluster or Supabase project.

---

## 📦 How to Import FormForge into Any Other App

### Option A: In a React / TypeScript Application
Copy the `packages/` folder (or install via npm once published):

```tsx
import React from 'react';
import { FormRenderer } from '@formforge/react';
import { MemoryStorageAdapter, RestApiStorageAdapter } from '@formforge/adapters';
import { FormSchema } from '@formforge/core';

// 1. Define your form schema JSON
const surveySchema: FormSchema = {
  id: 'survey_01',
  title: 'Customer Feedback',
  version: 1,
  fields: [
    {
      id: 'f_name',
      key: 'name',
      type: 'text',
      label: 'Full Name',
      validation: { required: true, min: 2 },
    },
    {
      id: 'f_email',
      key: 'email',
      type: 'email',
      label: 'Email Address',
      validation: { required: true },
    },
  ],
};

// 2A. Zero-Database In-Memory Storage:
const adapter = new MemoryStorageAdapter();

// 2B. Or forward submissions to your own backend REST API:
// const adapter = new RestApiStorageAdapter({
//   endpointUrl: 'https://my-backend.com/api/submissions',
//   headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
// });

// 3. Render the form
export function App() {
  return (
    <FormRenderer
      schema={surveySchema}
      storageAdapter={adapter}
      onSuccess={(sub) => console.log('Saved:', sub)}
    />
  );
}
```

---

### Option B: In a Non-React App (HTML, WordPress, PHP, Vue, Angular)
Use the framework-neutral W3C Custom Element:

```html
<!-- 1. Load the Web Component script -->
<script type="module" src="https://your-domain.com/packages/web-component/dist/index.js"></script>

<!-- 2. Embed the Custom Element -->
<formforge-form
  src="https://your-domain.com/api/public/forms/my-survey-slug"
  endpoint="https://your-domain.com/api/sample-host/submissions"
></formforge-form>
```

---

### Option C: Calling from Any Backend (Python, Java, PHP, Go, .NET)
Send standard HTTP POST requests from your application:

```bash
curl -X POST https://your-domain.com/api/public/forms/my-survey-slug/submit \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }'
```

---

## 🌐 Production Hosting & Deployment

### 1. Deploy on Render / Railway / Fly.io (Recommended)
1. Push your repository to GitHub.
2. In Render or Railway, create a new **Web Service** connected to your repo.
3. Configure the service:
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
   * **Environment Variable:** `JWT_SECRET=your_custom_secure_secret_here`
4. Deploy! Your full-stack form engine is live with automatic SSL.

### 2. Deploy with Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📁 Repository Structure

```
formforge/
├── packages/
│   ├── core/           # Framework-independent validation & FormStorageAdapter interface
│   ├── react/          # React <FormRenderer /> & reusable UI components
│   ├── builder/        # Visual schema builder
│   ├── web-component/  # Framework-neutral <formforge-form> Custom Element
│   ├── adapters/       # Storage adapters (Memory, REST API, Webhook, Postgres, Supabase)
│   └── server/         # Server-side validation & submission processors
├── server/             # Turnkey hosted backend (Express + PostgreSQL / PGlite + JWT)
├── src/                # Turnkey hosted frontend (Dashboard, Builder, Responses, Framework Lab)
├── scripts/            # Automated test suites (test_poc.ts, test_phase1.ts)
└── docs/               # 3 consolidated documentation guides
```

---

## 📚 Core Documentation Files (`docs/`)

The documentation has been consolidated into 3 clean, dedicated guides:

| File | Purpose |
| :--- | :--- |
| **[`docs/1_OVERALL_GUIDE.md`](docs/1_OVERALL_GUIDE.md)** | **Overall System Guide**: Architecture, quickstart, database configuration, auth, and hosting. |
| **[`docs/2_CODEBASE_MAP_FOR_AI.md`](docs/2_CODEBASE_MAP_FOR_AI.md)** | **File-by-File Codebase Map for AI**: Exact responsibilities of every file and a decision guide on where to make changes. |
| **[`docs/3_HOW_TO_EMBED.md`](docs/3_HOW_TO_EMBED.md)** | **Embedding Guide**: How to embed in React, plain HTML, Vue, Angular, WordPress, and REST APIs. |

---

## 📄 License
MIT License. Free for commercial and non-commercial use.
