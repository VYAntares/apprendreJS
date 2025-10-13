import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { hashPassword } from '$lib/auth';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_ID_NORMAL = process.env.STRIPE_PRICE_ID_NORMAL || '';
const STRIPE_PRICE_ID_PREMIUM = process.env.STRIPE_PRICE_ID_PREMIUM || '';
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'http://localhost:5173';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
});

export async function POST({ request }) {
  try {
    const data = await request.json();
    const plan = data.plan || 'normal';

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(data.password);

    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        pays: data.pays,
        telephone: data.telephone || ''
      }
    });

    // Choisir le bon Price ID selon le plan
    const priceId = plan === 'premium' ? STRIPE_PRICE_ID_PREMIUM : STRIPE_PRICE_ID_NORMAL;

    // Créer un client Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.prenom} ${user.nom}`,
      address: {
        line1: user.adresse,
        postal_code: user.codePostal,
        city: user.ville,
        country: 'CH'
      },
      metadata: {
        userId: user.id,
        plan: plan
      }
    });

    // Créer une session de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${PUBLIC_SITE_URL}/inscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_SITE_URL}/inscription/cancel`,
      metadata: {
        userId: user.id,
        plan: plan
      }
    });

    return json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}