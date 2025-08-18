# TagMyThing TMT

**TagMyThing** is a digital asset tagging system that lets users document ownership of any item—physical or digital—in a secure, timestamped, and verifiable way.

Whether it's a bike, a car, a hidden bank account, a love letter, or a life story, TagMyThing allows you to:
- Record a video or photo of the asset
- Tag it with metadata (title, description, location, timestamp)
- Store it immutably and securely
- Retrieve it anytime, even years later
- Prove ownership, intention, or message delivery

This is not just a place to leave your *last* will—it's a place to record your *first* will. Tag your things. Say what they mean to you. Decide what should happen to them. Forever.

---

## 💡 Key Features
- Take photos or record videos directly in the app
- GPS and timestamp metadata
- Optional blockchain storage for proof of existence
- Asset tagging by name, type, value, and location
- Searchable personal archive
- Advanced Next-of-Kin management with Dead Man's Switch protection
- Incoming/Outgoing NOK assignment tracking
- Mass assignment of assets to trusted individuals
- NOK reassignment capabilities for flexible legacy planning
- Product authenticity verification for businesses
- QR code generation and scan tracking
- Multi-tier subscription plans for business users

---

## 🔐 Target Use Cases
- Lost & found recovery
- Proof of ownership
- Legacy planning with Dead Man's Switch protection
- Secret safekeeping
- Emotional or legal testimony
- Digital inheritance management
- Trusted asset handover with privacy protection

---

## 🚀 Future Vision
TagMyThing aims to become the go-to app for digital truth-keeping and asset memory. A place where your belongings—and your intentions—outlive you.

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
│   ├── tagging/        # Asset tagging components
│   └── ui/             # Base UI components (Button, Card, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tagmything
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Signup Paths

TagMyThing offers different signup paths for different user types Minimum user starts as Influencer:

- **HIDDEN temporarily; Regular Users**: Visit `/auth` for standard signup (50 TMT tokens)
- **All users start here; Influencers**: Visit `/influencer-signup` for enhanced features (100 TMT tokens + referral system)
- **Business Users**: Visit `/business-auth` for business features (50 TMT tokens + product verification tools)
- **Referred Users**: Any signup with `?ref=code` automatically gets enhanced benefits
---

## 📱 Core Functionality

### Asset Tagging Workflow
1. **Capture** - Use device camera to take photo/video
2. **Tag** - Add title, description, tags, and metadata
3. **Secure** - Store with optional blockchain publishing
4. **Manage** - View, edit, and organize your assets
5. **Share** - Control privacy and next-of-kin access

### Next-of-Kin & Dead Man's Switch
TagMyThing features an advanced Next-of-Kin (NOK) management system with Dead Man's Switch (DMS) protection:

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

#### Dashboard Overview
- **Incoming Count** - Number of assets assigned to you as NOK
- **Outgoing Count** - Number of assets you've assigned to others
- **Triggered Assignments** - Assets where DMS has been activated
- **Upcoming DMS** - Assignments approaching their DMS date

### Token Economy

- **100 TMT** - Free signup bonus for everyone.
- **25 TMT** - Cost per photo tag
- **60 TMT** - Cost per video tag
- **Additional tokens** - Available for purchase on pay as you go.

### User Roles
- Any user can be nominated as NOK.
- Any user can nominate a next of kin.
- Any user can nominate multiple next of kins. (outgoing Noks)
- Any user can be nominated as next of kin by different users. (incomming NOKs)
- **NOK** - Next-of-kin with limited asset access set by visibility switch and by Dead Mans Switch.
- **Moderator** - Content moderation capabilities
- **Admin** - Full platform administration
- **Influencer** - Enhanced referral capabilities, higher signup bonus (100 TMT)
- **Business User** - Access to product verification, QR code generation, and scan history tracking

---

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- `user_profiles` - Extended user information
- `user_wallets` - TMT token balances
- `assets` - Tagged assets with metadata
- `next_of_kin` - Next-of-kin relationships and contact information
- `asset_nok_assignments` - NOK assignments with Dead Man's Switch configuration
- `token_transactions` - Token earning/spending history
- `payments` - Token purchase records
- `referrals` - Referral tracking system
- `referral_rewards` - Referral token rewards

#### Enhanced NOK Schema
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
- **Authentication** - Supabase Auth with email/password
- **File Upload Security** - Secure asset storage with access controls
- **Token Validation** - Server-side token transaction validation
- **Privacy Controls** - User-controlled asset visibility
- **Dead Man's Switch** - Time-based access control for NOK assignments
- **Conditional Asset Access** - NOK can only view asset details after DMS activation
- **Activity Tracking** - User activity monitoring for DMS functionality

---

## 🌐 Deployment

The application is deployed on Netlify with automatic builds from the main branch.

**Live URL:** [https://tag-my-thing.netlify.app](https://tag-my-thing.netlify.app)

### Build Commands
```bash
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🔗 Referral System

TagMyThing features a comprehensive referral system available to all users:

- **Multi-Level Rewards** - Earn tokens up to 5 levels deep
- **Landing Page Selection** - Choose from 5 different landing pages for your referral links
- **Universal Access** - All users can generate and share referral codes
- **Flexible Targeting** - Direct referrals to specific use cases (General, NFT, MyWill, Business)
- **Automatic Processing** - Rewards are processed automatically upon successful referrals

### Referral Reward Structure
- Level 1: 50 TMT
- Level 2: 30 TMT
- Level 3: 20 TMT
- Level 4: 10 TMT
- Level 5: 5 TMT

**Total potential per referral chain: 115 TMT**

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For support, email tagmything_support@marshallepie.com or join our community discussions.

---

## 🎯 Roadmap

- [ ] Mobile app development (iOS/Android)
- [ ] Advanced blockchain integration
- [ ] AI-powered asset categorization
- [ ] Multi-language support
- [ ] API for third-party integrations
- [ ] Advanced NOK verification system
- [ ] Bulk NOK management tools
- [ ] Legacy planning templates

---

**TagMyThing** - Where your assets live forever. 🏷️✨



# TagMyThing Pre-Release QA Checklist

## 🧪 Step One: Smoke Test (Quick Manual Check)
- [ ] Can you load the homepage without errors?
- [ ] Does navigation between pages work?
- [ ] Does the Supabase connection initialize properly?
- [ ] Are all expected menus, buttons, and components showing up?

## ✅ Step Two: Manual End-to-End Flow Checklist

### Sign-Up / Login Flow
- [ ] Create a new account
- [ ] Confirm email verification link
- [ ] Log in
- [ ] Log out and log back in again

### Tagging Flow (Core Feature)
- [ ] Tap “Tag Now”
- [ ] Allow camera access
- [ ] Take photo or video
- [ ] Name and describe the item
- [ ] Save tag and confirm it appears on the dashboard
- [ ] Click to view the full tag details

### Token System
- [ ] Confirm default token balance after sign-up
- [ ] Use tokens to tag something
- [ ] Try to tag when out of tokens—should block or show upgrade prompt

### Referral System
- [ ] Use referral link to create a second account
- [ ] Check if the referral shows under the original account
- [ ] Confirm token rewards (if any) are credited

### Upgrade / Subscription Flow
- [ ] Simulate or test Stripe payment (if in test mode)
- [ ] Check token balance increases correctly
- [ ] Ensure role or plan status updates if needed

### MyWill / Legacy Features
- [ ] Assign a tag to a Next of Kin
- [ ] Test that NOK user can access the assigned tag
- [ ] Simulate NOK login and view legacy items

### Business Mode (if applicable)
- [ ] Go through business onboarding
- [ ] Add product with serial number
- [ ] Scan or input product code from another device
- [ ] Confirm verification status appears correctly

## 🧪 Step Three: Automated Cypress Test Suite
- [ ] Sign up and login flow
- [ ] Tag an asset
- [ ] Check dashboard updates
- [ ] Use token and confirm deduction
- [ ] Attempt invalid actions (e.g., tagging with 0 tokens)

## 🧩 Step Four: Backend Tests (API / Logic Checks)
- [ ] Test Supabase RLS policies
  - [ ] Can a user only access their own tags, payments, referrals?
  - [ ] Can Admin access all users' data?
- [ ] Test `archiveTagNow` function manually
- [ ] Simulate `retryFailedUploads`
- [ ] Test referral logic by directly querying the `referrals` table
- [ ] Check token refund when deleting a tag

## 🚨 Step Five: Error & Edge Case Testing
- [ ] Use invalid email/password
- [ ] Submit empty forms
- [ ] Double-click submit buttons
- [ ] Tag very large files
- [ ] Use expired links
- [ ] Rapidly switch between flows (e.g., sign-up → tag → logout mid-tag)

## 🧹 Step Six: Regression Testing (After Any Change)
- [ ] Re-test full tagging flow
- [ ] Re-test sign up + token deduction
- [ ] Re-test referral creation and token reward
- [ ] Re-test payment flow (if Stripe config is changed)
