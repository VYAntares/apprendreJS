import db from './db.js';

class PendingDeliveryService {
  // Ajouter ou mettre à jour un article en attente
  static addOrUpdatePending(userId, productId, productName, quantity, unitPrice) {
    // Vérifier s'il existe déjà un pending pour ce produit
    const existing = db.prepare(`
      SELECT * FROM pending_deliveries 
      WHERE user_id = ? AND product_id = ?
    `).get(userId, productId);

    if (existing) {
      // Mettre à jour la quantité
      db.prepare(`
        UPDATE pending_deliveries 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(quantity, existing.id);
    } else {
      // Créer un nouveau pending
      db.prepare(`
        INSERT INTO pending_deliveries (user_id, product_id, product_name, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, productId, productName, quantity, unitPrice);
    }
  }

  // Récupérer les articles en attente d'un utilisateur
  static getUserPendingDeliveries(userId) {
    return db.prepare(`
      SELECT pd.*, p.name, p.category, p.image_path
      FROM pending_deliveries pd
      JOIN products p ON pd.product_id = p.id
      WHERE pd.user_id = ?
      ORDER BY pd.created_at DESC
    `).all(userId);
  }

  // Réduire la quantité en attente après livraison
  static reducePendingQuantity(userId, productId, deliveredQuantity) {
    const pending = db.prepare(`
      SELECT * FROM pending_deliveries 
      WHERE user_id = ? AND product_id = ?
    `).get(userId, productId);

    if (pending) {
      const newQuantity = pending.quantity - deliveredQuantity;
      
      if (newQuantity <= 0) {
        // Supprimer si tout est livré
        db.prepare('DELETE FROM pending_deliveries WHERE id = ?').run(pending.id);
      } else {
        // Mettre à jour la quantité restante
        db.prepare(`
          UPDATE pending_deliveries 
          SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(newQuantity, pending.id);
      }
    }
  }

  // Supprimer un pending
  static deletePending(userId, productId) {
    db.prepare(`
      DELETE FROM pending_deliveries 
      WHERE user_id = ? AND product_id = ?
    `).run(userId, productId);
  }

  // Obtenir la quantité en attente pour un produit
  static getPendingQuantity(userId, productId) {
    const result = db.prepare(`
      SELECT quantity FROM pending_deliveries 
      WHERE user_id = ? AND product_id = ?
    `).get(userId, productId);
    
    return result ? result.quantity : 0;
  }
}

export default PendingDeliveryService;