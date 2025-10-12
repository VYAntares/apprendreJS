<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let users = [];
  let showForm = false;
  let selectedUser = null;
  let userOrders = [];
  let userPendingDeliveries = [];
  let selectedOrder = null;
  let newUser = {
    username: '',
    password: '',
    role: 'client',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_type: 'shipping',
    address_label: 'Principale',
    street: '',
    street_complement: '',
    city: '',
    postal_code: '',
    state_province: '',
    country: 'Suisse'
  };
  let message = '';
  let messageType = '';

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    loadUsers();
  });

  async function loadUsers() {
    const res = await fetch('/api/users');
    if (res.ok) {
      users = await res.json();
    }
  }

  async function handleSubmit() {
    if (newUser.username.length < 3) {
      showMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères', 'error');
      return;
    }

    if (newUser.password.length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Utilisateur créé avec succès !', 'success');
      resetForm();
      loadUsers();
    } else {
      showMessage(data.message || 'Erreur lors de la création', 'error');
    }
  }

  async function viewUserDetails(userId) {
    const res = await fetch(`/api/users/${userId}`);
    if (res.ok) {
      selectedUser = await res.json();
      selectedOrder = null;
      await loadUserOrders(userId);
      await loadUserPendingDeliveries(userId);
    }
  }

  async function loadUserOrders(userId) {
    const res = await fetch(`/api/users/${userId}/orders`);
    if (res.ok) {
      userOrders = await res.json();
    } else {
      userOrders = [];
    }
  }

  async function loadUserPendingDeliveries(userId) {
    const res = await fetch(`/api/users/${userId}/pending-deliveries`);
    if (res.ok) {
      userPendingDeliveries = await res.json();
    } else {
      userPendingDeliveries = [];
    }
  }

  async function viewOrderDetails(orderId) {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const orderData = await res.json();
      const itemsByCategory = groupItemsByCategory(orderData.items);
      selectedOrder = { ...orderData, itemsByCategory };
    }
  }

  function groupItemsByCategory(items) {
    const grouped = {};
    items.forEach(item => {
      const category = item.name.split(' ')[0];
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }

  function getCategoryTotal(items) {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }

  function closeOrderDetails() {
    selectedOrder = null;
  }

  async function deletePendingDelivery(userId, productId) {
    if (!confirm('Supprimer cet article en attente de livraison ?')) return;
    
    const response = await fetch('/api/pending-deliveries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId })
    });

    if (response.ok) {
      showMessage('Article en attente supprimé', 'success');
      loadUserPendingDeliveries(userId);
    } else {
      showMessage('Erreur lors de la suppression', 'error');
    }
  }

  async function deleteUser(userId, username) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" et toutes ses données ?`)) {
      return;
    }

    const response = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Utilisateur supprimé avec succès !', 'success');
      selectedUser = null;
      userOrders = [];
      userPendingDeliveries = [];
      selectedOrder = null;
      loadUsers();
    } else {
      showMessage(data.message || 'Erreur lors de la suppression', 'error');
    }
  }

  function resetForm() {
    newUser = {
      username: '',
      password: '',
      role: 'client',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address_type: 'shipping',
      address_label: 'Principale',
      street: '',
      street_complement: '',
      city: '',
      postal_code: '',
      state_province: '',
      country: 'Suisse'
    };
    showForm = false;
  }

  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 4000);
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }

  function closeDetails() {
    selectedUser = null;
    userOrders = [];
    userPendingDeliveries = [];
    selectedOrder = null;
  }
</script>

<div>
  <button on:click={goBack}>Retour au tableau de bord</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Gestion des utilisateurs</h1>

{#if message}
  <div>
    <strong>{messageType === 'success' ? 'Succès' : 'Erreur'}:</strong> {message}
  </div>
{/if}

<button on:click={() => showForm = !showForm}>
  {showForm ? 'Annuler' : '+ Créer un nouvel utilisateur'}
</button>

{#if showForm}
  <div>
    <h2>Nouvel utilisateur</h2>
    <form on:submit|preventDefault={handleSubmit}>
      
      <h3>Informations de connexion</h3>
      
      <label for="username">Nom d'utilisateur *:</label>
      <input type="text" id="username" bind:value={newUser.username} required>
      <br><br>
      
      <label for="password">Mot de passe *:</label>
      <input type="text" id="password" bind:value={newUser.password} required>
      <br><br>
      
      <label for="role">Rôle *:</label>
      <select id="role" bind:value={newUser.role}>
        <option value="client">Client</option>
        <option value="admin">Admin</option>
      </select>
      <br><br>

      <h3>Informations personnelles</h3>
      
      <label for="first_name">Prénom:</label>
      <input type="text" id="first_name" bind:value={newUser.first_name}>
      <br><br>
      
      <label for="last_name">Nom:</label>
      <input type="text" id="last_name" bind:value={newUser.last_name}>
      <br><br>
      
      <label for="email">Email:</label>
      <input type="email" id="email" bind:value={newUser.email}>
      <br><br>
      
      <label for="phone">Téléphone:</label>
      <input type="tel" id="phone" bind:value={newUser.phone}>
      <br><br>

      <h3>Adresse</h3>
      
      <label for="address_type">Type d'adresse:</label>
      <select id="address_type" bind:value={newUser.address_type}>
        <option value="shipping">Livraison</option>
        <option value="billing">Facturation</option>
        <option value="other">Autre</option>
      </select>
      <br><br>
      
      <label for="address_label">Libellé:</label>
      <input type="text" id="address_label" bind:value={newUser.address_label}>
      <br><br>
      
      <label for="street">Rue:</label>
      <input type="text" id="street" bind:value={newUser.street}>
      <br><br>
      
      <label for="street_complement">Complément d'adresse:</label>
      <input type="text" id="street_complement" bind:value={newUser.street_complement}>
      <br><br>
      
      <label for="city">Ville:</label>
      <input type="text" id="city" bind:value={newUser.city}>
      <br><br>
      
      <label for="postal_code">Code postal:</label>
      <input type="text" id="postal_code" bind:value={newUser.postal_code}>
      <br><br>
      
      <label for="state_province">État/Province:</label>
      <input type="text" id="state_province" bind:value={newUser.state_province}>
      <br><br>
      
      <label for="country">Pays:</label>
      <input type="text" id="country" bind:value={newUser.country}>
      <br><br>
      
      <div>
        <button type="submit">Créer l'utilisateur</button>
        <button type="button" on:click={resetForm}>Annuler</button>
      </div>
    </form>
  </div>
{/if}

<h2>Liste des utilisateurs ({users.length})</h2>

<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>ID</th>
      <th>Username</th>
      <th>Nom complet</th>
      <th>Rôle</th>
      <th>Date création</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each users as user}
      <tr>
        <td>{user.id}</td>
        <td>{user.username}</td>
        <td>{user.first_name || ''} {user.last_name || ''}</td>
        <td>{user.role}</td>
        <td>{formatDate(user.created_at)}</td>
        <td>
          <button on:click={() => viewUserDetails(user.id)}>Détails</button>
          <button on:click={() => deleteUser(user.id, user.username)}>Supprimer</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if users.length === 0}
  <p>Aucun utilisateur trouvé</p>
{/if}

{#if selectedOrder}
  <!-- Détails de la commande -->
  <hr>
  <div style="border: 2px solid #007bff; padding: 20px; margin: 20px 0; background-color: #f0f8ff;">
    <div>
      <h2>Détails de la commande #{selectedOrder.id}</h2>
      <button on:click={closeOrderDetails}>Fermer</button>
    </div>
    
    <h3>Informations générales</h3>
    <p><strong>Client:</strong> {selectedOrder.username}</p>
    <p><strong>Date de création:</strong> {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('fr-FR') : '-'}</p>
    <p><strong>Date de traitement:</strong> {selectedOrder.processed_at ? new Date(selectedOrder.processed_at).toLocaleString('fr-FR') : '-'}</p>
    <p><strong>Statut:</strong> {selectedOrder.status}</p>
    
    <h3>Articles commandés par catégorie</h3>
    
    {#each Object.entries(selectedOrder.itemsByCategory) as [category, items]}
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; background-color: white;">
        <h4>{category}</h4>
        <table border="1" cellpadding="5" cellspacing="0" width="100%">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item}
              <tr>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>CHF {item.unit_price.toFixed(2)}</td>
                <td><strong>CHF {(item.quantity * item.unit_price).toFixed(2)}</strong></td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0;">
              <td colspan="3" style="text-align: right;"><strong>Total {category}:</strong></td>
              <td><strong>CHF {getCategoryTotal(items).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    {/each}
    
    <hr>
    <p style="font-size: 1.2em;">
      <strong>TOTAL GÉNÉRAL: CHF {selectedOrder.total_amount.toFixed(2)}</strong>
    </p>
    
    <div style="margin-top: 20px;">
      <button 
        style="padding: 10px 20px; font-size: 1.1em;"
        on:click={() => window.open(`/api/invoice/${selectedOrder.id}`, '_blank')}
      >
        📄 Générer la facture
      </button>
    </div>
  </div>
{:else if selectedUser}
  <hr>
  <div>
    <h2>Détails de l'utilisateur</h2>
    <button on:click={closeDetails}>Fermer</button>
    
    <h3>Informations générales</h3>
    <p><strong>ID:</strong> {selectedUser.id}</p>
    <p><strong>Username:</strong> {selectedUser.username}</p>
    <p><strong>Rôle:</strong> {selectedUser.role}</p>
    <p><strong>Prénom:</strong> {selectedUser.first_name || '-'}</p>
    <p><strong>Nom:</strong> {selectedUser.last_name || '-'}</p>
    <p><strong>Email:</strong> {selectedUser.email || '-'}</p>
    <p><strong>Téléphone:</strong> {selectedUser.phone || '-'}</p>
    <p><strong>Créé le:</strong> {formatDate(selectedUser.created_at)}</p>
    
    <h3>Adresses ({selectedUser.addresses.length})</h3>
    {#if selectedUser.addresses.length > 0}
      {#each selectedUser.addresses as address}
        <div>
          <hr>
          <p><strong>{address.label}</strong> ({address.address_type}) {#if address.is_default}(Par défaut){/if}</p>
          <p>{address.street}</p>
          {#if address.street_complement}<p>{address.street_complement}</p>{/if}
          <p>{address.postal_code} {address.city}</p>
          {#if address.state_province}<p>{address.state_province}</p>{/if}
          <p>{address.country}</p>
        </div>
      {/each}
    {:else}
      <p>Aucune adresse enregistrée</p>
    {/if}

    <h3>Articles en attente de livraison ({userPendingDeliveries.length})</h3>
    {#if userPendingDeliveries.length > 0}
      <table border="1" cellpadding="5" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Quantité en attente</th>
            <th>Prix unitaire</th>
            <th>Date de création</th>
            <th>Dernière mise à jour</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each userPendingDeliveries as pending}
            <tr>
              <td>{pending.product_name}</td>
              <td><strong style="color: orange;">{pending.quantity}</strong></td>
              <td>CHF {pending.unit_price.toFixed(2)}</td>
              <td>{formatDate(pending.created_at)}</td>
              <td>{formatDate(pending.updated_at)}</td>
              <td>
                <button on:click={() => deletePendingDelivery(pending.user_id, pending.product_id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p>
        <strong>Total articles en attente: {userPendingDeliveries.reduce((sum, p) => sum + p.quantity, 0)}</strong>
      </p>
    {:else}
      <p>Aucun article en attente de livraison</p>
    {/if}

    <h3>Historique des commandes ({userOrders.length})</h3>
    {#if userOrders.length > 0}
      <table border="1" cellpadding="5" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Montant total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each userOrders as order}
            <tr>
              <td>{order.id}</td>
              <td>{formatDate(order.created_at)}</td>
              <td>{order.status}</td>
              <td><strong>CHF {order.total_amount.toFixed(2)}</strong></td>
              <td>
                <button on:click={() => viewOrderDetails(order.id)}>Voir détails</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p>
        <strong>Total des commandes: CHF {userOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}</strong>
      </p>
    {:else}
      <p>Aucune commande passée</p>
    {/if}
  </div>
{/if}