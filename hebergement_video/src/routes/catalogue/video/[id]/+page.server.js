import { db } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';

export async function load({ params, cookies }) {
  const token = cookies.get('auth_token');
  if (!token) throw redirect(303, '/');

  const payload = verifyToken(token);
  if (!payload) throw redirect(303, '/');

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { subscription: true }
  });

  if (!user || user.subscription.status !== 'active') {
    throw redirect(303, '/');
  }

  const video = await db.video.findUnique({
    where: { id: params.id }
  });

  if (!video) {
    return {
      status: 404,
      error: new Error('Vidéo introuvable')
    };
  }

  // Récupérer aussi la catégorie pour construire le chemin du fichier
  const categorie = await db.categorie.findUnique({
    where: { nom: video.categorie }
  });

  return {
    user,
    subscription: user.subscription,
    video,
    categorie
  };
}
