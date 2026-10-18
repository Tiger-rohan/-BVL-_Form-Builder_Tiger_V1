# How to Host FormForge Once & Import into Any Other Project

> **This is the complete guide for hosting FormForge on a server and importing / embedding it into any other application (React, Next.js, Vue, Angular, WordPress, PHP, Python) over the internet with zero local file copying.**

---

## 🌐 The Big Picture

```
                               ┌───────────────────────────────────────────────────────────┐
                               │   YOUR HOSTED FORMFORGE SERVER                            │
                               │   URL: https://my-formforge.onrender.com                  │
                               │                                                           │
                               │   • Dashboard & Visual Form Builder                       │
                               │   • PostgreSQL Database (Forms & Submissions)             │
                               │   • Serves Hosted SDK: /sdk/formforge.js                  │
                               │   • Public REST Endpoints: /api/public/forms/:slug        │
                               └─────────────────────────────┬─────────────────────────────┘
                                                             │
                  ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                  │ (Method 1)                               │ (Method 2)                               │ (Method 3)
                  ▼                                          ▼                                          ▼
   ┌──────────────────────────────┐           ┌──────────────────────────────┐           ┌──────────────────────────────┐
   │ React / Next.js Project      │           │ Plain HTML / Vue / Angular   │           │ External Backend (Python/Go) │
   │                              │           │                              │           │                              │
   │ Drop-in React Component      │           │ <script src=".../sdk.js">    │           │ requests.post(               │
   │ Connects to hosted server    │           │ <formforge-form ...>         │           │   "https://my-host/api/..."  │
   │ Zero npm packages installed! │           │ Zero build tools!            │           │ )                            │
   └──────────────────────────────┘           └──────────────────────────────┘           └──────────────────────────────┘
```

---

## Step 1: Host FormForge (Deploy to the Cloud in 3 Minutes)

You only need to host FormForge **once**. Once hosted, you get a public URL (e.g., `https://my-formforge.onrender.com`).

### Deploy on Render or Railway:
1. Push your FormForge code to a GitHub repository.
2. In **Render** (or **Railway**), click **New Web Service** and link your repo.
3. Configure the commands:
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
4. In **Environment Variables**, add:
   * `JWT_SECRET` = any random 32-character string
   * `DATABASE_URL` = *(Optional: only if you want an external PostgreSQL / Supabase database)*
5. Click **Deploy**. Note your live URL: `https://my-formforge.onrender.com`.

---

## Step 2: Import into Your Other Projects

Once FormForge is hosted, choose any of the methods below to import forms into your other applications:

---

### Method A: In Another React or Next.js Application (Zero npm install)

You do **not** need to install any npm packages in your other React project. Simply create a 20-line component in your other project:

#### 1. Create `HostedForm.tsx` in your other React project:
```tsx
import React, { useEffect } from 'react';

interface HostedFormProps {
  hostUrl: string;       // e.g. "https://my-formforge.onrender.com"
  formSlug: string;      // e.g. "customer-feedback-2a1b"
  onSuccess?: (data: any) => void;
}

export function HostedForm({ hostUrl, formSlug, onSuccess }: HostedFormProps) {
  useEffect(() => {
    // 1. Dynamically loads the SDK from your hosted FormForge instance
    const scriptId = 'formforge-sdk-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `${hostUrl}/sdk/formforge.js`;
      script.async = true;
      document.body.appendChild(script);
    }

    // 2. Listen for form submission events
    const handleSuccess = (event: any) => {
      if (onSuccess) onSuccess(event.detail?.data);
    };

    window.addEventListener('formforge:submit', handleSuccess);
    return () => window.removeEventListener('formforge:submit', handleSuccess);
  }, [hostUrl, onSuccess]);

  return (
    <div className="formforge-wrapper w-full max-w-xl mx-auto">
      {/* Renders the custom element provided by your hosted SDK */}
      <formforge-form
        src={`${hostUrl}/api/public/forms/${formSlug}`}
        endpoint={`${hostUrl}/api/public/forms/${formSlug}/submit`}
      />
    </div>
  );
}
```

#### 2. Use it in any React page:
```tsx
import { HostedForm } from './HostedForm';

export default function ContactPage() {
  return (
    <main className="p-8">
      <h1>Contact Us</h1>
      <HostedForm
        hostUrl="https://my-formforge.onrender.com"
        formSlug="contact-us-survey"
        onSuccess={(data) => {
          alert('Submission received: ' + JSON.stringify(data));
        }}
      />
    </main>
  );
}
```

---

### Method B: In Plain HTML, PHP, Vue, Angular, or WordPress (Hosted Script Tag)

Add the hosted script tag to your HTML `<head>` and use `<formforge-form>` anywhere in your page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Customer Survey</title>

  <!-- 1. Load the Hosted SDK directly from your FormForge server -->
  <script src="https://my-formforge.onrender.com/sdk/formforge.js"></script>
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #f8fafc;">

  <!-- 2. Drop the form element anywhere -->
  <formforge-form
    src="https://my-formforge.onrender.com/api/public/forms/customer-survey"
    endpoint="https://my-formforge.onrender.com/api/public/forms/customer-survey/submit"
  ></formforge-form>

  <!-- 3. (Optional) Capture submitted data in JavaScript -->
  <script>
    document.querySelector('formforge-form').addEventListener('formforge:submit', (e) => {
      console.log('User submitted answers:', e.detail.data);
    });
  </script>
</body>
</html>
```

---

### Method C: Responsive Iframe (Drop into Notion, Webflow, Shopify, WordPress)

Use the clean `#embed/:slug` route:
```html
<iframe
  src="https://my-formforge.onrender.com/#embed/customer-survey"
  width="100%"
  height="650px"
  frameborder="0"
  style="border-radius: 16px; border: 1px solid #e2e8f0; max-width: 680px; margin: 0 auto; display: block;"
></iframe>
```
* The `#embed` route automatically hides all header navigation, toolbars, and dashboard buttons, showing only the clean questionnaire.

---

### Method D: Programmatic REST API (Python, Java, Go, PHP, .NET)

If you are collecting survey data from backend scripts or cron jobs, submit directly over HTTP:

#### Python Example:
```python
import requests

url = "https://my-formforge.onrender.com/api/public/forms/customer-survey/submit"

payload = {
    "data": {
        "full_name": "Sarah Connor",
        "email_address": "sarah@cyberdyne.org",
        "rating": 5
    }
}

response = requests.post(url, json=payload)
print(response.status_code) # 201 Created
print(response.json())        # {"submissionId": "...", "submittedAt": "..."}
```

#### cURL Example:
```bash
curl -X POST "https://my-formforge.onrender.com/api/public/forms/customer-survey/submit" \
  -H "Content-Type: application/json" \
  -d '{"data": {"full_name": "Alex", "email_address": "alex@example.com"}}'
```

---

## 🔒 Security & Cross-Origin (CORS)

* Your hosted FormForge server automatically sends:
  ```http
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  ```
  This guarantees that any website on any domain can load the SDK script and submit responses to your hosted instance with zero CORS errors.

---

## 📋 Summary: Which Method Should You Use?

| Target Application | Recommended Integration Method |
| :--- | :--- |
| **React / Next.js** | **Method A**: Drop-in `<HostedForm />` component (fetches from your server). |
| **Plain HTML / Vue / Angular / PHP** | **Method B**: `<script src="https://my-host/sdk/formforge.js">` + `<formforge-form>`. |
| **WordPress / Webflow / CMS** | **Method C**: Responsive `<iframe>` with `#embed/:slug`. |
| **Python / Java / Go / Backend** | **Method D**: HTTP POST to `/api/public/forms/:slug/submit`. |
