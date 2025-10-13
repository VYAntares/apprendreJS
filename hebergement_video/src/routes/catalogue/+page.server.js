import { redirect } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { db } from '$lib/db';

export async function load({ cookies }) {
  const token = cookies.get('auth_token');

  if (!token) {
    throw redirect(303, '/');
  }

  const payload = verifyToken(token);
  if (!payload) {
    cookies.delete('auth_token', { path: '/' });
    throw redirect(303, '/');
  }

  // Vérifier que l'utilisateur existe et a un abonnement actif
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { subscription: true }
  });

  if (!user || !user.subscription || user.subscription.status !== 'active') {
    cookies.delete('auth_token', { path: '/' });
    throw redirect(303, '/');
  }

  // Récupérer les catégories
  const categories = await db.categorie.findMany({
    orderBy: { ordre: 'asc' }
  });

  // Récupérer les vidéos
  const videos = await db.video.findMany({
    orderBy: { ordre: 'asc' }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom
    },
    subscription: {
      plan: user.subscription.plan
    },
    categories,
    videos
  };
}