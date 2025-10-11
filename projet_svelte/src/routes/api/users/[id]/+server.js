import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

// GET - Récupérer un utilisateur avec toutes ses infos
export async function GET({ params, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const userId = parseInt(params.id);

  // Récupérer l'utilisateur et son profil
  const user = db.prepare(`
    SELECT 
      u.id, u.username, u.role, u.created_at,
      p.first_name, p.last_name, p.email, p.phone, p.date_of_birth
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `).get(userId);

  if (!user) {
    return json({ message: 'Utilisateur non trouvé' }, { status: 404 });
  }

  // Récupérer toutes ses adresses
  const addresses = db.prepare(`
    SELECT * FROM user_addresses
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `).all(userId);

  return json({ ...user, addresses });
}