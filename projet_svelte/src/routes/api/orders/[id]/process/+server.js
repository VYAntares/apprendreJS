import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function POST({ params, request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { processedQuantities } = await request.json();

  try {
    const updateOrder = db.prepare('UPDATE orders SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateOrderItem = db.prepare('UPDATE order_items SET quantity = ? WHERE id = ?');
    const getOrderItem = db.prepare('SELECT quantity, unit_price FROM order_items WHERE id = ?');
    
    const transaction = db.transaction((orderId, quantities) => {
      // Recalculer le montant total basé sur les quantités traitées
      let newTotal = 0;
      
      for (const [itemId, quantity] of Object.entries(quantities)) {
        const item = getOrderItem.get(itemId);
        if (item) {
          updateOrderItem.run(quantity, itemId);
          newTotal += item.unit_price * quantity;
        }
      }
      
      // Mettre à jour la commande
      updateOrder.run('processed', orderId);
      
      // Mettre à jour le montant total
      db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(newTotal, orderId);
    });
    
    transaction(params.id, processedQuantities);
    return json({ success: true });
  } catch (error) {
    console.error('Erreur traitement commande:', error);
    return json({ message: 'Erreur lors du traitement de la commande: ' + error.message }, { status: 500 });
  }
}