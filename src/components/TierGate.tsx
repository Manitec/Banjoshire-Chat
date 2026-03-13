import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { useRouter } from 'next/router';

interface TierGateProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** inline: shows a small lock badge instead of the full upgrade card */
  inline?: boolean;
}

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, agency: 2 };

export default function TierGate({ requiredTier, children, fallback, inline }: TierGateProps) {
  const { tier, loading } = useSubscription();
  const router = useRouter();

  // During loading: inline mode shows nothing (no layout shift), full mode shows slim bar
  if (loading) {
    if (inline) return null;
    return <div className="animate-pulse bg-gray-700/40 rounded h-8 w-32" />;
  }

  if (TIER_RANK[tier] >= TIER_RANK[requiredTier]) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  if (inline) {
    return (
      <button
        onClick={() => router.push('/upgrade')}
        className="flex items-center gap-1 opacity-60 cursor-pointer text-white text-sm px-3 py-1 rounded-lg border border-purple-500 hover:opacity-90 transition"
        title={`Upgrade to ${requiredTier} to unlock`}
      >
        🔒 {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg border border-purple-500">
      <p className="text-white text-lg font-semibold mb-2">🔒 {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature</p>
      <p className="text-gray-400 text-sm mb-4">Upgrade to unlock private rooms, direct messages & more.</p>
      <button
        onClick={() => router.push('/upgrade')}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition"
      >
        Upgrade Now
      </button>
    </div>
  );
}
