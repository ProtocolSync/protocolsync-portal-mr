# Azure Entra ID Setup Instructions

## Quick Setup Guide for ProtocolSync Portal Authentication

### Step 1: Create App Registration in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click **App registrations** in the left menu
4. Click **+ New registration**

### Step 2: Configure Application Registration

**Basic Information:**
- **Name:** `ProtocolSync Portal`
- **Supported account types:** 
  - Select "Accounts in this organizational directory only (Single tenant)"
- **Redirect URI:**
  - Platform: `Single-page application (SPA)`
  - URI: `http://localhost:5173` (for development)
  - For production, add: `https://your-production-domain.com`

Click **Register**

### Step 3: Copy Required Values

After registration, you'll see the Overview page:

1. Copy **Application (client) ID** 
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   
2. Copy **Directory (tenant) ID**
   - Example: `12345678-1234-1234-1234-123456789012`

### Step 4: Configure Authentication

1. In your app registration, click **Authentication** in the left menu
2. Under "Implicit grant and hybrid flows":
   - ✅ Check **Access tokens** (used for implicit flows)
   - ✅ Check **ID tokens** (used for implicit and hybrid flows)
3. Click **Save**

### Step 5: Configure API Permissions

1. Click **API permissions** in the left menu
2. You should see **Microsoft Graph** > **User.Read** already added
3. If not, click **+ Add a permission**:
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Check **User.Read**
   - Click **Add permissions**

### Step 6: Update Your Code

Edit `src/authConfig.ts` in your project:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: 'PASTE_YOUR_APPLICATION_CLIENT_ID_HERE',
    authority: 'https://login.microsoftonline.com/PASTE_YOUR_TENANT_ID_HERE',
    redirectUri: window.location.origin,
  },
  // ... rest of config
};
```

### Step 7: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173`

3. You should see the ProtocolSync login page

4. Click **Sign in with Microsoft**

5. Use your credentials: `david@protocolsync.org`

6. After successful login, you'll be redirected to the Operational Dashboard

## Troubleshooting

### Common Issues

**Error: "AADSTS50011: The reply URL specified in the request does not match..."**
- Solution: Make sure `http://localhost:5173` is added as a redirect URI in Azure Portal

**Error: "AADSTS700016: Application with identifier was not found..."**
- Solution: Double-check your clientId in authConfig.ts matches Azure Portal

**Error: "Invalid tenant"**
- Solution: Verify your tenant ID is correct in authConfig.ts

**Login popup is blocked**
- Solution: Allow popups in your browser for localhost:5173

### Testing with Different Accounts

To test with multiple accounts or organizations:
1. Add additional redirect URIs in Azure Portal
2. Update the `authority` in authConfig.ts:
   - Single tenant: `https://login.microsoftonline.com/{tenantId}`
   - Multi-tenant: `https://login.microsoftonline.com/common`
   - Specific org: `https://login.microsoftonline.com/{tenantId}`

## Production Deployment

Before deploying to production:

1. Add production redirect URIs in Azure Portal:
   - Example: `https://portal.protocolsync.org`

2. Update environment variables:
   ```
   VITE_API_URL=https://api.protocolsync.org/api/v1
   ```

3. Consider using environment-specific app registrations:
   - Development App Registration
   - Production App Registration

## Security Best Practices

✅ **Do:**
- Use separate app registrations for dev/staging/production
- Regularly rotate client secrets (if using confidential client flow)
- Enable Conditional Access policies
- Monitor sign-in logs in Azure Portal
- Use managed identities when possible

❌ **Don't:**
- Commit client secrets to version control
- Share app registration credentials
- Use production credentials in development
- Allow all redirect URIs (be specific)

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/azure/active-directory/develop/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [React MSAL Guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)

---

**Support Contact:** david@protocolsync.org
