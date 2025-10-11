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
      message = 'Commande envoyée avec succès!';
      cart = {};
      
      setTimeout(() => {
        message = '';
      }, 3000);
    } else {
      alert('Erreur lors de l\'envoi de la commande');
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

<div class="header">
  <div class="user-info">
    <span>Bienvenue, {username}</span>
    <button on:click={handleLogout} class="btn-logout">Déconnexion</button>
  </div>
  <div class="cart-summary">
    {#if getTotalItems() > 0}
      <span class="cart-badge">{getTotalItems()} article{getTotalItems() > 1 ? 's' : ''} • CHF {getTotalPrice()}</span>
    {/if}
  </div>
</div>

<h1>Catalogue de produits</h1>

{#if message}
  <div class="success-message">{message}</div>
{/if}

<div class="container">
  <aside class="sidebar">
    <h2>Catégories</h2>
    <nav class="categories">
      {#each categories as cat}
        <button 
          class="category-btn" 
          class:active={selectedCategory === cat.category}
          on:click={() => selectCategory(cat.category)}
        >
          {cat.category}
          <span class="count">({cat.product_count})</span>
        </button>
      {/each}
    </nav>
  </aside>

  <main class="main-content">
    {#if selectedCategory}
      <h2>{selectedCategory}</h2>
      
      <div class="products-grid">
        {#each products as product}
          <div class="product-card">
            <div class="product-image">
              <img src={product.image_path} alt={product.name} />
            </div>
            <div class="product-info">
              <h3>{product.name}</h3>
              <p class="description">{product.description}</p>
              <div class="product-footer">
                <span class="price">CHF {product.price.toFixed(2)}</span>
                <div class="stock">
                  {#if product.stock > 0}
                    <span class="in-stock">En stock: {product.stock}</span>
                  {:else}
                    <span class="out-of-stock">Rupture de stock</span>
                  {/if}
                </div>
              </div>
              <div class="quantity-control">
                <label for="qty_{product.id}">Quantité:</label>
                <input 
                  type="number" 
                  id="qty_{product.id}"
                  min="0" 
                  max={product.stock}
                  value={cart[product.id] || 0}
                  on:focus={(e) => { if(e.target.value === '0') e.target.value = ''; }} 
                  on:input={(e) => updateCart(product.id, parseInt(e.target.value))}
                  disabled={product.stock === 0}
                  inputmode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if products.length === 0}
        <p>Aucun produit dans cette catégorie</p>
      {/if}
    {/if}
  </main>
</div>

{#if getTotalItems() > 0}
  <div class="cart-footer">
    <button on:click={handleSubmit} class="btn-order">
      Commander ({getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}) • CHF {getTotalPrice()}
    </button>
  </div>
{/if}

<style>

  :global(body) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Helvetica, Arial, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .btn-logout {
    padding: 0.5rem 1rem;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cart-summary {
    font-weight: bold;
  }

  .cart-badge {
    background-color: #28a745;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
  }

  h1 {
    text-align: center;
    margin: 2rem 0;
  }

  .success-message {
    background-color: #d4edda;
    color: #155724;
    padding: 1rem;
    margin: 1rem;
    border-radius: 4px;
    text-align: center;
  }

  .container {
    display: flex;
    gap: 2rem;
    padding: 0 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .sidebar {
    width: 250px;
    flex-shrink: 0;
  }

  .sidebar h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .categories {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.75rem 1rem;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .category-btn:hover {
    background-color: #f8f9fa;
  }

  .category-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  .count {
    float: right;
    opacity: 0.7;
  }

  .main-content {
    flex: 1;
  }

  .main-content h2 {
    margin-bottom: 1.5rem;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .product-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .product-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .product-image {
    width: 100%;
    height: 200px;
    background-color: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .product-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .product-info {
    padding: 1rem;
  }

  .product-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .description {
    color: #6c757d;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
  }

  .product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .price {
    font-size: 1.3rem;
    font-weight: bold;
    color: #28a745;
  }

  .stock {
    font-size: 0.85rem;
  }

  .in-stock {
    color: #28a745;
  }

  .out-of-stock {
    color: #dc3545;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-control label {
    font-size: 0.9rem;
  }

  .quantity-control input {
    width: 70px;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 16px;
  }

  .cart-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    border-top: 2px solid #dee2e6;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  }

  .btn-order {
    padding: 1rem 2rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
  }

  .btn-order:hover {
    background-color: #218838;
  }

  @media (max-width: 768px) {
  .container {
    flex-direction: column;
    padding: 0 1rem;
  }

  .sidebar {
    width: 100%;
  }

  .category-btn {
    width: 100%;
  }

  .main-content {
    width: 100%;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .user-info,
  .cart-summary {
    width: 100%;
    justify-content: space-between;
  }

  .cart-footer {
    padding: 0.75rem;
  }

  .btn-order {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
  }

  .product-card {
    border-radius: 6px;
  }

  .product-info {
    padding: 0.75rem;
  }

  .product-image {
    height: 160px;
  }

  .quantity-control input {
    width: 60px;
  } 
}

</style>