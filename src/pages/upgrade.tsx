import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/services/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/router';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Public servers', 'Basic chat', 'Demo access'],
    priceId: null,
    cta: 'Current Plan',
  },
  {
    name: 'Pro',
    price: '$7',
    period: 'per month',
    features: ['Private servers', 'File sharing (10GB)', 'Voice channels', 'Priority support'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$15',
    period: 'per month',
    features: ['Everything in Pro', 'Custom bots', '100GB storage', 'White-label option', 'Dedicated support'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID,
    cta: 'Upgrade to Agency',
  },
];

export default function UpgradePage() {
  const [user] = useAuthState(auth);
  const { tier } = useSubscription();
  const router = useRouter();

  const handleUpgrade = async (priceId: string) => {
    if (!user) return router.push('/login');
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, userEmail: user.email, priceId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-4xl font-bold text-white mb-2">Banjoshire Plans</h1>
      <p className="text-gray-400 mb-12">Upgrade for private servers, voice, and more</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 flex flex-col ${
              plan.highlight
                ? 'bg-purple-700 border-2 border-purple-400 shadow-xl scale-105'
                : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <p className="text-3xl font-extrabold text-white mt-2">
              {plan.price} <span className="text-sm font-normal text-gray-300">{plan.period}</span>
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-gray-200 text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={!plan.priceId || tier === plan.name.toLowerCase()}
              onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
              className="mt-6 w-full py-2 rounded-full font-semibold text-white bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {tier === plan.name.toLowerCase() ? '✓ Current Plan' : plan.cta}
            </button>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-10">Powered by Manitec · <a href="/" className="underline">Back to Banjoshire</a></p>
    </div>
  );
}
