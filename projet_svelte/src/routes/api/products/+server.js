import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ locals }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }
  
  const products = db.prepare('SELECT * FROM products').all();
  return json(products);
}