import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  returnUrl,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  returnUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId },
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url: `${returnUrl}?status=cancelled`,
  });
  return session;
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}
