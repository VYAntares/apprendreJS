import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function POST({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'client') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { items } = await request.json();
  
  // Filtrer les items avec quantité > 0
  const validItems = items.filter(item => item.quantity > 0);
  
  if (validItems.length === 0) {
    return json({ message: 'Aucun article commandé' }, { status: 400 });
  }

  try {
    const insertOrder = db.prepare('INSERT INTO orders (user_id, status) VALUES (?, ?)');
    const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
    
    const transaction = db.transaction((userId, items) => {
      const result = insertOrder.run(userId, 'pending');
      const orderId = result.lastInsertRowid;
      
      for (const item of items) {
        insertOrderItem.run(orderId, item.product_id, item.quantity);
      }
      
      return orderId;
    });
    
    const orderId = transaction(locals.session.userId, validItems);
    return json({ success: true, orderId });
  } catch (error) {
    return json({ message: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}