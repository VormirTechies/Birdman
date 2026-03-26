import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility (classname merger)', () => {
  it('merges multiple class names', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');

    const isDisabled = false;
    const result2 = cn('base-class', isDisabled && 'disabled-class');
    expect(result2).toBe('base-class');
  });

  it('merges conflicting Tailwind classes correctly', () => {
    // tailwind-merge should keep the last class when conflicting
    const result = cn('px-4', 'px-6'); // Both are padding-x
    expect(result).toBe('px-6'); // Should keep px-6
  });

  it('handles clsx arrays', () => {
    const result = cn(['class-1', 'class-2'], 'class-3');
    expect(result).toBe('class-1 class-2 class-3');
  });

  it('handles clsx objects', () => {
    const result = cn({
      'class-1': true,
      'class-2': false,
      'class-3': true,
    });
    expect(result).toBe('class-1 class-3');
  });

  it('removes duplicate classes', () => {
    const result = cn('class-1', 'class-2', 'class-1');
    expect(result).toBe('class-1 class-2');
  });

  it('handles empty or null values', () => {
    const result = cn('class-1', null, undefined, '', 'class-2');
    expect(result).toBe('class-1 class-2');
  });
});
