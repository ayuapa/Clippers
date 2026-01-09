# Maya Pet Grooming Pro - Setup Guide

## 🎉 Project Status

✅ **MVP is Ready!** All core features have been implemented and the app is running on `http://localhost:5173/`

## 📋 Quick Start Checklist

### 1. ✅ Dependencies Installed
All npm packages have been installed successfully.

### 2. ⚠️ Environment Configuration Required

You need to create a `.env` file with your API keys:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### 3. ⚠️ Supabase Database Setup Required

#### Step-by-step:

1. **Create a Supabase Account** (if you haven't already)
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Run the Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to: `SQL Editor`
   - Copy the contents of `supabase_schema.sql`
   - Paste into the SQL Editor and click "Run"
   - This creates all tables (clients, pets, services, appointments)

3. **Get Your API Keys**
   - In Supabase dashboard, go to: `Settings` → `API`
   - Copy the `Project URL` (VITE_SUPABASE_URL)
   - Copy the `anon public` key (VITE_SUPABASE_ANON_KEY)
   - Paste these into your `.env` file

4. **Generate TypeScript Types** (Optional but recommended)
   ```bash
   npm run types
   ```

### 4. 🗺️ Google Maps Setup (Optional - for Map View)

The app will work without Google Maps, but the Map View feature requires it:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Add the key to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

**Note:** Map View will show a friendly message if the API key is not configured.

## 🎯 Features Implemented (MVP Phase 1)

### ✅ Complete Features

1. **App Shell**
   - Bottom navigation (Schedule | Clients | More)
   - Mobile-first, thumb-friendly design
   - Purple branding (#7c3aed)

2. **Client CRM**
   - Searchable client list
   - Add/Edit client modal
   - Client contact information
   - Address with suburb/postcode

3. **Services Management**
   - View all services
   - Add/Edit/Delete services
   - Price and duration settings
   - Color-coded service tags

4. **TimeGrid Scheduler**
   - Vertical scrolling grid (6 AM - 7 PM)
   - **Pinch-to-zoom** functionality (50% - 250%)
   - 15-minute interval subdivisions
   - Current time indicator
   - Auto-scroll to 7 AM on load

5. **Booking Flow**
   - 3-step wizard (Date/Time → Client/Pet/Service → Confirm)
   - Service selection with pricing
   - Notes field for special instructions

6. **Map View**
   - Route visualization with numbered markers
   - Today's appointments overlay
   - "Navigate" button (opens Google Maps)
   - Color-coded by service

7. **Payment Checkout**
   - Cash/Card/PayID options
   - Visual payment confirmation
   - Payment status tracking

### 🔧 Technical Highlights

- **Timezone Strict:** All dates use `Australia/Sydney` timezone
- **Mobile Input:** Correct keyboard types (tel, decimal, etc.)
- **Touch Targets:** Minimum 44px for fat-finger-proof tapping
- **Offline-Ready Structure:** PWA-ready architecture (service worker in Phase 2)

## 🚀 Running the App

```bash
# Development server (already running!)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Testing the App

1. **Open in browser:** http://localhost:5173/
2. **Mobile testing:** 
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select iPhone/Android device
3. **Test pinch-to-zoom:**
   - Use mouse wheel + Ctrl/Cmd for desktop testing
   - Use two-finger pinch on trackpad
   - Use actual phone for best experience

## 📊 Sample Data

The app currently uses mock data for demonstration. Once you connect to Supabase:

- Default services are auto-created by the SQL script
- You can add your first client via the Clients tab
- Create appointments via the "+" button on Schedule

## 🎨 Customization

### Colors
Edit `src/index.css` to change the primary purple:

```css
--primary: 262 83% 58%; /* #7c3aed */
```

### Business Hours
Edit `src/components/schedule/TimeGrid.tsx`:

```typescript
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6 AM to 7 PM
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env` file exists in project root
- Restart the dev server after creating `.env`

### TimeGrid not zooming
- Desktop: Hold Ctrl/Cmd + scroll
- Mobile: Use two-finger pinch gesture
- Ensure `@use-gesture/react` is installed

### Map not showing
- Check that `VITE_GOOGLE_MAPS_API_KEY` is set
- Verify the API key has Maps JavaScript API enabled
- The app will gracefully handle missing keys

## 📚 Next Steps (Phase 2 - Alpha)

After completing the Supabase setup, you can start working on:

1. **Google Calendar Sync** - Push appointments to Google Calendar
2. **SMS Reminders** - Twilio integration for automated reminders
3. **PWA Installation** - Add to Home Screen support
4. **Offline Mode** - Service Worker for offline viewing

See `MASTER_PLAN.md` for the complete roadmap.

## 🎉 You're All Set!

The MVP is fully functional. Just connect your Supabase database and you can start managing your pet grooming business!

For questions or issues, refer to:
- `MASTER_PLAN.md` - Complete project architecture
- `.cursorrules` - Development guidelines
- `README.md` - Project overview

