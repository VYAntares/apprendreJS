<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let username = '';
  let products = [];
  let message = '';

  onMount(async () => {
    // Vérifier l'authentification
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'client') {
      goto('/');
    } else {
      username = dataSession.username;
    }

    // Charger les produits
    const resProducts = await fetch('/api/products');
    products = await resProducts.json();
  });

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  async function handleSubmit(event) {
    const formData = new FormData(event.target);
    const items = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('quantity_')) {
        const productId = key.replace('quantity_', '');
        const quantity = parseInt(value);
        if (quantity > 0) {
          items.push({ product_id: parseInt(productId), quantity });
        }
      }
    }
    
    if (items.length === 0) {
      alert('Veuillez sélectionner au moins un article');
      return;
    }
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    
    if (response.ok) {
      message = 'Commande envoyée avec succès!';
      event.target.reset();
      
      setTimeout(() => {
        message = '';
      }, 3000);
    } else {
      alert('Erreur lors de l\'envoi de la commande');
    }
  }
</script>

<div style="text-align: right;">
  <span>{username}</span>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Commander des articles</h1>

<form on:submit|preventDefault={handleSubmit}>
  <table border="1" cellpadding="10">
    <thead>
      <tr>
        <th>Article</th>
        <th>Description</th>
        <th>Quantité</th>
      </tr>
    </thead>
    <tbody>
      {#each products as product}
        <tr>
          <td>{product.name}</td>
          <td>{product.description}</td>
          <td>
            <input 
              type="number" 
              name="quantity_{product.id}" 
              min="0" 
              value="0" 
              style="width: 60px;"
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <br>
  <button type="submit">Order</button>
</form>

{#if message}
  <p style="color: green;">{message}</p>
{/if}