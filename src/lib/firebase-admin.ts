import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();

export async function setUserSubscription(
  userId: string,
  tier: 'free' | 'pro' | 'agency',
  stripeCustomerId?: string
) {
  const update: Record<string, any> = { tier, updatedAt: Date.now() };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  await adminDb.ref(`users/${userId}/subscription`).update(update);
}

export async function getUserByStripeCustomerId(customerId: string) {
  const snapshot = await adminDb
    .ref('users')
    .orderByChild('subscription/stripeCustomerId')
    .equalTo(customerId)
    .once('value');
  if (!snapshot.exists()) return null;
  const entries = Object.entries(snapshot.val() as Record<string, any>);
  if (!entries.length) return null;
  const [id, data] = entries[0];
  return { id, ...data };
}

export default admin;
