import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  if (locals.session.userId) {
    return json({
      authenticated: true,
      role: locals.session.role,
      username: locals.session.username
    });
  } else {
    return json({ authenticated: false });
  }
}