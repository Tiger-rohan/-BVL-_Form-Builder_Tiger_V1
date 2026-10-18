import React, { useState } from 'react';
import { FormItem } from '../../types/form.ts';
import { Code2, Copy, Check, ExternalLink, Globe, Smartphone, Lock, Layers, Cpu, Terminal } from 'lucide-react';

interface EmbedCodeModalProps {
  form: FormItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({ form, isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'react' | 'iframe' | 'api'>('script');
  const [embedHeight, setEmbedHeight] = useState('720');

  if (!isOpen || !form) return null;

  const origin = window.location.origin;
  const publicUrl = `${origin}/#form/${form.slug}`;
  const embedUrl = `${origin}/#embed/${form.slug}`;
  const schemaApiUrl = `${origin}/api/public/forms/${form.slug}`;
  const submitApiUrl = `${origin}/api/public/forms/${form.slug}/submit`;
  const sdkScriptUrl = `${origin}/sdk/formforge.js`;

  // 1. Universal Web Component Script Tag
  const webComponentSnippet = `<!-- 1. Load the FormForge Hosted SDK from your server -->
<script src="${sdkScriptUrl}"></script>

<!-- 2. Embed the form custom element in any HTML / Vue / Angular / PHP page -->
<formforge-form
  src="${schemaApiUrl}"
  endpoint="${submitApiUrl}"
></formforge-form>

<!-- 3. (Optional) Listen for submissions in JavaScript -->
<script>
  document.querySelector('formforge-form').addEventListener('formforge:submit', (e) => {
    console.log('Submission received from hosted form:', e.detail.data);
  });
</script>`;

  // 2. React / Next.js Component (No local npm packages required!)
  const reactComponentSnippet = `import React, { useEffect, useRef } from 'react';

/**
 * Self-contained React component that connects to your hosted FormForge instance.
 * No local npm package installation required!
 */
export function HostedFormForge({ onSuccess }: { onSuccess?: (data: any) => void }) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Dynamically load SDK from your hosted FormForge server
    if (!customElements.get('formforge-form')) {
      const script = document.createElement('script');
      script.src = '${sdkScriptUrl}';
      script.async = true;
      document.body.appendChild(script);
    }

    const handler = (event: any) => {
      if (onSuccess) onSuccess(event.detail?.data);
    };

    window.addEventListener('formforge:submit', handler);
    return () => window.removeEventListener('formforge:submit', handler);
  }, [onSuccess]);

  return (
    <div ref={formRef} className="formforge-container w-full max-w-xl mx-auto py-6">
      <formforge-form
        src="${schemaApiUrl}"
        endpoint="${submitApiUrl}"
      ></formforge-form>
    </div>
  );
}`;

  // 3. Iframe Snippet
  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="${embedHeight}px"
  frameborder="0"
  marginheight="0"
  marginwidth="0"
  title="${form.title}"
  style="border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); max-width: 680px; margin: 0 auto; display: block;"
>Loading Form...</iframe>`;

  // 4. cURL Snippet
  const curlSnippet = `curl -X POST "${submitApiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "full_name": "Jane Doe",
      "email_address": "jane@example.com"
    }
  }'`;

  // 5. Python Snippet
  const pythonSnippet = `import requests

url = "${submitApiUrl}"
payload = {
    "data": {
        "full_name": "Jane Doe",
        "email_address": "jane@example.com"
    }
}

response = requests.post(url, json=payload)
print(response.status_code) # 201 Created
print(response.json())`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Import & Embed in Another Project</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Hosted Remote Import
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Host FormForge once, import & embed into any React, HTML, Vue, or backend project over the web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Status notice */}
        {form.status !== 'published' && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div>
              <strong>Notice:</strong> This form is currently in <em>{form.status}</em> state. Please publish it from the dashboard so external applications can fetch and submit to it.
            </div>
          </div>
        )}

        {/* Public Link Bar */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Direct Respondent URL
                </span>
                <span className="font-mono text-slate-800 truncate block text-xs">
                  {publicUrl}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyToClipboard(publicUrl, 'url')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition text-xs text-slate-700 shadow-2xs"
              >
                {copiedType === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'url' ? 'Copied Link' : 'Copy Link'}</span>
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition"
                title="Open public page in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'script', label: '1. Hosted Script Tag (HTML / Vue / PHP)', icon: Globe },
            { id: 'react', label: '2. React / Next.js Component', icon: Cpu },
            { id: 'iframe', label: '3. Responsive Iframe', icon: Layers },
            { id: 'api', label: '4. REST API & Python', icon: Terminal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* TAB 1: Hosted Script Tag */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Universal Hosted Script Tag</h4>
                <p className="text-slate-500 text-xs">
                  Load the SDK directly from this hosted FormForge server. Works in plain HTML, Vue, Angular, WordPress, or PHP with zero build tools!
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {webComponentSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webComponentSnippet, 'script')}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedType === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'script' ? 'Copied' : 'Copy Script Tag'}</span>
                </button>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                ✓ <strong>Hosted CDN Delivery:</strong> The file <code>{sdkScriptUrl}</code> is automatically served with universal CORS enabled.
              </div>
            </div>
          )}

          {/* TAB 2: React / Next.js Component */}
          {activeTab === 'react' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">React & Next.js Drop-In Component</h4>
                <p className="text-slate-500 text-xs">
                  Copy this 20-line component into your other React project. It connects directly to this hosted instance with <strong>zero npm dependencies</strong>!
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-72">
                  {reactComponentSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(reactComponentSnippet, 'react')}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedType === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'react' ? 'Copied' : 'Copy React Component'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Iframe */}
          {activeTab === 'iframe' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Responsive Iframe</h4>
                  <p className="text-slate-500 text-xs">
                    Drop into WordPress, Webflow, Notion, or Shopify without writing JavaScript:
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Height:</span>
                  <select
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs"
                  >
                    <option value="600">600px</option>
                    <option value="720">720px</option>
                    <option value="900">900px</option>
                    <option value="1100">1100px</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {iframeSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedType === 'iframe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'iframe' ? 'Copied' : 'Copy Iframe'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Programmatic REST API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Direct REST API Submissions</h4>
                <p className="text-slate-500 text-xs">
                  Submit answers programmatically from any backend or script (Python, Java, Go, PHP, C#):
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">cURL</span>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {curlSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(curlSnippet, 'curl')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-medium flex items-center gap-1 transition"
                  >
                    {copiedType === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Python (Requests)</span>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {pythonSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pythonSnippet, 'python')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-medium flex items-center gap-1 transition"
                  >
                    {copiedType === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'python' ? 'Copied' : 'Copy Python'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Form slug: <code className="font-mono text-slate-700">{form.slug}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
