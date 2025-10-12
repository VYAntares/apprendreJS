import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import PendingDeliveryService from '$lib/server/pendingDeliveryService';

export async function POST({ params, request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { processedQuantities } = await request.json();

  try {
    const updateOrder = db.prepare('UPDATE orders SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateOrderItem = db.prepare('UPDATE order_items SET quantity = ? WHERE id = ?');
    const getOrderItem = db.prepare('SELECT product_id, quantity, unit_price FROM order_items WHERE id = ?');
    const getProductStock = db.prepare('SELECT stock FROM products WHERE id = ?');
    const updateProductStock = db.prepare('UPDATE products SET stock = ? WHERE id = ?');
    const getOrder = db.prepare('SELECT user_id FROM orders WHERE id = ?');
    
    const transaction = db.transaction((orderId, quantities) => {
      let newTotal = 0;
      
      // Récupérer l'utilisateur de la commande
      const order = getOrder.get(orderId);
      const userId = order.user_id;
      
      for (const [itemId, quantityDelivered] of Object.entries(quantities)) {
        const item = getOrderItem.get(itemId);
        const quantityOrdered = item.quantity;
        
        if (item && quantityDelivered >= 0) {
          // Mettre à jour la quantité de l'article
          updateOrderItem.run(quantityDelivered, itemId);
          
          // Récupérer le stock actuel
          const product = getProductStock.get(item.product_id);
          const currentStock = product ? product.stock : 0;
          
          // Calculer le nouveau stock
          const newStock = Math.max(0, currentStock - quantityDelivered);
          updateProductStock.run(newStock, item.product_id);
          
          // Calculer la quantité non livrée
          const undeliveredQuantity = quantityOrdered - quantityDelivered;
          
          if (undeliveredQuantity > 0) {
            // Il reste des articles à livrer
            
            // Vérifier s'il y a déjà un pending pour ce produit
            const existingPending = PendingDeliveryService.getPendingQuantity(userId, item.product_id);
            
            // La nouvelle quantité en attente est le MAX entre l'existant et le non livré
            const newPendingQuantity = Math.max(existingPending, undeliveredQuantity);
            
            // Mettre à jour ou créer le pending
            const productInfo = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id);
            PendingDeliveryService.addOrUpdatePending(
              userId,
              item.product_id,
              productInfo.name,
              newPendingQuantity,
              item.unit_price
            );
          } else if (quantityDelivered > 0) {
            // Tout a été livré, réduire le pending si il existe
            PendingDeliveryService.reducePendingQuantity(userId, item.product_id, quantityDelivered);
          }
          
          // Ajouter au total
          if (quantityDelivered > 0) {
            newTotal += item.unit_price * quantityDelivered;
          }
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