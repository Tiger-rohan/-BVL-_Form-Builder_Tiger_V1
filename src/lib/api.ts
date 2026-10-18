import { FormItem, FormDefinition, FormVersionItem, SubmissionItem, UserProfile } from '../types/form.ts';

const TOKEN_KEY = 'formforge_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'Request failed');
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.fieldErrors = data?.fieldErrors;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string) {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(email: string, password: string) {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  // Forms
  async listForms() {
    return request<{ forms: FormItem[] }>('/api/forms');
  },

  async createForm(title: string, description?: string) {
    return request<{ message: string; form: FormItem }>('/api/forms', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  async getForm(id: string) {
    return request<{ form: FormItem }>(`/api/forms/${id}`);
  },

  async updateForm(id: string, payload: { title: string; description?: string; schema: FormDefinition; settings?: any }) {
    return request<{ message: string }>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async publishForm(id: string, changelog?: string) {
    return request<{ message: string; version: number; status: string }>(`/api/forms/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ changelog }),
    });
  },

  async archiveForm(id: string) {
    return request<{ message: string }>(`/api/forms/${id}/archive`, {
      method: 'POST',
    });
  },

  async unarchiveForm(id: string) {
    return request<{ message: string }>(`/api/forms/${id}/unarchive`, {
      method: 'POST',
    });
  },

  async duplicateForm(id: string) {
    return request<{ message: string; formId: string; slug: string }>(`/api/forms/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async deleteForm(id: string) {
    return request<{ message: string }>(`/api/forms/${id}`, {
      method: 'DELETE',
    });
  },

  async getVersions(id: string) {
    return request<{ versions: FormVersionItem[] }>(`/api/forms/${id}/versions`);
  },

  // Submissions
  async getResponses(
    formId: string,
    params: { search?: string; version?: number | string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}
  ) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.version) query.set('version', String(params.version));
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const url = `/api/forms/${formId}/responses?${query.toString()}`;
    return request<{
      formTitle: string;
      schema: FormDefinition;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      responses: SubmissionItem[];
    }>(url);
  },

  async getResponseDetail(formId: string, responseId: string) {
    return request<{ response: SubmissionItem }>(`/api/forms/${formId}/responses/${responseId}`);
  },

  async deleteResponse(formId: string, responseId: string) {
    return request<{ message: string }>(`/api/forms/${formId}/responses/${responseId}`, {
      method: 'DELETE',
    });
  },

  getCsvExportUrl(formId: string) {
    const token = getStoredToken();
    // Return direct download URL with token header via fetch or link
    return `/api/forms/${formId}/responses/csv`;
  },

  async downloadCsv(formId: string, formTitle: string) {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/forms/${formId}/responses/csv`, { headers });
    if (!res.ok) throw new Error('Failed to generate CSV download.');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_responses.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Public Form
  async getPublicForm(slug: string) {
    return request<{
      form: {
        id: string;
        title: string;
        description: string;
        slug: string;
        version: number;
        schema: FormDefinition;
        settings: any;
      };
    }>(`/api/public/forms/${slug}`);
  },

  async submitPublicForm(slug: string, data: Record<string, any>, metadata?: any) {
    return request<{
      message: string;
      submissionId: string;
      submittedAt: string;
    }>(`/api/public/forms/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ data, metadata }),
    });
  },

  // Health and Live DB Status
  async getHealth() {
    return request<{
      status: string;
      service: string;
      database: {
        connected: boolean;
        type: string;
        target: string;
        autoMigrated: boolean;
        latencyMs: number;
        tables: string[];
        stats?: {
          users: number;
          forms: number;
          form_versions: number;
          submissions: number;
        };
        error?: string;
      };
      time: string;
    }>('/api/health');
  },

  async getDatabaseDiagnostics() {
    return request<{
      engine: 'external-postgresql' | 'embedded-pglite';
      connected: boolean;
      target: string;
      autoMigrated: boolean;
      latencyMs: number;
      tables: string[];
      stats: {
        users: number;
        forms: number;
        form_versions: number;
        submissions: number;
      };
      error?: string;
    }>('/api/database/diagnostics');
  },

  async getTableRows(table: string) {
    return request<{
      table: string;
      count: number;
      rows: any[];
    }>(`/api/database/tables/${table}`);
  },
};
