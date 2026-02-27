# GrokSDR Design Language Specification

> Extracted from [vivekbw/vivekb-xai-takehome-sdr](https://github.com/vivekbw/vivekb-xai-takehome-sdr)

---

## 1. Design Philosophy

**"Dark Observatory"** — A command-center aesthetic inspired by space observatories and mission control dashboards. The default theme is a deep navy/near-black canvas with cyan accents, overlaid with glassmorphism cards and subtle ambient animations. The app supports 5 swappable themes via CSS custom properties with zero JS bundle overhead for theming.

Key principles:
- **Glass-first surfaces**: Cards use gradient glassmorphism with backdrop blur, not solid fills
- **Semantic color via CSS variables**: Every color is a variable; theming is pure CSS attribute swapping (`data-theme` on `<html>`)
- **Dual-font pairing**: Serif display font (Instrument Serif) for headings + geometric sans (Figtree) for body
- **Ambient motion**: Pulse animations on AI-processing elements, staggered fade-up for content, smooth transitions on theme switch
- **Grain texture**: Subtle SVG noise overlay (3% opacity) for analog depth

---

## 2. Theme System Architecture

Themes are applied via `data-theme` attribute on `<html>`. CSS custom properties cascade from `:root` / `[data-theme="..."]`. Tailwind v4 bridges the variables via `@theme inline`.

### Theme switching

```typescript
// Stored in localStorage as 'groksdr-theme'
// Applied via: document.documentElement.setAttribute('data-theme', themeId)
// Default: 'observatory'
```

### Available Themes

| ID | Name | Accent | Bg Primary | Text Primary | Mood |
|---|---|---|---|---|---|
| `observatory` | Dark Observatory | `#06B6D4` (cyan) | `#0A0E1A` | `#F0F4F8` | Deep navy command center |
| `ember` | Midnight Ember | `#F59E0B` (amber) | `#0D0C0C` | `#FAF5F0` | Warm charcoal with amber glow |
| `frost` | Arctic Frost | `#2563EB` (blue) | `#F8FAFC` | `#0F172A` | Clean light theme, steel blue |
| `terminal` | Verdant Terminal | `#22C55E` (green) | `#060E0A` | `#D4F0DC` | Dark green-black, phosphor green |
| `amethyst` | Dusk Amethyst | `#A78BFA` (violet) | `#0E0A1A` | `#EDE9FE` | Deep violet-gray, lavender |

---

## 3. Color Palette (Full Variable Reference)

### 3a. Default Theme: Dark Observatory

```css
/* ── Backgrounds ── */
--bg-primary:    #0A0E1A;   /* Page canvas — near-black navy */
--bg-secondary:  #111827;   /* Sidebar, table header, card alt */
--bg-tertiary:   #1A2035;   /* Input fields, nested surfaces */
--bg-elevated:   #1F2A45;   /* Elevated UI (icon containers, toggles off-state) */
--bg-hover:      #253050;   /* Hover state for interactive elements */

/* ── Text ── */
--text-primary:   #F0F4F8;  /* Headings, primary body text — warm off-white */
--text-secondary: #8B95A5;  /* Descriptions, secondary labels */
--text-muted:     #5A6578;  /* Captions, timestamps, disabled text */

/* ── Accent ── */
--accent:         #06B6D4;  /* Primary accent (cyan-500) — buttons, active nav, links */
--accent-dim:     #0891B2;  /* Darker accent for pressed/hover states */
--accent-glow:    rgba(6, 182, 212, 0.15);  /* Background fill behind accent icons */
--accent-pulse-from: rgba(6, 182, 212, 0.1);  /* Animation keyframe start */
--accent-pulse-to:   rgba(6, 182, 212, 0.25); /* Animation keyframe peak */

/* ── Status Colors (Semantic) ── */
--status-qualified:    #10B981;  /* Green — success, qualified, closed-won */
--status-pending:      #F59E0B;  /* Amber — pending, proposal, warning */
--status-disqualified: #F43F5E;  /* Rose — error, disqualified, closed-lost */
--status-new:          #6366F1;  /* Indigo — new leads, info */

/* ── Borders ── */
--border-primary:   #1E293B;  /* Card borders, dividers, table rows */
--border-secondary: #334155;  /* Secondary/input borders, button outlines */

/* ── Shadows ── */
--shadow-glow: 0 0 20px rgba(6, 182, 212, 0.1);  /* Ambient glow on cards */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);

/* ── Glass / Transparency ── */
--glass-from:  rgba(17, 24, 39, 0.8);   /* Glass gradient start */
--glass-to:    rgba(26, 32, 53, 0.6);   /* Glass gradient end */
--topbar-bg:   rgba(10, 14, 26, 0.8);   /* Topbar with blur */

/* ── Decorative ── */
--grid-dot: #1E293B;  /* Dot grid background pattern */
```

### 3b. Midnight Ember Theme

```css
--bg-primary:    #0D0C0C;
--bg-secondary:  #1A1614;
--bg-tertiary:   #231E1A;
--bg-elevated:   #2D2520;
--bg-hover:      #382E28;

--text-primary:   #FAF5F0;
--text-secondary: #A89888;
--text-muted:     #6D5F52;

--accent:         #F59E0B;   /* Amber */
--accent-dim:     #D97706;
--accent-glow:    rgba(245, 158, 11, 0.12);

--status-qualified:    #22C55E;
--status-pending:      #F59E0B;
--status-disqualified: #EF4444;
--status-new:          #8B5CF6;

--border-primary:   #2A2320;
--border-secondary: #3D332C;

--shadow-glow: 0 0 20px rgba(245, 158, 11, 0.08);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.35);

--glass-from:  rgba(26, 22, 20, 0.85);
--glass-to:    rgba(35, 30, 26, 0.6);
--topbar-bg:   rgba(13, 12, 12, 0.85);
```

### 3c. Arctic Frost Theme (Light)

```css
--bg-primary:    #F8FAFC;
--bg-secondary:  #F1F5F9;
--bg-tertiary:   #E8EDF2;
--bg-elevated:   #FFFFFF;
--bg-hover:      #E2E8F0;

--text-primary:   #0F172A;
--text-secondary: #475569;
--text-muted:     #94A3B8;

--accent:         #2563EB;   /* Blue-600 */
--accent-dim:     #1D4ED8;
--accent-glow:    rgba(37, 99, 235, 0.08);

--border-primary:   #E2E8F0;
--border-secondary: #CBD5E1;

--shadow-card: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
--glass-from:  rgba(255, 255, 255, 0.9);
--glass-to:    rgba(241, 245, 249, 0.75);
--topbar-bg:   rgba(248, 250, 252, 0.88);
```

### 3d. Verdant Terminal Theme

```css
--bg-primary:    #060E0A;
--bg-secondary:  #0C1A12;
--bg-tertiary:   #12241A;
--bg-elevated:   #1A3024;
--bg-hover:      #22402E;

--text-primary:   #D4F0DC;
--text-secondary: #7BAF8C;
--text-muted:     #4A7858;

--accent:         #22C55E;   /* Green-500 */
--accent-dim:     #16A34A;
--accent-glow:    rgba(34, 197, 94, 0.12);

--border-primary:   #1A3024;
--border-secondary: #2D4D3A;
```

### 3e. Dusk Amethyst Theme

```css
--bg-primary:    #0E0A1A;
--bg-secondary:  #161028;
--bg-tertiary:   #1E1635;
--bg-elevated:   #281F45;
--bg-hover:      #322855;

--text-primary:   #EDE9FE;
--text-secondary: #A5A0C0;
--text-muted:     #6D668A;

--accent:         #A78BFA;   /* Violet-400 */
--accent-dim:     #8B5CF6;
--accent-glow:    rgba(167, 139, 250, 0.12);

--border-primary:   #1E1635;
--border-secondary: #322855;
```

### Pipeline Stage Colors (Fixed Across Themes)

```
New Leads:    #6366F1  (Indigo)
Contacted:    #8B5CF6  (Violet)
Qualified:    #06B6D4  (Cyan)
Proposal:     #F59E0B  (Amber)
Negotiation:  #F97316  (Orange)
Closed Won:   #10B981  (Emerald)
Closed Lost:  #F43F5E  (Rose)
```

---

## 4. Typography

### Font Families

| Role | Font | Source | CSS Variable | Weight(s) |
|---|---|---|---|---|
| **Display / Headings** | Instrument Serif | Google Fonts (`next/font/google`) | `--font-instrument-serif` → `--font-display` | 400 (regular only) |
| **Body / UI** | Figtree | Google Fonts (`next/font/google`) | `--font-figtree` → `--font-body` | Variable (400–700) |

### Font Loading

```typescript
// next/font/google with display: 'swap'
const instrumentSerif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-instrument-serif' });
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
```

### Tailwind Bridge

```css
@theme inline {
  --font-sans: var(--font-body);    /* Figtree */
  --font-serif: var(--font-display); /* Instrument Serif */
}
```

### Typography Scale (from component usage)

| Element | Font | Size | Weight | Tracking | Example |
|---|---|---|---|---|---|
| Page title (h1) | Instrument Serif | `text-2xl sm:text-3xl` | 400 (serif natural) | `tracking-tight` | "Command Center" |
| Card title (h3) | Instrument Serif | `text-lg` | 400 | default | "Pipeline Overview" |
| Modal title (h2) | Instrument Serif | `text-xl` | 400 | default | "Add New Lead" |
| Metric value | Figtree | `text-xl sm:text-2xl` | `font-semibold` (600) | `tracking-tight` | "142" |
| Body text | Figtree | `text-sm` (14px) | 400 | default | Descriptions |
| Small label | Figtree | `text-xs` (12px) | 400 | default | Secondary info |
| Micro label | Figtree | `text-[11px]` | 400 | default | Metric labels on mobile |
| Uppercase label | Figtree | `text-[10px]` | `font-medium` (500) | `tracking-wider` + `uppercase` | "THEME" sidebar label |
| Nav item | Figtree | `text-sm` | 400 | default | Sidebar links |
| Table header | Figtree | `text-xs` | `font-medium` (500) | default | Column headers |
| Brand logotype | Instrument Serif | `text-lg` | 400 | `tracking-tight` | "GrokSDR" |

### Font Application Pattern

```css
/* Display font applied via inline family-name */
font-[family-name:var(--font-instrument-serif)]

/* Body font is the default on <body> */
body { font-family: var(--font-body), system-ui, sans-serif; }
```

---

## 5. Spacing & Sizing Conventions

### Layout

| Element | Value | Notes |
|---|---|---|
| Sidebar width | `220px` | Fixed, hidden on mobile (slide-in) |
| Topbar height | `h-14 sm:h-16` (56px / 64px) | Sticky, blurred background |
| Main content padding | `p-4 sm:p-6` (16px / 24px) | |
| Card internal padding | `p-5` (20px) | via `.glass-card` |
| Metric card padding | `p-3 sm:p-5` | Responsive |

### Common Spacing

```
gap-1.5   (6px)   — Theme swatches, status badge dot+text
gap-2     (8px)   — Inline button groups, toast items
gap-2.5   (10px)  — Sidebar logo items, toast content
gap-3     (12px)  — Nav items, metric card content, table cells
gap-4     (16px)  — Metric card grid, form fields
gap-6     (24px)  — Section spacing, card grid gap
space-y-1 (4px)   — Nav list items
space-y-3 (12px)  — List items in cards, mobile card list
space-y-4 (16px)  — Form field spacing
space-y-6 (24px)  — Settings section cards
```

### Section Spacing

```
mb-6 sm:mb-8  — Between page header and content grid
mt-4          — Between card title and card body content
pt-2          — Before form action buttons
py-16         — Empty state vertical padding
```

---

## 6. Border Radius

```css
--radius-sm: 6px;    /* Small elements, tags */
--radius-md: 10px;   /* Buttons (md), inputs */
--radius-lg: 14px;   /* Cards (glass-card), dropdowns */
--radius-xl: 20px;   /* Large containers */
```

### Tailwind Usage in Components

| Element | Class | Computed |
|---|---|---|
| Glass card | `rounded-[14px]` via `--radius-lg` in CSS | 14px |
| Button sm | `rounded-md` | 6px |
| Button md/lg | `rounded-lg` | 8px (Tailwind default) |
| Input fields | `rounded-lg` | 8px |
| Sidebar nav items | `rounded-lg` | 8px |
| Table container | `rounded-xl` | 12px |
| Toast | `rounded-xl` | 12px |
| Empty state icon container | `rounded-2xl` | 16px |
| Status badge dot | `rounded-full` | 50% |
| Avatar/profile icon | `rounded-full` | 50% |
| Theme swatch | `rounded-md` | 6px |
| Toggle switch track | `rounded-full` | 50% |
| Toggle switch knob | `rounded-full` | 50% |

---

## 7. Shadows

```css
/* Ambient glow — used on AI-processing elements */
--shadow-glow: 0 0 20px rgba(6, 182, 212, 0.1);

/* Card shadow — subtle depth */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);

/* Dropdown/popover shadow (inline) */
shadow-lg  /* Tailwind utility on dropdowns and toasts */
```

### Light Theme Shadow Adjustment

```css
/* Frost theme uses much lighter shadows */
--shadow-card: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
```

---

## 8. Component Patterns

### 8a. Glass Card (Primary Surface)

The main container pattern. Used everywhere for content grouping.

```css
.glass-card {
  background: linear-gradient(135deg, var(--glass-from), var(--glass-to));
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);          /* 14px */
  transition: background 0.3s ease, border-color 0.3s ease;
}
```

Usage: `<div className="glass-card p-5">...</div>`

With glow: add class `ai-processing` for pulsing box-shadow.

### 8b. Button

4 variants, 3 sizes. Inline styles for theme-awareness.

| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | `var(--accent)` | `#0A0E1A` (dark text) | none |
| `secondary` | `var(--bg-elevated)` | `var(--text-primary)` | `1px solid var(--border-secondary)` |
| `ghost` | transparent | `var(--text-secondary)` | `1px solid transparent` |
| `danger` | `var(--status-disqualified)` | `#fff` | none |

| Size | Height | Padding | Font | Radius |
|---|---|---|---|---|
| `sm` | `h-8` (32px) | `px-3` | `text-xs` | `rounded-md` |
| `md` | `h-9` (36px) | `px-4` | `text-sm` | `rounded-lg` |
| `lg` | `h-11` (44px) | `px-6` | `text-sm` | `rounded-lg` |

Common classes: `inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`

Loading state: SVG spinner (h-4 w-4 animate-spin) prepended to children.

### 8c. Status Badge

Dot indicator + text label. Minimal footprint.

```
<span class="inline-flex items-center gap-1.5 text-xs font-medium" style="color: {statusColor}">
  <span class="h-1.5 w-1.5 rounded-full" style="background: {statusColor}" />
  {label}
</span>
```

Status colors:
```
qualified:     var(--status-qualified)     #10B981
unqualified:   var(--text-muted)
disqualified:  var(--status-disqualified)  #F43F5E
new:           var(--status-new)           #6366F1
contacted:     #8B5CF6
proposal:      var(--status-pending)       #F59E0B
negotiation:   #F97316
closed-won:    var(--status-qualified)
closed-lost:   var(--status-disqualified)
```

### 8d. Metric Card

Icon-left layout with semantic color accents.

```
┌─────────────────────────────┐
│  [icon]  Label              │
│          42                 │
│          +12% this week     │
└─────────────────────────────┘
```

- Icon container: `h-10 w-10 rounded-xl` with `background: {color}15` (15% opacity suffix) and `color: {color}`
- Label: `text-xs`, `--text-muted`
- Value: `text-2xl font-semibold tracking-tight`, `--text-primary`
- Trend: `text-xs`, `--text-secondary`

### 8e. Score Gauge (SVG Ring)

Circular progress indicator with color thresholds.

```
Score ≥ 70: var(--status-qualified)     Green
Score ≥ 40: var(--status-pending)       Amber
Score < 40: var(--status-disqualified)  Red
```

Sizes:
| Size | Outer | Stroke | Font Size |
|---|---|---|---|
| `sm` | 40px | 3px | 0.75rem |
| `md` | 64px | 4px | 1rem |
| `lg` | 96px | 5px | 1.5rem |

Ring animation: `transition-all duration-700 ease-out` on stroke-dashoffset.

### 8f. Sidebar

- Fixed left, 220px wide, full height
- Background: `var(--bg-secondary)`
- Border: right border with `var(--border-primary)`
- Mobile: slides in/out with `translate-x` + overlay backdrop (`bg-black/50`)

**Logo area** (h-16):
- Icon container: `h-8 w-8 rounded-lg`, accent glow background, accent icon
- Brand name: Instrument Serif, `text-lg tracking-tight`

**Nav items**:
- `rounded-lg px-3 py-2.5 text-sm`
- Active: `color: var(--accent)`, `background: var(--accent-glow)`, trailing dot indicator
- Inactive: `color: var(--text-secondary)`, transparent background

**Theme picker** (bottom):
- Label: `text-[10px] font-medium uppercase tracking-wider`, `--text-muted`
- Swatches: `h-7 w-7 rounded-md` buttons showing theme bgPreview with accent dot
- Active swatch: 2px solid accent border + accent box-shadow glow

**Footer**:
- "Powered by xAI Grok" in `text-xs`, `--text-muted`

### 8g. Topbar

- Sticky, `h-14 sm:h-16`
- Background: `var(--topbar-bg)` with `backdrop-filter: blur(8px)`
- Bottom border: `var(--border-primary)`

Contains:
- Mobile menu button
- AI toggle button: `h-9 rounded-lg border` with accent highlight when active
- Search input: `h-9 rounded-lg border`, icon left-padded
- API status: green dot + "xAI Grok API" label

### 8h. Input Fields

```css
height: h-9 (36px)
border-radius: rounded-lg (8px)
border: 1px solid var(--border-primary)
background: var(--bg-primary) or var(--bg-tertiary)
color: var(--text-primary)
padding: px-3
font-size: text-sm
outline: none
focus: border-color changes to var(--accent)
```

### 8i. Modal

- Overlay: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- Content: `.glass-card` with `max-w-lg p-6`, `max-height: 90vh` with overflow scroll
- Close button: top-right, `rounded-lg p-1.5`, hover bg-elevated

### 8j. Table (Desktop)

- Container: `rounded-xl border` with `--border-primary`
- Header row: `background: var(--bg-secondary)`, bottom border
- Header cells: `text-xs font-medium`, `--text-muted`
- Body rows: bottom border, `hover:bg-[var(--bg-secondary)]` transition
- Cell padding: `px-4 py-3`

### 8k. Mobile Card List

- `rounded-xl border p-4`
- `border-color: var(--border-primary)`, `background: var(--bg-secondary)`
- Hover: `border-color: var(--accent)` transition

### 8l. Toast Notifications

- Position: fixed bottom-right (`bottom-4 right-4`)
- Container: `rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md`
- Colors per variant:
  - Success: `bg: rgba(34,197,94,0.08)`, `border: rgba(34,197,94,0.3)`, icon: `#22c55e`
  - Error: `bg: rgba(239,68,68,0.08)`, `border: rgba(239,68,68,0.3)`, icon: `#ef4444`
  - Info: `bg: rgba(59,130,246,0.08)`, `border: rgba(59,130,246,0.3)`, icon: `#3b82f6`
- Auto-dismiss: 3500ms
- Icons: `lucide-react` CheckCircle2, XCircle, Info

### 8m. Empty State

- Centered vertically with `py-16`
- Icon container: `h-14 w-14 rounded-2xl`, `bg-elevated`, `text-muted`
- Title: Instrument Serif, `text-lg`
- Description: `text-sm max-w-sm`, `--text-secondary`
- Optional action button below

### 8n. Toggle Switch

```html
<button class="flex h-5 w-9 items-center rounded-full px-0.5">
  <!-- Track: accent when on, bg-primary when off -->
  <!-- Knob: h-3.5 w-3.5 rounded-full bg-white, translateX(14px) when on -->
</button>
```

### 8o. Segmented Button Group (Style Picker)

Used in settings for "formal / casual / minimal" selection:
- `rounded-md border px-2.5 py-1 text-xs capitalize`
- Active: `border-color: var(--accent)`, `color: var(--accent)`, `background: var(--accent-glow)`
- Inactive: `border-color: var(--border-primary)`, `color: var(--text-secondary)`, transparent bg

### 8p. Profile Row

- `rounded-lg border px-4 py-3` with `--border-primary`
- Avatar: `h-10 w-10 rounded-full`, accent-glow bg, accent icon
- Name: `text-sm font-medium`, `--text-primary`
- Subtitle: `text-xs`, `--text-secondary`
- Meta: `text-xs`, `--text-muted`

---

## 9. Animations & Transitions

### Global Transitions

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
.glass-card {
  transition: background 0.3s ease, border-color 0.3s ease;
}
```

### Ambient Pulse (AI Processing)

```css
@keyframes ambient-pulse {
  0%, 100% { box-shadow: 0 0 15px var(--accent-pulse-from); }
  50%      { box-shadow: 0 0 30px var(--accent-pulse-to); }
}
.ai-processing {
  animation: ambient-pulse 2s ease-in-out infinite;
}
```

### Staggered Fade-Up (Content Loading)

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger-children > * {
  opacity: 0;
  animation: fade-up 0.4s ease-out forwards;
}
/* Delays: 0.05s increments from child 1 (0.05s) to child 8 (0.4s) */
```

### Toast Enter/Exit

```css
@keyframes toast-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-exit {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(8px) scale(0.95); }
}
/* Duration: 280ms ease-out (enter), 280ms ease-in (exit) */
```

### Score Gauge Ring

```css
/* SVG circle stroke transition */
transition-all duration-700 ease-out  /* on strokeDashoffset */
```

### Interactive Transitions

```
Buttons:          transition-all duration-150
Nav links:        transition-all duration-150
Sidebar slide:    transition-transform duration-200 ease-in-out
Hover opacity:    hover:opacity-90
Delete buttons:   opacity-40 hover:opacity-100 transition-opacity
Toggle switch:    transition-colors (track), transition-transform (knob)
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .stagger-children > * { opacity: 1; animation: none; }
  .ambient-pulse { animation: none; }
}
```

---

## 10. Background Textures

### Dot Grid

```css
.bg-grid {
  background-image: radial-gradient(circle, var(--grid-dot) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Film Grain Overlay

```css
.grain-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* fractalNoise SVG */
  pointer-events: none;
  z-index: 1;
}
```

---

## 11. Scrollbar

```css
* {
  scrollbar-width: thin;
  scrollbar-color: var(--bg-elevated) transparent;
}
```

---

## 12. Icon System

**Library**: `lucide-react` (v0.574+)

Common sizes:
- Sidebar/nav: `size={18}`
- Metric card: `size={18}` mobile, `size={20}` desktop
- Inline/table: `size={14}`
- Buttons: `size={14}`
- Empty state: `size={24}`
- Toast: `size={16}`
- Toast dismiss: `size={12}`

---

## 13. Dependencies Summary

| Package | Version | Role |
|---|---|---|
| `tailwindcss` | ^4 | Utility CSS (v4 with `@theme inline`) |
| `@tailwindcss/postcss` | ^4 | PostCSS integration |
| `framer-motion` | ^12.34 | Advanced animations (available but most animation is CSS) |
| `lucide-react` | ^0.574 | Icon library |
| `next` | 16.1.6 | Framework (App Router) |
| `react` / `react-dom` | 19.2.3 | UI runtime |
| `swr` | ^2.4 | Data fetching / caching |

Fonts loaded via `next/font/google` (no external CDN requests):
- **Instrument Serif** (weight 400)
- **Figtree** (variable weight)

---

## 14. Responsive Breakpoints

Standard Tailwind breakpoints used:

| Prefix | Min-width | Usage |
|---|---|---|
| (none) | 0px | Mobile-first base |
| `sm:` | 640px | Larger mobile / small tablet |
| `md:` | 768px | Tablet — sidebar becomes visible |
| `lg:` | 1024px | Desktop — wider grid layouts |

Key responsive patterns:
- Sidebar: hidden below `md:`, slide-in overlay on mobile
- Metric grid: `grid-cols-2 lg:grid-cols-4`
- Dashboard: `grid-cols-1 lg:grid-cols-3`
- Table: hidden below `md:`, replaced by card list
- Padding: `p-3 sm:p-5` or `p-4 sm:p-6`
- Text: `text-2xl sm:text-3xl` for page titles

---

## 15. Applying This Design Language to a New Project

### Minimum Setup

1. Install: `tailwindcss@4`, `@tailwindcss/postcss@4`, `lucide-react`
2. Load fonts: `Instrument_Serif` (400) and `Figtree` (variable) via `next/font/google`
3. Copy the full `globals.css` with all theme definitions
4. Create the theme provider with `data-theme` attribute switching
5. Use CSS variables everywhere via `style={{ color: 'var(--text-primary)' }}` pattern

### Key Patterns to Replicate

- **Never use hardcoded colors** — always reference CSS variables
- **Glass card is the primary surface** — gradient background + blur + border
- **Instrument Serif for display, Figtree for body** — strict separation
- **Status colors are semantic** — green/amber/rose/indigo for qualified/pending/error/new
- **Accent color tints at ~15% opacity** — `{color}15` hex suffix or `rgba(r,g,b,0.12)` for icon backgrounds
- **Stagger children animation** on page-level content containers
- **Inline styles for theme variables** — Tailwind classes for layout, inline `style={}` for colors
