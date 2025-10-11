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
    
    const transaction = db.transaction((orderId, quantities) => {
      updateOrder.run('processed', orderId);
      
      for (const [itemId, quantity] of Object.entries(quantities)) {
        updateOrderItem.run(quantity, itemId);
      }
    });
    
    transaction(params.id, processedQuantities);
    return json({ success: true });
  } catch (error) {
    return json({ message: 'Erreur lors du traitement de la commande' }, { status: 500 });
  }
}