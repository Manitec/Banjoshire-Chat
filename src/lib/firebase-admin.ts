import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace \n characters in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Helper: Update user's subscription tier in Firestore
export async function updateUserTier(
  userId: string,
  tier: 'free' | 'pro' | 'agency',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const updateData: any = {
      tier,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }
    if (stripeSubscriptionId) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }

    await userRef.set(updateData, { merge: true });
    console.log(`✅ Updated user ${userId} to tier: ${tier}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating user tier:', error);
    throw error;
  }
}

// Helper: Get user's current tier from Firestore
export async function getUserTier(userId: string): Promise<'free' | 'pro' | 'agency'> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const data = userDoc.data();
    return (data?.tier as 'free' | 'pro' | 'agency') || 'free';
  } catch (error) {
    console.error('❌ Error getting user tier:', error);
    return 'free';
  }
}

// Helper: Get user by Stripe customer ID
export async function getUserByStripeCustomerId(customerId: string) {
  try {
    const snapshot = await adminDb
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('❌ Error getting user by Stripe customer ID:', error);
    return null;
  }
}

// Helper: Cancel user's subscription (downgrade to free)
export async function cancelUserSubscription(userId: string) {
  try {
    await updateUserTier(userId, 'free');
    console.log(`✅ Cancelled subscription for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
}

export default admin;
