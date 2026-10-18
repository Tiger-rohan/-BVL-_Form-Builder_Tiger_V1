/**
 * FormForge Universal Hosted Client SDK v1.0.0
 * Embed and render forms from your hosted FormForge instance into ANY website,
 * framework (React, Vue, Angular), or plain HTML with zero npm dependencies.
 */
(function (global) {
  'use strict';

  // 1. Custom Element: <formforge-form>
  class FormForgeElement extends HTMLElement {
    constructor() {
      super();
      this._schema = null;
      this._endpoint = null;
      this._data = {};
      this._errors = {};
      this._submitting = false;
      this._submitted = false;
    }

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

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'src' && newValue) {
        this.fetchSchema(newValue);
      } else if (name === 'endpoint') {
        this._endpoint = newValue;
      }
    }

    async fetchSchema(url) {
      try {
        this.innerHTML = '<div style="padding:2rem;text-align:center;color:#64748b;font-family:sans-serif;">Loading form...</div>';
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        this._schema = json.form ? (json.form.schema || json.form) : (json.schema || json);
        this.render();
      } catch (err) {
        this.innerHTML = '<div style="padding:1.5rem;color:#e11d48;font-family:sans-serif;background:#fff1f2;border-radius:12px;border:1px solid #ffe4e6;">Failed to load form: ' + err.message + '</div>';
      }
    }

    render() {
      if (!this._schema) {
        this.innerHTML = '<div style="padding:2rem;text-align:center;color:#94a3b8;font-family:sans-serif;">No form schema loaded.</div>';
        return;
      }

      if (this._submitted) {
        this.innerHTML = `
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:3rem 2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:1.25rem;text-align:center;max-width:32rem;margin:0 auto;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
            <div style="width:48px;height:48px;background:#ecfdf5;color:#059669;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin-bottom:1rem;">✓</div>
            <h3 style="margin:0 0 0.5rem 0;color:#0f172a;font-size:1.25rem;font-weight:700;">Response Submitted</h3>
            <p style="color:#64748b;font-size:0.875rem;margin:0 0 1.5rem 0;">Thank you! Your response has been securely saved.</p>
            <button id="ff-reset-btn" style="background:#0f172a;color:#ffffff;border:none;border-radius:0.75rem;padding:0.6rem 1.25rem;font-size:0.875rem;font-weight:600;cursor:pointer;">Submit Another</button>
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

      const fields = this._schema.fields || [];
      const title = this._schema.title || 'Form';
      const description = this._schema.description || '';

      let fieldsHtml = '';
      fields.forEach((field) => {
        const error = this._errors[field.key || field.name || field.id];
        const val = this._data[field.key || field.name || field.id] || '';
        const requiredMark = field.validation?.required ? '<span style="color:#e11d48;margin-left:2px;">*</span>' : '';
        const errorHtml = error ? `<div style="color:#e11d48;font-size:0.75rem;margin-top:0.25rem;">${error}</div>` : '';

        let inputHtml = '';
        const fieldKey = field.key || field.name || field.id;

        if (field.type === 'textarea') {
          inputHtml = `<textarea name="${fieldKey}" rows="3" placeholder="${field.placeholder || ''}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${error ? '#e11d48' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;font-family:inherit;">${val}</textarea>`;
        } else if (field.type === 'select') {
          const options = (field.options || []).map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLbl = typeof opt === 'object' ? opt.label : opt;
            return `<option value="${optVal}" ${val === optVal ? 'selected' : ''}>${optLbl}</option>`;
          }).join('');
          inputHtml = `<select name="${fieldKey}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${error ? '#e11d48' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;font-family:inherit;background:#fff;"><option value="">Select an option...</option>${options}</select>`;
        } else {
          inputHtml = `<input type="${field.type || 'text'}" name="${fieldKey}" value="${val}" placeholder="${field.placeholder || ''}" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid ${error ? '#e11d48' : '#cbd5e1'};border-radius:0.5rem;font-size:0.875rem;font-family:inherit;" />`;
        }

        fieldsHtml += `
          <div style="margin-bottom:1.25rem;">
            <label style="display:block;font-size:0.8125rem;font-weight:600;color:#334155;margin-bottom:0.35rem;">
              ${field.label || fieldKey} ${requiredMark}
            </label>
            ${inputHtml}
            ${errorHtml}
          </div>
        `;
      });

      this.innerHTML = `
        <form style="font-family:system-ui,-apple-system,sans-serif;max-width:36rem;margin:0 auto;background:#ffffff;padding:2rem;border:1px solid #e2e8f0;border-radius:1.25rem;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
          <div style="margin-bottom:1.5rem;border-bottom:1px solid #f1f5f9;padding-bottom:1rem;">
            <h2 style="margin:0 0 0.35rem 0;color:#0f172a;font-size:1.375rem;font-weight:700;">${title}</h2>
            ${description ? `<p style="margin:0;color:#64748b;font-size:0.875rem;">${description}</p>` : ''}
          </div>
          ${fieldsHtml}
          <div style="margin-top:1.5rem;display:flex;justify-content:flex-end;">
            <button type="submit" ${this._submitting ? 'disabled' : ''} style="background:#059669;color:#ffffff;border:none;border-radius:0.75rem;padding:0.7rem 1.5rem;font-size:0.875rem;font-weight:600;cursor:pointer;opacity:${this._submitting ? 0.6 : 1};transition:background 0.2s;">
              ${this._submitting ? 'Submitting...' : (this._schema.settings?.submitButtonText || 'Submit Form')}
            </button>
          </div>
        </form>
      `;

      // Attach event listeners
      const formEl = this.querySelector('form');
      formEl?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });

      formEl?.querySelectorAll('input, select, textarea').forEach((input) => {
        input.addEventListener('input', (e) => {
          const target = e.target;
          this._data[target.name] = target.value;
          if (this._errors[target.name]) {
            delete this._errors[target.name];
          }
        });
      });
    }

    validate() {
      const errors = {};
      const fields = this._schema?.fields || [];
      fields.forEach((f) => {
        const key = f.key || f.name || f.id;
        const val = this._data[key];
        if (f.validation?.required) {
          if (val === undefined || val === null || val === '') {
            errors[key] = f.label ? `${f.label} is required` : 'This field is required';
          }
        }
      });
      this._errors = errors;
      return Object.keys(errors).length === 0;
    }

    async handleSubmit() {
      if (!this.validate()) {
        this.render();
        return;
      }

      this._submitting = true;
      this.render();

      try {
        const targetUrl = this._endpoint || (this.getAttribute('src') + '/submit');
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: this._data }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Submission failed');
        }

        const result = await res.json().catch(() => ({}));
        this._submitted = true;
        this._submitting = false;

        // Dispatch DOM event for host app
        this.dispatchEvent(
          new CustomEvent('formforge:submit', {
            bubbles: true,
            composed: true,
            detail: { data: this._data, result },
          })
        );

        this.render();
      } catch (err) {
        this._submitting = false;
        alert('Submission error: ' + err.message);
        this.render();
      }
    }
  }

  // Register Custom Element
  if (!customElements.get('formforge-form')) {
    customElements.define('formforge-form', FormForgeElement);
  }

  // 2. Global Helper Object: window.FormForge
  const FormForge = {
    version: '1.0.0',

    embed(selector, options) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) {
        console.error('[FormForge] Target container not found:', selector);
        return;
      }

      const formUrl = options.formUrl || `${options.host}/#embed/${options.formSlug}`;
      const height = options.height || '650px';

      const iframe = document.createElement('iframe');
      iframe.src = formUrl;
      iframe.style.width = '100%';
      iframe.style.height = height;
      iframe.style.border = 'none';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
      iframe.setAttribute('title', options.title || 'FormForge Survey');

      el.innerHTML = '';
      el.appendChild(iframe);

      if (options.onSuccess) {
        window.addEventListener('message', (event) => {
          if (event.data?.type === 'formforge:submit') {
            options.onSuccess(event.data.payload);
          }
        });
      }

      return iframe;
    },
  };

  global.FormForge = FormForge;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormForge;
  }
})(typeof window !== 'undefined' ? window : globalThis);
