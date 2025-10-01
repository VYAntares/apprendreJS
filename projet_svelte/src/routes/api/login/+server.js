import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export async function POST({ request, locals }) {
  const { username, password } = await request.json();
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    locals.session.userId = user.id;
    locals.session.username = user.username;
    locals.session.role = user.role;
    locals.saveSession();
    
    return json({ success: true, role: user.role });
  } else {
    return json({ success: false, message: 'Identifiants incorrects' }, { status: 401 });
  }
}