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
    // Vérifier s'il existe déjà une commande en attente pour cet utilisateur
    const pendingOrder = db.prepare(`
      SELECT id FROM orders 
      WHERE user_id = ? AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(locals.session.userId);

    if (pendingOrder) {
      // FUSION : Il existe déjà une commande en attente
      const orderId = pendingOrder.id;
      
      // Récupérer les articles existants de la commande
      const existingItems = db.prepare(`
        SELECT product_id, quantity, unit_price
        FROM order_items
        WHERE order_id = ?
      `).all(orderId);
      
      // Créer un Map pour fusionner les articles
      const mergedItems = new Map();
      
      // Ajouter les articles existants
      existingItems.forEach(item => {
        mergedItems.set(item.product_id, {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        });
      });
      
      // Fusionner avec les nouveaux articles (garder la quantité maximale)
      const getProduct = db.prepare('SELECT price FROM products WHERE id = ?');
      validItems.forEach(item => {
        const product = getProduct.get(item.product_id);
        const unitPrice = product ? product.price : 0;
        
        if (mergedItems.has(item.product_id)) {
          // Produit déjà dans la commande : garder la quantité maximale
          const existing = mergedItems.get(item.product_id);
          existing.quantity = Math.max(existing.quantity, item.quantity);
          existing.unit_price = unitPrice; // Mettre à jour le prix
        } else {
          // Nouveau produit
          mergedItems.set(item.product_id, {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: unitPrice
          });
        }
      });
      
      // Mettre à jour la commande avec les articles fusionnés
      const deleteItems = db.prepare('DELETE FROM order_items WHERE order_id = ?');
      const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
      
      const transaction = db.transaction((orderId, items) => {
        // Supprimer tous les anciens articles
        deleteItems.run(orderId);
        
        // Insérer les articles fusionnés
        let totalAmount = 0;
        items.forEach(item => {
          insertOrderItem.run(orderId, item.product_id, item.quantity, item.unit_price);
          totalAmount += item.unit_price * item.quantity;
        });
        
        // Mettre à jour le montant total et la date
        db.prepare(`
          UPDATE orders 
          SET total_amount = ?, created_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(totalAmount, orderId);
      });
      
      transaction(orderId, Array.from(mergedItems.values()));
      
      return json({ 
        success: true, 
        orderId: orderId,
        merged: true,
        message: 'Commande fusionnée avec votre commande en attente'
      });
      
    } else {
      // NOUVELLE COMMANDE : Aucune commande en attente
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
      
      return json({ 
        success: true, 
        orderId: orderId,
        merged: false,
        message: 'Nouvelle commande créée'
      });
    }
  } catch (error) {
    console.error('Erreur création commande:', error);
    return json({ message: 'Erreur lors de la création de la commande: ' + error.message }, { status: 500 });
  }
}