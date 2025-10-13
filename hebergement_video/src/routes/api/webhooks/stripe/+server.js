import Stripe from 'stripe';
import { db } from '$lib/db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
});

export async function POST({ request }) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan || 'normal';
          
          if (userId) {
            await db.subscription.upsert({
              where: { userId: userId },
              update: {
                plan: plan,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              },
              create: {
                userId: userId,
                plan: plan,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'canceled' }
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: { status: 'past_due' }
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}