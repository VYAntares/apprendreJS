<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let orders = [];

  onMount(async () => {
    // Vérifier l'authentification
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    // Charger l'historique
    const res = await fetch('/api/orders/history');
    orders = await res.json();
  });

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }
</script>

<div style="text-align: right;">
  <button on:click={goBack}>Retour aux commandes en attente</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Historique des commandes traitées</h1>

<table border="1" cellpadding="10">
  <thead>
    <tr>
      <th>ID</th>
      <th>Client</th>
      <th>Date de traitement</th>
      <th>Articles traités</th>
    </tr>
  </thead>
  <tbody>
    {#each orders as order}
      <tr>
        <td>{order.id}</td>
        <td>{order.username}</td>
        <td>{new Date(order.processed_at).toLocaleString('fr-FR')}</td>
        <td>
          {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if orders.length === 0}
  <p>Aucune commande traitée</p>
{/if}