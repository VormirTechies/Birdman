# 🏠 Homepage Implementation Documentation

## Overview

This document provides implementation details for the Birdman of Chennai homepage and related pages.

## 🗂️ Structure

### Pages Implemented

1. **Homepage** (`/` - `src/app/page.tsx`)
   - Hero section with call-to-action
   - About section with stats
   - Photo gallery with lightbox
   - Recent feedback testimonials
   - Footer with CTA

2. **Booking Page** (`/book` - `src/app/book/page.tsx`)
   - Form with client-side validation
   - Date and time selection
   - Rules acceptance checkbox
   - Responsive design

3. **Booking Confirmation** (`/book/confirmation` - `src/app/book/confirmation/page.tsx`)
   - Success message
   - Booking details display
   - Quick actions

4. **Feedback List** (`/feedback` - `src/app/feedback/page.tsx`)
   - All visitor testimonials
   - Filter by rating
   - Pagination-ready structure

5. **Submit Feedback** (`/feedback/submit` - `src/app/feedback/submit/page.tsx`)
   - Interactive star rating
   - Form validation
   - Success state

## 🧩 Component Architecture

### Atoms (Basic Components)
Located in `src/components/atoms/`

- **StarRating** - Interactive and display star ratings
- **Loading** - Loading spinner and skeleton components
- **Button, Input, Label, Badge, Card, Textarea** - From shadcn/ui

### Molecules (Simple Combinations)
Located in `src/components/molecules/`

- **FormField** - Label + Input + Error message
- **FeedbackCard** - Testimonial display card with truncation

### Organisms (Complex Sections)
Located in `src/components/organisms/`

- **Header** - Sticky navigation with mobile menu
- **Footer** - Multi-column footer with CTA
- **HeroSection** - Full-screen hero with animations
- **AboutSection** - Two-column layout with stats
- **GallerySection** - Image grid wrapper
- **GalleryGrid** - Masonry grid with lightbox
- **FeedbackSection** - Testimonial showcase

## 🎨 Design System

### Colors

```tsx
// Primary
bg-parakeet-green    // #00A36C
bg-sunset-gold       // #FF8C00

// Neutrals
bg-parchment         // #FEFDF5 (page background)
bg-mist-white        // #F0F4F0 (cards)
bg-deep-night        // #1A1A2E (dark mode)
text-chennai-earth   // #8B6914 (secondary text)
```

### Typography

```tsx
// Headings
font-serif           // Merriweather (Google Fonts)

// Body
font-sans            // Inter (Google Fonts)

// Tamil
font-tamil           // Noto Sans Tamil (Google Fonts)
```

### Spacing

```tsx
// Sections
py-16 md:py-24       // Standard section padding
py-20 md:py-32       // Large section padding

// Containers
max-w-6xl mx-auto px-4  // Standard container (1152px)
max-w-7xl mx-auto px-4  // Wide container (1280px)
```

## 🔄 Animations

All animations use **Framer Motion** and respect `prefers-reduced-motion`.

### Common Motion Variants

```tsx
// Fade in from bottom
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}

// Staggered children
transition={{ duration: 0.4, delay: index * 0.1 }}
```

## 📝 Form Validation

Client-side validation using simple React state (ready for react-hook-form + Zod integration):

```tsx
// Booking validation rules
- Name: min 2 characters
- Phone: min 10 digits
- Email: valid format (optional)
- Guests: 1-10
- Date: required, future dates
- Time: required
- Rules: must accept

// Feedback validation rules
- Rating: 1-5, required
- Message: min 10 characters
- Visit date: required
```

## 🖼️ Gallery Implementation

The gallery uses a custom lightbox implementation:

```tsx
<GalleryGrid 
  images={galleryImages} 
  loading={false} 
  columns={3} 
/>
```

**Features:**
- Responsive grid (1-4 columns)
- Click to open lightbox
- Lazy loading ready
- Loading skeletons
- Hover effects

## 🔗 API Integration Points

Currently using mock data. Replace with actual API calls:

### Bookings
```tsx
// POST /api/bookings
const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

### Feedback
```tsx
// GET /api/feedback?limit=5
const feedback = await fetch('/api/feedback?limit=5').then(r => r.json());

// POST /api/feedback
const response = await fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify(feedbackData)
});
```

### Gallery
```tsx
// GET /api/gallery
const images = await fetch('/api/gallery').then(r => r.json());
```

## ♿ Accessibility

All components follow WCAG 2.1 AA standards:

- **Keyboard Navigation**: All interactive elements accessible via Tab
- **Focus Indicators**: Visible focus rings on all focusable elements
- **ARIA Labels**: Proper labels on buttons, inputs, and images
- **Semantic HTML**: Proper heading hierarchy (h1 > h2 > h3)
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Screen Reader Support**: Descriptive alt text and aria-labels

## 📱 Responsive Design

Mobile-first approach with breakpoints:

```tsx
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Medium tablets
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

## 🚀 Performance Optimizations

1. **Next.js Image Component**: All images use `next/image` for automatic optimization
2. **Lazy Loading**: Below-fold content loads on scroll
3. **Code Splitting**: Automatic with Next.js App Router
4. **Framer Motion**: Animations respect reduced motion preferences
5. **Font Optimization**: Fonts loaded via next/font with display swap

## 🛠️ Development

### Running the Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npx tsc --noEmit
```

## 📦 Dependencies Added

These should be installed:

```bash
npm install react-hook-form @hookform/resolvers
npm install yet-another-react-lightbox  # Optional - custom lightbox built
npm install react-hot-toast             # Optional - simple alerts built
```

## 🔧 Configuration

### TypeScript Paths

```json
{
  "@/*": ["./src/*"]
}
```

### Design Tokens

All design tokens defined in `src/app/globals.css` using Tailwind v4 `@theme` directive.

## 🎯 Next Steps

1. **Add Real Images**: Replace placeholder gradients with actual photos
2. **Connect APIs**: Replace mock data with real API calls
3. **Add i18n**: Integrate next-intl for Tamil translations
4. **SEO**: Add metadata and structured data
5. **Analytics**: Add tracking for booking funnel
6. **Testing**: Add E2E tests with Playwright

## 📄 File Structure Summary

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── book/
│   │   ├── page.tsx               # Booking form
│   │   └── confirmation/page.tsx  # Confirmation
│   └── feedback/
│       ├── page.tsx               # All feedback
│       └── submit/page.tsx        # Submit feedback
├── components/
│   ├── atoms/              # Basic UI elements
│   ├── molecules/          # Simple combinations
│   └── organisms/          # Complex sections
└── types/
    └── index.ts           # TypeScript interfaces
```

## 💡 Usage Examples

### Using Components

```tsx
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { Header, Footer } from '@/components/organisms';

// In your page
<Header />
<main>
  <FormField
    label="Name"
    name="name"
    value={name}
    onChange={setName}
    required
  />
  <Button variant="primary" size="lg">
    Submit
  </Button>
</main>
<Footer />
```

## 🐛 Known Issues

1. **lucide-react types**: Type declarations warning (works at runtime)
2. **Mock Data**: All data is currently mocked
3. **Images**: Placeholder gradients need replacement
4. **API Routes**: Not yet implemented

## 📞 Support

For questions or issues, refer to:
- Design specs: `HOMEPAGE-DESIGN-TOKENS.md`, `HOMEPAGE-WIREFRAME.md`
- Component guide: `COMPONENT-GUIDE.md`
- Design system: `DESIGN-SYSTEM.md`
