<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let categories = [];
  let selectedCategory = null;
  let products = [];
  let message = '';
  let messageType = '';

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    loadCategories();
  });

  async function loadCategories() {
    const res = await fetch('/api/categories');
    if (res.ok) {
      categories = await res.json();
      if (categories.length > 0) {
        selectCategory(categories[0].category);
      }
    }
  }

  async function selectCategory(category) {
    selectedCategory = category;
    const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
    if (res.ok) {
      products = await res.json();
    }
  }

  async function updateStock(productId, newStock) {
    const response = await fetch('/api/products/stock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, stock: newStock })
    });

    if (response.ok) {
      showMessage('Stock mis à jour avec succès', 'success');
      // Recharger les produits
      selectCategory(selectedCategory);
    } else {
      showMessage('Erreur lors de la mise à jour du stock', 'error');
    }
  }

  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 3000);
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }
</script>

<div>
  <button on:click={goBack}>← Retour au tableau de bord</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Gestion des stocks</h1>

{#if message}
  <div>
    <strong>{messageType === 'success' ? '✓' : '✗'} {message}</strong>
  </div>
{/if}

<table width="100%">
  <tbody>
    <tr>
      <td valign="top" width="200">
        <h2>Catégories</h2>
        <nav>
          {#each categories as cat}
            <div>
              <button 
                on:click={() => selectCategory(cat.category)}
                disabled={selectedCategory === cat.category}
              >
                {cat.category} ({cat.product_count})
              </button>
            </div>
          {/each}
        </nav>
      </td>
      
      <td valign="top">
        {#if selectedCategory}
          <h2>{selectedCategory}</h2>
          
          {#if products.length === 0}
            <p>Aucun produit dans cette catégorie</p>
          {:else}
            <table border="1" cellpadding="10" cellspacing="0" width="100%">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Produit</th>
                  <th>Description</th>
                  <th>Prix</th>
                  <th>Stock actuel</th>
                  <th>Nouveau stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {#each products as product}
                  <tr>
                    <td>
                      <img src={product.image_path} alt={product.name} width="80" height="80" />
                    </td>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.description}</td>
                    <td><strong>CHF {product.price.toFixed(2)}</strong></td>
                    <td>
                      <strong style="color: {product.stock > 0 ? 'green' : 'red'};">
                        {product.stock}
                      </strong>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        id="stock_{product.id}"
                        min="0"
                        value={product.stock}
                        on:focus={(e) => e.target.select()}
                        on:change={(e) => {
                          const newStock = parseInt(e.target.value) || 0;
                          updateStock(product.id, newStock);
                        }}
                        size="5"
                      />
                    </td>
                    <td>
                      <button on:click={() => updateStock(product.id, 0)}>
                        Remettre à 0
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        {/if}
      </td>
    </tr>
  </tbody>
</table>