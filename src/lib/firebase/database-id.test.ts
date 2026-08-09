import { describe, expect, it } from 'vitest';
import {
  LOCAL_FIRESTORE_DATABASE_ID,
  PRODUCTION_FIRESTORE_DATABASE_ID,
  resolveFirestoreDatabaseId,
} from './database-id';

describe('resolveFirestoreDatabaseId', () => {
  it('uses the default database for local development', () => {
    expect(resolveFirestoreDatabaseId({ NODE_ENV: 'development' })).toBe(
      LOCAL_FIRESTORE_DATABASE_ID
    );
  });

  it('uses birdman-db in production', () => {
    expect(resolveFirestoreDatabaseId({ NODE_ENV: 'production' })).toBe(
      PRODUCTION_FIRESTORE_DATABASE_ID
    );
  });

  it('never permits production to target the default database', () => {
    expect(() =>
      resolveFirestoreDatabaseId({
        NODE_ENV: 'production',
        FIRESTORE_DATABASE_ID: LOCAL_FIRESTORE_DATABASE_ID,
      })
    ).toThrow('Production Firestore must use birdman-db');
  });

  it('allows an explicit local database override', () => {
    expect(
      resolveFirestoreDatabaseId({
        NODE_ENV: 'development',
        FIRESTORE_DATABASE_ID: 'local-integration-db',
      })
    ).toBe('local-integration-db');
  });
});
