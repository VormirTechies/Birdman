import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'birdman-7e745';
const DATABASE_ID = 'birdman-db';
const COLLECTION = 'feedback';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:7003';

const feedback = [
  {
    name: 'Ananya Rao',
    message: 'The booking experience was simple, clear, and much faster than I expected. Everything worked smoothly from start to finish.',
  },
  {
    name: 'Arjun Kumar',
    message: 'The team was welcoming and helpful throughout our visit. We especially appreciated the clear information provided beforehand.',
  },
  {
    name: 'Meera Nair',
    message: 'A thoughtfully designed experience with excellent communication. I would happily recommend Birdman to friends and family.',
  },
  {
    name: 'Karthik Iyer',
    message: 'Our visit was memorable and well organized. The process felt personal without being complicated or time-consuming.',
  },
  {
    name: 'Priya Shah',
    message: 'I loved how easy it was to find the information we needed. The experience was polished, friendly, and genuinely enjoyable.',
  },
  {
    name: 'Rahul Menon',
    message: 'Everything was handled professionally, and the team answered our questions with patience. We had a wonderful experience.',
  },
  {
    name: 'Divya Patel',
    message: 'The entire journey was smooth and reassuring. Small details were handled carefully, which made the experience stand out.',
  },
  {
    name: 'Naveen Krishnan',
    message: 'A very convenient and pleasant service. The updates were timely, the instructions were clear, and the result exceeded expectations.',
  },
  {
    name: 'Sneha Reddy',
    message: 'We felt supported at every step. The experience was easy to understand, beautifully presented, and worth sharing with others.',
  },
  {
    name: 'Vikram Singh',
    message: 'The platform was fast and straightforward to use. I appreciated the attention to detail and the responsive support from the team.',
  },
  {
    name: 'Lakshmi Das',
    message: 'From planning through completion, everything felt carefully organized. It was a positive experience that we will remember fondly.',
  },
  {
    name: 'Aditya Joshi',
    message: 'The service combined convenience with a personal touch. It saved us time and made the whole experience much more enjoyable.',
  },
] as const;

function getEmulatorHost() {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.trim() || DEFAULT_EMULATOR_HOST;
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
    throw new Error(`Refusing to seed non-local Firestore host: ${host}`);
  }
  return host;
}

async function run() {
  const emulatorHost = getEmulatorHost();
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  process.env.GCLOUD_PROJECT = PROJECT_ID;

  const app = initializeApp({ projectId: PROJECT_ID }, `feedback-emulator-seed-${Date.now()}`);
  const db = getFirestore(app, DATABASE_ID);
  const batch = db.batch();
  const now = Date.now();

  feedback.forEach((item, index) => {
    const createdAt = Timestamp.fromMillis(now - index * 24 * 60 * 60 * 1000);
    const reference = db.collection(COLLECTION).doc(`mock-approved-${String(index + 1).padStart(2, '0')}`);

    batch.set(reference, {
      name: item.name,
      email: `mock-feedback-${index + 1}@example.com`,
      message: item.message,
      status: 'approved',
      createdAt,
      updatedAt: createdAt,
      approvedAt: createdAt,
      approvedBy: 'emulator-seed',
    });
  });

  try {
    await batch.commit();
    console.log('Approved feedback mock data seeded successfully.', {
      project: PROJECT_ID,
      database: DATABASE_ID,
      emulatorHost,
      documents: feedback.length,
    });
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error('Failed to seed emulator feedback:', error);
  process.exitCode = 1;
});
