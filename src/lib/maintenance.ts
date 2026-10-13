// One fixed deadline shared by every visitor and server restart.
export const MAINTENANCE_ENDS_AT = '2026-10-14T03:27:44.000Z';

export function isMaintenanceActive(now = Date.now()) {
  return now < Date.parse(MAINTENANCE_ENDS_AT);
}
