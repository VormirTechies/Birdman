import { spawn } from 'node:child_process';
import { config } from 'dotenv';

config({ path: '.env.production', override: true, quiet: true });
Object.assign(process.env, {
  FIREBASE_USE_LIVE: 'true',
  NEXT_PUBLIC_FIREBASE_USE_LIVE: 'true',
  FIREBASE_PROJECT_ID: 'birdman-7e745',
  GCLOUD_PROJECT: 'birdman-7e745',
  FIRESTORE_DATABASE_ID: 'birdman-db',
  FIRESTORE_EMULATOR_HOST: '',
  FIREBASE_AUTH_EMULATOR_HOST: '',
  FIREBASE_STORAGE_EMULATOR_HOST: '',
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: '',
});
if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'birdman-7e745') throw new Error('Production Firebase client configuration must target birdman-7e745');
console.log('LIVE Firebase: birdman-7e745 / birdman-db. Local actions affect production.');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '7101'], { stdio: 'inherit', env: process.env });
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error); process.exitCode = 1; });
