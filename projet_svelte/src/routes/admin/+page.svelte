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
  goto(`/admin/process?id=${orderId}`);  // Au lieu de /process
  }

  function goToHistory() {
    goto('/admin/history');  // Au lieu de /history
  }

  function goToUsers() {
    goto('/admin/users');
  }

  function goToStock() {
    goto('/admin/stock');
  }
</script>

<div>
  <div>
    <span>👤 {username}</span>
    <button on:click={handleLogout}>Logout</button>
  </div>
</div>

<h1>Panneau d'administration</h1>

<div>
  <button on:click={goToUsers}>👥 Gérer les utilisateurs</button>
  <button on:click={goToStock}>📦 Gérer les stocks</button>
  <button on:click={goToHistory}>📜 Voir l'historique des commandes</button>
</div>

<h2>Commandes en attente</h2>

{#if orders.length > 0}
  <div>
    <table border="1" cellspacing="0" cellpadding="10">
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
  </div>
{:else}
  <p>Aucune commande en attente</p>
{/if}