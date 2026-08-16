# SafeRoad Angular UI - Project Structure

## Directory Overview

```
src/app/
├── models/
│   └── index.ts                    # All TypeScript interfaces/models
│
├── commoncomponents/
│   ├── header/
│   │   ├── header.component.ts
│   │   ├── header.component.html
│   │   └── header.component.scss
│   │
│   └── sidebar/
│       ├── sidebar.component.ts
│       ├── sidebar.component.html
│       └── sidebar.component.scss
│
├── pages/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.scss
│   │
│   ├── violations/
│   │   ├── violations.component.ts
│   │   ├── violations.component.html
│   │   └── violations.component.scss
│   │
│   ├── rewards/
│   │   ├── rewards.component.ts
│   │   ├── rewards.component.html
│   │   └── rewards.component.scss
│   │
│   └── verifications/
│       ├── verifications.component.ts
│       ├── verifications.component.html
│       └── verifications.component.scss
│
├── app.ts                          # Root component
├── app.html                        # Root layout
├── app.scss                        # Global styles
├── app.routes.ts                   # Route definitions
└── app.config.ts                   # App configuration
```

## Component Hierarchy

```
app-root (app.ts)
├── app-header
│   ├── Logo & Title
│   ├── Notifications
│   └── User Profile
│
├── app-sidebar
│   ├── Main Menu
│   │   ├── Dashboard
│   │   ├── Report Violation
│   │   ├── My Reports
│   │   ├── Verifications
│   │   ├── Rewards
│   │   ├── Wallet
│   │   └── Notifications
│   ├── Admin Menu
│   │   ├── Admin Dashboard
│   │   ├── User Management
│   │   └── Admin Logs
│   └── Quick Stats
│
└── Main Content Area (router-outlet)
    ├── dashboard-component
    ├── violations-component
    ├── rewards-component
    ├── verifications-component
    └── ...
```

## Key Features by Component

### Dashboard
- Welcome section with user name
- 4 stat cards with icons and hover effects
- Wallet summary (total earned, redeemed, balance)
- Recent reports widget
- Recent rewards widget
- Activity timeline with 6+ activities

### Violations
- Advanced search with real-time filtering
- Status filter dropdown
- Result counter
- List of violations with thumbnails
- Confidence badges
- Modal detail view with:
  - Full violation image
  - Vehicle plate number
  - Category
  - Date/time
  - Location coordinates
  - Status
  - Action buttons (Edit, Delete)

### Rewards
- 3 summary stat cards (Total, Completed, Pending)
- Tabbed interface (2 tabs)
- Rewards table with sortable columns
- Transaction timeline
- Format amounts with ₹ currency
- Status badges (Completed, Pending, Rejected)

### Verifications (Admin)
- 4 stat cards (Total, Pending Review, Approved, Rejected)
- Search by violation ID or plate number
- Status filter
- Verification cards with:
  - Confidence score bar
  - Verification method
  - Admin who verified
  - Preview of comments
- Detail modal with:
  - Full violation info
  - Verification details
  - Comments and evidence notes
  - Rejection reason (if applicable)
  - Approve/Reject buttons

## Styling Scheme

### Colors
- Primary: `#1e3c72` (Dark Blue)
- Secondary: `#2a5298` (Medium Blue)
- Success: `#2ed573` (Green)
- Warning: `#ff9500` (Orange)
- Danger: `#ff4757` (Red)
- Background: `#f5f7fa` (Light Blue-Gray)
- Border: `#e0e0e0` (Light Gray)

### Responsive Breakpoints
- Desktop: Default styles
- Tablet/Mobile: Max-width 768px
  - Stack layout vertically
  - Full-width buttons and inputs
  - Sidebar collapses to hamburger menu
  - Simplified grid layouts

## Data Flow

### Current (Hardcoded)
1. Components load
2. Hardcoded data arrays are populated
3. Data is displayed in templates with `*ngFor` loops
4. User interactions update local component state

### Future (API Integration)
1. Services will call FastAPI backend
2. Data will be retrieved asynchronously
3. Loading/error states will be displayed
4. Update operations will trigger API calls

## Sample Data Included

- 6 violation reports with full details
- 6 rewards with transaction history
- 6 verification records with different statuses
- 5 transactions spanning money earned and redeemed
- 4+ recent activities in timeline

## Ready for Production Features

When ready to connect to the backend:
1. **Authentication**: Add login/logout pages
2. **API Services**: Create HttpClient services for each data model
3. **State Management**: Implement NgRx or Akita for state
4. **Error Handling**: Add error pages and notifications
5. **Form Validation**: Add reactive forms for data submission
6. **Pagination**: Add pagination for large lists
7. **Sorting**: Add sorting to tables
8. **Export**: Add CSV/PDF export functionality

