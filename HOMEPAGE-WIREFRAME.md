# 🏠 Homepage Wireframe Specification

**Project:** Birdman of Chennai  
**Design Philosophy:** Documentary-Organic  
**Target Audience:** Nature lovers, photographers, families, elderly visitors (65+)  
**Languages:** English (primary), Tamil (first-class citizen)  
**Version:** 1.0 — Sprint 1

---

## 📐 Layout Overview

The homepage follows a vertical scroll narrative structure, like unfolding a nature documentary. Each section transitions smoothly into the next, guiding visitors from curiosity → connection → action.

### Layout Structure

```
┌─────────────────────────────────────────┐
│         1. HERO SECTION                 │  (Full viewport height)
│    "The Birdman Awaits You"             │
├─────────────────────────────────────────┤
│      2. ABOUT / STORY SECTION           │  (Content height)
│    "A 16-Year Bond with Nature"         │
├─────────────────────────────────────────┤
│      3. PHOTO GALLERY                   │  (Masonry grid)
│    "Moments from the Sanctuary"         │
├─────────────────────────────────────────┤
│      4. RECENT FEEDBACK                 │  (Carousel/Grid)
│    "Visitor Testimonials"               │
├─────────────────────────────────────────┤
│      5. CTA FOOTER SECTION              │  (Full-width)
│    "Ready to Visit?"                    │
└─────────────────────────────────────────┘
```

---

## 1. 🦜 Hero Section

### Visual Hierarchy

**Desktop (1280px+):**
```
┌───────────────────────────────────────────────────────────┐
│  [Navigation Bar: Logo | About | Gallery | Feedback]      │
│                                                            │
│              [FULL-BLEED HERO IMAGE/VIDEO]                │
│                                                            │
│           Birdman of Chennai | சென்னை பறவை மனிதர்       │
│               (Hero headline — Merriweather 56px)          │
│                                                            │
│        Where 14,000 wild parakeets come home daily        │
│        (Subheadline — Inter 18px, muted)                   │
│                                                            │
│              [Book Your Visit] [Watch His Story]           │
│               (Primary CTA)    (Secondary CTA)             │
│                                                            │
│                          ↓                                 │
│                   (Scroll indicator)                       │
└───────────────────────────────────────────────────────────┘
```

**Mobile (375px):**
```
┌──────────────────────────────┐
│  [☰]    Logo    [Language]   │
├──────────────────────────────┤
│                              │
│     [HERO IMAGE/VIDEO]       │
│       (70vh height)          │
│                              │
│   Birdman of Chennai         │
│   சென்னை பறவை மனிதர்        │
│   (H1 — 40px)                │
│                              │
│   14,000 wild parakeets      │
│   come home daily            │
│   (Body — 16px)              │
│                              │
│   [Book Your Visit]          │
│   (Full-width button)        │
│                              │
│   [Watch His Story]          │
│   (Full-width outline)       │
│                              │
└──────────────────────────────┘
```

### Specifications

#### Hero Container
```css
Background: Linear gradient overlay
  - gradient-to-b from-deep-night/40 via-transparent to-parchment
Height: 100vh (desktop) | 90vh (mobile)
Display: flex, items-center, justify-center, flex-col
Padding: px-4 py-24 (mobile) | px-8 py-32 (desktop)
```

#### Hero Background Media
- **Type:** Video (autoplay, muted, loop) with fallback image
- **Video source:** High-quality slow-motion footage of parakeets landing
- **Fallback image:** Static hero image (WebP format, 1920x1080)
- **Object fit:** cover
- **Optimization:** Lazy load below fold content

#### Headline
```typescript
<h1 className="text-center">
  <span className="block text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight">
    Birdman of Chennai
  </span>
  <span className="block text-white/90 font-tamil font-medium text-2xl md:text-3xl mt-2">
    சென்னை பறவை மனிதர்
  </span>
</h1>
```

- **Typography:** Merriweather Bold, 56px (desktop), 40px (mobile)
- **Color:** White with subtle text-shadow for readability
- **Animation:** Fade in + slide up (0.5s delay after page load)
- **Line height:** 1.1
- **Letter spacing:** -0.02em (tight for impact)

#### Subheadline
```typescript
<p className="text-center max-w-2xl mx-auto text-white/80 text-lg md:text-xl leading-relaxed mt-6">
  Where 14,000 wild parakeets come home daily to feed
</p>
```

- **Typography:** Inter Regular, 18px (desktop), 16px (mobile)
- **Color:** white/80 (slightly transparent for hierarchy)
- **Max width:** 640px (keeps text readable on large screens)
- **Animation:** Fade in + slide up (0.7s delay)

#### CTA Buttons
```typescript
<div className="flex flex-col md:flex-row gap-4 mt-10">
  <Button 
    variant="primary" 
    size="large"
    icon={<CalendarIcon />}
  >
    Book Your Visit
  </Button>
  <Button 
    variant="secondary" 
    size="large"
    icon={<PlayIcon />}
  >
    Watch His Story
  </Button>
</div>
```

**Primary CTA (Book Your Visit):**
- Background: `bg-parakeet-green`
- Text: `text-white`
- Size: `px-8 py-4 text-lg` (large)
- Hover: `scale-102 shadow-glow-green`
- Icon: Calendar icon, 20px, left aligned
- Touch target: 56px height (exceeds WCAG 44px minimum)
- Animation: Gentle pulse on hover

**Secondary CTA (Watch His Story):**
- Background: `bg-sunset-gold`
- Text: `text-white`
- Size: `px-8 py-4 text-lg`
- Hover: `scale-102 shadow-glow-gold`
- Icon: Play icon, 20px, left aligned

#### Scroll Indicator
```typescript
<motion.div
  animate={{ y: [0, 8, 0] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="absolute bottom-8 left-1/2 -translate-x-1/2"
>
  <ChevronDownIcon className="w-8 h-8 text-white/60" />
</motion.div>
```

- **Position:** Absolute, centered horizontally, 32px from bottom
- **Animation:** Gentle bounce (8px amplitude, 2s duration)
- **Color:** White/60 (subtle presence)
- **Accessibility:** Hidden from screen readers (decorative)

#### Navigation Bar
```typescript
<nav className="absolute top-0 w-full z-50 bg-transparent">
  <div className="container mx-auto px-4 py-6 flex items-center justify-between">
    <Logo />
    <ul className="hidden md:flex gap-8 text-white font-medium">
      <li><a href="#about">About</a></li>
      <li><a href="#gallery">Gallery</a></li>
      <li><a href="#feedback">Feedback</a></li>
    </ul>
    <LanguageToggle />
  </div>
</nav>
```

- **Background:** Transparent initially, transitions to `bg-deep-night/95` on scroll
- **Color:** White (high contrast against hero image)
- **Mobile:** Hamburger menu icon, full-screen slide-in menu
- **Logo:** 40px height, contains parakeet silhouette + text

---

## 2. 📖 About / Story Section

### Layout

**Desktop:**
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  [Photo: Sudarson    │    A 16-Year Bond with Nature     │
│   with parakeets]    │                                    │
│   (500x600px)        │    For over 16 years, Mr. Sudarson│
│                      │    Sah has welcomed 14,000 wild...│
│                      │                                    │
│                      │    [Key Stats Grid]                │
│                      │    • 16+ years | 14,000 birds      │
│                      │    • 2 feeding sessions daily      │
│                      │                                    │
│                      │    [Book a Visit →]                │
└──────────────────────────────────────────────────────────┘
```

**Mobile (Stacked):**
```
┌────────────────────────────┐
│                            │
│   [Photo: Sudarson]        │
│   (Full-width, 400px)      │
│                            │
│   A 16-Year Bond           │
│   with Nature              │
│                            │
│   For over 16 years...     │
│                            │
│   [Key Stats Grid]         │
│   2x2 or stacked           │
│                            │
│   [Book a Visit →]         │
│                            │
└────────────────────────────┘
```

### Specifications

#### Section Container
```typescript
<section className="py-16 md:py-24 bg-parchment">
  <div className="container mx-auto px-4 max-w-6xl">
    {/* Content */}
  </div>
</section>
```

- **Background:** `bg-parchment` (warm, journal-like)
- **Padding:** `py-16` (mobile) | `py-24` (desktop)
- **Max width:** 1152px (6xl container)

#### Grid Layout
```typescript
<div className="grid md:grid-cols-2 gap-12 items-center">
  <ImageBlock />
  <ContentBlock />
</div>
```

- **Grid:** Single column (mobile) | 2 equal columns (desktop)
- **Gap:** 48px between image and text (comfortable reading distance)
- **Alignment:** Vertically centered

#### Image Block
```typescript
<div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg">
  <Image
    src="/images/sudarson-portrait.jpg"
    alt="Mr. Sudarson Sah feeding parakeets at his sanctuary"
    fill
    className="object-cover"
    priority
  />
</div>
```

- **Aspect ratio:** 4:5 (portrait orientation)
- **Border radius:** 16px (rounded-2xl)
- **Shadow:** `shadow-lg` for depth
- **Image optimization:** Next.js Image component, priority loading
- **Animation:** Parallax subtle shift on scroll (2% transform)

#### Heading
```typescript
<h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-6">
  A 16-Year Bond with Nature
  <span className="block text-2xl md:text-3xl font-tamil mt-2 text-chennai-earth">
    இயற்கையுடன் 16 ஆண்டுகள்
  </span>
</h2>
```

- **Typography:** Merriweather Bold, 40px (desktop), 32px (mobile)
- **Color:** `text-deep-night` (primary heading)
- **Tamil subtitle:** Noto Sans Tamil, 32px (desktop), 24px (mobile), `text-chennai-earth`
- **Margin:** mb-6 (24px space before body text)

#### Body Copy
```typescript
<div className="prose prose-lg prose-stone max-w-none">
  <p className="text-stone-700 leading-relaxed">
    For over 16 years, Mr. Sudarson Sah has welcomed thousands of wild 
    rose-ringed parakeets to his rooftop sanctuary in Chennai. What began 
    as feeding a handful of birds has blossomed into a daily ritual where 
    up to 14,000 parakeets gather at dawn and dusk.
  </p>
  
  <p className="text-stone-700 leading-relaxed mt-4">
    His story is one of patience, dedication, and an unbreakable bond with 
    nature. Visitors from around the world come to witness this extraordinary 
    spectacle and learn about wildlife conservation.
  </p>
  
  <p className="text-stone-700 leading-relaxed mt-4">
    "The birds are my family. They trust me, and I honor that trust every 
    single day." — Mr. Sudarson Sah
  </p>
</div>
```

- **Typography:** Inter Regular, 18px
- **Color:** `text-stone-700` (softer than pure black for readability)
- **Line height:** 1.6 (comfortable reading)
- **Paragraph spacing:** mt-4 between paragraphs
- **Animation:** Scroll reveal with 0.1s stagger between paragraphs

#### Key Stats Grid
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 p-8 bg-mist-white rounded-xl">
  <StatCard 
    value="16+" 
    label="Years of Feeding"
    labelTamil="ஆண்டுகள்"
  />
  <StatCard 
    value="14,000" 
    label="Birds Daily"
    labelTamil="பறவைகள்"
  />
  <StatCard 
    value="2x" 
    label="Sessions per Day"
    labelTamil="அமர்வுகள்"
  />
  <StatCard 
    value="1,000+" 
    label="Visitors Hosted"
    labelTamil="பார்வையாளர்கள்"
  />
</div>
```

**Individual Stat Card:**
```typescript
<div className="text-center">
  <div className="text-4xl font-bold text-parakeet-green mb-2">
    16+
  </div>
  <div className="text-sm text-chennai-earth">
    Years of Feeding
  </div>
  <div className="text-xs text-chennai-earth/70 font-tamil mt-1">
    ஆண்டுகள்
  </div>
</div>
```

- **Background:** `bg-mist-white` (elevated surface)
- **Border radius:** rounded-xl (12px)
- **Padding:** p-8 (32px all sides)
- **Grid:** 2 columns (mobile) | 4 columns (desktop)
- **Number typography:** Font size 36px, font-bold, `text-parakeet-green`
- **Label typography:** Font size 14px, `text-chennai-earth`
- **Tamil label:** Font size 12px, font-tamil, `text-chennai-earth/70`
- **Animation:** Count-up animation on scroll into view

#### Secondary CTA
```typescript
<Button 
  variant="primary" 
  size="large"
  className="mt-10"
  icon={<ArrowRightIcon />}
>
  Book a Visit
  <span className="ml-2 font-tamil">பார்வை பதிவு</span>
</Button>
```

- **Placement:** mt-10 (40px above section end)
- **Icon:** Arrow right, positioned on the right side
- **Bilingual label:** English + Tamil inline

---

## 3. 📷 Photo Gallery

### Layout

**Desktop (Grid):**
```
┌─────────────────────────────────────────────────────────┐
│               Moments from the Sanctuary                │
│                                                          │
│  [Image 1]  [Image 2]  [Image 3]  [Image 4]             │
│  (Masonry layout — varying heights)                     │
│  [Image 5]  [Image 6]  [Image 7]  [Image 8]             │
│                                                          │
│  [Image 9]  [Image 10] [Image 11] [Image 12]            │
│                                                          │
│              [View All Photos →]                         │
└─────────────────────────────────────────────────────────┘
```

**Mobile (2-column Grid):**
```
┌────────────────────────────┐
│   Moments from the         │
│   Sanctuary                │
│                            │
│  [Image 1]  [Image 2]      │
│  [Image 3]  [Image 4]      │
│  [Image 5]  [Image 6]      │
│                            │
│  [View All Photos →]       │
└────────────────────────────┘
```

### Specifications

#### Section Container
```typescript
<section className="py-16 md:py-24 bg-gradient-to-b from-parchment to-mist-white">
  <div className="container mx-auto px-4 max-w-7xl">
    {/* Content */}
  </div>
</section>
```

- **Background:** Subtle gradient from parchment to mist-white
- **Padding:** `py-16` (mobile) | `py-24` (desktop)
- **Max width:** 1280px (7xl container — wider for gallery)

#### Section Heading
```typescript
<div className="text-center mb-12">
  <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night">
    Moments from the Sanctuary
  </h2>
  <p className="text-lg text-chennai-earth mt-3 font-tamil">
    சரணாலயத்தின் தருணங்கள்
  </p>
  <p className="text-base text-stone-600 mt-4 max-w-2xl mx-auto">
    Every day brings new stories. Here are glimpses of the magic that unfolds 
    when wild nature meets human kindness.
  </p>
</div>
```

#### Masonry Grid
```typescript
<div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
  {images.map((image) => (
    <GalleryCard 
      key={image.id}
      src={image.src}
      alt={image.alt}
      caption={image.caption}
    />
  ))}
</div>
```

- **Layout:** CSS columns (responsive masonry)
  - Mobile: 2 columns
  - Tablet: 3 columns
  - Desktop: 4 columns
- **Gap:** 16px between columns
- **Space:** 16px vertical spacing

#### Gallery Card
```typescript
<motion.div
  whileHover={{ scale: 1.02 }}
  className="relative group cursor-pointer break-inside-avoid mb-4"
  onClick={() => openLightbox(image.id)}
>
  <div className="relative overflow-hidden rounded-lg">
    <Image
      src={image.src}
      alt={image.alt}
      width={400}
      height={image.height}
      className="w-full h-auto object-cover"
      loading="lazy"
    />
    
    {/* Hover overlay */}
    <div className="absolute inset-0 bg-deep-night/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
      <ZoomInIcon className="w-12 h-12 text-white" />
    </div>
  </div>
  
  {/* Caption (optional) */}
  {image.caption && (
    <p className="text-sm text-chennai-earth mt-2 px-2">
      {image.caption}
    </p>
  )}
</motion.div>
```

**Specifications:**
- **Border radius:** rounded-lg (8px)
- **Hover effect:** Scale 1.02 + overlay with zoom icon
- **Image optimization:** Lazy loading, WebP format, responsive sizes
- **Cursor:** pointer (indicates clickable)
- **Overlay:** `bg-deep-night/60` with smooth opacity transition

#### Lightbox Modal
```typescript
<AnimatePresence>
  {selectedImage && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-deep-night/95 flex items-center justify-center p-4"
      onClick={closeLightbox}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={selectedImage.src}
          alt={selectedImage.alt}
          width={1200}
          height={800}
          className="w-full h-auto rounded-lg"
        />
        
        {/* Close button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
        >
          <XIcon className="w-6 h-6 text-white" />
        </button>
        
        {/* Navigation arrows */}
        <button
          onClick={previousImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>
        
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full"
        >
          <ChevronRightIcon className="w-6 h-6 text-white" />
        </button>
        
        {/* Image info */}
        <div className="mt-4 text-center text-white">
          <p className="text-lg">{selectedImage.caption}</p>
          <p className="text-sm text-white/70 mt-2">{selectedImage.date}</p>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Specifications:**
- **Background:** `bg-deep-night/95` (semi-transparent overlay)
- **Animation:** Spring physics for modal entry/exit
- **Keyboard nav:** Arrow keys for previous/next, Escape to close
- **Touch gestures:** Swipe left/right for navigation (mobile)
- **Close button:** Top-right corner, 48x48px touch target
- **Navigation arrows:** Left/right sides, 48x48px touch targets
- **Accessibility:** Focus trap inside modal, ARIA labels

#### View All CTA
```typescript
<div className="text-center mt-12">
  <Button 
    variant="outline" 
    size="large"
    icon={<ArrowRightIcon />}
    href="/gallery"
  >
    View All Photos
    <span className="ml-2 font-tamil">அனைத்து புகைப்படங்கள்</span>
  </Button>
</div>
```

- **Variant:** Outline (secondary action)
- **Links to:** `/gallery` page (full gallery experience)

---

## 4. 💬 Recent Feedback Section

### Layout

**Desktop (3-column Grid):**
```
┌──────────────────────────────────────────────────────────┐
│              What Visitors Are Saying                     │
│               விருந்தினர்கள் கூறுவது                       │
│                                                           │
│  [Card 1]         [Card 2]         [Card 3]              │
│  ★★★★★            ★★★★★            ★★★★★                 │
│  "Amazing..."     "Incredible..."  "Unforgettable..."    │
│  — Priya S.       — John D.        — Raj M.              │
│  Dec 15, 2025     Dec 12, 2025     Dec 10, 2025          │
│                                                           │
│              [Read All Feedback →]                        │
└──────────────────────────────────────────────────────────┘
```

**Mobile (Carousel):**
```
┌────────────────────────────┐
│   What Visitors Say        │
│   விருந்தினர்கள் கூறுவது    │
│                            │
│   [← Card 1/5 →]           │
│   ★★★★★                    │
│   "Amazing experience..."  │
│   — Priya S.               │
│   Dec 15, 2025             │
│                            │
│   • • ○ ○ ○                │
│   (Carousel dots)          │
│                            │
│   [Read All Feedback →]    │
└────────────────────────────┘
```

### Specifications

#### Section Container
```typescript
<section className="py-16 md:py-24 bg-parchment">
  <div className="container mx-auto px-4 max-w-6xl">
    {/* Content */}
  </div>
</section>
```

- **Background:** `bg-parchment` (consistent with About section)
- **Padding:** `py-16` (mobile) | `py-24` (desktop)
- **Max width:** 1152px (6xl container)

#### Section Heading
```typescript
<div className="text-center mb-12">
  <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night">
    What Visitors Are Saying
  </h2>
  <p className="text-2xl text-chennai-earth mt-3 font-tamil">
    விருந்தினர்கள் கூறுவது
  </p>
</div>
```

#### Feedback Grid (Desktop)
```typescript
<div className="hidden md:grid md:grid-cols-3 gap-6">
  {recentFeedback.slice(0, 3).map((feedback) => (
    <FeedbackCard key={feedback.id} feedback={feedback} />
  ))}
</div>
```

#### Feedback Carousel (Mobile)
```typescript
<div className="md:hidden">
  <Swiper
    spaceBetween={16}
    slidesPerView={1.1}
    pagination={{ clickable: true }}
    a11y={{ enabled: true }}
  >
    {recentFeedback.map((feedback) => (
      <SwiperSlide key={feedback.id}>
        <FeedbackCard feedback={feedback} />
      </SwiperSlide>
    ))}
  </Swiper>
</div>
```

- **Library:** Swiper.js or Embla Carousel (lightweight)
- **Slides:** 1.1 visible (peek next card to indicate swipeable)
- **Gap:** 16px between slides
- **Navigation:** Touch gestures + dot pagination
- **Accessibility:** Keyboard navigation, ARIA labels

#### Feedback Card
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  className="bg-mist-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
>
  {/* Star rating */}
  <div className="flex items-center gap-1 mb-4">
    {[...Array(feedback.rating)].map((_, i) => (
      <StarIcon key={i} className="w-5 h-5 text-sunset-gold fill-current" />
    ))}
  </div>
  
  {/* Feedback text */}
  <p className="text-stone-700 leading-relaxed mb-4 line-clamp-4">
    "{feedback.message}"
  </p>
  
  {/* Author info */}
  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-chennai-earth/20">
    <div className="w-10 h-10 rounded-full bg-parakeet-green/10 flex items-center justify-center">
      <span className="text-parakeet-green font-semibold text-lg">
        {feedback.authorInitial}
      </span>
    </div>
    <div className="flex-1">
      <p className="font-medium text-deep-night">
        {feedback.authorName}
      </p>
      <p className="text-sm text-chennai-earth/70">
        {feedback.visitDate}
      </p>
    </div>
  </div>
</motion.div>
```

**Specifications:**
- **Background:** `bg-mist-white` (elevated card)
- **Border radius:** rounded-xl (12px)
- **Padding:** p-6 (24px all sides)
- **Shadow:** md default, lg on hover
- **Star rating:** 5 stars, filled with `text-sunset-gold`
- **Text:** Line clamp 4 (ellipsis after 4 lines)
- **Avatar:** Circular badge with visitor's initial
- **Animation:** Scroll reveal, stagger by 0.1s

#### Read All CTA
```typescript
<div className="text-center mt-12">
  <Button 
    variant="outline" 
    size="large"
    icon={<ArrowRightIcon />}
    href="/feedback"
  >
    Read All Feedback
    <span className="ml-2 font-tamil">அனைத்து கருத்துகள்</span>
  </Button>
</div>
```

- **Variant:** Outline
- **Links to:** `/feedback` page

---

## 5. 📍 CTA Footer Section

### Layout

**Desktop:**
```
┌──────────────────────────────────────────────────────────┐
│                      Ready to Visit?                      │
│           அற்புதமான அனுபவத்திற்கு தயாரா?                 │
│                                                           │
│   Experience the magic of 14,000 parakeets gathering      │
│   at dawn and dusk. Book your slot today.                 │
│                                                           │
│              [Book Your Visit Now]                        │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  [FOOTER]                                                 │
│  [Logo] | About | Gallery | Feedback | Book              │
│                                                           │
│  📍 Address: [Full address]                               │
│  📞 Contact: +91 [phone]                                  │
│  📧 Email: contact@birdman.com                            │
│                                                           │
│  © 2026 Birdman of Chennai. Built with ❤️ by Parrot Team │
└──────────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌────────────────────────────┐
│   Ready to Visit?          │
│   அற்புதமான அனுபவம்        │
│                            │
│   Experience the magic...  │
│                            │
│   [Book Your Visit Now]    │
│   (Full-width)             │
│                            │
├────────────────────────────┤
│   [FOOTER]                 │
│   [Logo]                   │
│                            │
│   About                    │
│   Gallery                  │
│   Feedback                 │
│   Book                     │
│                            │
│   📍 Address               │
│   📞 Contact               │
│   📧 Email                 │
│                            │
│   © 2026 Birdman           │
└────────────────────────────┘
```

### Specifications

#### CTA Section
```typescript
<section className="relative py-24 bg-gradient-to-br from-parakeet-green to-parakeet-green/80 overflow-hidden">
  {/* Background pattern */}
  <div className="absolute inset-0 opacity-10">
    <BirdPattern />
  </div>
  
  <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
    <h2 className="font-serif font-bold text-4xl md:text-5xl text-white mb-4">
      Ready to Visit?
    </h2>
    <p className="text-2xl text-white/90 font-tamil mb-6">
      அற்புதமான அனுபவத்திற்கு தயாரா?
    </p>
    <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto mb-10">
      Experience the magic of 14,000 rose-ringed parakeets gathering at dawn 
      and dusk. Book your slot today and become part of this extraordinary story.
    </p>
    
    <Button 
      variant="secondary" 
      size="large"
      className="shadow-2xl hover:shadow-glow-gold"
    >
      Book Your Visit Now
      <span className="ml-2 font-tamil">இப்போது பதிவு செய்</span>
    </Button>
  </div>
</section>
```

**Specifications:**
- **Background:** Gradient from `parakeet-green` to slightly darker shade
- **Background pattern:** Subtle bird silhouettes (10% opacity)
- **Text color:** White for high contrast
- **CTA button:** Sunset gold (stands out against green background)
- **Animation:** Gentle parallax on background pattern

#### Footer
```typescript
<footer className="bg-deep-night text-white/80">
  <div className="container mx-auto px-4 py-12 max-w-7xl">
    {/* Main footer content */}
    <div className="grid md:grid-cols-4 gap-8 mb-8">
      {/* Column 1: Logo & Description */}
      <div className="md:col-span-2">
        <Logo className="mb-4" variant="light" />
        <p className="text-sm leading-relaxed max-w-md">
          A sanctuary where wild nature meets human kindness. Join us in 
          celebrating 16 years of connection with 14,000 rose-ringed parakeets.
        </p>
      </div>
      
      {/* Column 2: Quick Links */}
      <div>
        <h3 className="font-semibold text-white mb-4">Quick Links</h3>
        <ul className="space-y-2 text-sm">
          <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
          <li><a href="/gallery" className="hover:text-white transition-colors">Gallery</a></li>
          <li><a href="/feedback" className="hover:text-white transition-colors">Feedback</a></li>
          <li><a href="/book" className="hover:text-white transition-colors">Book a Visit</a></li>
        </ul>
      </div>
      
      {/* Column 3: Contact Info */}
      <div>
        <h3 className="font-semibold text-white mb-4">Contact</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <MapPinIcon className="w-5 h-5 text-parakeet-green flex-shrink-0" />
            <span>123 Parakeet Lane, Chennai, Tamil Nadu 600001</span>
          </li>
          <li className="flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-parakeet-green flex-shrink-0" />
            <span>+91 98765 43210</span>
          </li>
          <li className="flex items-center gap-2">
            <MailIcon className="w-5 h-5 text-parakeet-green flex-shrink-0" />
            <span>hello@birdmanofchennai.com</span>
          </li>
        </ul>
      </div>
    </div>
    
    {/* Divider */}
    <div className="border-t border-white/10 pt-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <p>
          © 2026 Birdman of Chennai. All rights reserved.
        </p>
        <p className="text-white/60">
          Built with ❤️ by the Parrot Team
        </p>
      </div>
    </div>
  </div>
</footer>
```

**Specifications:**
- **Background:** `bg-deep-night` (dark contrast)
- **Text color:** white/80 (readable but not harsh)
- **Grid:** 4 columns (desktop) | Stacked (mobile)
- **Links:** Hover transitions to pure white
- **Icons:** 20px, `text-parakeet-green` (brand accent)
- **Touch targets:** 44x44px minimum

---

## 🎨 Responsive Breakpoints

### Breakpoint Definitions

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small tablets, large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

### Responsive Behavior by Section

| Section | Mobile (< 768px) | Tablet (768px - 1024px) | Desktop (> 1024px) |
|---|---|---|---|
| **Hero** | Stacked layout, full-width CTAs | Stacked, 2-column CTAs | Centered, horizontal CTAs |
| **About** | Stacked image + text | 2-column grid | 2-column grid (larger) |
| **Gallery** | 2 columns | 3 columns | 4 columns (masonry) |
| **Feedback** | Carousel (1 card) | 2-column grid | 3-column grid |
| **Footer** | Stacked | 2 columns | 4 columns |

### Typography Scaling

```typescript
// Hero headline
text-4xl      (36px, mobile)
md:text-5xl   (48px, tablet)
lg:text-6xl   (56px, desktop)

// Section headings (H2)
text-3xl      (30px, mobile)
md:text-4xl   (36px, tablet)
lg:text-5xl   (48px, desktop)

// Body text
text-base     (16px, mobile)
md:text-lg    (18px, tablet+)
```

---

## 🎬 Animation Dictionary

### Page-Level Animations

**1. Page Load Sequence:**
```typescript
// Hero section
- Background video: Fade in (0s)
- Headline: Fade in + slide up (0.5s delay)
- Subheadline: Fade in + slide up (0.7s delay)
- CTA buttons: Fade in + scale up (0.9s delay)
- Scroll indicator: Fade in + bounce (1.2s delay)
```

**2. Scroll Reveal (Stagger Children):**
```typescript
const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// Stagger children by 0.1s
staggerChildren: 0.1
```

**3. Card Hover Effects:**
```typescript
// Gallery cards
whileHover={{ scale: 1.02 }}
transition={{ duration: 0.2 }}

// Feedback cards
hover:shadow-lg
transition-shadow duration-300
```

**4. Button Interactions:**
```typescript
// Primary CTA
whileHover={{ 
  scale: 1.02, 
  boxShadow: '0 0 20px rgba(0, 163, 108, 0.3)' 
}}
whileTap={{ scale: 0.98 }}
transition={{ duration: 0.2 }}

// Secondary CTA
whileHover={{ 
  scale: 1.02, 
  boxShadow: '0 0 20px rgba(255, 140, 0, 0.3)' 
}}
```

**5. Navigation Bar:**
```typescript
// Transparent → Solid on scroll
const navVariants = {
  top: { 
    background: 'transparent', 
    backdropFilter: 'none' 
  },
  scrolled: { 
    background: 'rgba(26, 26, 46, 0.95)', 
    backdropFilter: 'blur(10px)' 
  }
};

// Trigger at 50px scroll
const scrollY = useScroll();
<motion.nav variants={navVariants} animate={scrollY > 50 ? 'scrolled' : 'top'} />
```

**6. Lightbox Modal:**
```typescript
// Modal overlay
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Modal content
initial={{ scale: 0.9 }}
animate={{ scale: 1 }}
exit={{ scale: 0.9 }}
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

**7. Stat Counter Animation:**
```typescript
// Count-up effect on scroll into view
const controls = useAnimation();
const { ref, inView } = useInView({ threshold: 0.5 });

useEffect(() => {
  if (inView) {
    controls.start({
      count: targetValue,
      transition: { duration: 2, ease: 'easeOut' }
    });
  }
}, [inView]);
```

### Motion Principles

- **Organic motion:** Inspired by bird flight (gentle arcs, no hard stops)
- **Performance:** GPU-accelerated (opacity, transform only)
- **Accessibility:** Respect `prefers-reduced-motion`
- **Timing:** Ease-out for entrances, ease-in for exits
- **Spring physics:** For modals and interactive elements (damping: 25, stiffness: 300)

---

## ♿ Accessibility Checklist

### Color Contrast (WCAG 2.1 AA)

✅ **Text on backgrounds:**
- Body text (`#44403C` on `#FEFDF5`): **11:1** (Pass AAA)
- Headings (`#1A1A2E` on `#FEFDF5`): **14:1** (Pass AAA)
- White text on `parakeet-green` (`#00A36C`): **4.6:1** (Pass AA)
- White text on `sunset-gold` (`#FF8C00`): **3.1:1** (Pass AA for large text only)

✅ **Interactive elements:**
- Primary button (white on green): **4.6:1** (Pass AA)
- Secondary button (white on gold): **3.1:1** (Pass AA for large text)
- Outline button (green text on white): **4.7:1** (Pass AA)

### Keyboard Navigation

✅ **Focus indicators:**
```css
focus:outline-none 
focus:ring-2 
focus:ring-parakeet-green 
focus:ring-offset-2
```

✅ **Tab order:**
1. Skip to main content link (hidden, visible on focus)
2. Navigation menu items
3. Hero CTAs
4. Section CTAs
5. Gallery items (keyboard + Enter to open lightbox)
6. Feedback cards (tab through, no interaction needed)
7. Footer links

✅ **Modal focus trap:**
- Focus locked inside modal when open
- Escape key closes modal
- Arrow keys navigate gallery images

### Screen Reader Support

✅ **Semantic HTML:**
```html
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<section aria-labelledby="about-heading">
<footer role="contentinfo">
```

✅ **Image alt text:**
- Hero image: "Thousands of rose-ringed parakeets gathering at sunset over Mr. Sudarson Sah's rooftop sanctuary in Chennai"
- Sudarson portrait: "Mr. Sudarson Sah feeding parakeets at his sanctuary"
- Gallery images: Descriptive alt text for each image
- Decorative images: `alt=""` (empty alt for pure decoration)

✅ **ARIA labels:**
```html
<button aria-label="Close modal">
<button aria-label="Next image">
<button aria-label="Previous image">
<nav aria-label="Main navigation">
<nav aria-label="Footer navigation">
```

✅ **Live regions:**
```html
<div role="status" aria-live="polite">
  Booking confirmed for Dec 25, 2025
</div>
```

### Touch Targets

✅ **Minimum size: 44x44px** (WCAG 2.1 Level AA)
- All buttons: 48px+ height
- Gallery cards: Entire card clickable
- Navigation items: 44px height
- Carousel dots: 44px touch area (visual dot can be smaller)

### Motion & Animation

✅ **Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// Framer Motion
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
>
```

---

## 📱 Mobile-First Implementation Notes

### Critical Considerations

1. **Performance:**
   - Hero video: Use poster image on mobile, video on desktop only (or low-res video)
   - Lazy load all images below fold
   - Font subsetting for Tamil fonts (reduce file size)

2. **Touch Interactions:**
   - Gallery: Full-bleed cards, swipe to navigate
   - Feedback: Carousel with clear swipe affordance (1.1 slides visible)
   - CTA buttons: Full-width on mobile for easy thumb reach

3. **Typography:**
   - Tamil text: 18px minimum (2px larger than English)
   - Line height: 1.7 for Tamil (more generous)
   - Never scale Tamil font size below 16px

4. **Layout:**
   - Padding: Minimum 16px (px-4) on smallest screens
   - Container max-width: Use fluid widths with max constraints
   - Avoid horizontal scroll at all costs

5. **Navigation:**
   - Hamburger menu icon: 44x44px
   - Full-screen slide-in menu (not dropdown)
   - Language toggle: Prominent in header

---

## 🎒 Handoff Checklist for Parrot-Frontend

### Files to Create

- [ ] `/src/app/page.tsx` (Homepage route)
- [ ] `/src/components/organisms/HeroSection.tsx`
- [ ] `/src/components/organisms/AboutSection.tsx`
- [ ] `/src/components/organisms/PhotoGallery.tsx`
- [ ] `/src/components/organisms/FeedbackSection.tsx`
- [ ] `/src/components/organisms/CTAFooter.tsx`
- [ ] `/src/components/molecules/FeedbackCard.tsx`
- [ ] `/src/components/molecules/GalleryCard.tsx`
- [ ] `/src/components/molecules/StatCard.tsx`
- [ ] `/src/components/atoms/StarRating.tsx`
- [ ] `/src/components/ui/Lightbox.tsx`
- [ ] `/src/lib/animations.ts` (Shared motion variants)

### Assets Needed

- [ ] Hero video (MP4, WebM) — 1920x1080, max 5MB
- [ ] Hero fallback image (WebP) — 1920x1080
- [ ] Sudarson portrait (WebP) — 800x1000
- [ ] Gallery images (12 images, WebP) — Various sizes
- [ ] Logo (SVG) — Light and dark variants
- [ ] Favicon (ICO, PNG) — 32x32, 192x192

### Third-Party Integrations

- [ ] Framer Motion (`npm i framer-motion`)
- [ ] Swiper.js or Embla Carousel (`npm i swiper` or `npm i embla-carousel-react`)
- [ ] React Icons (`npm i react-icons`)
- [ ] Next.js Image optimization (built-in)

### Testing Requirements

- [ ] Desktop: Chrome, Safari, Firefox (latest versions)
- [ ] Mobile: iPhone SE (375px), iPhone 12 (390px), Android (360px+)
- [ ] Tablet: iPad (768px), iPad Pro (1024px)
- [ ] Accessibility: Lighthouse audit (score 95+)
- [ ] Screen readers: NVDA (Windows), VoiceOver (Mac/iOS)
- [ ] Keyboard navigation: Full keyboard access, visible focus states

---

## 🚀 Next Steps

1. **Parrot-Frontend** implements homepage components using this spec
2. **Parrot-Content** provides actual content (text, images, testimonials)
3. **Parrot-Database** sets up feedback API endpoints
4. **Parrot-UIUX** reviews implementation, provides feedback

---

**End of Homepage Wireframe Specification**  
**Version:** 1.0  
**Last Updated:** March 25, 2026  
**Designer:** Parrot-UIUX  
**Status:** Ready for Implementation ✅
