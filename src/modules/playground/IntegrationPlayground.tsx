import React, { useState, useMemo } from 'react';
import { FormSchema, FormSubmission } from '@formforge/core';
import { MemoryStorageAdapter, RestApiStorageAdapter } from '@formforge/adapters';
import { FormRenderer } from '@formforge/react';
import {
  Cpu,
  Layers,
  Code2,
  Database,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ExternalLink,
  Sliders,
  Send,
} from 'lucide-react';

const SAMPLE_SCHEMAS: Record<string, FormSchema> = {
  feedback: {
    id: 'schema_feedback_v1',
    title: 'Customer Experience Survey',
    description: 'Framework-agnostic form definition with conditional logic and custom rules.',
    version: 1,
    fields: [
      {
        id: 'f_name',
        key: 'respondent_name',
        type: 'text',
        label: 'Your Full Name',
        placeholder: 'Jane Doe',
        validation: { required: true, min: 2 },
      },
      {
        id: 'f_email',
        key: 'contact_email',
        type: 'email',
        label: 'Work Email Address',
        placeholder: 'jane@company.com',
        validation: { required: true },
      },
      {
        id: 'f_rating',
        key: 'experience_rating',
        type: 'select',
        label: 'Overall Experience Rating',
        options: [
          { label: '5 - Exceptional', value: '5' },
          { label: '4 - Good', value: '4' },
          { label: '3 - Satisfactory', value: '3' },
          { label: '2 - Needs Improvement', value: '2' },
          { label: '1 - Poor', value: '1' },
        ],
        validation: { required: true },
      },
      {
        id: 'f_comments',
        key: 'feedback_comments',
        type: 'textarea',
        label: 'Additional Comments or Suggestions',
        placeholder: 'What could we improve?',
        validation: { max: 500 },
      },
    ],
    settings: {
      submitButtonText: 'Send Feedback',
      successMessage: 'Thank you! Your feedback has been stored via the active adapter.',
      allowMultiple: true,
    },
  },
  assessment: {
    id: 'schema_field_v1',
    title: 'Field Health Assessment',
    description: 'KoboToolbox-style offline-first multi-question questionnaire.',
    version: 1,
    fields: [
      {
        id: 'f_location',
        key: 'location_id',
        type: 'text',
        label: 'Facility / Zone Code',
        placeholder: 'ZONE-A4-902',
        validation: { required: true, pattern: '^[A-Z0-9-]+$' },
      },
      {
        id: 'f_population',
        key: 'household_count',
        type: 'number',
        label: 'Estimated Household Count',
        validation: { required: true, min: 1, max: 10000 },
      },
      {
        id: 'f_date',
        key: 'inspection_date',
        type: 'date',
        label: 'Date of Inspection',
        validation: { required: true },
      },
    ],
    settings: {
      submitButtonText: 'Record Assessment',
      successMessage: 'Field record successfully persisted.',
      allowMultiple: true,
    },
  },
};

export const IntegrationPlayground: React.FC = () => {
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<'feedback' | 'assessment'>('feedback');
  const [schemaText, setSchemaText] = useState<string>(
    JSON.stringify(SAMPLE_SCHEMAS.feedback, null, 2)
  );
  const [adapterType, setAdapterType] = useState<'memory' | 'rest' | 'custom'>('memory');
  const [submissionsList, setSubmissionsList] = useState<FormSubmission[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'react' | 'webcomponent' | 'rest_python' | 'rest_node'>('react');

  // Parse active schema safely
  const activeSchema: FormSchema = useMemo(() => {
    try {
      return JSON.parse(schemaText);
    } catch {
      return SAMPLE_SCHEMAS[selectedSchemaKey];
    }
  }, [schemaText, selectedSchemaKey]);

  // Create or retrieve storage adapter
  const memoryAdapter = useMemo(() => new MemoryStorageAdapter(), []);

  const restApiAdapter = useMemo(
    () =>
      new RestApiStorageAdapter({
        endpointUrl: '/api/sample-host/submissions',
        headers: {
          'X-Client-App': 'FormForge-POC',
        },
      }),
    []
  );

  const customDeveloperAdapter = useMemo(
    () => ({
      name: 'CustomDeveloperAdapter',
      async saveSubmission(sub: any) {
        console.log('[CustomDeveloperAdapter] Intercepted submission in host code:', sub);
        const customRecord: FormSubmission = {
          ...sub,
          id: `custom_${Date.now()}`,
          metadata: {
            ...sub.metadata,
            adapterNote: 'Handled by custom application logic',
            handledAt: new Date().toISOString(),
          },
        };
        return customRecord;
      },
    }),
    []
  );

  const activeAdapter = useMemo(() => {
    if (adapterType === 'memory') return memoryAdapter;
    if (adapterType === 'rest') return restApiAdapter;
    return customDeveloperAdapter;
  }, [adapterType, memoryAdapter, restApiAdapter, customDeveloperAdapter]);

  const handleSchemaChange = (key: 'feedback' | 'assessment') => {
    setSelectedSchemaKey(key);
    setSchemaText(JSON.stringify(SAMPLE_SCHEMAS[key], null, 2));
  };

  const handleSubmissionSuccess = (submission: any) => {
    setLastEvent(`Successfully persisted record "${submission.id}" via ${activeAdapter.name}`);
    setSubmissionsList((prev) => [submission, ...prev]);
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Decoupled Architecture Proof-of-Concept</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              FormForge Framework & Adapter Lab
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              FormForge is completely database-agnostic. Test live submissions using the <strong>Mock Memory Adapter</strong> (zero database required), the <strong>Host REST API Adapter</strong>, or supply your own custom storage adapter.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              No Supabase Required
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700 text-emerald-300">
              Zero-DB In-Memory Ready
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Form Renderer vs Schema & Adapter Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Form Preview (Using @formforge/react) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Live Form Rendering (`@formforge/react`)</span>
              </h2>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Adapter: {activeAdapter.name}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              This form is rendered by <code>&lt;FormRenderer schema=&#123;schema&#125; storageAdapter=&#123;adapter&#125; /&gt;</code>. Submitting triggers validation and passes the payload directly to the selected adapter.
            </p>

            {/* Live Form */}
            <div className="pt-2">
              <FormRenderer
                schema={activeSchema}
                storageAdapter={activeAdapter}
                onSuccess={handleSubmissionSuccess}
                onError={(err) => setLastEvent(`Validation error: ${JSON.stringify(err)}`)}
                className="shadow-none border-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Schema Editor, Adapter Switcher, & Submissions Log */}
        <div className="lg:col-span-6 space-y-6">
          {/* Adapter Switcher */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Select Storage Adapter</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">FormStorageAdapter</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAdapterType('memory')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  adapterType === 'memory'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">1. In-Memory</div>
                <div className="text-[10px] text-slate-500 mt-1">Zero Database</div>
              </button>

              <button
                type="button"
                onClick={() => setAdapterType('rest')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  adapterType === 'rest'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">2. Host REST API</div>
                <div className="text-[10px] text-slate-500 mt-1">HTTP POST /api/...</div>
              </button>

              <button
                type="button"
                onClick={() => setAdapterType('custom')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  adapterType === 'custom'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">3. Custom Adapter</div>
                <div className="text-[10px] text-slate-500 mt-1">Developer Logic</div>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
              {adapterType === 'memory' && (
                <span>
                  <strong>MemoryStorageAdapter:</strong> Submissions are stored in memory without requiring a database connection. Perfect for tests, dev environments, and offline apps.
                </span>
              )}
              {adapterType === 'rest' && (
                <span>
                  <strong>RestApiStorageAdapter:</strong> Automatically POSTs answers to the host backend route <code>/api/sample-host/submissions</code>. Works with any backend (Python, Java, Go, PHP, Express).
                </span>
              )}
              {adapterType === 'custom' && (
                <span>
                  <strong>CustomDeveloperAdapter:</strong> Demonstrates implementing <code>FormStorageAdapter</code> directly in developer code (e.g. saving to DynamoDB, MongoDB, or message bus).
                </span>
              )}
            </div>
          </div>

          {/* Submissions Received Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Submissions Received by Adapter ({submissionsList.length})
                </h3>
              </div>
              {submissionsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSubmissionsList([])}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Clear Log
                </button>
              )}
            </div>

            {lastEvent && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">{lastEvent}</span>
              </div>
            )}

            <div className="max-h-56 overflow-y-auto space-y-2 font-mono text-[11px]">
              {submissionsList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Submit the form on the left to see answers captured here in real-time.
                </div>
              ) : (
                submissionsList.map((sub, idx) => (
                  <div
                    key={`${sub.id}-${idx}`}
                    className="p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 space-y-1"
                  >
                    <div className="flex justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-1">
                      <span>ID: {sub.id}</span>
                      <span>{new Date(sub.metadata?.submittedAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-200 text-xs font-sans pt-1">
                      Answers: {JSON.stringify(sub.data)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schema Selector & Raw JSON */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" />
                <span>Form Definition Schema (JSON)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSchemaChange('feedback')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedSchemaKey === 'feedback'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Feedback Form
                </button>
                <button
                  type="button"
                  onClick={() => handleSchemaChange('assessment')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedSchemaKey === 'assessment'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Assessment Form
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              className="w-full p-3 font-mono text-[11px] bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Integration Options Documentation Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>How to Integrate FormForge into Any Tech Stack</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose the integration method that fits your frontend framework and backend language:
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCodeTab('react')}
            className={`py-2.5 px-4 border-b-2 transition ${
              codeTab === 'react'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Option A: React / TypeScript
          </button>

          <button
            type="button"
            onClick={() => setCodeTab('webcomponent')}
            className={`py-2.5 px-4 border-b-2 transition ${
              codeTab === 'webcomponent'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Option B: Web Component / HTML / WordPress
          </button>

          <button
            type="button"
            onClick={() => setCodeTab('rest_python')}
            className={`py-2.5 px-4 border-b-2 transition ${
              codeTab === 'rest_python'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Option C: REST API (Python / FastAPI)
          </button>

          <button
            type="button"
            onClick={() => setCodeTab('rest_node')}
            className={`py-2.5 px-4 border-b-2 transition ${
              codeTab === 'rest_node'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Option C: REST API (Node / Express)
          </button>
        </div>

        {/* Tab Snippets */}
        <div>
          {codeTab === 'react' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Import React Renderer with Custom or Built-in Adapter
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      `import React from 'react';
import { FormRenderer } from '@formforge/react';
import { RestApiStorageAdapter } from '@formforge/adapters';

const myAdapter = new RestApiStorageAdapter({
  endpointUrl: 'https://my-backend.com/api/submissions',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

export function SurveyPage({ schema }) {
  return (
    <FormRenderer
      schema={schema}
      storageAdapter={myAdapter}
      onSuccess={(sub) => console.log('Stored:', sub)}
    />
  );
}`,
                      'react'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  {copiedTab === 'react' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'react' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`import React from 'react';
import { FormRenderer } from '@formforge/react';
import { RestApiStorageAdapter } from '@formforge/adapters';

// 1. Initialize your desired storage adapter
const myAdapter = new RestApiStorageAdapter({
  endpointUrl: 'https://my-backend.com/api/submissions',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// 2. Render form in your React application
export function SurveyPage({ schema }) {
  return (
    <FormRenderer
      schema={schema}
      storageAdapter={myAdapter}
      onSuccess={(sub) => console.log('Successfully recorded:', sub)}
    />
  );
}`}
              </pre>
            </div>
          )}

          {codeTab === 'webcomponent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Embed in Plain HTML, Angular, Vue, PHP, or WordPress
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      `<!-- Load FormForge Web Component -->
<script type="module" src="https://unpkg.com/@formforge/web-component/dist/index.js"></script>

<!-- Embed Custom Element with Schema & Submission Endpoint -->
<formforge-form
  src="https://my-api.com/forms/contact-us"
  endpoint="https://my-api.com/submissions"
></formforge-form>`,
                      'webcomp'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  {copiedTab === 'webcomp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'webcomp' ? 'Copied' : 'Copy HTML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`<!-- 1. Include the lightweight FormForge Web Component -->
<script type="module" src="/packages/web-component/src/index.ts"></script>

<!-- 2. Place Custom Element anywhere in your HTML, Vue, or PHP template -->
<formforge-form
  src="https://my-api.com/forms/contact-us"
  endpoint="https://my-api.com/submissions"
></formforge-form>`}
              </pre>
            </div>
          )}

          {codeTab === 'rest_python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Python Backend (FastAPI / Django / Flask)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

class SubmissionPayload(BaseModel):
    formId: str
    formVersion: int
    data: Dict[str, Any]

@app.post("/api/submissions")
def receive_submission(payload: SubmissionPayload):
    # Persist in your own database (PostgreSQL, MongoDB, SQLite)
    print(f"Received submission for {payload.formId}: {payload.data}")
    return {"status": "saved", "formId": payload.formId}`,
                      'python'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  {copiedTab === 'python' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'python' ? 'Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

class SubmissionPayload(BaseModel):
    formId: str
    formVersion: int
    data: Dict[str, Any]

@app.post("/api/submissions")
def receive_submission(payload: SubmissionPayload):
    # Store answers in your host database (PostgreSQL, MySQL, Mongo, etc.)
    print(f"Persisting submission for form {payload.formId}: {payload.data}")
    return {"status": "stored", "formId": payload.formId}`}
              </pre>
            </div>
          )}

          {codeTab === 'rest_node' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Node.js / Express Host Backend
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      `import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/submissions', async (req, res) => {
  const { formId, formVersion, data } = req.body;
  // Save directly to host application database
  await myHostDb.submissions.insert({ formId, formVersion, data });
  res.status(201).json({ status: 'success' });
});`,
                      'node'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  {copiedTab === 'node' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab === 'node' ? 'Copied' : 'Copy Node.js'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/submissions', async (req, res) => {
  const { formId, formVersion, data, metadata } = req.body;
  // Save directly into your application's existing database
  await myHostDatabase.save({ formId, formVersion, data, metadata });
  res.status(201).json({ status: 'stored_by_host' });
});`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
