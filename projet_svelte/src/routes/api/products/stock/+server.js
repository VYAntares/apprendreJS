import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function PUT({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { productId, stock } = await request.json();

  // Validation
  if (stock < 0) {
    return json({ message: 'Le stock ne peut pas être négatif' }, { status: 400 });
  }

  try {
    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(stock, productId);
    return json({ success: true, message: 'Stock mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour stock:', error);
    return json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}