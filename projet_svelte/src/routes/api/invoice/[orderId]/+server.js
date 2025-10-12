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
      u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    throw error(404, 'Commande non trouvée');
  }

  // Récupérer les articles
  const items = db.prepare(`
    SELECT 
      oi.quantity, 
      oi.unit_price,
      p.name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

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
    WHERE up.user_id = (SELECT user_id FROM orders WHERE id = ?)
  `).get(orderId);

  // Créer le PDF
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});

  // Générer la facture
  await InvoiceService.generateInvoicePDF(
    doc,
    items,
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