<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let username = '';
  let orders = [];

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    username = dataSession.username;
    loadOrders();
  });

  async function loadOrders() {
    const res = await fetch('/api/orders/pending');
    orders = await res.json();
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goToProcess(orderId) {
    goto(`/process?id=${orderId}`);
  }

  function goToHistory() {
    goto('/history');
  }

  function goToUsers() {
    goto('/admin/users');
  }
</script>

<div style="text-align: right;">
  <span>{username}</span>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Panneau d'administration</h1>

<div style="margin: 20px 0;">
  <button on:click={goToUsers} style="margin-right: 10px;">
    👥 Gérer les utilisateurs
  </button>
  <button on:click={goToHistory}>
    📜 Voir l'historique des commandes
  </button>
</div>

<h2>Commandes en attente</h2>

<table border="1" cellpadding="10">
  <thead>
    <tr>
      <th>ID</th>
      <th>Client</th>
      <th>Date de création</th>
      <th>Statut</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {#each orders as order}
      <tr>
        <td>{order.id}</td>
        <td>{order.username}</td>
        <td>{new Date(order.created_at).toLocaleString('fr-FR')}</td>
        <td>{order.status}</td>
        <td>
          <button on:click={() => goToProcess(order.id)}>Traiter</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if orders.length === 0}
  <p>Aucune commande en attente</p>
{/if}