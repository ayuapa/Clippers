Mobile Pet Grooming App - Master Plan (MVP Strategy)

1. Project Overview

1.1 Product Definition

Product Name: Pet-Groom-Pro(Internal Business Tool) Primary User: Sole Trader Mobile Pet Groomer. Nature of App: A high-utility, mobile-first Progressive Web App (PWA).

1.2 Design Philosophy & Standards

* Timezone: Australia/Sydney (AEST/AEDT) (Strict adherence).
* Visuals: Clean White, High Contrast Black, Modular Purple (#7c3aed).
* UX: Mobile-first, thumb-friendly, high density.

1.3 Feature Triage

* MVP: Client/Pet CRM, Visual Scheduler (Grid/List/Map), Basic Appointment Booking, Payment Recording (Status only).
* Alpha: Google Calendar 2-Way Sync, SMS Reminders, Offline Mode refinement.
* Beta: Complex Recurrence (Alternating Services), SMS Broadcasts, Waitlist.

---

2. Technical Architecture

* Frontend: React (Vite) + TypeScript.
* Styling: Tailwind CSS + shadcn/ui.
* State: React Query + Zustand.
* Backend: Supabase (PostgreSQL).
* Maps: @vis.gl/react-google-maps.

---

3. Database Schema

(We implement the full schema now so we don't have to migrate data later, even if some columns remain null in MVP).

SQL-- Enable UUIDs create extension if not exists "uuid-ossp"; -- 1. CLIENTS create table clients ( id uuid default uuid_generate_v4() primary key, created_at timestamp with time zone default now(), full_name text not null, phone text, email text, address text, suburb text, postcode text, latitude double precision, longitude double precision, notes text, is_active boolean default true, deleted_at timestamp with time zone ); -- 2. PETS create table pets ( id uuid default uuid_generate_v4() primary key, client_id uuid references clients(id) not null, name text not null, breed text, size text, notes text, deleted_at timestamp with time zone ); -- 3. SERVICES create table services ( id uuid default uuid_generate_v4() primary key, name text not null, default_duration_minutes integer not null, price numeric(10,2) not null, is_gst_applicable boolean default true, is_active boolean default true ); -- 4. APPOINTMENTS create table appointments ( id uuid default uuid_generate_v4() primary key, client_id uuid references clients(id) not null, start_time timestamp with time zone not null, end_time timestamp with time zone not null, status text default 'confirmed', payment_status text default 'unpaid', payment_method text, total_amount numeric(10,2), notes text, google_event_id text, created_at timestamp with time zone default now() ); -- 5. APPOINTMENT_SERVICES create table appointment_services ( id uuid default uuid_generate_v4() primary key, appointment_id uuid references appointments(id) on delete cascade not null, service_id uuid references services(id) not null, price_at_booking numeric(10,2) not null ); -- 6. PERSONAL EVENTS (Alpha Phase) create table personal_events ( id uuid default uuid_generate_v4() primary key, google_event_id text unique not null, title text, start_time timestamp with time zone not null, end_time timestamp with time zone not null, is_all_day boolean default false ); -- 7. WAITLIST (Beta Phase) create table waitlist ( id uuid default uuid_generate_v4() primary key, client_id uuid references clients(id) not null, preferred_date date, notes text, created_at timestamp with time zone default now() ); 

---

4. Implementation Phases (MVP -> Alpha -> Beta)

Phase 1: The MVP Core (Digital Replacement)

Goal: A fully functional app to manage clients, pets, and the daily schedule. No automation yet, but full manual control.

Tasks:

* [ ] 1.1 Setup: Initialize Vite, Tailwind, Shadcn, Supabase, and Timezone Config (Australia/Sydney).
* [ ] 1.2 App Shell: Bottom Nav (Schedule | Clients | More).
* [ ] 1.3 CRM: - [ ] Clients List (Searchable).
  * [ ] Client Details (Profile + Pets List + History Tabs).
  * [ ] Add/Edit Client & Pet Modals.
* [ ] 1.4 Services: Simple CRUD for service pricing/duration.
* [ ] 1.5 The Schedule (Time Grid): - [ ] Vertical scrolling grid.
  * [ ] Pinch-to-zoom logic (Essential for usability).
  * [ ] Rendering Appointment Cards (Purple).
* [ ] 1.6 Booking Flow:
  * [ ] Modal: Date/Time -> Client -> Pet -> Service.
  * [ ] Basic Conflict Warning (Visual only).
* [ ] 1.7 Map View: - [ ] Show markers (1, 2, 3) for the day's route.
  * [ ] Link to external Maps app.
* [ ] 1.8 Payments (Manual):
  * [ ] Checkout Modal with [Cash] [Card] [PayID] buttons to update status.

Cursor Prompt (Phase 1): "Read Phase 1 of MASTER_PLAN.md. We are building the MVP. Please help me structure the project, install dependencies, and then systematically build the Client CRM, the Services setup, and the core TimeGrid scheduler with Pinch-to-Zoom."

---

Phase 2: Alpha (Automation & Integrations)

Goal: Connect the app to the outside world to save time and prevent errors.

Tasks:

* [ ] 2.1 Edge Function Setup: Configure Supabase CLI.
* [ ] 2.2 Google Sync (Push): - [ ] Webhook triggers on Appointment creation.
  * [ ] Pushes event to Google Calendar.
* [ ] 2.3 Google Sync (Pull):
  * [ ] Cron job fetches Personal Events.
  * [ ] Blocks out time on the App Grid (Gray blocks).
* [ ] 2.4 SMS Reminders:
  * [ ] Twilio Integration.
  * [ ] Cron job (Daily at 8am) to send reminders for tomorrow.
* [ ] 2.5 PWA Polish:
  * [ ] Service Worker implementation for basic offline viewing (Agenda/Client details).

Cursor Prompt (Phase 2): "Read Phase 2 of MASTER_PLAN.md. We are moving to Alpha. Let's set up the Supabase Edge Functions for Google Calendar 2-way sync and Twilio SMS reminders."

---

Phase 3: Beta (Growth & Advanced Logic)

Goal: Advanced features for scaling the business.

Tasks:

* [ ] 3.1 Complex Recurrence: - [ ] "Service Series" logic (e.g., Deshed -> Trim -> Deshed).
  * [ ] Auto-generate future appointments.
* [ ] 3.2 Waitlist:
  * [ ] Waitlist UI and "Promote to Appointment" logic.
* [ ] 3.3 SMS Broadcasts:
  * [ ] UI to send bulk messages (e.g., "Holidays").
* [ ] 3.4 Reporting:
  * [ ] Basic Revenue charts (Weekly/Monthly).

Cursor Prompt (Phase 3): "Read Phase 3 of MASTER_PLAN.md. We are now adding Beta features. Help me implement the 'Service Series' recurrence logic and the Waitlist system."

