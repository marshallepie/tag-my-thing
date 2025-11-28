# TagMyThing - Technical Documentation

**Version:** 1.0  
**For Developers & Contributors**

---

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Lucide React** for icons

### Backend & Database
- **Supabase** for authentication, database, and storage
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates

### Key Features
- **Camera Integration** - Direct photo/video capture
- **Token Economy** - TMT tokens for platform interactions
- **GPS Location Tracking** - Automatic location capture with Google Maps API
- **Blockchain Ready** - Prepared for immutable asset records
- **Mobile-First** - Responsive design optimized for mobile devices
- **Progressive Web App** - Installable on mobile devices

---

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Layout)
│   ├── modals/         # Modal components (LocationPermissionModal)
│   ├── tagging/        # Asset tagging components
│   └── ui/             # Base UI components (Button, Card, etc.)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication management
│   ├── useGeolocation.ts # GPS location tracking
│   ├── useTokens.ts    # Token balance management
│   └── useReferrals.ts # Referral system
├── lib/                # Utility libraries and configurations
│   ├── supabase.ts     # Supabase client configuration
│   └── utils.ts        # General utilities
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)
- Google Maps API key (for GPS features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/marshallepie/tag-my-thing.git
   cd tag-my-thing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Google Maps API (for GPS features)
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Environment
   VITE_ENVIRONMENT=development
   
   # Email Service (Resend)
   VITE_RESEND_API_KEY=your_resend_api_key
   VITE_FROM_EMAIL=noreply@yourdomain.com
   
   # Stripe Configuration (for payments)
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   VITE_STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Build Commands
```bash
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run test     # Run test suite
```

---

## 📱 Core Architecture

### GPS Location System
The app features a dual-location tracking system:

1. **Manual Item Location**: User-entered text describing where an item is stored
2. **Automatic GPS Coordinates**: Device location when the app is used (with permission)

#### Components:
- `LocationPermissionModal` - Handles GPS permission requests during authentication
- `LocationToggle` - Dashboard component for GPS settings and current location display
- `useGeolocation` - Hook managing GPS permissions, location tracking, and Google Maps integration

### Asset Tagging Workflow
1. **Capture** - Use device camera to take photo/video
2. **Tag** - Add title, description, tags, and metadata
3. **Location** - Manual item location + automatic GPS capture (if enabled)
4. **Secure** - Store with encryption and optional blockchain publishing
5. **Manage** - View, edit, and organize your assets
6. **Share** - Control privacy and next-of-kin access

### Next-of-Kin & Dead Man's Switch
Advanced NOK management system with DMS protection:

#### Core Features
- **Incoming NOK Assignments** - Track assets where you've been designated as someone's next-of-kin
- **Outgoing NOK Assignments** - Manage assets you've assigned to others as next-of-kin
- **Dead Man's Switch Protection** - Assets are only accessible to NOK after a specified period of inactivity
- **Privacy Protection** - NOK can see they've been assigned without viewing asset details until DMS triggers
- **Mass Assignment** - Assign all your assets to a single NOK in one action
- **Reassignment** - NOK can reassign incoming assignments to other trusted individuals

#### How It Works
1. **Add Next-of-Kin** - Register trusted individuals with their contact information
2. **Assign Assets** - Choose specific assets or use mass assignment to assign all assets
3. **Set DMS Period** - Define how long you must be inactive before access is granted (1-5 years)
4. **Privacy Protection** - NOK only sees assignment notification, not asset details
5. **Automatic Trigger** - If you don't log in within the DMS period, NOK gains access
6. **Reassignment Option** - NOK can reassign responsibility to someone else if needed

### Token Economy
- **50 TMT** - Free signup bonus for all users
- **25 TMT** - Cost per photo tag
- **60 TMT** - Cost per video tag
- **Referral System** - Multi-level rewards up to 5 levels deep

### User Roles
- **Regular User** - Standard platform access
- **Business User** - Access to product verification, QR code generation, and scan history tracking
- **NOK** - Next-of-kin with limited asset access controlled by Dead Man's Switch
- **Moderator** - Content moderation capabilities
- **Admin** - Full platform administration

---

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

### Core Tables
- `user_profiles` - Extended user information including GPS preferences and location data
- `user_wallets` - TMT token balances
- `assets` - Tagged assets with metadata and GPS coordinates
- `next_of_kin` - Next-of-kin relationships and contact information
- `asset_nok_assignments` - NOK assignments with Dead Man's Switch configuration
- `token_transactions` - Token earning/spending history
- `payments` - Token purchase records
- `referrals` - Referral tracking system
- `referral_rewards` - Referral token rewards

### GPS Location Schema
Enhanced tables for location tracking:

**user_profiles additions:**
- `location_tracking_enabled` - Boolean permission flag
- `current_latitude` - User's current GPS latitude
- `current_longitude` - User's current GPS longitude
- `formatted_address` - Human-readable address from Google Maps API
- `location_last_updated` - Timestamp of last location update

**assets additions:**
- `asset_latitude` - GPS coordinates where app was used to tag item
- `asset_longitude` - GPS coordinates where app was used to tag item
- `asset_formatted_address` - Formatted address of tagging location
- `location_captured_at` - Timestamp when GPS was captured

### Enhanced NOK Schema
The NOK system includes advanced fields for Dead Man's Switch functionality:
- `dms_date` - Date when DMS triggers if user remains inactive
- `status` - Assignment status (pending, active, triggered, cancelled)
- `access_granted_at` - Timestamp when DMS was triggered
- `original_assigner_user_id` - User who created the assignment
- `reassigned_by_user_id` - User who reassigned the NOK responsibility
- `last_activity_at` - User's last login/activity for DMS tracking

All tables implement Row Level Security (RLS) for data protection.

---

## 🔒 Security Features

- **Row Level Security** - Database-level access control
- **Authentication** - Supabase Auth with email/password and phone number sync
- **GPS Privacy Controls** - User-controlled location tracking with explicit permissions
- **Phone Number Validation** - Numeric-only input with uniqueness constraints
- **Automated Data Sync** - Phone numbers automatically synchronized between user profiles and authentication system
- **File Upload Security** - Secure asset storage with access controls
- **Token Validation** - Server-side token transaction validation
- **Privacy Controls** - User-controlled asset visibility
- **Dead Man's Switch** - Time-based access control for NOK assignments
- **Conditional Asset Access** - NOK can only view asset details after DMS activation
- **Activity Tracking** - User activity monitoring for DMS functionality

---

## 🌐 Deployment

The application is deployed on Netlify with automatic builds from the main branch.

**Live URL:** https://tagmything.com

### Environment Configuration
- **Production**: Uses production Supabase instance with live Google Maps API
- **Staging**: Separate Supabase project for testing
- **Development**: Local environment with development keys

### Database Migrations
Use Supabase CLI for managing database changes:
```bash
# Link to project
supabase link --project-ref your_project_id

# Create new migration
supabase migration new migration_name

# Push migrations to remote
supabase db push

# Pull latest schema
supabase db pull
```

---

## 🧪 Testing

### Test Files
- `Test-Guide.md` - Comprehensive manual testing guide
- `cypress/e2e/` - End-to-end testing scenarios
- `src/**/*.test.tsx` - Unit tests for components and hooks

### Critical Testing Areas
- Authentication flows (including GPS permission modal)
- Asset tagging with dual location capture
- GPS permission management and location tracking
- Token economy and transaction processing
- Referral system mechanics
- Next-of-Kin assignments and Dead Man's Switch
- Business features and QR code generation

### Testing Commands
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run Cypress end-to-end tests
npm run lint        # Code quality checking
```

---

## 🔗 Referral System Technical Details

TagMyThing features a comprehensive 5-level referral system:

### Referral Calculation Logic
- Level 1: 50 TMT (Direct referral)
- Level 2: 30 TMT (Referral of referral)
- Level 3: 20 TMT (3rd level)
- Level 4: 10 TMT (4th level)
- Level 5: 5 TMT (5th level)

### Implementation
- Multi-level rewards calculated automatically
- Fallback logic to Marshall Epie (marshallepie@marshallepie.com) if referrer not found
- Universal access for all users to generate referral codes
- Automatic processing upon successful referrals

### Database Tables
- `referrals` - Tracks referral relationships
- `referral_rewards` - Records token rewards for each level

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards**:
   - Use TypeScript for type safety
   - Follow existing component patterns
   - Add proper error handling
   - Include tests for new features
4. **Test thoroughly**:
   - Run unit tests (`npm run test`)
   - Test GPS features manually
   - Verify database migrations
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Style Guidelines
- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Add JSDoc comments for complex functions
- Follow existing file structure and naming conventions

### GPS Feature Development
When working on location features:
- Always request user permission explicitly
- Handle location permission denied gracefully
- Test on both mobile and desktop
- Respect user privacy settings
- Use Google Maps API responsibly

### Database Changes
- Create migrations for schema changes
- Update TypeScript types accordingly
- Test with both staging and production data
- Ensure RLS policies are properly configured

---

## 📞 Developer Support

**Technical Questions:** marshallepie@marshallepie.com  
**Code Reviews:** Submit PRs for review  
**Bug Reports:** Use GitHub Issues  
**Feature Requests:** Discussion in GitHub Issues

---

## 🎯 Roadmap

### Completed Features ✅
- GPS location tracking with user permissions
- Dual-location system (manual + automatic GPS)
- Enhanced authentication flow with location modal
- Google Maps API integration for reverse geocoding
- Dashboard location toggle and display
- Comprehensive testing documentation

### In Development 🚧
- Advanced blockchain integration
- Enhanced mobile PWA features
- Real-time collaboration features

### Planned Features 📋
- Multi-language support
- Modular REST API architecture
- Advanced analytics dashboard
- Enhanced business features
- Mobile app versions (iOS/Android)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**TagMyThing** - Technical documentation for developers and contributors. 🛠️✨