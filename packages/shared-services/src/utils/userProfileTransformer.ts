import type { User, Role } from '@protocolsync/shared-types';

/**
 * Transform backend API response to User type
 * Used by both web and mobile platforms for consistency
 *
 * Handles multiple response formats from the backend:
 * - Wrapped format: { data: { user: {...}, company: {...}, site: {...} } }
 * - Flat format: { user: {...}, company: {...}, site: {...} }
 * - Legacy format: { id, email, role, client: {...}, ... }
 */
export function transformUserProfileResponse(rawData: any): User {
  // Extract the actual data from the response wrapper
  const responseData = rawData.data || rawData;
  const userData = responseData.user || responseData;
  const companyData = responseData.company;
  const siteData = responseData.site;

  // Extract user ID with fallbacks
  const userId = userData.user_id?.toString()
    || userData.id?.toString()
    || responseData.id?.toString()
    || '';

  // Extract Azure AD user ID with fallbacks
  const azureAdUserId = userData.azure_ad_object_id
    || responseData.azureAdUserId
    || responseData.azure_ad_user_id
    || '';

  // Extract email
  const email = userData.email || responseData.email || '';

  // Extract display name with fallbacks
  const displayName = userData.full_name
    || userData.name
    || responseData.displayName
    || responseData.display_name
    || responseData.name
    || '';

  // Extract role with fallbacks
  const roleValue = userData.role
    || (typeof responseData.role === 'object' ? responseData.role?.name : responseData.role)
    || responseData.role_name
    || 'site_user';
  const role = roleValue as Role;

  // Extract client ID with fallbacks (from company or legacy client)
  const clientId = companyData?.company_id?.toString()
    || responseData.client?.client_id
    || responseData.clientId
    || responseData.client_id
    || '';

  // Build client object
  const client = {
    name: companyData?.company_name
      || responseData.client?.client_name
      || responseData.client?.name
      || 'Unknown Client',
    organizationType: companyData?.subscription_tier
      || responseData.client?.organization_type
      || responseData.client?.organizationType
      || 'research_site'
  };

  // Build company object if data exists
  const company = companyData ? {
    id: companyData.company_id?.toString() || '',
    name: companyData.company_name || '',
    code: companyData.company_code,
    subscriptionTier: companyData.subscription_tier
  } : undefined;

  // Build site object if data exists
  const site = siteData ? {
    id: siteData.site_id?.toString() || '',
    number: siteData.site_number,
    name: siteData.site_name || ''
  } : undefined;

  // Extract last login with fallbacks
  const lastLogin = userData.last_login_at
    || userData.last_login
    || responseData.lastLogin
    || responseData.last_login;

  return {
    id: userId,
    azureAdUserId,
    email,
    displayName,
    role,
    clientId,
    client,
    company,
    site,
    lastLogin
  };
}
