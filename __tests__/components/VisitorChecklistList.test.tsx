import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitorChecklistList } from '@/app/admin/checklist/_components/VisitorChecklistList';
import type { ChecklistVisitor } from '@/app/admin/checklist/_components/VisitorChecklistItem';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout: _layout, layoutId: _layoutId, ...props }: React.HTMLAttributes<HTMLDivElement> & { layout?: unknown; layoutId?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeVisitor = (overrides: Partial<ChecklistVisitor> = {}): ChecklistVisitor => ({
  id: `id-${Math.random()}`,
  visitorName: 'Test Visitor',
  phone: '+919000000000',
  visited: false,
  numberOfGuests: 1,
  ...overrides,
});

describe('VisitorChecklistList', () => {
  describe('empty state', () => {
    it('shows empty message when visitors array is empty', () => {
      render(<VisitorChecklistList visitors={[]} updatingId={null} onToggle={vi.fn()} />);
      expect(screen.getByText(/no visitors booked for this date/i)).toBeInTheDocument();
    });

    it('does not render any toggle buttons when empty', () => {
      render(<VisitorChecklistList visitors={[]} updatingId={null} onToggle={vi.fn()} />);
      expect(screen.queryAllByRole('switch')).toHaveLength(0);
    });
  });

  describe('with visitors', () => {
    it('renders the correct number of visitor items', () => {
      const visitors = [
        makeVisitor({ id: '1', visitorName: 'Ananya Mani' }),
        makeVisitor({ id: '2', visitorName: 'Priya Kumar' }),
        makeVisitor({ id: '3', visitorName: 'Rajesh Iyer' }),
      ];
      render(<VisitorChecklistList visitors={visitors} updatingId={null} onToggle={vi.fn()} />);
      expect(screen.getAllByRole('switch')).toHaveLength(3);
    });

    it('renders each visitor name', () => {
      const visitors = [
        makeVisitor({ id: '1', visitorName: 'Ananya Mani' }),
        makeVisitor({ id: '2', visitorName: 'Priya Kumar' }),
      ];
      render(<VisitorChecklistList visitors={visitors} updatingId={null} onToggle={vi.fn()} />);
      expect(screen.getByText('Ananya Mani')).toBeInTheDocument();
      expect(screen.getByText('Priya Kumar')).toBeInTheDocument();
    });

    it('does not show empty message when visitors exist', () => {
      const visitors = [makeVisitor({ id: '1' })];
      render(<VisitorChecklistList visitors={visitors} updatingId={null} onToggle={vi.fn()} />);
      expect(screen.queryByText(/no visitors booked/i)).not.toBeInTheDocument();
    });
  });

  describe('updating state', () => {
    it('disables the toggle for the item being updated', () => {
      const visitors = [
        makeVisitor({ id: 'updating-id', visitorName: 'Visitor A' }),
        makeVisitor({ id: 'other-id', visitorName: 'Visitor B' }),
      ];
      render(
        <VisitorChecklistList visitors={visitors} updatingId="updating-id" onToggle={vi.fn()} />,
      );
      const toggles = screen.getAllByRole('switch');
      // First visitor (updating-id) should be disabled, second should not
      const disabledToggle = toggles.find((t) => t.getAttribute('aria-label')?.includes('Visitor A'));
      const activeToggle = toggles.find((t) => t.getAttribute('aria-label')?.includes('Visitor B'));
      expect(disabledToggle).toBeDisabled();
      expect(activeToggle).not.toBeDisabled();
    });

    it('enables all toggles when updatingId is null', () => {
      const visitors = [
        makeVisitor({ id: '1', visitorName: 'Visitor A' }),
        makeVisitor({ id: '2', visitorName: 'Visitor B' }),
      ];
      render(<VisitorChecklistList visitors={visitors} updatingId={null} onToggle={vi.fn()} />);
      screen.getAllByRole('switch').forEach((toggle) => {
        expect(toggle).not.toBeDisabled();
      });
    });
  });

  describe('toggle propagation', () => {
    it('passes onToggle handler down to items', async () => {
      const onToggle = vi.fn();
      const { userEvent: user } = await import('@testing-library/user-event').then((m) => ({
        userEvent: m.default.setup(),
      }));
      const visitors = [makeVisitor({ id: 'v1', visitorName: 'Kavya Natarajan' })];
      render(<VisitorChecklistList visitors={visitors} updatingId={null} onToggle={onToggle} />);
      await user.click(screen.getByRole('switch'));
      expect(onToggle).toHaveBeenCalledWith('v1', true);
    });
  });
});
