export const PRODUCTION_FIRESTORE_DATABASE_ID = 'birdman-db';
export const LOCAL_FIRESTORE_DATABASE_ID = '(default)';

interface FirestoreDatabaseEnvironment {
  NODE_ENV?: string;
  FIRESTORE_DATABASE_ID?: string;
}

export function resolveFirestoreDatabaseId(
  environment: FirestoreDatabaseEnvironment = process.env
) {
  const configuredDatabaseId = environment.FIRESTORE_DATABASE_ID?.trim();

  if (environment.NODE_ENV === 'production') {
    if (
      configuredDatabaseId &&
      configuredDatabaseId !== PRODUCTION_FIRESTORE_DATABASE_ID
    ) {
      throw new Error(
        `Production Firestore must use ${PRODUCTION_FIRESTORE_DATABASE_ID}; received ${configuredDatabaseId}`
      );
    }

    return PRODUCTION_FIRESTORE_DATABASE_ID;
  }

  return configuredDatabaseId || LOCAL_FIRESTORE_DATABASE_ID;
}
