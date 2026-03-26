# 🎨 Birdman of Chennai — Design System

**Philosophy:** "Documentary-Organic"  
**Mission:** Create a digital experience that feels like stepping into a nature documentary — cinematic, intimate, alive, and deeply respectful of Mr. Sudarson Sah's 16-year journey with thousands of wild parakeets.

---

## 🌈 Color Palette

### Primary Colors

```css
--parakeet-green: #00A36C;    /* Primary brand, CTAs, active states */
--sunset-gold: #FF8C00;        /* Accents, highlights, hover states */
```

### Neutral Colors

```css
--parchment: #FEFDF5;          /* Page backgrounds (warm, journal-like) */
--mist-white: #F0F4F0;         /* Cards, elevated surfaces */
--chennai-earth: #8B6914;      /* Secondary text, decorative borders */
--deep-night: #1A1A2E;         /* Dark mode backgrounds, overlay text */
```

### Semantic Colors

```css
--success: #00A36C;            /* Booking confirmed */
--warning: #FF8C00;            /* Few slots left */
--error: #DC2626;              /* Slot full, validation errors */
--info: #3B82F6;               /* Informational messages */
```

### Opacity Variants

```css
--parakeet-green-10: rgba(0, 163, 108, 0.1);
--parakeet-green-20: rgba(0, 163, 108, 0.2);
--sunset-gold-10: rgba(255, 140, 0, 0.1);
--sunset-gold-20: rgba(255, 140, 0, 0.2);
```

---

## 🔤 Typography

### Font Families

```css
--font-serif: 'Merriweather', Georgia, serif;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-tamil: 'Noto Sans Tamil', sans-serif;
```

### Font Weights

```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Type Scale

| Role | Font | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Hero** | Merriweather | 3.5rem (56px) | 700 | 1.1 | Page titles |
| **H1** | Merriweather | 2.5rem (40px) | 700 | 1.2 | Section headings |
| **H2** | Merriweather | 2rem (32px) | 600 | 1.3 | Subsection headings |
| **H3** | Merriweather | 1.5rem (24px) | 600 | 1.4 | Card titles |
| **Body Large** | Inter | 1.125rem (18px) | 400 | 1.6 | Intro paragraphs |
| **Body** | Inter | 1rem (16px) | 400 | 1.6 | Standard text |
| **Body Small** | Inter | 0.875rem (14px) | 400 | 1.5 | Captions, meta |
| **Label** | Inter | 0.875rem (14px) | 500 | 1.4 | Form labels, buttons |
| **Tamil Body** | Noto Sans Tamil | 1.125rem (18px) | 400 | 1.7 | Tamil text (larger for readability) |

### Mobile Adjustments

On screens < 640px:
- Hero: 2.5rem (40px)
- H1: 2rem (32px)
- H2: 1.5rem (24px)
- Body: 1rem (16px) — maintain minimum readability

---

## 📏 Spacing Scale

Based on 4px base unit (Tailwind default):

```
1  = 4px    (micro spacing)
2  = 8px    (tight spacing)
3  = 12px   (compact)
4  = 16px   (base)
6  = 24px   (comfortable)
8  = 32px   (section spacing)
12 = 48px   (large gaps)
16 = 64px   (section padding)
24 = 96px   (hero padding)
```

### Component-Specific Spacing

| Element | Padding | Margin |
|---|---|---|
| Button (small) | px-4 py-2 | — |
| Button (default) | px-6 py-3 | — |
| Button (large) | px-8 py-4 | — |
| Card | p-6 | mb-6 |
| Section | py-16 | — |
| Container | px-4 md:px-8 | mx-auto |

---

## 🎭 Shadows & Elevation

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-glow-green: 0 0 20px rgba(0, 163, 108, 0.3);
--shadow-glow-gold: 0 0 20px rgba(255, 140, 0, 0.3);
```

### Usage

| Elevation | Shadow | Usage |
|---|---|---|
| **0** | none | Page background |
| **1** | sm | Inputs, subtle cards |
| **2** | md | Cards, buttons (default) |
| **3** | lg | Modals, dropdowns, floating elements |
| **Glow** | glow-green | CTA hover states |

---

## 🎬 Animation Vocabulary (Framer Motion)

### Principles

1. **Organic motion** — Inspired by bird flight: gentle arcs, no sharp edges
2. **Respect for silence** — Animations are soft, never jarring
3. **Performance-first** — GPU-accelerated transforms only
4. **Accessibility** — Respect `prefers-reduced-motion`

### Standard Transitions

```typescript
// Page transitions
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Scroll reveal (stagger children)
const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// CTA hover
const ctaHover = {
  scale: 1.02,
  boxShadow: '0 0 20px rgba(0, 163, 108, 0.3)',
  transition: { duration: 0.2, ease: 'easeOut' }
};

// Modal entry
const modalSpring = {
  type: 'spring',
  damping: 25,
  stiffness: 300
};

// Loading pulse
const loadingPulse = {
  scale: [1, 1.05, 1],
  opacity: [0.6, 1, 0.6],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};
```

---

## 🧩 Component Specifications

### Button

**Variants:**

```typescript
// Primary (Parakeet Green)
<Button variant="primary">Book a Visit</Button>
// bg-parakeet-green text-white hover:scale-102 shadow-glow-green

// Secondary (Sunset Gold)
<Button variant="secondary">Learn More</Button>
// bg-sunset-gold text-white hover:scale-102 shadow-glow-gold

// Outline
<Button variant="outline">Cancel</Button>
// border-2 border-parakeet-green text-parakeet-green hover:bg-parakeet-green-10

// Ghost
<Button variant="ghost">Back</Button>
// text-chennai-earth hover:bg-mist-white
```

**Sizes:**
- Small: `px-4 py-2 text-sm`
- Default: `px-6 py-3 text-base`
- Large: `px-8 py-4 text-lg`

**Touch Target:** Minimum `44x44px` (WCAG 2.1 AA)

---

### Card

```typescript
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Morning Session</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Styles
bg-mist-white 
rounded-xl 
p-6 
shadow-md 
hover:shadow-lg 
transition-shadow
```

---

### Input Fields

```typescript
<Input 
  label="Visitor Name"
  placeholder="Enter your name"
  error="Name is required"
/>

// Styles
border-2 
border-chennai-earth/30 
focus:border-parakeet-green 
focus:ring-2 
focus:ring-parakeet-green/20
rounded-lg 
px-4 py-3
text-deep-night
placeholder:text-chennai-earth/50
```

**Tamil Support:**
- Apply `font-tamil` class explicitly
- Increase font size by 2px for Tamil scripts

---

### Slot Status Badge

```typescript
// Available
<Badge status="available">Available</Badge>
// bg-parakeet-green/10 text-parakeet-green border border-parakeet-green/30

// Few Left
<Badge status="warning">Few Left</Badge>
// bg-sunset-gold/10 text-sunset-gold border border-sunset-gold/30

// Full
<Badge status="full">Full</Badge>
// bg-error/10 text-error border border-error/30

// Closed
<Badge status="closed">Closed</Badge>
// bg-chennai-earth/10 text-chennai-earth border border-chennai-earth/30
```

---

## ♿ Accessibility Standards (WCAG 2.1 AA)

### Color Contrast

✅ **Passing Combinations:**

| Text | Background | Ratio | Pass |
|---|---|---|---|
| `#1A1A2E` (deep-night) | `#FEFDF5` (parchment) | 15.3:1 | ✅ AAA |
| `#00A36C` (parakeet-green) | `#FFFFFF` (white) | 3.2:1 | ✅ AA Large |
| `#FFFFFF` (white) | `#00A36C` (parakeet-green) | 3.2:1 | ✅ AA Large |
| `#8B6914` (chennai-earth) | `#FEFDF5` (parchment) | 4.8:1 | ✅ AA |

### Keyboard Navigation

- All interactive elements must be focusable
- Visible focus indicators (2px outline, parakeet-green)
- Logical tab order (top to bottom, left to right)

### Focus Rings

```css
focus:outline-none 
focus:ring-2 
focus:ring-parakeet-green 
focus:ring-offset-2
```

### Screen Reader Support

- All images have meaningful `alt` text in both English and Tamil
- Form labels explicitly linked to inputs
- ARIA labels for icon-only buttons
- `aria-live` regions for dynamic booking status updates

### Touch Targets

- Minimum `44x44px` for all interactive elements
- Adequate spacing between buttons (minimum 8px gap)

---

## 🌍 Internationalization (i18n)

### Language Support

- **Primary:** Tamil (`ta`) — First-class citizen
- **Secondary:** English (`en`)

### Design Considerations for Tamil

1. **Font Size:** Tamil script requires +2px for equivalent readability
2. **Line Height:** Increase by 0.1 (1.6 → 1.7) for Tamil text
3. **Font Family:** Always specify `Noto Sans Tamil` explicitly
4. **Text Length:** Tamil translations are typically 10-20% longer than English

### Language Switcher

```typescript
<LanguageSwitcher />
// Fixed position: top-right
// Icon + text label
// Smooth transition between locales
```

---

## 📱 Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
};
```

### Design Priority

**Mobile-First:** Base styles target mobile (320px+)

| Device | Breakpoint | Layout |
|---|---|---|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640px - 1024px | Two-column grid for cards |
| Desktop | > 1024px | Three-column grid, wider containers |

**Admin Dashboard:** Mobile-only (optimized for Mr. Sudarson's phone)

---

## 🎨 Page-Specific Design Patterns

### Story Portfolio (Home Page)

**Layout:**
```
HeroSection (full viewport height)
  ↓
StoryTimeline (scroll-triggered reveals)
  ↓
CinemaConnection (image + text card)
  ↓
ConservationStats (animated counters)
  ↓
CTASection (book visit)
```

**Hero Section:**
- Full-bleed background image (parakeets in flight)
- Gradient overlay for text readability
- Large serif heading (Merriweather 700)
- Subtle scroll indicator animation

---

### Booking Engine

**Layout:**
```
DatePicker (calendar view)
  ↓
SlotGrid (morning/evening cards with capacity)
  ↓
BookingForm (visitor details)
  ↓
RulesModal (mandatory acknowledgment)
  ↓
ConfirmationScreen
```

**Slot Cards:**
- Real-time capacity indicator
- Color-coded status badges
- Disabled state for full/closed slots
- Subtle hover effects

---

### Admin Dashboard

**Mobile-First Layout:**
```
Header (greeting + date)
  ↓
QuickStats (today's bookings, monthly total)
  ↓
TodaysList (expandable booking cards)
  ↓
ToggleAvailability (simple switch for no-feed days)
```

**Interaction Pattern:**
- Bottom navigation (large touch targets)
- Swipe gestures for navigation
- Minimal text entry (toggles and selects preferred)

---

## 🖼️ Image Guidelines

### Optimization

- Use Next.js `<Image>` component (automatic optimization)
- Serve WebP with JPEG fallback
- Lazy load images below the fold
- Responsive sizes: `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`

### Aspect Ratios

| Usage | Ratio | Example Size |
|---|---|---|
| Hero background | 16:9 | 1920x1080 |
| Story images | 4:3 | 1200x900 |
| Thumbnail | 1:1 | 400x400 |

### Alt Text

**English Example:**
```
alt="Thousands of emerald parakeets gathering on Mr. Sudarson Sah's rooftop at sunset in Chintadripet, Chennai"
```

**Tamil Example:**
```
alt="சென்னை சிந்தாத்திரிப்பேட்டில் சூரிய அஸ்தமனத்தின் போது திரு. சுதர்சன் சாஹ் அவர்களின் மொட்டை மாடியில் கூடும் ஆயிரக்கணக்கான மரகத கிளிகள்"
```

---

## 🎯 Implementation Checklist for Parrot-Frontend

### Phase 1: Foundation
- [ ] Set up Tailwind CSS config with design tokens
- [ ] Import Google Fonts (Merriweather, Inter, Noto Sans Tamil)
- [ ] Create base CSS variables in `globals.css`
- [ ] Set up Framer Motion wrapper components

### Phase 2: Atomic Components
- [ ] Button (all variants)
- [ ] Input, Textarea, Select
- [ ] Badge (status indicators)
- [ ] Card components (Card, CardHeader, CardContent)
- [ ] Icon system (lucide-react)

### Phase 3: Molecular Components
- [ ] FormField (label + input + error)
- [ ] SlotCard (booking slot with capacity)
- [ ] StoryCard (timeline cards)
- [ ] LanguageSwitcher

### Phase 4: Organism Components
- [ ] HeroSection
- [ ] BookingForm (multi-step)
- [ ] SlotGrid (morning/evening slots)
- [ ] RulesModal (mandatory acknowledgment)
- [ ] AdminDashboard cards

### Phase 5: Templates
- [ ] PageLayout (header, footer, container)
- [ ] BookingLayout (stepper navigation)
- [ ] AdminLayout (mobile-first)

---

## 📖 Reference Implementation Examples

### Button Component

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-parakeet-green text-white hover:shadow-[0_0_20px_rgba(0,163,108,0.3)]',
        secondary: 'bg-sunset-gold text-white hover:shadow-[0_0_20px_rgba(255,140,0,0.3)]',
        outline: 'border-2 border-parakeet-green text-parakeet-green hover:bg-parakeet-green/10',
        ghost: 'text-chennai-earth hover:bg-mist-white',
      },
      size: {
        sm: 'px-4 py-2 text-sm min-h-[36px]',
        md: 'px-6 py-3 text-base min-h-[44px]',
        lg: 'px-8 py-4 text-lg min-h-[52px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
```

---

## ✅ Design Sign-Off

This design system is **production-ready** and approved for implementation.

**Handoff to:** `@Parrot-Frontend`

**Next Steps:**
1. Configure Tailwind with these design tokens
2. Set up font imports
3. Build atomic components following these specs
4. Ensure all accessibility requirements are met

**Design Review Cadence:**
- Check-in after atomic components complete
- Review before each page goes live
- Iterate based on Mr. Sudarson's feedback

---

**Design System Version:** 1.0.0  
**Last Updated:** March 24, 2026  
**Designer:** Parrot-UIUX  
**For:** The Birdman of Chennai Digital Sanctuary
