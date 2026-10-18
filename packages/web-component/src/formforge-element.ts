import {
  FormSchema,
  FormValidationResult,
  validateFormSubmission,
} from '@formforge/core';

/**
 * FormForge Web Component (<formforge-form>)
 * Framework-neutral Custom Element that runs in vanilla HTML, Angular, Vue, WordPress, PHP.
 */
export class FormForgeElement extends HTMLElement {
  private _schema: FormSchema | null = null;
  private _endpoint: string | null = null;
  private _data: Record<string, any> = {};
  private _errors: Record<string, string> = {};
  private _submitting = false;
  private _submitted = false;

  static get observedAttributes() {
    return ['src', 'endpoint', 'theme'];
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    this._endpoint = this.getAttribute('endpoint');

    if (src) {
      this.fetchSchema(src);
    } else {
      this.render();
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    if (name === 'src' && newValue) {
      this.fetchSchema(newValue);
    } else if (name === 'endpoint') {
      this._endpoint = newValue;
    }
  }

  set schema(val: FormSchema) {
    this._schema = val;
    this._data = {};
    this._errors = {};
    this._submitted = false;
    this.render();
  }

  get schema(): FormSchema | null {
    return this._schema;
  }

  set endpoint(val: string) {
    this._endpoint = val;
  }

  get endpoint(): string | null {
    return this._endpoint;
  }

  private async fetchSchema(url: string) {
    try {
      this.innerHTML = `<div style="padding:2rem;text-align:center;color:#64748b;font-family:sans-serif;">Loading form schema...</div>`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._schema = data.schema || data;
      this.render();
    } catch (err: any) {
      this.innerHTML = `<div style="padding:1.5rem;color:#e11d48;font-family:sans-serif;">Failed to load form schema: ${err.message}</div>`;
    }
  }

  private render() {
    if (!this._schema) {
      this.innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-family:sans-serif;">No form schema supplied.</div>`;
      return;
    }

    if (this._submitted) {
      this.innerHTML = `
        <div style="font-family:system-ui,-apple-system,sans-serif;padding:2.5rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:1rem;text-align:center;max-width:32rem;margin:0 auto;">
          <div style="font-size:2rem;margin-bottom:0.75rem;">✓</div>
          <h3 style="margin:0 0 0.5rem 0;color:#0f172a;font-size:1.25rem;">Response Submitted</h3>
          <p style="color:#475569;font-size:0.875rem;margin:0 0 1.5rem 0;">
            ${this._schema.settings?.successMessage || 'Thank you! Your response has been recorded.'}
          </p>
          <button id="ff-reset-btn" style="background:#0f172a;color:#ffffff;border:none;border-radius:0.5rem;padding:0.5rem 1.25rem;font-size:0.875rem;font-weight:600;cursor:pointer;">
            Submit Another Response
          </button>
        </div>
      `;
      this.querySelector('#ff-reset-btn')?.addEventListener('click', () => {
        this._submitted = false;
        this._data = {};
        this._errors = {};
        this.render();
      });
      return;
    }

    const fieldsHtml = this._schema.fields
      .map((f) => {
        const err = this._errors[f.key];
        const val = this._data[f.key] ?? '';
        const requiredMark = f.validation?.required ? '<span style="color:#ef4444;">*</span>' : '';
        const errorHtml = err
          ? `<div style="color:#e11d48;font-size:0.75rem;margin-top:0.25rem;">⚠ ${err}</div>`
          : '';

        let inputHtml = '';
        if (f.type === 'textarea') {
          inputHtml = `<textarea id="ff-${f.key}" data-key="${f.key}" rows="3" placeholder="${f.placeholder || ''}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${err ? '#f43f5e' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;">${val}</textarea>`;
        } else if (f.type === 'select') {
          const opts = (f.options || [])
            .map((o) => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`)
            .join('');
          inputHtml = `<select id="ff-${f.key}" data-key="${f.key}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${err ? '#f43f5e' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;"><option value="">-- Choose an option --</option>${opts}</select>`;
        } else {
          inputHtml = `<input id="ff-${f.key}" data-key="${f.key}" type="${f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}" placeholder="${f.placeholder || ''}" value="${val}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${err ? '#f43f5e' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;" />`;
        }

        return `
        <div style="margin-bottom:1.25rem;">
          <label for="ff-${f.key}" style="display:block;font-size:0.875rem;font-weight:600;color:#1e293b;margin-bottom:0.35rem;">
            ${f.label} ${requiredMark}
          </label>
          ${f.helpText ? `<div style="font-size:0.75rem;color:#64748b;margin-bottom:0.35rem;">${f.helpText}</div>` : ''}
          ${inputHtml}
          ${errorHtml}
        </div>
      `;
      })
      .join('');

    this.innerHTML = `
      <form id="ff-form" style="font-family:system-ui,-apple-system,sans-serif;background:#ffffff;border:1px solid #e2e8f0;border-radius:1rem;padding:2rem;max-width:38rem;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="margin-bottom:1.5rem;border-bottom:1px solid #f1f5f9;padding-bottom:1rem;">
          <h2 style="margin:0 0 0.5rem 0;color:#0f172a;font-size:1.35rem;font-weight:700;">${this._schema.title}</h2>
          ${this._schema.description ? `<p style="margin:0;color:#64748b;font-size:0.875rem;">${this._schema.description}</p>` : ''}
        </div>

        <div>${fieldsHtml}</div>

        <div style="margin-top:1.5rem;border-top:1px solid #f1f5f9;padding-top:1.25rem;display:flex;justify-content:flex-end;">
          <button type="submit" ${this._submitting ? 'disabled' : ''} style="background:#059669;color:#ffffff;border:none;border-radius:0.5rem;padding:0.65rem 1.5rem;font-size:0.875rem;font-weight:600;cursor:pointer;">
            ${this._submitting ? 'Submitting...' : this._schema.settings?.submitButtonText || 'Submit Response'}
          </button>
        </div>
      </form>
    `;

    // Attach listeners
    this.querySelectorAll('input, textarea, select').forEach((el) => {
      el.addEventListener('input', (e: any) => {
        const key = e.target.getAttribute('data-key');
        if (key) this._data[key] = e.target.value;
      });
      el.addEventListener('change', (e: any) => {
        const key = e.target.getAttribute('data-key');
        if (key) this._data[key] = e.target.value;
      });
    });

    this.querySelector('#ff-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  private async handleSubmit() {
    if (!this._schema || this._submitting) return;

    // Validate using @formforge/core
    const validation = validateFormSubmission(this._schema, this._data);
    if (!validation.valid) {
      this._errors = validation.errors;
      this.render();
      return;
    }

    this._submitting = true;
    this.render();

    const payload = {
      formId: this._schema.id,
      formVersion: this._schema.version,
      data: this._data,
      metadata: {
        submittedAt: new Date().toISOString(),
        client: 'WebComponent',
      },
    };

    // Dispatch custom DOM event for host application
    this.dispatchEvent(
      new CustomEvent('formforge:submit', {
        detail: payload,
        bubbles: true,
        composed: true,
      })
    );

    if (this._endpoint) {
      try {
        const res = await fetch(this._endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this._submitted = true;
      } catch (err: any) {
        alert(`Submission error: ${err.message}`);
      } finally {
        this._submitting = false;
        this.render();
      }
    } else {
      this._submitting = false;
      this._submitted = true;
      this.render();
    }
  }
}

// Define the custom element if in browser environment
if (typeof customElements !== 'undefined' && !customElements.get('formforge-form')) {
  customElements.define('formforge-form', FormForgeElement);
}
