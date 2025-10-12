import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ params, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const userId = parseInt(params.id);

  // Récupérer toutes les commandes de cet utilisateur
  const orders = db.prepare(`
    SELECT 
      o.id, 
      o.status, 
      o.total_amount, 
      o.created_at,
      o.processed_at
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(userId);

  // Pour chaque commande, récupérer ses articles
  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT 
        oi.id, 
        oi.quantity, 
        oi.unit_price, 
        oi.product_id,
        p.name, 
        p.description, 
        p.image_path
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    
    return { ...order, items };
  });

  return json(ordersWithItems);
}