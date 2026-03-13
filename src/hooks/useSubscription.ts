import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'pro' | 'agency';

interface Subscription {
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
  loading: boolean;
}

export function useSubscription(): Subscription {
  const [user] = useAuthState(auth);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier('free');
      setLoading(false);
      return;
    }
    const fetchSub = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setTier(data.subscriptionTier || 'free');
          setStripeCustomerId(data.stripeCustomerId || null);
        }
      } catch (e) {
        console.error('Subscription fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, [user]);

  return { tier, stripeCustomerId, loading };
}
