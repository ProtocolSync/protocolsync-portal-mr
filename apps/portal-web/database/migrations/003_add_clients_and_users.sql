-- Migration: Add Clients and Users tables for multi-tenancy
-- Description: Creates tables to store research sites (clients) and user profiles with Azure Entra ID integration
-- Date: 2025-11-24

-- =====================================================
-- Table: clients
-- Purpose: Store research sites/CROs for multi-tenancy
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) CHECK (organization_type IN ('research_site', 'cro', 'sponsor')),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT clients_name_unique UNIQUE (name)
);

-- Index for filtering active clients
CREATE INDEX idx_clients_active ON clients(active) WHERE active = true;

-- =====================================================
-- Table: users
-- Purpose: Store user profiles linked to Azure Entra ID
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Azure Entra ID (Azure AD) information
    azure_ad_user_id VARCHAR(255) NOT NULL UNIQUE,  -- Object ID from Azure AD
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    
    -- Multi-tenancy and authorization
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('site_admin', 'coordinator', 'investigator', 'monitor', 'viewer')),
    
    -- User status
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT users_azure_ad_user_id_unique UNIQUE (azure_ad_user_id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Indexes for performance
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_azure_ad_user_id ON users(azure_ad_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- Updated Trigger: Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data: Sample clients and users
-- =====================================================

-- Sample client (research site)
INSERT INTO clients (id, name, organization_type, contact_email, contact_phone, address)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'ProtocolSync Demo Site', 'research_site', 'contact@protocolsync.org', '555-0100', '123 Medical Center Dr, Research City, RC 12345')
ON CONFLICT (name) DO NOTHING;

-- Sample user (linked to Azure AD)
-- Note: Replace 'YOUR_AZURE_AD_OBJECT_ID' with actual Azure AD Object ID
INSERT INTO users (azure_ad_user_id, email, display_name, client_id, role, active)
VALUES 
    ('david-azure-ad-object-id', 'david@protocolsync.org', 'David Taylor', '550e8400-e29b-41d4-a716-446655440000', 'site_admin', true)
ON CONFLICT (azure_ad_user_id) DO NOTHING;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE clients IS 'Stores research sites, CROs, and sponsor organizations for multi-tenancy';
COMMENT ON TABLE users IS 'User profiles linked to Azure Entra ID for authentication and authorization';

COMMENT ON COLUMN users.azure_ad_user_id IS 'Azure AD Object ID (oid claim from JWT token)';
COMMENT ON COLUMN users.client_id IS 'Links user to their research site/organization for data isolation';
COMMENT ON COLUMN users.role IS 'User role: site_admin, coordinator, investigator, monitor, or viewer';

-- =====================================================
-- Views for common queries
-- =====================================================

-- View: Active users with client information
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    u.id,
    u.azure_ad_user_id,
    u.email,
    u.display_name,
    u.role,
    u.last_login,
    c.id AS client_id,
    c.name AS client_name,
    c.organization_type
FROM users u
INNER JOIN clients c ON u.client_id = c.id
WHERE u.active = true AND c.active = true;

COMMENT ON VIEW v_active_users IS 'Active users with their associated client information';
