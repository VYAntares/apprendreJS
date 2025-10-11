<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let users = [];
  let showForm = false;
  let selectedUser = null;
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
</script>

<div class="header">
  <button on:click={goBack}>Retour au tableau de bord</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<h1>Gestion des utilisateurs</h1>

{#if message}
  <div class="message {messageType}">
    {message}
  </div>
{/if}

<button on:click={() => showForm = !showForm} class="btn-primary">
  {showForm ? 'Annuler' : '+ Créer un nouvel utilisateur'}
</button>

{#if showForm}
  <div class="form-container">
    <h2>Nouvel utilisateur</h2>
    <form on:submit|preventDefault={handleSubmit}>
      
      <h3>Informations de connexion</h3>
      
      <label for="username">Nom d'utilisateur *:</label>
      <input type="text" id="username" bind:value={newUser.username} required>
      
      <label for="password">Mot de passe *:</label>
      <input type="text" id="password" bind:value={newUser.password} required>
      
      <label for="role">Rôle *:</label>
      <select id="role" bind:value={newUser.role}>
        <option value="client">Client</option>
        <option value="admin">Admin</option>
      </select>

      <h3>Informations personnelles</h3>
      
      <label for="first_name">Prénom:</label>
      <input type="text" id="first_name" bind:value={newUser.first_name}>
      
      <label for="last_name">Nom:</label>
      <input type="text" id="last_name" bind:value={newUser.last_name}>
      
      <label for="email">Email:</label>
      <input type="email" id="email" bind:value={newUser.email}>
      
      <label for="phone">Téléphone:</label>
      <input type="tel" id="phone" bind:value={newUser.phone}>

      <h3>Adresse</h3>
      
      <label for="address_type">Type d'adresse:</label>
      <select id="address_type" bind:value={newUser.address_type}>
        <option value="shipping">Livraison</option>
        <option value="billing">Facturation</option>
        <option value="other">Autre</option>
      </select>
      
      <label for="address_label">Libellé:</label>
      <input type="text" id="address_label" bind:value={newUser.address_label}>
      
      <label for="street">Rue:</label>
      <input type="text" id="street" bind:value={newUser.street}>
      
      <label for="street_complement">Complément d'adresse:</label>
      <input type="text" id="street_complement" bind:value={newUser.street_complement}>
      
      <label for="city">Ville:</label>
      <input type="text" id="city" bind:value={newUser.city}>
      
      <label for="postal_code">Code postal:</label>
      <input type="text" id="postal_code" bind:value={newUser.postal_code}>
      
      <label for="state_province">État/Province:</label>
      <input type="text" id="state_province" bind:value={newUser.state_province}>
      
      <label for="country">Pays:</label>
      <input type="text" id="country" bind:value={newUser.country}>
      
      <div class="form-actions">
        <button type="submit" class="btn-success">Créer l'utilisateur</button>
        <button type="button" on:click={resetForm}>Annuler</button>
      </div>
    </form>
  </div>
{/if}

<h2>Liste des utilisateurs ({users.length})</h2>

<table>
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
        <td><span class="badge {user.role}">{user.role}</span></td>
        <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
        <td>
          <button on:click={() => viewUserDetails(user.id)} class="btn-info">Détails</button>
          <button on:click={() => deleteUser(user.id, user.username)} class="btn-danger">Supprimer</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if users.length === 0}
  <p>Aucun utilisateur trouvé</p>
{/if}

{#if selectedUser}
  <div class="details-container">
    <div class="details-header">
      <h2>Détails de l'utilisateur</h2>
      <button on:click={() => selectedUser = null}>Fermer</button>
    </div>
    
    <h3>Informations générales</h3>
    <p><strong>ID:</strong> {selectedUser.id}</p>
    <p><strong>Username:</strong> {selectedUser.username}</p>
    <p><strong>Rôle:</strong> {selectedUser.role}</p>
    <p><strong>Prénom:</strong> {selectedUser.first_name || '-'}</p>
    <p><strong>Nom:</strong> {selectedUser.last_name || '-'}</p>
    <p><strong>Email:</strong> {selectedUser.email || '-'}</p>
    <p><strong>Téléphone:</strong> {selectedUser.phone || '-'}</p>
    <p><strong>Créé le:</strong> {new Date(selectedUser.created_at).toLocaleString('fr-FR')}</p>
    
    <h3>Adresses ({selectedUser.addresses.length})</h3>
    {#if selectedUser.addresses.length > 0}
      {#each selectedUser.addresses as address}
        <div class="address-card">
          <p><strong>{address.label}</strong> ({address.address_type}) {#if address.is_default}<span class="default-badge">Par défaut</span>{/if}</p>
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
  </div>
{/if}

<style>
  .header {
    text-align: right;
    margin-bottom: 20px;
  }

  .message {
    padding: 10px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .message.success {
    background-color: #d4edda;
    color: #155724;
  }

  .message.error {
    background-color: #f8d7da;
    color: #721c24;
  }

  .form-container {
    border: 1px solid #ccc;
    padding: 20px;
    margin: 20px 0;
    background-color: #f9f9f9;
  }

  form {
    max-width: 600px;
  }

  label {
    display: block;
    margin-top: 10px;
    margin-bottom: 5px;
  }

  input, select {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }

  h3 {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .form-actions {
    margin-top: 20px;
  }

  button {
    padding: 8px 16px;
    margin-right: 10px;
    cursor: pointer;
    border: 1px solid #ccc;
    background-color: #fff;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  .btn-success {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
  }

  .btn-info {
    background-color: #17a2b8;
    color: white;
    border-color: #17a2b8;
    padding: 5px 10px;
    font-size: 14px;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
    padding: 5px 10px;
    font-size: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    font-size: 12px;
  }

  .badge.client {
    background-color: #17a2b8;
  }

  .badge.admin {
    background-color: #ffc107;
  }

  .details-container {
    border: 2px solid #007bff;
    padding: 20px;
    margin-top: 30px;
    background-color: #f0f8ff;
  }

  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .address-card {
    border: 1px solid #ddd;
    padding: 15px;
    margin: 10px 0;
    background-color: white;
  }

  .default-badge {
    background-color: #28a745;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
  }
</style>