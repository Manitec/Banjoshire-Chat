import * as admin from 'firebase-admin';

let db: admin.database.Database | null = null;
let auth: admin.auth.Auth | null = null;

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
      !databaseURL && 'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    ].filter(Boolean);
    throw new Error(`Missing Firebase Admin env vars: ${missing.join(', ')}`);
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
}

export function getAdminDb(): admin.database.Database {
  if (!db) db = getAdminApp().database();
  return db;
}

export function getAdminAuth(): admin.auth.Auth {
  if (!auth) auth = getAdminApp().auth();
  return auth;
}

export async function setUserSubscription(
  userId: string,
  tier: 'free' | 'pro' | 'agency',
  stripeCustomerId?: string
) {
  const update: Record<string, any> = { tier, updatedAt: Date.now() };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  await getAdminDb().ref(`users/${userId}/subscription`).update(update);
}

export async function getUserByStripeCustomerId(customerId: string) {
  const snapshot = await getAdminDb()
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
