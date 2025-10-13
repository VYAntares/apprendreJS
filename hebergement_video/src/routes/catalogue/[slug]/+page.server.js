// src/routes/catalogue/[slug]/+page.server.js
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

  const slug = params.slug;

  // Trouver la catégorie par son "nom slugifié"
  const categories = await db.categorie.findMany();
  const categorie = categories.find(c =>
    c.nom.toLowerCase().replace(/\s/g, '-') === slug
  );

  if (!categorie) {
    return {
      status: 404,
      error: new Error('Catégorie introuvable')
    };
  }

  const videos = await db.video.findMany({
    where: { categorie: categorie.nom },
    orderBy: { ordre: 'asc' }
  });

  return {
    user,
    subscription: user.subscription,
    categorie,
    videos
  };
}
