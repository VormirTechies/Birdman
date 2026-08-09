import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const exportDirectory = path.resolve('.firebase', 'emulator-data');
const firebaseArgs = [
  'firebase-tools',
  'emulators:start',
  '--config',
  'firebase.emulator.json',
  '--project',
  'birdman-7e745',
  '--export-on-exit',
  '.firebase/emulator-data',
];

if (existsSync(path.join(exportDirectory, 'firebase-export-metadata.json'))) {
  firebaseArgs.push('--import', '.firebase/emulator-data');
}

const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npx';
const args = isWindows
  ? ['/d', '/s', '/c', ['npx', ...firebaseArgs].join(' ')]
  : firebaseArgs;

console.log('Starting Firebase emulators with the local (default) Firestore database.');
console.log('Firestore UI: http://127.0.0.1:7000/firestore/default/data');
console.log(`Persistence directory: ${exportDirectory}`);

const result = spawnSync(command, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    FIRESTORE_DATABASE_ID: '(default)',
  },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
