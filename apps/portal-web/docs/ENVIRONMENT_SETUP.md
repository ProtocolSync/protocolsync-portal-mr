# Environment Configuration for Role-Based Portal

## Required Environment Variables

Create or update your `.env` file in the project root:

```bash
# Stripe Configuration (Required for Billing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# API Configuration (Existing)
VITE_API_URL=http://localhost:3000/api/v1

# Azure AD Configuration (Existing)
# Add your Azure AD configuration here if not already present
```

## Getting Stripe API Keys

### For Development/Testing

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create a Stripe account (free for testing)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)
5. Add it to your `.env` file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Abc...
   ```

### For Production

1. Complete Stripe account activation
2. Use the **Live mode** publishable key (starts with `pk_live_`)
3. **Important**: Never commit live keys to version control

## Test Credit Cards

Stripe provides test cards for development:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0000 0000 0341 | Requires authentication |

- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

## Database Schema Updates Needed

### Companies Table
```sql
-- Add subscription fields if not present
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'basic';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
```

### Sites Table
```sql
-- Create sites table if not exists
CREATE TABLE IF NOT EXISTS sites (
  site_id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(company_id),
  site_number VARCHAR(50) UNIQUE NOT NULL,
  site_name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User-Site Relationships
```sql
-- Link users to specific sites
ALTER TABLE users ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES sites(site_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_company_id ON sites(company_id);
```

## User Role Configuration

### CRO Admin Users
Set `account_type = 'company_admin'` or `'system_admin'` in the users table:

```sql
UPDATE users 
SET account_type = 'company_admin'
WHERE email = 'admin@cro.com';
```

### Site Admin Users
Set `account_type = 'site_user'` and assign a site:

```sql
UPDATE users 
SET account_type = 'site_user',
    site_id = 1
WHERE email = 'siteadmin@site.com';
```

## Running the Application

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Test with different roles**:
   - Login as CRO admin → Should see Sites, Billing
   - Login as Site admin → Should see Protocols, Delegation Log

## Troubleshooting

### Stripe not loading
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_` or `pk_live_`

### Wrong dashboard showing
- Check user's `account_type` in database
- Clear browser cache/cookies
- Check browser console for user context logs

### Payment form errors
- Stripe test mode only accepts test cards
- Card number must be exactly as specified in test cards
- Check browser console for detailed Stripe errors

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Using test Stripe keys in development
- [ ] Live Stripe keys only in production environment variables
- [ ] API endpoints validate user permissions
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting on payment endpoints

## Next Steps

1. Set up Stripe test account
2. Add publishable key to `.env`
3. Test payment form with test cards
4. Implement backend Stripe integration
5. Add webhook handling for payment events
6. Test role-based access with different user types
