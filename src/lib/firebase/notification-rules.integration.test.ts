// @vitest-environment node
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { initializeTestEnvironment, assertFails, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { NOTIFICATION_COLLECTIONS as C } from '@/models/firestore/notification';
const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let environment: RulesTestEnvironment;
const fixture = `notification-rules-${Date.now()}`;
beforeAll(async () => {
  if (!enabled) return;
  environment = await initializeTestEnvironment({ projectId: `demo-notification-rules-${Date.now()}`,
    firestore: { host: '127.0.0.1', port: 7003, rules: readFileSync('firestore.rules', 'utf8') } });
  await environment.withSecurityRulesDisabled(async context => {
    for (const name of [...Object.values(C), 'adminUsers']) await setDoc(doc(context.firestore(), name, fixture), { uid: fixture, role: 'admin', token: 'private-token' });
  });
});
afterAll(async () => {
  if (enabled && environment) {
    await environment.withSecurityRulesDisabled(async context => {
      for (const name of [...Object.values(C), 'adminUsers']) await deleteDoc(doc(context.firestore(), name, fixture));
    });
    await environment.cleanup();
  }
});
it.skipIf(!enabled).each(['anonymous', 'ordinary', 'admin'])('denies direct CRUD/list on every notification collection and role documents for %s', async identity => {
  const db = identity === 'anonymous' ? environment.unauthenticatedContext().firestore()
    : environment.authenticatedContext(identity === 'admin' ? fixture : `${fixture}-ordinary`, { role: identity === 'admin' ? 'admin' : 'user', admin: identity === 'admin' }).firestore();
  for (const name of [...Object.values(C), 'adminUsers']) {
    await assertFails(getDoc(doc(db, name, fixture)));
    await assertFails(getDocs(collection(db, name)));
    await assertFails(setDoc(doc(db, name, 'attacker'), { uid: 'other', role: 'admin', expiresAt: 'wrong-type' }));
    await assertFails(updateDoc(doc(db, name, fixture), { uid: 'attacker', role: 'admin', extraData: 'x'.repeat(10000), expiresAt: 'future' }));
    await assertFails(deleteDoc(doc(db, name, fixture)));
    await assertFails(setDoc(doc(db, name, 'missing-parent', 'nested', 'attack'), { role: 'admin' }));
  }
});
it.skipIf(!enabled)('keeps privileged seed access available through the server-only bypass', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    const snapshot = await getDoc(doc(context.firestore(), C.devices, fixture));
    expect(snapshot.data()?.token).toBe('private-token');
  });
});
