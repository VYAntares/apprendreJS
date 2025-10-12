<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let username = '';
  let categories = [];
  let selectedCategory = null;
  let products = [];
  let cart = {};
  let message = '';

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'client') {
      goto('/');
    } else {
      username = dataSession.username;
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

  function updateCart(productId, quantity) {
    if (quantity > 0) {
      cart[productId] = quantity;
    } else {
      delete cart[productId];
    }
    cart = cart; // Réactivité Svelte
  }

  async function handleSubmit() {
  const items = Object.entries(cart).map(([product_id, quantity]) => ({
    product_id: parseInt(product_id),
    quantity
  }));
  
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
    const data = await response.json();
    
    // Afficher un message différent selon si la commande a été fusionnée ou non
    if (data.merged) {
      message = '✓ Commande fusionnée avec votre commande en attente! Les quantités ont été mises à jour.';
    } else {
      message = '✓ Commande envoyée avec succès!';
    }
    
    cart = {};
    
    // Recharger les produits pour mettre à jour le stock
    selectCategory(selectedCategory);
    
    setTimeout(() => {
      message = '';
    }, 5000);
  } else {
    const errorData = await response.json();
    alert(errorData.message || 'Erreur lors de l\'envoi de la commande');
  }
}

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function getTotalItems() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function getTotalPrice() {
    let total = 0;
    for (const [productId, quantity] of Object.entries(cart)) {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        total += product.price * quantity;
      }
    }
    return total.toFixed(2);
  }
</script>

<div>
  <div>
    <span>Bienvenue, {username}</span>
    <button on:click={handleLogout}>Déconnexion</button>
  </div>
  <div>
    {#if getTotalItems() > 0}
      <strong>Panier: {getTotalItems()} article{getTotalItems() > 1 ? 's' : ''} • CHF {getTotalPrice()}</strong>
    {/if}
  </div>
</div>

<hr>

<h1>Catalogue de produits</h1>

{#if message}
  <div>
    <strong>{message}</strong>
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
                  <th>Quantité</th>
                </tr>
              </thead>
              <tbody>
                {#each products as product}
                  <tr>
                    <td>
                      <img src={product.image_path} alt={product.name} width="100" height="100" />
                    </td>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.description}</td>
                    <td><strong>CHF {product.price.toFixed(2)}</strong></td>
                    <td>
                      <label for="qty_{product.id}">Quantité:</label>
                      <input 
                        type="number" 
                        id="qty_{product.id}"
                        min="0"
                        value={cart[product.id] || 0}
                        on:focus={(e) => { if(e.target.value === '0') e.target.value = ''; }} 
                        on:input={(e) => updateCart(product.id, parseInt(e.target.value) || 0)}
                        inputmode="numeric"
                        pattern="[0-9]*"
                        size="5"
                      />
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

<hr>

{#if getTotalItems() > 0}
  <div>
    <button on:click={handleSubmit}>
      Commander ({getTotalItems()}) article{getTotalItems() > 1 ? 's' : ''} • CHF {getTotalPrice()}
    </button>
  </div>
{/if}