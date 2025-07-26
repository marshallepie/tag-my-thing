# TagMyThing

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
- Next-of-kin handover instructions (optional)

---

## 🔐 Target Use Cases
- Lost & found recovery
- Proof of ownership
- Legacy planning
- Secret safekeeping
- Emotional or legal testimony

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

---

## 📱 Core Functionality

### Asset Tagging Workflow
1. **Capture** - Use device camera to take photo/video
2. **Tag** - Add title, description, tags, and metadata
3. **Secure** - Store with optional blockchain publishing
4. **Manage** - View, edit, and organize your assets
5. **Share** - Control privacy and next-of-kin access

### Token Economy
- **50 TMT** - Free signup bonus
- **5 TMT** - Cost per photo tag
- **7 TMT** - Cost per video tag
- **Additional tokens** - Available for purchase

### User Roles
- **User** - Standard account with asset tagging
- **NOK** - Next-of-kin with limited asset access
- **Moderator** - Content moderation capabilities
- **Admin** - Full platform administration
- **Influencer** - Enhanced referral capabilities

---

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- `user_profiles` - Extended user information
- `user_wallets` - TMT token balances
- `assets` - Tagged assets with metadata
- `next_of_kin` - Next-of-kin relationships
- `token_transactions` - Token earning/spending history
- `payments` - Token purchase records
- `referrals` - Referral tracking system
- `referral_rewards` - Referral token rewards

All tables implement Row Level Security (RLS) for data protection.

---

## 🔒 Security Features

- **Row Level Security** - Database-level access control
- **Authentication** - Supabase Auth with email/password
- **File Upload Security** - Secure asset storage with access controls
- **Token Validation** - Server-side token transaction validation
- **Privacy Controls** - User-controlled asset visibility

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
- [ ] Enterprise features
- [ ] API for third-party integrations

---

**TagMyThing** - Where your assets live forever. 🏷️✨