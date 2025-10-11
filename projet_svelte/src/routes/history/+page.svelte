<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let orders = [];

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

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

<div class="header-actions">
  <button on:click={goBack} class="btn secondary">← Commandes en attente</button>
  <button on:click={handleLogout} class="btn danger">Déconnexion</button>
</div>

<main>
  <h1>Historique des commandes traitées</h1>

  {#if orders.length === 0}
    <p class="empty-msg">Aucune commande traitée</p>
  {:else}
    <table class="order-table">
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
  {/if}
</main>

<style>
  * {
    box-sizing: border-box;
  }

  main {
    max-width: 1000px;
    margin: 2rem auto;
    background: #ffffff;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  h1 {
    font-size: 2rem;
    color: #1e3a8a;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .header-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 2rem;
  }

  .btn {
    cursor: pointer;
    padding: 0.5rem 1.2rem;
    font-weight: 600;
    border-radius: 5px;
    border: none;
    font-size: 0.9rem;
    transition: background-color 0.3s ease;
  }

  .btn.secondary {
    background-color: #e0e7ff;
    color: #1e3a8a;
  }

  .btn.secondary:hover {
    background-color: #c7d2fe;
  }

  .btn.danger {
    background-color: #ef4444;
    color: white;
  }

  .btn.danger:hover {
    background-color: #b91c1c;
  }

  .order-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5rem;
  }

  .order-table th,
  .order-table td {
    text-align: left;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
  }

  .order-table thead {
    background-color: #1e3a8a;
    color: white;
  }

  .order-table tbody tr:nth-child(even) {
    background-color: #f9fafb;
  }

  .empty-msg {
    text-align: center;
    font-size: 1.1rem;
    color: #6b7280;
    padding: 2rem 0;
  }

  @media (max-width: 700px) {
    main {
      padding: 1rem;
      border-radius: 0;
    }

    .header-actions {
      flex-direction: column;
      align-items: flex-end;
      padding: 1rem;
    }

    .order-table,
    .order-table thead,
    .order-table tbody,
    .order-table th,
    .order-table td,
    .order-table tr {
      display: block;
      width: 100%;
    }

    .order-table thead {
      display: none;
    }

    .order-table tbody tr {
      margin-bottom: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      padding: 1rem;
    }

    .order-table tbody td {
      padding: 0.5rem 0;
      border: none;
      position: relative;
    }

    .order-table tbody td::before {
      content: attr(data-label);
      font-weight: bold;
      display: block;
      color: #1e3a8a;
      margin-bottom: 0.25rem;
    }
  }
</style>
