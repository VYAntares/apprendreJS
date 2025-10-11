<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let orderId = '';
  let clientName = '';
  let orderDate = '';
  let items = [];

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    orderId = $page.url.searchParams.get('id');
    
    if (!orderId) {
      goto('/admin');
      return;
    }

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

<div class="header-actions">
  <button on:click={goBack} class="btn secondary">← Retour</button>
  <button on:click={handleLogout} class="btn danger">Logout</button>
</div>

<main>
  <h1>Traiter la commande #{orderId}</h1>

  <section class="order-info">
    <p><strong>Client :</strong> {clientName}</p>
    <p><strong>Date :</strong> {orderDate}</p>
  </section>

  <section class="order-items">
    <h2>Articles commandés</h2>

    <form on:submit|preventDefault={handleSubmit} class="order-form">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Article</th>
            <th>Quantité demandée</th>
            <th>Quantité traitée</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item}
            <tr>
              <td data-label="Image" class="product-image-cell">
                {#if item.image_path}
                  <img src={item.image_path} alt={item.name} class="product-image" />
                {:else}
                  <span class="no-image">—</span>
                {/if}
              </td>
              <td data-label="Article">{item.name}</td>
              <td data-label="Demandée">{item.quantity}</td>
              <td data-label="Traitée">
                <input 
                  type="number" 
                  name="item_{item.id}" 
                  min="0" 
                  max={item.quantity} 
                  value={item.quantity}
                  aria-label={`Quantité traitée pour ${item.name}`}
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <button type="submit" class="btn primary submit-btn">Valider le traitement</button>
    </form>
  </section>
</main>

<style>
  * {
    box-sizing: border-box;
  }

  main {
    max-width: 900px;
    margin: 1.5rem auto 3rem;
    background: #fff;
    padding: 1.5rem 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
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
    transition: background-color 0.3s ease;
    font-size: 0.9rem;
  }

  .btn.primary {
    background-color: #2563eb;
    color: white;
  }

  .btn.primary:hover {
    background-color: #1d4ed8;
  }

  .btn.secondary {
    background-color: #e0e7ff;
    color: #3730a3;
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

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #111827;
  }

  .order-info p {
    font-size: 1.1rem;
    margin: 0.3rem 0;
  }

  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #1e40af;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 0.3rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
  }

  thead {
    background-color: #2563eb;
    color: white;
  }

  th, td {
    text-align: left;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
  }

  tbody tr:nth-child(even) {
    background-color: #f3f4f6;
  }

  input[type="number"] {
    width: 70px;
    padding: 0.3rem 0.5rem;
    font-size: 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    text-align: center;
    transition: border-color 0.2s ease;
  }

  input[type="number"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 4px #2563eb;
  }

  .submit-btn {
    display: block;
    margin: 0 auto;
    font-size: 1.1rem;
    padding: 0.75rem 2rem;
    border-radius: 6px;
  }

  .product-image-cell {
    width: 70px;
    text-align: center;
  }

  .product-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .no-image {
    color: #aaa;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 700px) {
    main {
      padding: 1rem 1rem 2rem;
      margin: 1rem 0 2rem;
      border-radius: 0;
      box-shadow: none;
    }

    .header-actions {
      padding: 0.5rem 1rem;
      flex-direction: column;
      align-items: flex-end;
    }

    table, thead, tbody, th, td, tr {
      display: block;
      width: 100%;
    }

    thead tr {
      display: none;
    }

    tbody tr {
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.75rem;
      background-color: #fff;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    }

    tbody tr td {
      padding: 0.5rem 0.25rem;
      border: none;
      position: relative;
      padding-left: 50%;
      text-align: left;
      font-size: 0.95rem;
    }

    tbody tr td::before {
      content: attr(data-label);
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-weight: 700;
      color: #2563eb;
      white-space: nowrap;
      font-size: 0.85rem;
    }

    input[type="number"] {
      width: 100%;
      padding: 0.4rem;
      font-size: 1rem;
    }

    .product-image-cell {
      padding-left: 0;
      text-align: center;
    }

    .product-image {
      width: 60px;
      height: 60px;
      margin: 0 auto;
    }

    tbody tr td[data-label="Image"]::before {
      display: none;
    }

    .submit-btn {
      width: 100%;
      font-size: 1rem;
      margin-top: 1rem;
    }
  }
</style>
