import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database } from 'services/firebase';
import { ref, onValue } from 'firebase/database';

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
      setStripeCustomerId(null);
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${user.uid}/subscription`);
    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setTier(data.tier || 'free');
          setStripeCustomerId(data.stripeCustomerId || null);
        } else {
          setTier('free');
          setStripeCustomerId(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Subscription fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { tier, stripeCustomerId, loading };
}
