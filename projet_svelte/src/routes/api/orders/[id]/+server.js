import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function GET({ params, locals }) {
  // Vérifie que l'utilisateur est connecté et est un admin
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Récupère les détails de la commande
  const order = db.prepare(`
    SELECT 
      o.id, 
      o.status, 
      o.total_amount, 
      o.notes, 
      u.username,
      o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(params.id);

  // Si la commande n'existe pas
  if (!order) {
    return json({ message: 'Commande non trouvée' }, { status: 404 });
  }

  // Récupère les articles de la commande, avec les infos produit
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
  `).all(params.id);

  // Renvoie la commande avec ses articles
  return json({ ...order, items });
}
