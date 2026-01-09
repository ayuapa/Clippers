# Maya Pet Grooming Pro

A high-utility, mobile-first Progressive Web App (PWA) for mobile pet grooming businesses.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Maps API key (for map features)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in your credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. **Set up Supabase database:**

- Go to your Supabase project's SQL Editor
- Run the SQL script in `supabase_schema.sql`

4. **Start the development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📱 Features (MVP Phase)

### ✅ Implemented

- **Client Management (CRM)**
  - Searchable client list
  - Add/edit client information
  - Client details with contact info
  
- **App Shell**
  - Bottom navigation (Schedule | Clients | More)
  - Mobile-first, thumb-friendly design
  
- **Schedule Grid (TimeGrid)**
  - Vertical scrolling time grid (6 AM - 7 PM)
  - Pinch-to-zoom functionality
  - 15-minute interval subdivisions
  - Sydney timezone strict adherence

### 🚧 In Progress

- Pet management within client profiles
- Appointment booking flow
- Services CRUD interface
- Payment checkout modal
- Map view with route planning

## 🛠 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query
- **Backend:** Supabase (PostgreSQL)
- **Maps:** @vis.gl/react-google-maps
- **Gestures:** @use-gesture/react (pinch-to-zoom)
- **Date/Time:** date-fns + date-fns-tz (Sydney timezone)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── navigation/      # Bottom navigation
│   ├── schedule/        # Schedule views & TimeGrid
│   ├── clients/         # Client CRM components
│   └── more/            # Additional features
├── lib/
│   ├── utils.ts         # Utility functions (cn, etc.)
│   ├── timezone.ts      # Sydney timezone utilities
│   └── supabase.ts      # Supabase client
├── types/
│   └── database.types.ts # TypeScript DB types
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles + Tailwind
```

## 🌏 Timezone Handling (CRITICAL)

This app uses **Australia/Sydney** as the source of truth for all time operations. Never use `new Date()` directly for business logic. Always use the timezone utilities in `src/lib/timezone.ts`:

```typescript
import { nowInSydney, formatInSydney, toSydneyTime } from '@/lib/timezone'

// Get current Sydney time
const now = nowInSydney()

// Format for display
const formatted = formatInSydney(date, 'yyyy-MM-dd HH:mm')

// Convert to Sydney timezone
const sydneyDate = toSydneyTime(date)
```

## 📊 Database Schema

The app uses the following main tables:

- `clients` - Client information and contact details
- `pets` - Pet profiles linked to clients
- `services` - Service types, pricing, and duration
- `appointments` - Scheduled appointments with payment tracking

See `supabase_schema.sql` for the complete schema.

## 🎨 Design System

- **Primary Color:** Purple (#7c3aed) - Used for branding and CTAs
- **Touch Targets:** Minimum 44px for mobile ergonomics
- **Layout:** Mobile-first, primary actions at bottom
- **Typography:** System fonts for performance

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel/Netlify

1. Connect your Git repository
2. Set environment variables in the hosting platform
3. Deploy!

### PWA Configuration (Coming in Alpha)

Service Worker and manifest will be added in Phase 2 (Alpha) for offline support.

## 📖 Development Roadmap

### Phase 1: MVP (Current)
- ✅ Client/Pet CRM
- ✅ Visual Scheduler (Grid)
- 🚧 Basic Appointment Booking
- 🚧 Payment Recording (Status only)

### Phase 2: Alpha
- Google Calendar 2-Way Sync
- SMS Reminders (Twilio)
- Offline Mode refinement
- PWA installation

### Phase 3: Beta
- Complex Recurrence (Service Series)
- SMS Broadcasts
- Waitlist Management
- Revenue Reporting

## 🤝 Contributing

This is an internal business tool. Refer to `MASTER_PLAN.md` for architecture decisions and feature planning.

## 📄 License

Private/Proprietary

