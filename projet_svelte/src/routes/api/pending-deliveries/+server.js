import { json } from '@sveltejs/kit';
import PendingDeliveryService from '$lib/server/pendingDeliveryService';

export async function GET({ locals }) {
  if (!locals.session.userId) {
    return json({ message: 'Non authentifié' }, { status: 401 });
  }

  try {
    const pendingDeliveries = PendingDeliveryService.getUserPendingDeliveries(locals.session.userId);
    return json(pendingDeliveries);
  } catch (error) {
    console.error('Erreur récupération pending:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE({ request, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const { userId, productId } = await request.json();

  try {
    PendingDeliveryService.deletePending(userId, productId);
    return json({ success: true });
  } catch (error) {
    console.error('Erreur suppression pending:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
}