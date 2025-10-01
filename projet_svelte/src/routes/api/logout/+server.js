import { json } from '@sveltejs/kit';

export async function POST({ locals }) {
  locals.destroySession();
  return json({ success: true });
}