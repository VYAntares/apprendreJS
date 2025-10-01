<script>
  let username = '';
  let password = '';
  let error = '';

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(async () => {
    const res = await fetch('/api/check-session');
    const data = await res.json();
    
    if (data.authenticated) {
      if (data.role === 'client') {
        goto('/client');
      } else if (data.role === 'admin') {
        goto('/admin');
      }
    }
  });

  async function handleSubmit() {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.role === 'client') {
        goto('/client');
      } else if (data.role === 'admin') {
        goto('/admin');
      }
    } else {
      error = 'Identifiants incorrects';
    }
  }
</script>

<h1>Connexion</h1>
<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="username">Nom d'utilisateur:</label><br>
    <input type="text" id="username" bind:value={username} required>
  </div>
  <br>
  <div>
    <label for="password">Mot de passe:</label><br>
    <input type="password" id="password" bind:value={password} required>
  </div>
  <br>
  <button type="submit">Se connecter</button>
</form>
{#if error}
  <p style="color: red;">{error}</p>
{/if}