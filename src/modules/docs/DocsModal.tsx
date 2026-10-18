import React, { useState } from 'react';
import {
  Shield,
  Key,
  Database,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { getStoredToken } from '../../lib/api.ts';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'faq' | 'jwt' | 'supabase' | 'external' | 'schema';
}

export const DocsModal: React.FC<DocsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'faq',
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'jwt' | 'supabase' | 'external' | 'schema'>(defaultTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentToken = getStoredToken() || 'Sign in to generate an active JWT token';

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                FormForge Framework & Architecture Manual
              </h2>
              <p className="text-xs text-slate-400">
                Database-agnostic form builder, pluggable adapters, and API integration guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>0. Quick Start & Database FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('jwt')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'jwt'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. JWT & Database Explained Simply</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Connecting with Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('external')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'external'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. Other Web Services Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Database Schema & RLS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          {/* TAB 0: Quick Start & Database FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Question 1: Do we need a database? */}
              <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    Do we need an external database connection for now?
                  </h3>
                </div>
                <p className="text-emerald-900 text-xs sm:text-sm font-semibold leading-relaxed">
                  NO! You do NOT need to set up, connect, or pay for any database right now.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">
                      1. In Embedded / Framework Mode
                    </span>
                    <span className="text-slate-600">
                      Use <code>MemoryStorageAdapter</code>. Form submissions are validated and recorded completely in memory without any database connection. Ideal for testing, local development, and offline apps.
                    </span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">
                      2. In Hosted Mode (This App)
                    </span>
                    <span className="text-slate-600">
                      A self-contained PostgreSQL engine (<strong>PGlite</strong>) runs automatically on server-side disk storage (<code>/data/pglite</code>). All forms, users, and responses persist out of the box with zero setup!
                    </span>
                  </div>
                </div>
              </div>

              {/* Question 2: How to Import FormForge */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-600" />
                  <span>How to Import FormForge into Your Application</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-900 block">Option A: React</span>
                    <p className="text-[11px] text-slate-600">
                      Import <code>&lt;FormRenderer /&gt;</code> and pass your schema and chosen adapter:
                    </p>
                    <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto">
{`import { FormRenderer } from '@formforge/react';
import { MemoryStorageAdapter } from '@formforge/adapters';

<FormRenderer
  schema={mySchema}
  storageAdapter={new MemoryStorageAdapter()}
/>`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-900 block">Option B: Web Component</span>
                    <p className="text-[11px] text-slate-600">
                      Embed native Custom Element in Angular, Vue, plain HTML, PHP, or WordPress:
                    </p>
                    <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto">
{`<script type="module" src=".../web-component"></script>

<formforge-form
  src="/api/forms/survey"
  endpoint="/api/submissions"
></formforge-form>`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-900 block">Option C: REST API</span>
                    <p className="text-[11px] text-slate-600">
                      POST submission JSON directly from Python, Java, Go, PHP, or .NET:
                    </p>
                    <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto">
{`curl -X POST /api/submissions \\
  -H "Content-Type: application/json" \\
  -d '{"formId":"...","data":{...}}'`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Question 3: What Databases Are Needed? */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>What Database is Needed if You Want to Connect One?</span>
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <p className="text-slate-700 leading-relaxed">
                    FormForge is completely <strong>database-agnostic</strong> through the <code>FormStorageAdapter</code> interface. You can back it with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li><strong>No Database (Default):</strong> In-memory RAM storage with <code>MemoryStorageAdapter</code>.</li>
                    <li><strong>Your Own Backend:</strong> Any REST endpoint with <code>RestApiStorageAdapter</code>.</li>
                    <li><strong>PostgreSQL (Version 14+):</strong> Connect AWS RDS, Neon, Cloud SQL, or local Postgres.</li>
                    <li><strong>Supabase (Optional):</strong> Supply <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code>.</li>
                    <li><strong>MySQL / MongoDB / DynamoDB:</strong> Implement a 10-line custom adapter class.</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-slate-500">
                    💡 All privileged database operations and connection credentials run strictly server-side.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: What is JWT Verification? */}
          {activeTab === 'jwt' && (
            <div className="space-y-6">
              {/* Live Token Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm text-emerald-300">Your Current JWT Token</span>
                  </div>
                  <button
                    onClick={() => copyText(currentToken, 'current_token')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    {copiedCode === 'current_token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'current_token' ? 'Copied Token!' : 'Copy Active JWT'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 break-all select-all border border-slate-800/80 max-h-24 overflow-y-auto">
                  {currentToken}
                </div>
                <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1">
                  <span>📌 Stored in browser: <code>localStorage.getItem('formforge_auth_token')</code></span>
                  <span>⏱ Validity: 7 days</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>The Big Reveal: The JWT Does NOT Connect to the Database!</span>
                </h3>
                <p className="text-emerald-900 leading-relaxed font-semibold">
                  A common point of confusion is thinking the JWT token connects directly to the database. It does not!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-slate-900 block mb-1">1. The Database (Storage)</span>
                    <span className="text-slate-600">
                      The database (PostgreSQL/PGlite) only connects to the Node.js server. It doesn't know or care what a JWT is.
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-slate-900 block mb-1">2. The JWT (Name Badge)</span>
                    <span className="text-slate-600">
                      The JWT is just a signed digital name badge given to the browser so the server remembers: <em>"This request is from User #123"</em>.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Simple Steps */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">How It Works in 3 Simple Steps</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                    <span className="font-bold text-blue-800 block text-xs">Step 1: You Log In</span>
                    <p className="text-[11px] text-slate-600">
                      Server verifies your email + password in the <code>users</code> table, and hands your browser a signed token: <code>&#123; id: "user_123" &#125;</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                    <span className="font-bold text-purple-800 block text-xs">Step 2: You Open Dashboard</span>
                    <p className="text-[11px] text-slate-600">
                      Your browser automatically sends that token in the header. The server reads it: <em>"Ah, you are user_123!"</em>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <span className="font-bold text-emerald-800 block text-xs">Step 3: Server Queries DB</span>
                    <p className="text-[11px] text-slate-600">
                      The server runs a simple SQL query: <code>SELECT * FROM forms WHERE user_id = 'user_123'</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* When is JWT NOT Needed? */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span>💡 When is a JWT Token NOT needed at all?</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                  <li><strong>Public Survey Respondents:</strong> Zero JWT required! Anyone can view public forms and submit answers anonymously.</li>
                  <li><strong>Embedded Library Mode:</strong> Using <code>&lt;FormRenderer /&gt;</code> in your own React app requires zero JWT tokens.</li>
                  <li><strong>In-Memory / Testing Mode:</strong> Uses <code>MemoryStorageAdapter</code> with no auth and no database.</li>
                </ul>
              </div>

              {/* FormForge Implementation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">FormForge Server Middleware (`server/auth.ts`)</h4>
                  <button
                    onClick={() => copyText(`export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}`, 'middleware')}
                    className="inline-flex items-center gap-1 text-emerald-600 font-semibold"
                  >
                    {copiedCode === 'middleware' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'middleware' ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7); // Strip 'Bearer '
  try {
    // Cryptographically checks signature & expiration
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded; // Injects validated user identity
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Connecting with Supabase */}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-emerald-900">
                  How Supabase and Row Level Security (RLS) Work Together
                </h3>
                <p className="text-emerald-800 leading-relaxed">
                  Supabase uses standard JWTs for authentication. Inside PostgreSQL, the function <code>auth.uid()</code> reads the <code>sub</code> (Subject) field directly from the JWT. That is how policies like <code>USING (auth.uid() = user_id)</code> guarantee that a user can never access another user's forms or private submissions!
                </p>
              </div>

              {/* 3 Step Integration */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">3 Easy Steps to Connect FormForge to Supabase</h4>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Set Environment Variables</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    In your <code>.env</code> file, paste your Supabase Project URL and Keys from <em>Supabase Dashboard &gt; Project Settings &gt; API</em>:
                  </p>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
{`SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."`}
                  </pre>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Execute the FormForge Migration in Supabase SQL Editor</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Open your Supabase project, navigate to <strong>SQL Editor</strong>, and run the SQL migration located at <code>supabase/migrations/20261002000000_formforge_core.sql</code>:
                  </p>
                  <button
                    onClick={() => copyText(`-- Users can only manage their own forms
CREATE POLICY "Owners can view and manage their own forms"
    ON forms FOR ALL
    USING (auth.uid() = user_id);

-- Public respondents can submit to published forms
CREATE POLICY "Public respondents can submit to published forms"
    ON submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = submissions.form_id
            AND forms.status = 'published'
        )
    );`, 'sql')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-[11px]"
                  >
                    {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'sql' ? 'Copied Policy SQL' : 'Copy Supabase RLS Policy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Query via Supabase JavaScript Client</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: \`Bearer \${userToken}\` // Automatically applies RLS!
      }
    }
  }
);`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Other Web Services */}
          {activeTab === 'external' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  How to Consume FormForge from External Services
                </h4>
                <p className="text-slate-500 text-xs">
                  Because FormForge uses standard HTTP headers and RFC 7519 JWTs, any programming language or cloud service can authenticate seamlessly.
                </p>
              </div>

              {/* Python Example */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Python (FastAPI / Flask / Requests)</span>
                  <button
                    onClick={() => copyText(`import requests

token = "YOUR_FORMFORGE_JWT"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get("https://formforge.app/api/forms", headers=headers)
forms = response.json()
print("Forms:", forms)`, 'python')}
                    className="inline-flex items-center gap-1 text-emerald-600 font-semibold"
                  >
                    {copiedCode === 'python' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'python' ? 'Copied' : 'Copy Python'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
{`import requests

token = "YOUR_FORMFORGE_JWT"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Fetch user's forms
res = requests.get("https://your-domain.com/api/forms", headers=headers)
print("My Forms:", res.json())`}
                </pre>
              </div>

              {/* cURL Example */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">cURL / CLI Terminal</span>
                  <button
                    onClick={() => copyText(`curl -X GET "http://localhost:3000/api/forms" \\
  -H "Authorization: Bearer YOUR_JWT_HERE"`, 'curl')}
                    className="inline-flex items-center gap-1 text-emerald-600 font-semibold"
                  >
                    {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
{`curl -X GET "http://localhost:3000/api/forms" \\
  -H "Authorization: Bearer YOUR_JWT_HERE"`}
                </pre>
              </div>

              {/* Public Submissions without Token */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <span className="font-bold text-slate-900">Unauthenticated Public Submissions (Zero Auth)</span>
                <p className="text-slate-500 text-xs">
                  Respondents answering surveys do not require a JWT. They POST directly to:
                </p>
                <code className="block p-2 bg-white border border-slate-200 rounded-lg text-emerald-700 font-mono text-[11px]">
                  POST /api/public/forms/:slug/submit
                </code>
              </div>
            </div>
          )}

          {/* TAB 4: Database Schema & RLS */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Relational PostgreSQL Tables
                </h4>
                <p className="text-slate-500 text-xs">
                  FormForge runs a relational PostgreSQL engine with native schema types and foreign keys:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-800">1. `users`</div>
                  <div className="text-[11px] text-slate-500">
                    UUID, email (unique), password_hash (bcrypt), name, created_at.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-800">2. `forms`</div>
                  <div className="text-[11px] text-slate-500">
                    UUID, user_id (FK), title, slug (unique), status (draft/published/archived), schema (JSONB).
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-800">3. `form_versions`</div>
                  <div className="text-[11px] text-slate-500">
                    Immutable snapshots of JSON schemas at each publication increment.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-800">4. `submissions`</div>
                  <div className="text-[11px] text-slate-500">
                    form_id (FK), form_version, data (JSONB), metadata (IP, User-Agent, timestamp).
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="font-bold text-emerald-900">Active Row Level Security (RLS)</div>
                <ul className="list-disc pl-5 space-y-1 text-emerald-800 text-[11px]">
                  <li>Forms: Form creators can view, edit, and delete only rows where <code>user_id = auth.uid()</code>.</li>
                  <li>Submissions: Form owners can view all submissions for their forms; public respondents can only INSERT into published forms.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            FormForge Platform Architecture Documentation
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
