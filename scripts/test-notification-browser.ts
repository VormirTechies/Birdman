import { spawnSync } from 'node:child_process';
import path from 'node:path';
async function main() {
  for (const port of [7002, 7003]) {
    try { await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(5000) }); }
    catch { throw new Error(`Local emulator port ${port} is unavailable. Run npm run emulators:start first.`); }
  }
  const result = spawnSync(process.execPath, [path.resolve('node_modules/@playwright/test/cli.js'), 'test', '--config=playwright.notifications.config.ts'], {
    stdio: 'inherit', env: { ...process.env, RUN_NOTIFICATION_BROWSER_TESTS: 'true' },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Browser tests failed.'); process.exitCode = 1; });
