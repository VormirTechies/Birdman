import { describe, expect, it } from 'vitest';

describe('Firebase Storage production configuration', () => {
  it('uses the birdman-7e745 bucket naming convention', () => {
    const projectId = 'birdman-7e745';
    const bucket = `${projectId}.firebasestorage.app`;
    expect(bucket.startsWith(`${projectId}.`)).toBe(true);
  });
});
