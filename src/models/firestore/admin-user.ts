export const ADMIN_ROLE = 'admin' as const;

export interface AdminUserDocument {
  role: typeof ADMIN_ROLE;
  displayName?: string;
}

export interface AdminSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: typeof ADMIN_ROLE;
}

export function isAdminUserDocument(value: unknown): value is AdminUserDocument {
  if (!value || typeof value !== 'object') return false;
  const document = value as Record<string, unknown>;
  return document.role === ADMIN_ROLE
    && (document.displayName === undefined || typeof document.displayName === 'string');
}
