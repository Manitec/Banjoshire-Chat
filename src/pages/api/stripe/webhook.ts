import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/services/stripe';
import { db } from '@/services/firebase-admin';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const getTier = (priceId: string) => {
    if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
    return 'free';
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        if (userId) {
          await db.collection('users').doc(userId).set(
            { stripeCustomerId: customerId, subscriptionTier: 'pro' },
            { merge: true }
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0].price.id;
        const tier = getTier(priceId);
        const customers = await db.collection('users')
          .where('stripeCustomerId', '==', sub.customer).get();
        customers.forEach(doc => doc.ref.update({ subscriptionTier: tier }));
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customers = await db.collection('users')
          .where('stripeCustomerId', '==', sub.customer).get();
        customers.forEach(doc => doc.ref.update({ subscriptionTier: 'free' }));
        break;
      }
    }
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
