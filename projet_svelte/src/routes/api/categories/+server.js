import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ locals }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }
  
  // Récupérer toutes les catégories uniques
  const categories = db.prepare(`
    SELECT DISTINCT category, COUNT(*) as product_count
    FROM products
    GROUP BY category
    ORDER BY category
  `).all();
  
  return json(categories);
}