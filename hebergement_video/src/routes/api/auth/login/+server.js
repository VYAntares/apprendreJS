import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { verifyPassword, generateToken } from '$lib/auth';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();

    // Trouver l'utilisateur
    const user = await db.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!user) {
      return json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Vérifier l'abonnement
    if (!user.subscription || user.subscription.status !== 'active') {
      return json({ error: 'Aucun abonnement actif. Veuillez souscrire à un abonnement.' }, { status: 403 });
    }

    // Générer le token JWT
    const token = generateToken({ userId: user.id, email: user.email });

    // Définir le cookie
    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    });

    return json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
}