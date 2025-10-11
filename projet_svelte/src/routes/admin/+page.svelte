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

<div class="header">
  <div class="user-logout">
    <span class="username">👤 {username}</span>
    <button class="btn-logout" on:click={handleLogout}>Logout</button>
  </div>
</div>

<h1>Panneau d'administration</h1>

<div class="actions">
  <button class="btn-action" on:click={goToUsers}>👥 Gérer les utilisateurs</button>
  <button class="btn-action" on:click={goToHistory}>📜 Voir l'historique des commandes</button>
</div>

<h2>Commandes en attente</h2>

{#if orders.length > 0}
  <div class="table-wrapper">
    <table class="orders-table" cellspacing="0" cellpadding="10">
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
            <td class="status">{order.status}</td>
            <td>
              <button class="btn-process" on:click={() => goToProcess(order.id)}>Traiter</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="no-orders">Aucune commande en attente</p>
{/if}

<style>
  /* Reset simple */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* Header user + logout */
  .header {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 2rem;
    background-color: #f0f2f5;
    border-bottom: 1px solid #ddd;
  }

  .user-logout {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .username {
    font-weight: 600;
    font-size: 1rem;
    color: #333;
  }

  .btn-logout {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.4rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }

  .btn-logout:hover {
    background-color: #b02a37;
  }

  /* Titles */
  h1 {
    text-align: center;
    margin: 2rem 0 1rem 0;
    font-weight: 700;
    color: #222;
  }

  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #444;
    font-weight: 600;
  }

  /* Action buttons container */
  .actions {
    text-align: center;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Action buttons */
  .btn-action {
    background-color: #007bff;
    border: none;
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }

  .btn-action:hover {
    background-color: #0056b3;
  }

  /* Table wrapper for responsive scroll */
  .table-wrapper {
    overflow-x: auto;
    margin: 0 1rem 2rem 1rem;
  }

  /* Table styles */
  .orders-table {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    font-family: Arial, sans-serif;
    font-size: 0.95rem;
  }

  thead {
    background-color: #007bff;
    color: white;
  }

  th, td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #ddd;
    text-align: left;
    white-space: nowrap;
  }

  tbody tr:nth-child(odd) {
    background-color: #f9f9f9;
  }

  tbody tr:hover {
    background-color: #e6f0ff;
  }

  .status {
    font-weight: 600;
    text-transform: capitalize;
  }

  /* Process button */
  .btn-process {
    background-color: #28a745;
    border: none;
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }

  .btn-process:hover {
    background-color: #1e7e34;
  }

  /* No orders message */
  .no-orders {
    text-align: center;
    font-style: italic;
    color: #666;
    margin-top: 2rem;
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    .header {
      justify-content: center;
      padding: 1rem;
    }

    .user-logout {
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    h1 {
      font-size: 1.5rem;
      margin: 1.5rem 1rem;
    }

    .actions {
      flex-direction: column;
      gap: 0.8rem;
      margin: 0 1rem 1.5rem 1rem;
    }

    .btn-action {
      width: 100%;
      font-size: 1.1rem;
      padding: 0.8rem;
    }

    .table-wrapper {
      margin: 0 0.5rem 1.5rem 0.5rem;
    }

    th, td {
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }

    tbody tr:hover {
      background-color: #d1e7fd;
    }

    .btn-process {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
  }
</style>
