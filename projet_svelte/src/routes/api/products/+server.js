import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ locals, url }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }
  
  const category = url.searchParams.get('category');
  
  let products;
  if (category) {
    // Filtrer par catégorie
    products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY name').all(category);
  } else {
    // Tous les produits
    products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  }
  
  return json(products);
}