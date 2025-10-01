import db from '$lib/server/db';

// Store simple en mémoire pour les sessions (comme express-session)
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function handle({ event, resolve }) {
  // Récupérer le cookie de session
  const sessionId = event.cookies.get('sessionId');
  
  // Charger la session existante ou créer une nouvelle
  if (sessionId && sessions.has(sessionId)) {
    event.locals.session = sessions.get(sessionId);
  } else {
    event.locals.session = {};
  }
  
  // Fonction helper pour sauvegarder la session
  event.locals.saveSession = () => {
    let sid = sessionId;
    if (!sid) {
      sid = generateSessionId();
      event.cookies.set('sessionId', sid, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 // 24 heures
      });
    }
    sessions.set(sid, event.locals.session);
  };
  
  // Fonction helper pour détruire la session
  event.locals.destroySession = () => {
    if (sessionId) {
      sessions.delete(sessionId);
      event.cookies.delete('sessionId', { path: '/' });
    }
  };
  
  const response = await resolve(event);
  return response;
}