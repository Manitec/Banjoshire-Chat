import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from 'services/stripe';
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

const getTier = (priceId: string): 'free' | 'pro' | 'agency' => {
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'free';
};

async function writeToFirebase(path: string, data: object) {
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  if (!dbUrl || !secret) {
    throw new Error(`Missing: ${!dbUrl ? 'NEXT_PUBLIC_FIREBASE_DATABASE_URL ' : ''}${!secret ? 'FIREBASE_DATABASE_SECRET' : ''}`);
  }
  const res = await fetch(`${dbUrl}/${path}.json?auth=${secret}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase REST ${res.status}: ${await res.text()}`);
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
  } catch (err: any) {
    return res.status(400).json({ error: 'Failed to read body' });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Signature error:', err.message);
    return res.status(400).json({ error: `Signature error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        console.log('checkout.session.completed — userId:', userId);
        if (userId) {
          await writeToFirebase(`users/${userId}/subscription`, {
            tier: 'pro',
            stripeCustomerId: customerId,
            updatedAt: Date.now(),
          });
          console.log('✅ Wrote tier:pro for', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = getTier(sub.items.data[0].price.id);
        const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
        const secret = process.env.FIREBASE_DATABASE_SECRET;
        const snapshot = await fetch(
          `${dbUrl}/users.json?auth=${secret}&orderBy="subscription/stripeCustomerId"&equalTo="${sub.customer}"`
        ).then(r => r.json());
        if (snapshot) {
          for (const uid of Object.keys(snapshot)) {
            await writeToFirebase(`users/${uid}/subscription`, { tier, updatedAt: Date.now() });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
        const secret = process.env.FIREBASE_DATABASE_SECRET;
        const snapshot = await fetch(
          `${dbUrl}/users.json?auth=${secret}&orderBy="subscription/stripeCustomerId"&equalTo="${sub.customer}"`
        ).then(r => r.json());
        if (snapshot) {
          for (const uid of Object.keys(snapshot)) {
            await writeToFirebase(`users/${uid}/subscription`, { tier: 'free', updatedAt: Date.now() });
          }
        }
        break;
      }
      default:
        console.log('Unhandled event:', event.type);
    }
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
