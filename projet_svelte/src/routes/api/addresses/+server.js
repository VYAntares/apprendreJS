import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

// POST - Ajouter une adresse
export async function POST({ request, locals }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }

  const data = await request.json();
  const userId = data.userId || locals.session.userId;

  // Admin peut ajouter pour n'importe qui, client seulement pour lui
  if (locals.session.role !== 'admin' && userId !== locals.session.userId) {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Validation
  if (!data.street || !data.city || !data.postal_code) {
    return json({ message: 'Rue, ville et code postal sont requis' }, { status: 400 });
  }

  try {
    // Si cette adresse est définie comme par défaut, retirer le flag des autres
    if (data.is_default) {
      db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }

    const result = db.prepare(`
      INSERT INTO user_addresses (
        user_id, address_type, label, street, street_complement,
        city, postal_code, state_province, country, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      data.address_type || 'other',
      data.label || 'Nouvelle adresse',
      data.street,
      data.street_complement || null,
      data.city,
      data.postal_code,
      data.state_province || null,
      data.country || 'Suisse',
      data.is_default ? 1 : 0
    );

    return json({ 
      success: true, 
      addressId: result.lastInsertRowid,
      message: 'Adresse ajoutée avec succès'
    });
  } catch (error) {
    console.error('Erreur ajout adresse:', error);
    return json({ message: 'Erreur lors de l\'ajout de l\'adresse' }, { status: 500 });
  }
}

// DELETE - Supprimer une adresse
export async function DELETE({ request, locals }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { addressId } = await request.json();

  // Vérifier que l'adresse appartient bien à l'utilisateur (sauf admin)
  if (locals.session.role !== 'admin') {
    const address = db.prepare('SELECT user_id FROM user_addresses WHERE id = ?').get(addressId);
    if (!address || address.user_id !== locals.session.userId) {
      return json({ message: 'Accès refusé' }, { status: 403 });
    }
  }

  try {
    db.prepare('DELETE FROM user_addresses WHERE id = ?').run(addressId);
    return json({ success: true, message: 'Adresse supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression adresse:', error);
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
}