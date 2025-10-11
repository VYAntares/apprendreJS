import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

// GET - Récupérer tous les utilisateurs
export async function GET({ locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const users = db.prepare('SELECT id, username, role FROM users').all();
  return json(users);
}

// POST - Créer un nouvel utilisateur
export async function POST({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { username, password, role } = await request.json();
  
  // Validation
  if (!username || !password || !role) {
    return json({ message: 'Tous les champs sont requis' }, { status: 400 });
  }

  if (role !== 'client' && role !== 'admin') {
    return json({ message: 'Le rôle doit être "client" ou "admin"' }, { status: 400 });
  }

  try {
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, password, role);
    
    return json({ 
      success: true, 
      userId: result.lastInsertRowid,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return json({ message: 'Ce nom d\'utilisateur existe déjà' }, { status: 400 });
    }
    return json({ message: 'Erreur lors de la création de l\'utilisateur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { userId } = await request.json();
  
  // Empêcher de supprimer son propre compte
  if (userId === locals.session.userId) {
    return json({ message: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
  }

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    return json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
}