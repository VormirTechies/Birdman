# Component Architecture

This project follows **Atomic Design** principles for component organization.

## Folder Structure

```
src/components/
├── atoms/           # Basic building blocks (Button, Input, Badge, Icon)
├── molecules/       # Simple combinations of atoms (FormField, SlotCard)
├── organisms/       # Complex UI sections (Header, BookingForm, SlotGrid)
└── templates/       # Page-level layouts (PageLayout, BookingLayout)
```

---

## Atomic Design Principles

### **Atoms** (Smallest components)
- Single-purpose, highly reusable
- No business logic
- Examples: Button, Input, Badge, Icon, Label

### **Molecules** (Combinations of atoms)
- Purpose-built groupings
- Limited business logic
- Examples: FormField (Label + Input + Error), SlotCard (Badge + Button + Text)

### **Organisms** (Complex sections)
- Distinct sections of UI
- Can contain business logic
- Examples: Header, BookingForm, SlotGrid, AdminDashboard

### **Templates** (Page layouts)
- Define page structure
- Coordinate organisms
- Examples: PageLayout (Header + Content + Footer), BookingLayout (Stepper + Form)

---

## Component Guidelines

### File Naming
- Use PascalCase: `Button.tsx`, `FormField.tsx`
- Index exports: `components/atoms/index.ts` for easier imports

### Component Structure
```typescript
// 1. Imports
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 2. Variants (if using CVA)
const buttonVariants = cva(/* ... */);

// 3. Types
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// 4. Component
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

---

## Design Token Usage

Always use design tokens from `globals.css`:

```tsx
// ✅ Correct
<div className="bg-parakeet-green text-parchment">

// ❌ Incorrect
<div className="bg-green-600 text-white">
```

---

## Accessibility Checklist

Every component must:
- [ ] Support keyboard navigation
- [ ] Have appropriate ARIA labels
- [ ] Meet WCAG 2.1 AA color contrast (4.5:1 minimum)
- [ ] Have visible focus indicators
- [ ] Support screen readers
- [ ] Respect `prefers-reduced-motion`

---

## Tamil Language Support

When creating components with text content:
- All user-facing strings must come from next-intl
- Use `font-tamil` class for Tamil text
- Increase font size by 2px for Tamil scripts

```tsx
import { useTranslations } from 'next-intl';

export function Greeting() {
  const t = useTranslations('common');
  
  return (
    <p className="font-sans">{t('greeting')}</p>
    // Will use font-tamil automatically based on locale
  );
}
```

---

## Example Components to Build

### Atoms
- `Button` (primary, secondary, outline, ghost variants)
- `Input` (text, email, tel)
- `Badge` (available, warning, full, closed statuses)
- `Label`
- `Card`, `CardHeader`, `CardContent`, `CardFooter`

### Molecules
- `FormField` (Label + Input + Error message)
- `SlotCard` (Time + Capacity + Badge + Book Button)
- `StoryCard` (Image + Title + Description)
- `LanguageSwitcher` (EN/TA toggle)

### Organisms
- `Header` (Logo + Navigation + LanguageSwitcher)
- `HeroSection` (Full-bleed image + Title + CTA)
- `BookingForm` (Multi-step form with validation)
- `SlotGrid` (Morning/Evening session cards)
- `RulesModal` (Sanctuary rules with acceptance)
- `Footer` (Links + Contact + Social)

### Templates
- `PageLayout` (Header + main + Footer)
- `BookingLayout` (Stepper + Form container)
- `AdminLayout` (Mobile-first dashboard structure)

---

## Import Patterns

```typescript
// Importing atoms
import { Button, Badge, Input } from '@/components/atoms';

// Importing molecules
import { FormField, SlotCard } from '@/components/molecules';

// Importing organisms
import { Header, BookingForm } from '@/components/organisms';

// Importing templates
import { PageLayout } from '@/components/templates';
```

---

## Testing Requirements

Each component should have:
- Visual tests (Storybook stories — future)
- Accessibility tests (keyboard nav, ARIA)
- Responsive tests (mobile, tablet, desktop)
- I18n tests (English + Tamil rendering)

---

## Next Steps for Parrot-Frontend

1. Create component folders manually or via script
2. Build atoms first (Button, Input, Badge, Card)
3. Compose molecules from atoms
4. Build organisms using molecules
5. Create page templates
6. Wire up to actual pages

Refer to [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for full design specifications.
