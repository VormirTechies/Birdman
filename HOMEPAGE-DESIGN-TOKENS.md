# 🎨 Homepage Design Tokens & Implementation Guide

**Purpose:** Implementation-ready design tokens for Parrot-Frontend to directly integrate with Tailwind CSS configuration.

---

## 🎨 Tailwind CSS Configuration

### 1. Extended Color Palette

Add to `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary colors
        'parakeet-green': {
          DEFAULT: '#00A36C',
          10: 'rgba(0, 163, 108, 0.1)',
          20: 'rgba(0, 163, 108, 0.2)',
          30: 'rgba(0, 163, 108, 0.3)',
        },
        'sunset-gold': {
          DEFAULT: '#FF8C00',
          10: 'rgba(255, 140, 0, 0.1)',
          20: 'rgba(255, 140, 0, 0.2)',
          30: 'rgba(255, 140, 0, 0.3)',
        },
        
        // Neutrals
        'parchment': '#FEFDF5',
        'mist-white': '#F0F4F0',
        'chennai-earth': '#8B6914',
        'deep-night': '#1A1A2E',
        
        // Semantic
        'error': '#DC2626',
        'success': '#00A36C',
        'warning': '#FF8C00',
        'info': '#3B82F6',
      },
      
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
      },
      
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 163, 108, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 140, 0, 0.3)',
      },
      
      animation: {
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
};
```

---

## 📏 Spacing Reference

### Component-Specific Spacing (Tailwind Classes)

```typescript
// Sections
const sectionPadding = "py-16 md:py-24";
const sectionPaddingLarge = "py-20 md:py-32";

// Containers
const containerPadding = "px-4 md:px-8";
const containerMaxWidth = "max-w-6xl mx-auto"; // 1152px
const containerMaxWidthWide = "max-w-7xl mx-auto"; // 1280px

// Cards
const cardPadding = "p-6";
const cardRadius = "rounded-xl"; // 12px
const cardShadow = "shadow-md hover:shadow-lg transition-shadow duration-300";

// Buttons
const buttonSizes = {
  small: "px-4 py-2 text-sm",
  default: "px-6 py-3 text-base",
  large: "px-8 py-4 text-lg",
};

// Gaps
const gridGap = "gap-6"; // 24px
const flexGap = "gap-4"; // 16px
```

---

## 🔤 Typography Utility Classes

### Heading Styles

```typescript
// Hero headline
const heroHeadline = "font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight";

// H1 (Section headings)
const h1 = "font-serif font-bold text-3xl md:text-4xl text-deep-night leading-tight";

// H2 (Subsection headings)
const h2 = "font-serif font-semibold text-2xl md:text-3xl text-deep-night leading-snug";

// H3 (Card titles)
const h3 = "font-serif font-semibold text-xl md:text-2xl text-deep-night leading-snug";

// Body text
const bodyLarge = "text-lg md:text-xl text-stone-700 leading-relaxed";
const body = "text-base md:text-lg text-stone-700 leading-relaxed";
const bodySmall = "text-sm text-stone-600 leading-relaxed";

// Labels
const label = "text-sm font-medium text-chennai-earth uppercase tracking-wide";

// Tamil text (always 2px larger)
const tamilBody = "text-lg md:text-xl font-tamil text-stone-700 leading-loose";
const tamilHeading = "text-2xl md:text-3xl font-tamil text-chennai-earth leading-relaxed";
```

### Copy-Paste Ready Classes

```jsx
{/* Hero Headline */}
<h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight text-white">
  Birdman of Chennai
</h1>

{/* Section Heading with Tamil */}
<h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-6">
  What Visitors Are Saying
  <span className="block text-2xl md:text-3xl font-tamil mt-2 text-chennai-earth">
    விருந்தினர்கள் கூறுவது
  </span>
</h2>

{/* Body Copy */}
<p className="text-base md:text-lg text-stone-700 leading-relaxed">
  For over 16 years, Mr. Sudarson Sah has welcomed thousands of wild 
  rose-ringed parakeets to his rooftop sanctuary in Chennai.
</p>

{/* Tamil Body */}
<p className="text-lg md:text-xl font-tamil text-stone-700 leading-loose">
  அவரது கதை பொறுமை, அர்ப்பணிப்பு மற்றும் இயற்கையுடன் கூடிய உறவு...
</p>
```

---

## 🎨 Component Style Reference

### 1. Hero Section Styles

```typescript
// Hero Container
<section className="relative h-screen flex items-center justify-center overflow-hidden">
  {/* Background Video/Image */}
  <div className="absolute inset-0 z-0">
    <video 
      autoPlay 
      muted 
      loop 
      playsInline
      className="w-full h-full object-cover"
    >
      <source src="/videos/hero-parakeets.webm" type="video/webm" />
      <source src="/videos/hero-parakeets.mp4" type="video/mp4" />
    </video>
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-deep-night/40 via-transparent to-parchment" />
  </div>
  
  {/* Content */}
  <div className="relative z-10 px-4 py-24 text-center max-w-5xl">
    {/* Headlines and CTAs */}
  </div>
</section>

// Navigation Bar (transparent → solid on scroll)
<nav className="absolute top-0 w-full z-50 transition-all duration-300">
  <div className="container mx-auto px-4 py-6 flex items-center justify-between">
    {/* Navigation items */}
  </div>
</nav>
```

### 2. Button Components

```typescript
// Primary Button
<button className="
  px-8 py-4 
  bg-parakeet-green 
  text-white text-lg font-medium 
  rounded-lg 
  shadow-md 
  hover:scale-102 hover:shadow-glow-green 
  active:scale-98 
  transition-all duration-200 
  flex items-center justify-center gap-2
  min-h-[56px] /* Exceeds 44px WCAG minimum */
  focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2
">
  <CalendarIcon className="w-5 h-5" />
  Book Your Visit
  <span className="ml-2 font-tamil">பார்வை பதிவு</span>
</button>

// Secondary Button
<button className="
  px-8 py-4 
  bg-sunset-gold 
  text-white text-lg font-medium 
  rounded-lg 
  shadow-md 
  hover:scale-102 hover:shadow-glow-gold 
  active:scale-98 
  transition-all duration-200 
  flex items-center justify-center gap-2
  min-h-[56px]
  focus:outline-none focus:ring-2 focus:ring-sunset-gold focus:ring-offset-2
">
  <PlayIcon className="w-5 h-5" />
  Watch His Story
</button>

// Outline Button
<button className="
  px-6 py-3 
  border-2 border-parakeet-green 
  text-parakeet-green text-base font-medium 
  rounded-lg 
  hover:bg-parakeet-green-10 
  active:scale-98 
  transition-all duration-200 
  min-h-[44px]
  focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2
">
  Learn More
</button>
```

### 3. Card Components

```typescript
// Standard Card (About Section, Stats)
<div className="
  bg-mist-white 
  rounded-xl 
  p-6 
  shadow-md 
  hover:shadow-lg 
  transition-shadow duration-300
">
  {/* Card content */}
</div>

// Feedback Card
<div className="
  bg-mist-white 
  rounded-xl 
  p-6 
  shadow-md 
  hover:shadow-lg 
  transition-shadow duration-300
  min-h-[280px] /* Consistent height */
">
  {/* Star rating */}
  <div className="flex items-center gap-1 mb-4">
    {[...Array(5)].map((_, i) => (
      <svg className="w-5 h-5 text-sunset-gold fill-current">
        {/* Star icon */}
      </svg>
    ))}
  </div>
  
  {/* Feedback text */}
  <p className="text-stone-700 leading-relaxed mb-4 line-clamp-4">
    "Amazing experience watching thousands of parakeets..."
  </p>
  
  {/* Author */}
  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-chennai-earth/20">
    <div className="w-10 h-10 rounded-full bg-parakeet-green/10 flex items-center justify-center">
      <span className="text-parakeet-green font-semibold text-lg">P</span>
    </div>
    <div>
      <p className="font-medium text-deep-night">Priya S.</p>
      <p className="text-sm text-chennai-earth/70">Dec 15, 2025</p>
    </div>
  </div>
</div>

// Gallery Card
<div className="
  relative 
  group 
  cursor-pointer 
  break-inside-avoid 
  mb-4 
  overflow-hidden 
  rounded-lg
  hover:scale-102 
  transition-transform duration-200
">
  <img 
    src="/images/gallery/parakeets-1.jpg" 
    alt="Parakeets gathering at sunset"
    className="w-full h-auto object-cover"
  />
  
  {/* Hover overlay */}
  <div className="
    absolute inset-0 
    bg-deep-night/60 
    opacity-0 
    group-hover:opacity-100 
    transition-opacity duration-300 
    flex items-center justify-center
  ">
    <svg className="w-12 h-12 text-white">
      {/* Zoom icon */}
    </svg>
  </div>
</div>
```

### 4. Form Elements

```typescript
// Input Field
<div className="space-y-2">
  <label className="block text-sm font-medium text-chennai-earth">
    Visitor Name
    <span className="text-error ml-1">*</span>
  </label>
  <input
    type="text"
    placeholder="Enter your name"
    className="
      w-full 
      px-4 py-3 
      border-2 border-chennai-earth/30 
      rounded-lg 
      text-deep-night 
      placeholder:text-chennai-earth/50
      focus:border-parakeet-green 
      focus:ring-2 
      focus:ring-parakeet-green/20 
      focus:outline-none
      transition-all duration-200
      min-h-[44px]
    "
  />
</div>
```

### 5. Badge Components

```typescript
// Status Badge (Slot availability)
const badges = {
  available: "bg-parakeet-green/10 text-parakeet-green border border-parakeet-green/30",
  warning: "bg-sunset-gold/10 text-sunset-gold border border-sunset-gold/30",
  full: "bg-error/10 text-error border border-error/30",
  closed: "bg-chennai-earth/10 text-chennai-earth border border-chennai-earth/30",
};

<span className={`
  inline-flex items-center 
  px-3 py-1 
  rounded-full 
  text-sm font-medium 
  ${badges.available}
`}>
  Available
</span>
```

---

## 🎬 Framer Motion Variants

### Copy-Paste Ready Animation Variants

```typescript
// animations.ts
import { Variants } from 'framer-motion';

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

// Scroll reveal
export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 20 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  viewport: { once: true, margin: '-50px' }
};

// Stagger children
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Fade in only
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

// Scale on hover
export const scaleOnHover = {
  scale: 1.02,
  transition: { duration: 0.2 }
};

// Glow on hover
export const glowGreen = {
  scale: 1.02,
  boxShadow: '0 0 20px rgba(0, 163, 108, 0.3)',
  transition: { duration: 0.2 }
};

export const glowGold = {
  scale: 1.02,
  boxShadow: '0 0 20px rgba(255, 140, 0, 0.3)',
  transition: { duration: 0.2 }
};

// Modal spring
export const modalSpring = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300
};

// Bounce indicator
export const bounceIndicator: Variants = {
  animate: {
    y: [0, 8, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Loading pulse
export const loadingPulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};
```

### Usage Examples

```typescript
import { motion } from 'framer-motion';
import { scrollReveal, staggerContainer, glowGreen } from '@/lib/animations';

// Scroll reveal
<motion.div
  variants={scrollReveal}
  initial="initial"
  whileInView="whileInView"
  viewport={{ once: true }}
>
  <h2>Content appears on scroll</h2>
</motion.div>

// Stagger children
<motion.div
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={scrollReveal}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Hover effect
<motion.button
  whileHover={glowGreen}
  whileTap={{ scale: 0.98 }}
>
  Book Now
</motion.button>
```

---

## 📱 Responsive Patterns

### Container Queries

```typescript
// Section containers
const sectionContainer = "py-16 md:py-24 bg-parchment";
const innerContainer = "container mx-auto px-4 md:px-8 max-w-6xl";

// Grid patterns
const grid2Col = "grid md:grid-cols-2 gap-6 md:gap-12";
const grid3Col = "grid md:grid-cols-2 lg:grid-cols-3 gap-6";
const grid4Col = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

// Flex patterns
const flexStackToRow = "flex flex-col md:flex-row gap-4 md:gap-6";
const flexCenter = "flex items-center justify-center";
```

### Typography Responsive Classes

```typescript
// Responsive heading scales
<h1 className="text-4xl md:text-5xl lg:text-6xl">Hero Headline</h1>
<h2 className="text-3xl md:text-4xl lg:text-5xl">Section Heading</h2>
<h3 className="text-2xl md:text-3xl">Subsection Heading</h3>
<p className="text-base md:text-lg">Body text</p>

// Responsive spacing
<div className="px-4 md:px-8 py-16 md:py-24">Content</div>
<div className="mb-8 md:mb-12">Section</div>
```

---

## ♿ Accessibility Utilities

### Focus States

```typescript
// Standard focus ring
const focusRing = "focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2";

// Focus visible (keyboard only)
const focusVisible = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-parakeet-green";

// Skip to content link (hidden until focused)
<a 
  href="#main-content" 
  className="
    sr-only 
    focus:not-sr-only 
    focus:absolute 
    focus:top-4 
    focus:left-4 
    focus:z-50 
    focus:px-4 
    focus:py-2 
    focus:bg-parakeet-green 
    focus:text-white 
    focus:rounded-lg
  "
>
  Skip to main content
</a>
```

### Screen Reader Only Content

```typescript
// Visually hidden but accessible to screen readers
const srOnly = "sr-only";

<span className="sr-only">Loading, please wait</span>

// Show on focus (for skip links)
const srOnlyFocusable = "sr-only focus:not-sr-only";
```

### ARIA Patterns

```typescript
// Navigation
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="#about" aria-current="page">About</a></li>
  </ul>
</nav>

// Modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal content</p>
</div>

// Loading state
<div role="status" aria-live="polite">
  <span className="sr-only">Loading content...</span>
  {/* Visual loading indicator */}
</div>
```

---

## 🎯 Quick Reference: Common Combinations

### Hero Section Classes

```jsx
<section className="relative h-screen flex items-center justify-center overflow-hidden">
  <div className="relative z-10 px-4 py-24 text-center max-w-5xl">
    <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight text-white mb-4">
      Birdman of Chennai
    </h1>
    <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto mb-10">
      Subheadline text
    </p>
    <button className="px-8 py-4 bg-parakeet-green text-white text-lg font-medium rounded-lg shadow-md hover:scale-102 hover:shadow-glow-green transition-all duration-200">
      Book Your Visit
    </button>
  </div>
</section>
```

### About Section Classes

```jsx
<section className="py-16 md:py-24 bg-parchment">
  <div className="container mx-auto px-4 max-w-6xl">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg">
        {/* Image */}
      </div>
      <div>
        <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-6">
          Section Heading
        </h2>
        <p className="text-base md:text-lg text-stone-700 leading-relaxed">
          Body text
        </p>
      </div>
    </div>
  </div>
</section>
```

### Gallery Section Classes

```jsx
<section className="py-16 md:py-24 bg-gradient-to-b from-parchment to-mist-white">
  <div className="container mx-auto px-4 max-w-7xl">
    <div className="text-center mb-12">
      <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night">
        Gallery Heading
      </h2>
    </div>
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {/* Gallery items */}
    </div>
  </div>
</section>
```

### Feedback Card Classes

```jsx
<div className="bg-mist-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
  <div className="flex items-center gap-1 mb-4">
    {/* Stars */}
  </div>
  <p className="text-stone-700 leading-relaxed mb-4 line-clamp-4">
    Feedback text
  </p>
  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-chennai-earth/20">
    {/* Author */}
  </div>
</div>
```

---

## 🔧 Implementation Checklist

### Setup Phase
- [ ] Install dependencies: `framer-motion`, `swiper`, `react-icons`
- [ ] Update `tailwind.config.ts` with extended colors and fonts
- [ ] Import Google Fonts: Merriweather, Inter, Noto Sans Tamil
- [ ] Create `/src/lib/animations.ts` with motion variants

### Component Development
- [ ] Implement atomic components (Button, Input, Badge)
- [ ] Build molecular components (FeedbackCard, GalleryCard, StatCard)
- [ ] Assemble organisms (HeroSection, AboutSection, etc.)
- [ ] Integrate into `/src/app/page.tsx`

### Content Integration
- [ ] Replace placeholder text with actual content
- [ ] Add proper alt text to all images
- [ ] Ensure bilingual support (EN/Tamil) throughout

### Testing & Optimization
- [ ] Test responsive breakpoints (375px, 768px, 1024px, 1280px)
- [ ] Run Lighthouse accessibility audit (target 95+)
- [ ] Test keyboard navigation (Tab, Enter, Escape, Arrows)
- [ ] Test screen reader compatibility (NVDA, VoiceOver)
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Test `prefers-reduced-motion` behavior

---

**End of Design Tokens & Implementation Guide**  
**Version:** 1.0  
**Last Updated:** March 25, 2026  
**Designer:** Parrot-UIUX  
**For:** Parrot-Frontend Implementation
