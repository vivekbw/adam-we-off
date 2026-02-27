# We Off -- Collaborative Travel Planning Dashboard

A production-grade Next.js travel planning app. Plan itineraries, track flights, manage accommodations, split expenses, and chat with an AI travel assistant.

## Quick Start

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Works out of the box with seed data -- no API keys required for basic functionality.

## Architecture

- **Next.js 15** App Router with TypeScript
- **Supabase** for persistence (Postgres + RLS)
- **SWR** for client-side data fetching with optimistic updates
- **Framer Motion** for animations
- **Sonner** for toast notifications

### Project Structure

```
app/                  Pages and API routes
  api/chat/           Anthropic Claude proxy (streaming)
  api/places/         Google Places proxy (search, details, map)
  trip/[id]/          Trip overview + section pages
components/           Single-responsibility React components
  layout/             TopBar, Modal, ErrorBoundary
  trip/               TimelineStrip, TripPlanner, ValidationWarnings
  flights/            FlightCard, FlightDetail, FlightGlobe, FlightsSection
  stays/              StayCard, StayCoverage, StaysSection
  activities/         ActivityCard, AddActivityForm, ActivitiesSection
  notes/              NoteCard, AddNoteForm, NotesSection
  expenses/           ExpenseList, BalanceCard, SplitModal
  chat/               ChatPanel, BuddiesModal
  ui/                 Button, Tag, ProgressRing, Dropdown, Skeleton
hooks/                SWR data hooks with Supabase + seed fallback
lib/                  Constants, types, Supabase clients
  supabase/           Client (browser) + Server (service role) + SQL schema
styles/               Design tokens (CSS variables) + global styles
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only Supabase admin key |
| `ANTHROPIC_API_KEY` | Optional | AI chat assistant |
| `GOOGLE_PLACES_API_KEY` | Optional | Maps, place search, photos |

Without these, the app uses seed data and the chat/maps features are disabled.

## Setting Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `lib/supabase/schema.sql` in the SQL Editor
3. Add your keys to `.env.local`

## Design System

- **Typography**: Fraunces (display) + Satoshi (body)
- **Colors**: Warm terracotta primary, deep navy text, cream backgrounds
- **Tokens**: All in `styles/variables.css` as CSS custom properties

## Tech Decisions

- API keys never touch the client -- all external APIs proxied through Next.js API routes
- SWR hooks fall back to seed data when Supabase is unconfigured
- CSS Modules per component, shared tokens via CSS variables
- Dynamic imports for heavy components (chat, globe, modals)
