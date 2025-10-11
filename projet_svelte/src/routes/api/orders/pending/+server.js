import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const orders = db.prepare(`
    SELECT o.id, o.status, o.total_amount, u.username,
           DATE(o.created_at) as created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'pending'
    ORDER BY o.created_at DESC
  `).all();

  return json(orders);
}