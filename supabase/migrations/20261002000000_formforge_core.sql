-- =========================================================================
-- FormForge Migration: 20261002000000_formforge_core.sql
-- Description: Core Schema & Row Level Security (RLS) Policies for FormForge
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    current_version INT NOT NULL DEFAULT 1,
    schema JSONB NOT NULL,
    settings JSONB NOT NULL DEFAULT '{"submitButtonText": "Submit Response", "confirmationMessage": "Thank you! Your response has been recorded."}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

-- 3. Form Versions Table (Immutable schema snapshots)
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    schema JSONB NOT NULL,
    changelog TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_form_version UNIQUE (form_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);

-- 4. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    form_version INT NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- 5. Integrations Table (Phase 3 Foundation)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('webhook', 'postgres', 'mysql', 'mongodb')),
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_form_id ON integrations(form_id);

-- 6. Delivery Logs Table (Phase 3 Foundation)
CREATE TABLE IF NOT EXISTS delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    payload JSONB NOT NULL,
    response_code INT,
    response_body TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_integration_id ON delivery_logs(integration_id);

-- =========================================================================
-- Row Level Security (RLS) Configuration
-- =========================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Users can manage their own profile"
    ON users
    FOR ALL
    USING (auth.uid() = id);

-- Forms RLS
CREATE POLICY "Owners can view and manage their own forms"
    ON forms
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public respondents can view published forms"
    ON forms
    FOR SELECT
    USING (status = 'published');

-- Form Versions RLS
CREATE POLICY "Owners can manage versions of their forms"
    ON form_versions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_versions.form_id
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Public respondents can view published form versions"
    ON form_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_versions.form_id
            AND forms.status = 'published'
        )
    );

-- Submissions RLS
CREATE POLICY "Form owners can view and delete submissions"
    ON submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = submissions.form_id
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Public respondents can submit to published forms"
    ON submissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = submissions.form_id
            AND forms.status = 'published'
        )
    );

-- Integrations RLS
CREATE POLICY "Form owners can manage integrations"
    ON integrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = integrations.form_id
            AND forms.user_id = auth.uid()
        )
    );

-- Delivery Logs RLS
CREATE POLICY "Form owners can view integration delivery logs"
    ON delivery_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM integrations
            JOIN forms ON forms.id = integrations.form_id
            WHERE integrations.id = delivery_logs.integration_id
            AND forms.user_id = auth.uid()
        )
    );
