import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

// GET - Récupérer tous les utilisateurs avec leurs infos
export async function GET({ locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  // Requête avec JOIN pour récupérer users + profils + adresse par défaut
  const users = db.prepare(`
    SELECT 
      u.id, u.username, u.role,
      p.first_name, p.last_name, p.email, p.phone,
      a.city, a.country
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN user_addresses a ON u.id = a.user_id AND a.is_default = 1
    ORDER BY u.id DESC
  `).all();
  
  return json(users);
}

// POST - Créer un nouvel utilisateur complet
export async function POST({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const data = await request.json();
  
  // Validation
  if (!data.username || !data.password || !data.role) {
    return json({ message: 'Nom d\'utilisateur, mot de passe et rôle sont requis' }, { status: 400 });
  }

  if (data.role !== 'client' && data.role !== 'admin') {
    return json({ message: 'Le rôle doit être "client" ou "admin"' }, { status: 400 });
  }

  // Validation email si fourni
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return json({ message: 'Email invalide' }, { status: 400 });
    }
  }

  // Transaction pour créer user + profil + adresse
  const createUser = db.transaction((userData) => {
    try {
      // 1. Créer l'utilisateur dans la table users
      const userResult = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
        .run(userData.username, userData.password, userData.role);
      
      const userId = userResult.lastInsertRowid;
      
      // 2. Créer le profil dans la table user_profiles (si des infos sont fournies)
      if (userData.first_name || userData.last_name || userData.email || userData.phone) {
        db.prepare(`
          INSERT INTO user_profiles (user_id, first_name, last_name, email, phone)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          userId,
          userData.first_name || null,
          userData.last_name || null,
          userData.email || null,
          userData.phone || null
        );
      }
      
      // 3. Créer l'adresse dans la table user_addresses (si fournie)
      if (userData.street && userData.city && userData.postal_code) {
        db.prepare(`
          INSERT INTO user_addresses (
            user_id, address_type, label, street, street_complement,
            city, postal_code, state_province, country, is_default
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          userData.address_type || 'other',
          userData.address_label || 'Principale',
          userData.street,
          userData.street_complement || null,
          userData.city,
          userData.postal_code,
          userData.state_province || null,
          userData.country || 'Suisse',
          1 // Première adresse = par défaut
        );
      }
      
      return userId;
    } catch (error) {
      throw error;
    }
  });

  try {
    const userId = createUser(data);
    return json({ 
      success: true, 
      userId: userId,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: users.username')) {
      return json({ message: 'Ce nom d\'utilisateur existe déjà' }, { status: 400 });
    }
    if (error.message.includes('UNIQUE constraint failed: user_profiles.email')) {
      return json({ message: 'Cet email est déjà utilisé' }, { status: 400 });
    }
    console.error('Erreur création utilisateur:', error);
    return json({ message: 'Erreur lors de la création de l\'utilisateur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur (cascade sur profil et adresses)
export async function DELETE({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { userId } = await request.json();
  
  if (userId === locals.session.userId) {
    return json({ message: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
  }

  try {
    // Grâce à ON DELETE CASCADE, le profil et les adresses sont supprimés automatiquement
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
}