# 📐 Homepage Visual Specifications

**Purpose:** Exact measurements, spacing, and layout specifications for pixel-perfect implementation of the homepage.

---

## 🔍 Section-by-Section Measurements

### 1. Hero Section

#### Desktop (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar                                          │ ← 80px height
│ Margin: 0                                               │
│ Padding: 24px (top/bottom) 32px (left/right)           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                   [HERO CONTENT]                         │
│                                                          │
│ Container: 1280px max-width, centered                   │
│ Padding: 96px (top/bottom) 32px (left/right)           │
│                                                          │
│ Headline: 56px font size, -1.12px letter spacing        │
│ Margin bottom: 16px                                     │
│                                                          │
│ Subheadline: 18px font size                             │
│ Max width: 640px                                        │
│ Margin bottom: 40px                                     │
│                                                          │
│ CTA Buttons:                                             │
│   - Width: auto (with padding)                          │
│   - Height: 56px                                        │
│   - Padding: 32px (left/right) 16px (top/bottom)        │
│   - Gap between buttons: 16px                           │
│   - Border radius: 8px                                  │
│                                                          │
│ Scroll Indicator:                                        │
│   - Bottom: 32px                                        │
│   - Size: 32x32px                                       │
└─────────────────────────────────────────────────────────┘
Total height: 100vh (viewport height)
```

#### Tablet (768px - 1023px)

```
┌──────────────────────────────────────┐
│ Navigation Bar                       │ ← 72px height
│ Padding: 20px (top/bottom)           │
├──────────────────────────────────────┤
│                                      │
│        [HERO CONTENT]                │
│                                      │
│ Container: 720px max-width           │
│ Padding: 80px (top/bottom)           │
│          24px (left/right)           │
│                                      │
│ Headline: 48px font size             │
│ Margin bottom: 16px                  │
│                                      │
│ Subheadline: 18px font size          │
│ Margin bottom: 32px                  │
│                                      │
│ CTA Buttons:                         │
│   - Height: 56px                     │
│   - Padding: 32px (left/right)       │
│   - Gap: 16px                        │
│   - Full-width on mobile toggle      │
│                                      │
└──────────────────────────────────────┘
Total height: 100vh
```

#### Mobile (375px - 767px)

```
┌───────────────────────────┐
│ [☰] Logo [Lang]           │ ← 64px height
│ Padding: 16px             │
├───────────────────────────┤
│                           │
│   [HERO CONTENT]          │
│                           │
│ Padding: 96px (top)       │
│          16px (sides)     │
│          64px (bottom)    │
│                           │
│ Headline: 40px font size  │
│ Margin: 0 0 12px 0        │
│                           │
│ Subheadline: 16px         │
│ Margin: 0 0 32px 0        │
│                           │
│ CTA Buttons:              │
│   - Width: 100% (full)    │
│   - Height: 56px          │
│   - Margin bottom: 12px   │
│   - Border radius: 8px    │
│                           │
└───────────────────────────┘
Total height: 90vh (mobile)
```

---

### 2. About Section

#### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│ Section Padding: 96px (top/bottom) 0 (left/right)       │
│                                                          │
│ ┌─────────────────┐  ┌──────────────────────────────┐  │
│ │                 │  │                              │  │
│ │  Image Block    │  │    Content Block             │  │
│ │  500px wide     │  │    600px wide                │  │
│ │  625px tall     │  │                              │  │
│ │                 │  │  Heading: 40px font          │  │
│ │  Border radius: │  │  Margin: 0 0 24px 0          │  │
│ │  16px           │  │                              │  │
│ │                 │  │  Body paragraphs:            │  │
│ │                 │  │  - 18px font size            │  │
│ │                 │  │  - 16px margin between       │  │
│ │                 │  │                              │  │
│ │                 │  │  Stats Grid:                 │  │
│ │                 │  │  - Margin top: 40px          │  │
│ │                 │  │  - 4 columns                 │  │
│ │                 │  │  - 24px gap                  │  │
│ │                 │  │  - Padding: 32px             │  │
│ │                 │  │  - Border radius: 12px       │  │
│ │                 │  │                              │  │
│ │                 │  │  CTA Button:                 │  │
│ │                 │  │  - Margin top: 40px          │  │
│ │                 │  │  - Height: 56px              │  │
│ └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  Total container: 1152px max-width                      │
│  Gap between columns: 48px                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout

```
┌────────────────────────────┐
│ Section Padding:           │
│ 64px (top/bottom)          │
│ 16px (left/right)          │
│                            │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │  Image Block           │ │
│ │  Full-width            │ │
│ │  Aspect ratio: 4:5     │ │
│ │  (343px × 428px)       │ │
│ │  Border radius: 16px   │ │
│ │                        │ │
│ └────────────────────────┘ │
│ Margin bottom: 32px        │
│                            │
│ Heading: 32px font         │
│ Margin: 0 0 24px 0         │
│                            │
│ Body paragraphs:           │
│ - 16px font size           │
│ - 16px margin between      │
│ - Max-width: 100%          │
│                            │
│ Stats Grid:                │
│ ┌──────────┬──────────┐   │
│ │  Stat 1  │  Stat 2  │   │
│ │  (2x2)   │          │   │
│ ├──────────┼──────────┤   │
│ │  Stat 3  │  Stat 4  │   │
│ └──────────┴──────────┘   │
│ Gap: 16px                  │
│ Padding: 24px              │
│ Margin top: 32px           │
│                            │
│ CTA Button:                │
│ - Full-width               │
│ - Height: 56px             │
│ - Margin top: 32px         │
│                            │
└────────────────────────────┘
```

---

### 3. Photo Gallery Section

#### Desktop Layout (Masonry)

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│ Section Heading:                                         │
│ - Margin bottom: 48px                                    │
│ - Text align: center                                     │
│                                                          │
│ Gallery Grid (4 columns):                                │
│                                                          │
│ ┌────┐  ┌────┐  ┌────┐  ┌────┐                          │
│ │Img1│  │Img2│  │Img3│  │Img4│                          │
│ │    │  │    │  └────┘  │    │                          │
│ │    │  └────┘  ┌────┐  │    │                          │
│ └────┘  ┌────┐  │Img7│  └────┘                          │
│ ┌────┐  │Img5│  │    │  ┌────┐                          │
│ │Img9│  │    │  └────┘  │Img8│                          │
│ │    │  └────┘  ┌────┐  │    │                          │
│ └────┘          │Im11│  └────┘                          │
│                 │    │                                   │
│                 └────┘                                   │
│                                                          │
│ Column specifications:                                   │
│ - Number of columns: 4                                   │
│ - Gap between columns: 16px                              │
│ - Gap between rows: 16px                                 │
│ - Image border radius: 8px                               │
│ - Image max-width: 100%                                  │
│ - Height: auto (maintains aspect ratio)                  │
│                                                          │
│ Hover overlay:                                           │
│ - Background: rgba(26, 26, 46, 0.6)                     │
│ - Icon size: 48x48px                                     │
│ - Transition duration: 300ms                             │
│                                                          │
│ CTA Button:                                              │
│ - Margin top: 48px                                       │
│ - Text align: center                                     │
│                                                          │
│ Container max-width: 1280px                              │
│ Section padding: 96px (top/bottom) 32px (left/right)    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout (2 columns)

```
┌────────────────────────────┐
│ Section Heading            │
│ Margin bottom: 32px        │
│                            │
│ Gallery Grid (2 columns):  │
│                            │
│ ┌──────┐    ┌──────┐       │
│ │ Img1 │    │ Img2 │       │
│ │      │    │      │       │
│ └──────┘    └──────┘       │
│ ┌──────┐    ┌──────┐       │
│ │ Img3 │    │ Img4 │       │
│ │      │    │      │       │
│ └──────┘    └──────┘       │
│ ┌──────┐    ┌──────┐       │
│ │ Img5 │    │ Img6 │       │
│ │      │    │      │       │
│ └──────┘    └──────┘       │
│                            │
│ Column width: calc(50% - 8px)
│ Gap: 16px                  │
│ Border radius: 8px         │
│                            │
│ CTA Button:                │
│ - Full-width               │
│ - Margin top: 32px         │
│                            │
│ Section padding:           │
│ 64px (top/bottom)          │
│ 16px (left/right)          │
│                            │
└────────────────────────────┘
```

---

### 4. Feedback Section

#### Desktop Layout (3 columns)

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│ Section Heading:                                         │
│ - Margin bottom: 48px                                    │
│ - Text align: center                                     │
│                                                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ Card 1   │  │ Card 2   │  │ Card 3   │               │
│ │          │  │          │  │          │               │
│ │ ★★★★★    │  │ ★★★★★    │  │ ★★★★★    │               │
│ │ Height:  │  │ Height:  │  │ Height:  │               │
│ │ 20px     │  │ 20px     │  │ 20px     │               │
│ │ Margin:  │  │ Margin:  │  │ Margin:  │               │
│ │ 0 0 16px │  │ 0 0 16px │  │ 0 0 16px │               │
│ │          │  │          │  │          │               │
│ │ Text:    │  │ Text:    │  │ Text:    │               │
│ │ 4 lines  │  │ 4 lines  │  │ 4 lines  │               │
│ │ max      │  │ max      │  │ max      │               │
│ │ Margin:  │  │ Margin:  │  │ Margin:  │               │
│ │ 0 0 16px │  │ 0 0 16px │  │ 0 0 16px │               │
│ │          │  │          │  │          │               │
│ │ ─────────│  │ ─────────│  │ ─────────│               │
│ │ Border:  │  │ Border:  │  │ Border:  │               │
│ │ 1px top  │  │ 1px top  │  │ 1px top  │               │
│ │ Padding: │  │ Padding: │  │ Padding: │               │
│ │ 16px top │  │ 16px top │  │ 16px top │               │
│ │          │  │          │  │          │               │
│ │ [Avatar] │  │ [Avatar] │  │ [Avatar] │               │
│ │ Name     │  │ Name     │  │ Name     │               │
│ │ Date     │  │ Date     │  │ Date     │               │
│ └──────────┘  └──────────┘  └──────────┘               │
│                                                          │
│ Card specifications:                                     │
│ - Width: calc(33.333% - 16px)                           │
│ - Min-height: 280px                                     │
│ - Padding: 24px                                         │
│ - Border radius: 12px                                   │
│ - Gap between cards: 24px                               │
│                                                          │
│ Star rating:                                             │
│ - Icon size: 20x20px                                    │
│ - Gap between stars: 4px                                │
│                                                          │
│ Avatar:                                                  │
│ - Size: 40x40px                                         │
│ - Border radius: 50% (full circle)                      │
│ - Font size (initial): 18px                             │
│                                                          │
│ Container max-width: 1152px                              │
│ Section padding: 96px (top/bottom) 32px (left/right)    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout (Carousel)

```
┌────────────────────────────┐
│ Section Heading            │
│ Margin bottom: 32px        │
│                            │
│ Carousel Container:        │
│ ┌────────────────────────┐ │
│ │ [← Card 1 of 5 →]      │ │
│ │                        │ │
│ │ ★★★★★ (20px)           │ │
│ │ Margin: 0 0 16px 0     │ │
│ │                        │ │
│ │ Feedback text          │ │
│ │ (max 4 lines)          │ │
│ │                        │ │
│ │ ──────────────────     │ │
│ │                        │ │
│ │ [40px] Name            │ │
│ │        Date            │ │
│ │                        │ │
│ │ Card height: 300px     │ │
│ │ Card width: calc(100% - 32px)
│ │ Padding: 24px          │ │
│ │ Border radius: 12px    │ │
│ └────────────────────────┘ │
│                            │
│ Peek next card: 16px       │
│ (1.1 slides visible)       │
│                            │
│ Pagination dots:           │
│ • • ○ ○ ○                  │
│ Size: 8x8px                │
│ Gap: 8px                   │
│ Margin top: 24px           │
│                            │
│ CTA Button:                │
│ - Full-width               │
│ - Margin top: 32px         │
│                            │
│ Section padding:           │
│ 64px (top/bottom)          │
│ 16px (left/right)          │
│                            │
└────────────────────────────┘
```

---

### 5. CTA Footer Section

#### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ CTA Section                                              │
│ Background: Gradient (green to darker green)             │
│ Padding: 96px (top/bottom) 32px (left/right)            │
│                                                          │
│                    Ready to Visit?                       │
│                 அற்புதமான அனுபவம்                       │
│                                                          │
│   Experience the magic of 14,000 parakeets...            │
│                                                          │
│              [Book Your Visit Now]                       │
│                                                          │
│ Heading: 48px font, center aligned                       │
│ Tamil: 32px font, center aligned, margin: 0 0 24px 0    │
│ Body: 18px font, max-width: 640px, margin: 0 0 40px 0   │
│ Button: Height 56px, padding 32px (left/right)          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Footer Section                                           │
│ Background: #1A1A2E (deep-night)                        │
│ Padding: 48px (top/bottom) 32px (left/right)            │
│                                                          │
│ ┌─────────────┬───────────┬───────────┬────────────┐   │
│ │ Logo &      │ Quick     │ Contact   │ Social     │   │
│ │ Description │ Links     │ Info      │ Media      │   │
│ │             │           │           │            │   │
│ │ Width: 50%  │ Width:    │ Width:    │ Width:     │   │
│ │             │ 16.67%    │ 16.67%    │ 16.67%     │   │
│ │             │           │           │            │   │
│ │ Logo: 40px  │ Links:    │ Icons:    │ Icons:     │   │
│ │ height      │ 14px font │ 20x20px   │ 24x24px    │   │
│ │             │           │           │            │   │
│ │ Text: 14px  │ Gap: 8px  │ Gap: 12px │ Gap: 16px  │   │
│ │ line: 1.6   │           │           │            │   │
│ └─────────────┴───────────┴───────────┴────────────┘   │
│                                                          │
│ Divider: 1px border, margin: 32px (top) 0 (bottom)     │
│                                                          │
│ Copyright Bar:                                           │
│ - Flex layout: space-between                             │
│ - Font size: 14px                                        │
│ - Padding top: 32px                                      │
│                                                          │
│ Container max-width: 1280px                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout

```
┌────────────────────────────┐
│ CTA Section                │
│ Padding: 64px (top/bottom) │
│          16px (sides)      │
│                            │
│ Ready to Visit?            │
│ அற்புதமான அனுபவம்          │
│                            │
│ Body text (16px)           │
│                            │
│ [Book Your Visit Now]      │
│ (Full-width, 56px height)  │
│                            │
├────────────────────────────┤
│ Footer Section             │
│ Padding: 48px (top/bottom) │
│          16px (sides)      │
│                            │
│ Stacked Layout:            │
│                            │
│ ┌────────────────────────┐ │
│ │ Logo & Description     │ │
│ │ Margin: 0 0 32px 0     │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ Quick Links            │ │
│ │ Margin: 0 0 32px 0     │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ Contact Info           │ │
│ │ Margin: 0 0 32px 0     │ │
│ └────────────────────────┘ │
│                            │
│ ─────────────────────────  │
│ (Divider)                  │
│ Margin: 32px 0             │
│                            │
│ Copyright text:            │
│ - Center aligned           │
│ - Font size: 12px          │
│ - Stack vertically         │
│ - Gap: 8px                 │
│                            │
└────────────────────────────┘
```

---

## 🎯 Precise Spacing System

### Vertical Rhythm

```
┌────────────────────────────────────────┐
│ Section 1 (Hero)                       │ ← 100vh
├────────────────────────────────────────┤
│ ↕ Gap: 0px (seamless transition)      │
├────────────────────────────────────────┤
│ Section 2 (About)                      │
│ Padding top: 96px (desktop) / 64px (mobile)
│ Padding bottom: 96px / 64px            │
├────────────────────────────────────────┤
│ ↕ Gap: 0px                             │
├────────────────────────────────────────┤
│ Section 3 (Gallery)                    │
│ Padding: 96px / 64px                   │
├────────────────────────────────────────┤
│ ↕ Gap: 0px                             │
├────────────────────────────────────────┤
│ Section 4 (Feedback)                   │
│ Padding: 96px / 64px                   │
├────────────────────────────────────────┤
│ ↕ Gap: 0px                             │
├────────────────────────────────────────┤
│ Section 5 (CTA Footer)                 │
│ CTA padding: 96px / 64px               │
│ Footer padding: 48px / 48px            │
└────────────────────────────────────────┘
```

### Horizontal Spacing

| Screen Size | Container Padding | Container Max-Width | Grid Gap |
|-------------|-------------------|---------------------|----------|
| Mobile (375px) | 16px | 100% | 16px |
| Tablet (768px) | 24px | 720px | 24px |
| Desktop (1024px) | 32px | 960px | 24px |
| Desktop (1280px+) | 32px | 1152px - 1280px | 24px - 32px |

### Component Spacing

```
Button internal padding:
- Small: 16px (H) × 8px (V)
- Default: 24px (H) × 12px (V)
- Large: 32px (H) × 16px (V)

Card internal padding:
- Mobile: 20px (all sides)
- Desktop: 24px (all sides)

Input field padding:
- Horizontal: 16px
- Vertical: 12px
- Total height: 44px minimum

Icon sizes:
- Small: 16x16px
- Default: 20x20px
- Large: 24x24px
- Hero/Feature: 48x48px
```

---

## 📸 Image Specifications

### Hero Section

| Asset | Desktop | Tablet | Mobile | Format | Quality |
|-------|---------|--------|--------|--------|---------|
| Hero Video | 1920×1080 | 1280×720 | None (use poster) | MP4, WebM | 5MB max |
| Hero Poster | 1920×1080 | 1280×720 | 768×1024 | WebP | 80% quality |

### About Section

| Asset | Desktop | Tablet | Mobile | Format | Quality |
|-------|---------|--------|--------|--------|---------|
| Sudarson Portrait | 800×1000 | 600×750 | 400×500 | WebP | 85% quality |

### Gallery Section

| Asset Type | Dimensions | Format | Quality | Notes |
|------------|------------|--------|---------|-------|
| Gallery Thumbnail | 400px width | WebP | 80% | Height: auto |
| Lightbox Full | 1200px width | WebP | 90% | Height: auto |
| Gallery Caption | N/A | Text | N/A | 1-2 sentences max |

### Recommended Image Dimensions

```
Portrait orientation: 400×500, 600×750, 800×1000
Landscape orientation: 500×300, 750×450, 1000×600
Square: 400×400, 600×600, 800×800

Always maintain aspect ratios:
- Portrait: 4:5
- Landscape: 5:3
- Square: 1:1
```

---

## 🎨 Z-Index Scale

```css
/* Z-index hierarchy */
.hero-background {
  z-index: 0; /* Background layer */
}

.hero-content {
  z-index: 10; /* Content layer */
}

.navigation-bar {
  z-index: 50; /* Fixed navigation */
}

.lightbox-overlay {
  z-index: 100; /* Modal overlay */
}

.lightbox-content {
  z-index: 110; /* Modal content */
}

.toast-notification {
  z-index: 200; /* Alerts and notifications */
}

.skip-to-content {
  z-index: 300; /* Accessibility link */
}
```

---

## 💫 Animation Timing

### Duration Reference

```
Micro-interactions: 150ms - 200ms
- Button hover
- Input focus
- Icon transitions

Standard transitions: 300ms - 400ms
- Card hover effects
- Image overlay
- Dropdown menus

Page transitions: 500ms - 600ms
- Scroll reveals
- Section animations
- Content fades

Modal animations: 300ms (spring physics)
- Entry: spring damping 25, stiffness 300
- Exit: 200ms ease-out

Loading states: 2000ms (loop)
- Skeleton screens
- Pulse animations
```

### Easing Functions

```typescript
// CSS easing
ease-out: cubic-bezier(0, 0, 0.2, 1)   // For entrances
ease-in: cubic-bezier(0.4, 0, 1, 1)    // For exits
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) // For both

// Framer Motion easing
easeOut: [0, 0, 0.2, 1]    // Standard entrance
easeIn: [0.4, 0, 1, 1]     // Standard exit
anticipate: [...]           // For playful interactions
```

---

## 📱 Touch Target Specifications

### Minimum Sizes (WCAG 2.1 AA)

```
Primary buttons: 56×56px (exceeds 44px minimum)
Secondary buttons: 48×48px
Navigation items: 44×44px
Gallery cards: Full card clickable (100×100px minimum)
Carousel dots: 44×44px touch area (visual dot: 8×8px)
Close buttons: 48×48px
Icon-only buttons: 48×48px
Input fields: 44px height minimum
```

### Mobile Touch Zones

```
┌────────────────────────────┐
│ [☰] Logo    [Lang] ←────── │ Top bar (easy reach)
│                            │
│   Primary content area     │ Comfortable thumb zone
│   (scrollable)             │
│                            │
│                            │
│                            │
│   [Primary CTA] ←────────  │ Bottom thumb zone
│   (Full-width button)      │
│                            │
└────────────────────────────┘

Thumb zone reference:
- Easy reach: Top 1/4 and bottom 1/4
- Comfortable: Middle 1/2
- Stretch: Corners and edges
```

---

## ♿ Focus Indicator Specifications

### Visible Focus States

```css
/* Default focus ring */
.focusable-element:focus {
  outline: none;
  box-shadow: 0 0 0 2px #FFFFFF,    /* White inner ring */
              0 0 0 4px #00A36C;    /* Green outer ring */
  border-radius: 8px;
}

/* Focus on buttons */
button:focus-visible {
  outline: 2px solid #00A36C;
  outline-offset: 2px;
}

/* Focus on inputs */
input:focus,
textarea:focus {
  border-color: #00A36C;
  box-shadow: 0 0 0 3px rgba(0, 163, 108, 0.2);
}

/* Skip to content link focus */
.skip-link:focus {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 300;
  padding: 12px 24px;
  background: #00A36C;
  color: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-weight: 600;
}
```

---

## 🔍 Print Styles (Bonus)

```css
@media print {
  /* Hide non-essential elements */
  nav,
  .hero-background,
  .cta-section,
  footer {
    display: none;
  }
  
  /* Optimize for print */
  body {
    background: white;
    color: black;
    font-size: 12pt;
  }
  
  h1 { font-size: 24pt; }
  h2 { font-size: 18pt; }
  h3 { font-size: 14pt; }
  p { font-size: 12pt; line-height: 1.5; }
  
  /* Show links */
  a[href]:after {
    content: " (" attr(href) ")";
    font-size: 10pt;
    color: #666;
  }
  
  /* Page breaks */
  section {
    page-break-inside: avoid;
  }
  
  img {
    max-width: 100%;
    page-break-inside: avoid;
  }
}
```

---

## 📊 Performance Budget

### File Size Targets

```
Hero video: ≤ 5MB
Hero poster image: ≤ 200KB
About section image: ≤ 150KB
Gallery thumbnails: ≤ 50KB each
Gallery full-size: ≤ 200KB each
Total font files: ≤ 200KB
CSS bundle: ≤ 50KB (gzipped)
JS bundle: ≤ 150KB (gzipped)

Total page weight: ≤ 2MB (initial load)
Largest Contentful Paint (LCP): ≤ 2.5s
First Input Delay (FID): ≤ 100ms
Cumulative Layout Shift (CLS): ≤ 0.1
```

### Image Optimization Checklist

- [ ] Convert all images to WebP format
- [ ] Provide multiple sizes using srcset
- [ ] Lazy load images below fold
- [ ] Use blur-up placeholder technique
- [ ] Optimize alt text for SEO and accessibility
- [ ] Compress images to 80-85% quality
- [ ] Use responsive images (picture element)
- [ ] Preload hero image/video

---

**End of Visual Specifications**  
**Version:** 1.0  
**Last Updated:** March 25, 2026  
**Designer:** Parrot-UIUX  
**Status:** Ready for Implementation ✅
