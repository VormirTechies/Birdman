import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Components', () => {
  it('renders card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders card without optional sections', () => {
    render(
      <Card>
        <CardContent>Minimal Card</CardContent>
      </Card>
    );

    expect(screen.getByText('Minimal Card')).toBeInTheDocument();
  });

  it('applies custom className to card', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    );

    const card = screen.getByText('Content').parentElement?.parentElement;
    expect(card).toHaveClass('custom-card');
  });

  it('renders CardTitle with correct heading level', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H3');
  });

  it('renders CardDescription with muted text', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
      </Card>
    );

    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('supports nested components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="nested-content">
            <p>Date: April 1, 2026</p>
            <p>Time: 10:00 AM</p>
          </div>
        </CardContent>
      </Card>
    );

    expect(screen.getByTestId('nested-content')).toBeInTheDocument();
    expect(screen.getByText('Date: April 1, 2026')).toBeInTheDocument();
  });

  it('CardFooter aligns items correctly', () => {
    render(
      <Card>
        <CardFooter>
          <button>Cancel</button>
          <button>Submit</button>
        </CardFooter>
      </Card>
    );

    const footer = screen.getByText('Cancel').parentElement;
    expect(footer).toHaveClass('flex');
  });
});
