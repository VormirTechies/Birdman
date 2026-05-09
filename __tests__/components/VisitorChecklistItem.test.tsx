import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitorChecklistItem, type ChecklistVisitor } from '@/app/admin/checklist/_components/VisitorChecklistItem';

// framer-motion needs to be mocked in jsdom – render children immediately
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout: _layout, layoutId: _layoutId, ...props }: React.HTMLAttributes<HTMLDivElement> & { layout?: unknown; layoutId?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseVisitor: ChecklistVisitor = {
  id: 'abc-123',
  visitorName: 'Rajesh Kumar',
  phone: '+919876543210',
  visited: false,
  numberOfGuests: 2,
};

describe('VisitorChecklistItem', () => {
  describe('rendering', () => {
    it('renders visitor name', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    });

    it('renders visitor phone', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('+919876543210')).toBeInTheDocument();
    });

    it('renders avatar initials from name', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('RK')).toBeInTheDocument();
    });

    it('renders single-word name initials correctly', () => {
      const visitor = { ...baseVisitor, visitorName: 'Sudarson' };
      render(<VisitorChecklistItem visitor={visitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('renders guest count badge with plural label', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('2 guests')).toBeInTheDocument();
    });

    it('renders singular "guest" when numberOfGuests is 1', () => {
      const visitor = { ...baseVisitor, numberOfGuests: 1 };
      render(<VisitorChecklistItem visitor={visitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('1 guest')).toBeInTheDocument();
    });

    it('renders 4 guests correctly', () => {
      const visitor = { ...baseVisitor, numberOfGuests: 4 };
      render(<VisitorChecklistItem visitor={visitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('4 guests')).toBeInTheDocument();
    });
  });

  describe('visited toggle', () => {
    it('toggle is unchecked when visited is false', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('toggle is checked when visited is true', () => {
      const visitor = { ...baseVisitor, visited: true };
      render(<VisitorChecklistItem visitor={visitor} onToggle={vi.fn()} isUpdating={false} />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onToggle with id and true when toggled from false', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={onToggle} isUpdating={false} />);
      await user.click(screen.getByRole('switch'));
      expect(onToggle).toHaveBeenCalledOnce();
      expect(onToggle).toHaveBeenCalledWith('abc-123', true);
    });

    it('calls onToggle with id and false when toggled from true', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      const visitor = { ...baseVisitor, visited: true };
      render(<VisitorChecklistItem visitor={visitor} onToggle={onToggle} isUpdating={false} />);
      await user.click(screen.getByRole('switch'));
      expect(onToggle).toHaveBeenCalledWith('abc-123', false);
    });

    it('toggle is disabled while updating', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={true} />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('does not call onToggle when disabled', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={onToggle} isUpdating={true} />);
      await user.click(screen.getByRole('switch'));
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('toggle has descriptive aria-label when not visited', () => {
      render(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-label',
        'Mark Rajesh Kumar as visited',
      );
    });

    it('toggle has descriptive aria-label when already visited', () => {
      const visitor = { ...baseVisitor, visited: true };
      render(<VisitorChecklistItem visitor={visitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-label',
        'Mark Rajesh Kumar as not visited',
      );
    });
  });

  describe('avatar color consistency', () => {
    it('same name always produces the same avatar initials', () => {
      const { rerender } = render(
        <VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />,
      );
      const first = screen.getByText('RK');

      rerender(<VisitorChecklistItem visitor={baseVisitor} onToggle={vi.fn()} isUpdating={false} />);
      expect(screen.getByText('RK')).toBe(first);
    });
  });
});
