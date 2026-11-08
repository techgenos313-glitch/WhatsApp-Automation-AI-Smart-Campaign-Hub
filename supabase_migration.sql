-- Supabase Multi-Tenant WhatsApp Automation SaaS Schema & RLS Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_contacts INT NOT NULL DEFAULT 500,
    max_messages_per_day INT NOT NULL DEFAULT 200,
    max_staff_accounts INT NOT NULL DEFAULT 3,
    allow_ai_auto_answer BOOLEAN NOT NULL DEFAULT true,
    allow_custom_videos BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenants / Businesses Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_user_id VARCHAR(100),
    sender_number VARCHAR(50) NOT NULL DEFAULT '',
    urdu_footer TEXT NOT NULL DEFAULT '',
    enable_urdu_footer BOOLEAN NOT NULL DEFAULT true,
    daily_limit_per_category INT NOT NULL DEFAULT 3,
    ai_delay_minutes INT NOT NULL DEFAULT 5,
    ai_system_instruction TEXT NOT NULL DEFAULT '',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tenant Users & Roles (RBAC) Table
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF')),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

-- 4. Tenant Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES public.subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    messages_sent_this_month INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    folder_path VARCHAR(255),
    video_file VARCHAR(255),
    video_url TEXT NOT NULL,
    caption_template TEXT NOT NULL,
    daily_limit INT NOT NULL DEFAULT 3,
    sent_today INT NOT NULL DEFAULT 0,
    color VARCHAR(50) DEFAULT 'blue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

-- 6. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    category_id VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    last_sent_at TIMESTAMPTZ,
    messages_sent_today INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

-- 7. WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    category_id VARCHAR(100) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    video_url TEXT,
    footer_text TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'delivered',
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

-- 8. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category_id VARCHAR(100) NOT NULL,
    target_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Consent Records Table
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    contact_phone VARCHAR(50) NOT NULL,
    opted_in BOOLEAN NOT NULL DEFAULT true,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, contact_phone)
);

-- 11. Message Jobs Queue Table
CREATE TABLE IF NOT EXISTS public.message_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) REFERENCES public.tenants(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    attempts INT NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_jobs ENABLE ROW LEVEL SECURITY;

-- Insert Default Subscription Plans
INSERT INTO public.subscription_plans (id, name, price_monthly, max_contacts, max_messages_per_day, max_staff_accounts, allow_ai_auto_answer, allow_custom_videos)
VALUES 
    ('plan_starter', 'Starter Business Plan', 29.00, 500, 200, 2, true, false),
    ('plan_pro', 'Business Pro Suite', 79.00, 2500, 1000, 10, true, true),
    ('plan_enterprise', 'Enterprise Unlimited', 199.00, 10000, 5000, 50, true, true)
ON CONFLICT (id) DO NOTHING;
