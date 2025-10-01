<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let orderId = '';
  let clientName = '';
  let orderDate = '';
  let items = [];

  onMount(async () => {
    // Vérifier l'authentification
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    // Récupérer l'ID de la commande depuis l'URL
    orderId = $page.url.searchParams.get('id');
    
    if (!orderId) {
      goto('/admin');
      return;
    }

    // Charger les détails de la commande
    const res = await fetch(`/api/orders/${orderId}`);
    const order = await res.json();
    
    clientName = order.username;
    orderDate = new Date(order.created_at).toLocaleString('fr-FR');
    items = order.items;
  });

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }

  async function handleSubmit(event) {
    const formData = new FormData(event.target);
    const processedQuantities = {};
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('item_')) {
        const itemId = key.replace('item_', '');
        processedQuantities[itemId] = parseInt(value);
      }
    }
    
    const response = await fetch(`/api/orders/${orderId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processedQuantities })
    });
    
    if (response.ok) {
      alert('Commande traitée avec succès!');
      goto('/admin');
    } else {
      alert('Erreur lors du traitement de la commande');
    }
  }
</script>

<div style="text-align: right;">
  <button on:click={goBack}>Retour</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Traiter la commande #{orderId}</h1>

<p><strong>Client:</strong> {clientName}</p>
<p><strong>Date:</strong> {orderDate}</p>

<h2>Articles commandés</h2>

<form on:submit|preventDefault={handleSubmit}>
  <table border="1" cellpadding="10">
    <thead>
      <tr>
        <th>Article</th>
        <th>Quantité demandée</th>
        <th>Quantité traitée</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr>
          <td>{item.name}</td>
          <td>{item.quantity}</td>
          <td>
            <input 
              type="number" 
              name="item_{item.id}" 
              min="0" 
              max={item.quantity} 
              value={item.quantity} 
              style="width: 60px;"
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <br>
  <button type="submit">Valider le traitement</button>
</form>