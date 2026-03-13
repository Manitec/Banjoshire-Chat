import type { NextApiRequest, NextApiResponse } from 'next';
import { createCheckoutSession } from 'services/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail, priceId } = req.body;
  if (!userId || !userEmail || !priceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const session = await createCheckoutSession({
      userId,
      userEmail,
      priceId,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/upgrade`,
    });
    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
