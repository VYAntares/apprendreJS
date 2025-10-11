import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const orders = db.prepare(`
    SELECT o.id, o.total_amount, u.username,
           DATE(o.processed_at) as processed_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'processed'
    ORDER BY o.processed_at DESC
  `).all();

  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.quantity, oi.unit_price, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    
    return { ...order, items };
  });

  return json(ordersWithItems);
}