import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import InvoiceService from '$lib/server/invoiceService';
import PDFDocument from 'pdfkit';

export async function GET({ params, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    throw error(403, 'Accès refusé');
  }

  const orderId = parseInt(params.orderId);

  // Récupérer la commande
  const order = db.prepare(`
    SELECT 
      o.id, 
      o.created_at,
      o.processed_at,
      o.total_amount,
      o.user_id,
      u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    throw error(404, 'Commande non trouvée');
  }

  // Récupérer TOUS les articles (livrés ET non livrés)
  const items = db.prepare(`
    SELECT 
      oi.quantity, 
      oi.unit_price,
      p.id as product_id,
      p.name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

  // Récupérer les articles en attente de livraison pour ce client
  const pendingItems = db.prepare(`
    SELECT 
      pd.product_id,
      pd.product_name as name,
      pd.quantity,
      pd.unit_price
    FROM pending_deliveries pd
    WHERE pd.user_id = ?
  `).all(order.user_id);

  // Récupérer le profil utilisateur
  const userProfile = db.prepare(`
    SELECT 
      up.first_name,
      up.last_name,
      up.email,
      ua.street,
      ua.city,
      ua.postal_code,
      ua.country
    FROM user_profiles up
    LEFT JOIN user_addresses ua ON up.user_id = ua.user_id AND ua.is_default = 1
    WHERE up.user_id = ?
  `).get(order.user_id);

  // Créer le PDF
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});

  // Générer la facture avec TOUS les items et les pending
  await InvoiceService.generateInvoicePDF(
    doc,
    items,           // Tous les articles de la commande
    pendingItems,    // Articles en attente
    userProfile || {},
    new Date(order.created_at),
    order.id
  );

  doc.end();

  // Attendre que le PDF soit complété
  await new Promise((resolve) => {
    doc.on('end', resolve);
  });

  const pdfBuffer = Buffer.concat(chunks);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`
    }
  });
}