import { json } from '@sveltejs/kit';
import PendingDeliveryService from '$lib/server/pendingDeliveryService';

export async function GET({ params, locals }) {
  if (!locals.session.userId || locals.session.role !== 'admin') {
    return json({ message: 'Accès refusé' }, { status: 403 });
  }

  const userId = parseInt(params.id);

  try {
    const pendingDeliveries = PendingDeliveryService.getUserPendingDeliveries(userId);
    return json(pendingDeliveries);
  } catch (error) {
    console.error('Erreur:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
}