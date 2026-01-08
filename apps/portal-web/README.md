# ProtocolSync Portal - Day 11 Operational Dashboard

## 🎯 Overview
The ProtocolSync Portal is a secure admin interface for managing clinical trial protocol compliance. Built with React-Admin and integrated with Azure Entra ID for authentication.

## ✨ Features Implemented (Day 11)

### 1. **Secure Authentication**
- Azure Entra ID (formerly Azure AD) integration
- Protected routes - login required for access
- MSAL (Microsoft Authentication Library) implementation
- Designed for `david@protocolsync.org` identity

### 2. **Operational Dashboard**
- Real-time protocol status overview
- Live connection to backend APIs:
  - `GET /api/v1/documents/current` - Current protocols
  - `GET /api/v1/document/:masterId/versions` - Version history
- DOA (Delegation of Authority) log status
- Personnel training compliance tracking
- Visual compliance metrics

### 3. **Protocol Version Management**
- Complete version history for all protocols
- **Status control buttons** - "Set to Current" functionality
- Connected to `PUT /api/v1/document/:versionId/status` endpoint
- **Visual feedback** with color-coded status:
  - 🟢 **Green** = Current (active version)
  - 🔴 **Red** = Superseded (old version)
  - 🟡 **Yellow** = Draft (pending)
- Automatic cascading updates (setting one version to Current marks others as Superseded)

## 🚀 Getting Started

### Prerequisites
- Node.js v22.x
- npm 10.x
- Azure Entra ID tenant (for authentication)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your settings:**
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   ```

4. **Configure Azure Entra ID:**
   
   Edit `src/authConfig.ts` and replace placeholders:
   
   ```typescript
   clientId: 'YOUR_CLIENT_ID_HERE',
   authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE',
   ```

   To get these values:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to **Microsoft Entra ID** > **App registrations**
   - Create a new registration: "ProtocolSync Portal"
   - Set Redirect URI: `http://localhost:5173` (for dev)
   - Copy **Application (client) ID** and **Directory (tenant) ID**
   - Under "Authentication": Enable "Access tokens" and "ID tokens"
   - Under "API permissions": Add Microsoft Graph > User.Read

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Application Structure

```
src/
├── App.tsx                          # Main app with authentication wrapper
├── authConfig.ts                    # Azure Entra ID configuration
├── dataProvider.ts                  # Custom API data provider
├── OperationalDashboard.tsx         # Main dashboard (landing page)
├── ProtocolVersionManagement.tsx    # Version control & status management
├── Dashboard.tsx                    # Original Day 6 mockup (reference)
└── components/
    ├── Login.tsx                    # Azure AD login page
    ├── ProtectedRoute.tsx           # Authentication guard
    ├── Card.tsx                     # Reusable card components
    ├── CustomMenu.tsx               # Navigation menu
    └── CustomLayout.tsx             # React-Admin layout wrapper
```

## 🔌 API Integration

The portal connects to your backend API with the following endpoints:

### Current Documents
```
GET /api/v1/documents/current
Response: Array of current protocol documents
```

### Version History
```
GET /api/v1/document/:masterId/versions
Response: Array of all versions for a specific protocol
```

### Update Status (Critical Feature!)
```
PUT /api/v1/document/:versionId/status
Body: { status: "Current" }
Response: Updated document with new status
```

## 🎨 Key Features

### Protocol Version Management
- **View all versions** of each protocol in grouped tables
- **One-click status changes** via "Set to Current" button
- **Real-time updates** with visual feedback
- **Optimistic UI updates** for immediate response
- **Automatic status cascade** - when one version becomes Current, others become Superseded

### Operational Dashboard
- **Live metrics** from backend API
- **DOA log monitoring** - track missing signatures
- **Training compliance** - expiring certifications alerts
- **Version history** - recent protocol changes

## 🔐 Security

- All routes protected by Azure Entra ID authentication
- Session-based token storage (sessionStorage)
- Automatic redirect to login if unauthenticated
- Microsoft security best practices

## 🎯 Day 11 Objectives - ✅ Complete

- [x] Secure login with Azure Entra ID
- [x] Protected routing structure
- [x] Connect to real compliance APIs
- [x] Display current protocol status from API
- [x] Display version history from API
- [x] Build status control interface
- [x] Implement "Set to Current" button
- [x] Wire up PUT endpoint for status updates
- [x] Visual feedback for status changes
- [x] Color-coded status indicators

## 📝 Development Notes

### Mock Data Fallback
If the backend API is not available, the application will display mock data with a warning notification. This allows frontend development to continue independently.

### Testing the Status Update
1. Navigate to "Protocol Versions" in the sidebar
2. Find a protocol with multiple versions
3. Click "Set to Current" on a non-current version
4. Watch the status change from Superseded → Current (green)
5. Observe other versions automatically become Superseded (red)

## 🚧 Next Steps (Future Development)

- Implement document upload functionality
- Add audit trail logging
- Create staff management interface
- Build training certification tracking
- Add real-time notifications
- Implement DOA log management

## 👤 For Site Administrators

This portal is designed specifically for **Site Administrators** who need to:
- Maintain audit readiness
- Manage protocol versions
- Track compliance metrics
- Monitor training requirements
- Ensure DOA log completeness

---

Built with ❤️ using React-Admin, TypeScript, and Azure Entra ID

