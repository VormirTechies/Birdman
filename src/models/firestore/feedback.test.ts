import { describe, expect, it } from 'vitest';
import { feedbackSubmissionSchema } from './feedback';

const valid = { name: '  Vicky  ', email: '  VICKY@example.com ', feedback: 'A'.repeat(20), website: '' };

describe('feedbackSubmissionSchema', () => {
  it('normalizes valid input and accepts the lower boundary', () => {
    expect(feedbackSubmissionSchema.parse(valid)).toEqual({
      name: 'Vicky', email: 'vicky@example.com', feedback: 'A'.repeat(20), website: '',
    });
  });

  it('accepts exactly 500 feedback characters', () => {
    expect(feedbackSubmissionSchema.safeParse({ ...valid, feedback: 'A'.repeat(500) }).success).toBe(true);
  });

  it.each([
    [{ ...valid, name: ' ' }, 'blank name'],
    [{ ...valid, email: 'not-an-email' }, 'invalid email'],
    [{ ...valid, feedback: 'A'.repeat(19) }, 'short feedback'],
    [{ ...valid, feedback: 'A'.repeat(501) }, 'long feedback'],
    [{ ...valid, status: 'approved' }, 'unknown server-owned field'],
  ])('rejects %s (%s)', (input) => {
    expect(feedbackSubmissionSchema.safeParse(input).success).toBe(false);
  });
});
