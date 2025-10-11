import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ params, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const order = db.prepare(`
    SELECT o.id, o.status, o.total_amount, o.notes, u.username,
           DATE(o.created_at) as created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(params.id);

  if (!order) {
    return json({ message: 'Commande non trouvée' }, { status: 404 });
  }

  const items = db.prepare(`
    SELECT oi.id, oi.quantity, oi.unit_price, p.name, p.description, oi.product_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(params.id);

  return json({ ...order, items });
}