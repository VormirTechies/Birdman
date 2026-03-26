'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { StarRating } from '@/components/atoms/StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeedbackCardProps {
  name?: string;
  rating: number;
  message: string;
  date: string;
  className?: string;
  truncateLength?: number;
}

export function FeedbackCard({
  name = 'Anonymous',
  rating,
  message,
  date,
  className,
  truncateLength = 150,
}: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = message.length > truncateLength;
  const displayMessage = shouldTruncate && !isExpanded 
    ? `${message.slice(0, truncateLength)}...` 
    : message;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className={cn('p-6 space-y-4 hover:shadow-lg transition-shadow', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-deep-night">{name}</h3>
          <time className="text-sm text-chennai-earth" dateTime={date}>
            {formattedDate}
          </time>
        </div>
        <StarRating rating={rating} size="sm" />
      </div>

      <p className="text-deep-night/80 leading-relaxed">
        {displayMessage}
      </p>

      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-parakeet-green hover:text-parakeet-green/80 p-0 h-auto font-medium"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>
      )}
    </Card>
  );
}
