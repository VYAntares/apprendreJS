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
    const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    const getProduct = db.prepare('SELECT price FROM products WHERE id = ?');
    
    const transaction = db.transaction((userId, items) => {
      const result = insertOrder.run(userId, 'pending');
      const orderId = result.lastInsertRowid;
      
      let totalAmount = 0;
      
      for (const item of items) {
        // Récupérer le prix du produit
        const product = getProduct.get(item.product_id);
        const unitPrice = product ? product.price : 0;
        
        // Insérer l'item avec le prix
        insertOrderItem.run(orderId, item.product_id, item.quantity, unitPrice);
        
        totalAmount += unitPrice * item.quantity;
      }
      
      // Mettre à jour le montant total de la commande
      db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);
      
      return orderId;
    });
    
    const orderId = transaction(locals.session.userId, validItems);
    return json({ success: true, orderId });
  } catch (error) {
    console.error('Erreur création commande:', error);
    return json({ message: 'Erreur lors de la création de la commande: ' + error.message }, { status: 500 });
  }
}