# Component Usage Guide

All atomic components have been customized with the Birdman of Chennai design system tokens (Parakeet Green, Sunset Gold, etc.).

## ✅ Installation Complete

- ✅ shadcn/ui initialized with Radix preset
- ✅ Button, Input, Label, Badge, Card, Textarea installed
- ✅ All components customized with design tokens
- ✅ Atomic design folder structure created

---

## 📦 Import Patterns

```typescript
// Import from atoms barrel export
import { Button, Input, Label, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/atoms';

// Or import directly from ui (not recommended - use atoms for consistency)
import { Button } from '@/components/ui/button';
```

---

## 🎨 Component Examples

### Button

```tsx
import { Button } from '@/components/atoms';

// Primary (Parakeet Green) - Default
<Button>Book a Visit</Button>
<Button variant="primary" size="md">Book a Visit</Button>

// Secondary (Sunset Gold)
<Button variant="secondary">Learn More</Button>

// Outline
<Button variant="outline">Cancel</Button>

// Ghost
<Button variant="ghost">Back</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Link style
<Button variant="link">Read Terms</Button>

// Sizes: sm (36px), md (44px - WCAG compliant), lg (52px)
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>

// With icon
<Button size="icon">
  <CalendarIcon />
</Button>

// Disabled state
<Button disabled>Processing...</Button>

// With next-intl
import { useTranslations } from 'next-intl';

function BookButton() {
  const t = useTranslations('booking');
  return <Button>{t('bookNow')}</Button>;
}
```

---

### Input

```tsx
import { Input, Label } from '@/components/atoms';

// Basic input
<Input type="text" placeholder="Enter your name" />

// With label
<div className="space-y-2">
  <Label htmlFor="visitor-name">Visitor Name</Label>
  <Input id="visitor-name" type="text" placeholder="Your full name" />
</div>

// Different input types
<Input type="email" placeholder="your@email.com" />
<Input type="tel" placeholder="+91 98765 43210" />
<Input type="number" min={1} max={10} defaultValue={2} />

// Disabled
<Input disabled value="Not editable" />

// Tamil support (font-tamil will be applied via locale)
<Input placeholder="உங்கள் பெயர்" className="font-tamil" />
```

---

### Badge

```tsx
import { Badge } from '@/components/atoms';

// Available (Parakeet Green)
<Badge variant="available">Available</Badge>

// Warning (Sunset Gold) - Few slots left
<Badge variant="warning">Few Left</Badge>

// Full (Error Red)
<Badge variant="full">Full</Badge>

// Closed (Chennai Earth)
<Badge variant="closed">Closed</Badge>

// Default (same as available)
<Badge>Available</Badge>
```

---

### Card

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/atoms';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Morning Session</CardTitle>
    <CardDescription>6:00 AM - 8:00 AM</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Watch thousands of parakeets arrive as the sun rises.</p>
  </CardContent>
  <CardFooter>
    <Button>Book Slot</Button>
  </CardFooter>
</Card>

// Slot card example
<Card className="max-w-sm">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Evening Session</CardTitle>
      <Badge variant="warning">3 Left</Badge>
    </div>
    <CardDescription>5:00 PM - 7:00 PM</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p className="text-sm text-chennai-earth">
        Capacity: 7/10 visitors
      </p>
      <p className="text-sm">
        Golden hour sunset viewing with the birds.
      </p>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Book This Slot</Button>
  </CardFooter>
</Card>
```

---

### Textarea

```tsx
import { Textarea, Label } from '@/components/atoms';

<div className="space-y-2">
  <Label htmlFor="feedback">Your Feedback</Label>
  <Textarea 
    id="feedback" 
    placeholder="Share your experience..."
    rows={4}
  />
</div>
```

---

## 🎬 With Framer Motion

```tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, Button } from '@/components/atoms';

export function AnimatedSlotCard({ slot }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{slot.time}</CardTitle>
        </CardHeader>
        {/* content */}
      </Card>
    </motion.div>
  );
}
```

---

## 🌍 With next-intl

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button, Label, Input } from '@/components/atoms';

export function BookingForm() {
  const t = useTranslations('booking');

  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="name">{t('visitorName')}</Label>
        <Input id="name" placeholder={t('namePlaceholder')} />
      </div>
      
      <Button type="submit">{t('submitBooking')}</Button>
    </form>
  );
}
```

**Translation files needed:**

```json
// src/messages/en.json
{
  "booking": {
    "visitorName": "Visitor Name",
    "namePlaceholder": "Enter your full name",
    "submitBooking": "Book My Visit"
  }
}

// src/messages/ta.json
{
  "booking": {
    "visitorName": "பார்வையாளர் பெயர்",
    "namePlaceholder": "உங்கள் முழு பெயரை உள்ளிடவும்",
    "submitBooking": "எனது வருகையை பதிவு செய்யுங்கள்"
  }
}
```

---

## ♿ Accessibility Features

All components include:

- ✅ **Focus rings**: 2px parakeet-green ring with offset
- ✅ **Keyboard navigation**: Full tab support
- ✅ **Touch targets**: Minimum 44x44px (WCAG 2.1 AA)
- ✅ **Color contrast**: WCAG AA compliant ratios
- ✅ **Screen reader support**: Semantic HTML elements
- ✅ **Disabled states**: Proper opacity and pointer-events handling

---

## 🎨 Design Token Reference

Components use these Tailwind classes from [globals.css](../app/globals.css):

```css
/* Colors */
bg-parakeet-green   /* #00A36C */
bg-sunset-gold      /* #FF8C00 */
bg-parchment        /* #FEFDF5 */
bg-mist-white       /* #F0F4F0 */
text-chennai-earth  /* #8B6914 */
text-deep-night     /* #1A1A2E */

/* Shadows */
shadow-md           /* Standard card shadow */
shadow-lg           /* Hover card shadow */
shadow-glow-green   /* Button hover glow */

/* Fonts */
font-serif          /* Merriweather */
font-sans           /* Inter */
font-tamil          /* Noto Sans Tamil */
```

---

## 📂 Next Steps

Build molecular components by combining atoms:

1. **FormField**: Label + Input + Error message
2. **SlotCard**: Badge + Card + Button
3. **LanguageSwitcher**: EN/TA toggle button
4. **StoryCard**: Image + Card + Text

See [COMPONENT-GUIDE.md](../../COMPONENT-GUIDE.md) for the full atomic design structure.

---

## 🐛 Troubleshooting

**TypeScript errors with imports?**
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**Tailwind classes not working?**
- Ensure `globals.css` is imported in `layout.tsx`
- Check that design tokens are defined in the `@theme` directive

**Components not styled correctly?**
- Verify `components.json` points to correct paths
- Run `npm run dev` to rebuild

---

**Built with ❤️ for the Birdman of Chennai**
