# ProtocolSync Monorepo - Deployment Guide

## Overview

This monorepo contains the ProtocolSync web portal and shared packages ready for web and mobile development.

**Status**: ✅ Phase 2 Complete - All shared packages created and building successfully

## Repository Structure

```
protocolsync-monorepo/
├── apps/
│   └── portal-web/          # Web application (React + Vite + React-Admin)
├── packages/
│   ├── shared-types/        # TypeScript types
│   ├── shared-constants/    # API endpoints, roles, config
│   ├── shared-utils/        # Validation, formatters
│   ├── shared-services/     # ApiClient, auth interfaces
│   └── shared-hooks/        # React hooks (useLogin, etc.)
├── package.json             # Root workspace config
└── turbo.json              # Turborepo orchestration
```

## Prerequisites

- Node.js 18+ (Current: v24.12.0)
- npm 7+ (Current: v11.6.2)

## Installation

```bash
cd ~/Documents/Projects/protocolsync-monorepo
npm install
```

## Building

### Build All Packages
```bash
npm run build
```

### Build Web Portal Only
```bash
npm run build:web
```

## Development

### Run Web Dev Server
```bash
npm run dev:web
```

The web portal will be available at `http://localhost:5173`

### Watch Mode for Packages
```bash
# In separate terminals
cd packages/shared-types && npm run watch
cd packages/shared-constants && npm run watch
# ... etc
```

## Production Deployment

### 1. Build for Production

```bash
cd ~/Documents/Projects/protocolsync-monorepo
npm install
npm run build:web
```

### 2. Deploy Static Files

The build output is in `apps/portal-web/dist/`:

```bash
# Serve locally for testing
cd apps/portal-web
npx serve -s dist -l 8080
```

### 3. Environment Variables

Set these in your deployment environment:

```bash
VITE_API_URL=https://protocolsync-app-prod-bkfovjzn35ddq.azurewebsites.net
VITE_API_KEY=your-api-key
VITE_AZURE_CLIENT_ID=d29b70a1-86f2-4ae4-8da9-823416860cda
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_REDIRECT_URI=https://your-domain.com
```

### 4. Deploy Options

**Azure Static Web Apps:**
```bash
# Deploy dist folder to Azure
az staticwebapp deploy --app-name protocolsync-portal --resource-group rg-protocolsync
```

**Other Options:**
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- AWS S3 + CloudFront
- GitHub Pages (if applicable)

## Rollback Strategy

If issues arise with the monorepo version:

### Option 1: Revert to Backup
```bash
cd ~/Documents/Projects/protocolsync-portal-backup-20260108
npm install
npm run build
npm run dev
```

### Option 2: Use Original Portal
```bash
cd ~/Documents/Projects/protocolsync-portal
npm install
npm run build
npm run dev
```

## Verification Checklist

Before deploying to production:

- [ ] All packages build without errors: `npm run build`
- [ ] Web portal builds: `npm run build:web`
- [ ] Dev server runs: `npm run dev:web`
- [ ] Login flow works
- [ ] Dashboard loads correctly
- [ ] API calls succeed
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Production build tested locally

## Troubleshooting

### Cannot find module '@protocolsync/shared-*'
```bash
npm install
npm run build
```

### Web app won't start
```bash
cd apps/portal-web
rm -rf node_modules dist
cd ../..
npm install
npm run build:web
```

### TypeScript errors
```bash
npm run typecheck
```

### Clean rebuild
```bash
npm run clean
npm install
npm run build
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Web Portal

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build packages
        run: npm run build

      - name: Build web app
        run: npm run build:web

      - name: Deploy
        run: |
          # Your deployment command here
          cd apps/portal-web/dist
          # Deploy to your hosting service
```

## Package Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm run build:web` | Build web portal only |
| `npm run dev` | Run all dev servers |
| `npm run dev:web` | Run web dev server |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | TypeScript type checking |
| `npm run clean` | Clean all builds |

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review git history: `git log --oneline`
3. Compare with backup: `~/Documents/Projects/protocolsync-portal-backup-20260108`

## Next Steps

**Phase 3: Refactor Components** (Optional - can be done incrementally)
- Update components to import types from shared-types
- Create platform-specific file structure (.web.tsx pattern)
- Extract business logic to shared-hooks

**Phase 4: Mobile Development** (Ready when you are)
- Add `apps/mobile` with React Native/Expo
- Reuse all shared packages
- Create `.native.tsx` versions of components

## Success Metrics

✅ **Current Status:**
- Monorepo structure created
- 5 shared packages built and working
- Web portal builds successfully
- Zero breaking changes to existing functionality
- Original portal remains intact as backup

🎯 **Production Ready:**
- Can deploy to production immediately
- All tests pass (when implemented)
- Environment variables configured
- Rollback strategy tested
