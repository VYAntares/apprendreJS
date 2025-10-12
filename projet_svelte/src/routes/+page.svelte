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
        goto('/catalog');
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
        goto('/catalog');
      } else if (data.role === 'admin') {
        goto('/admin');
      }
    } else {
      error = 'Identifiants incorrects';
    }
  }
</script>

<main>
  <form on:submit|preventDefault={handleSubmit} aria-label="formulaire de connexion">
    <h1>Connexion</h1>

    <label for="username">Nom d'utilisateur</label>
    <input
      id="username"
      type="text"
      bind:value={username}
      placeholder="Votre nom d'utilisateur"
      required
      autocomplete="username"
    />
    <br><br>

    <label for="password">Mot de passe</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      placeholder="Votre mot de passe"
      required
      autocomplete="current-password"
    />
    <br><br>

    <button type="submit" aria-label="Se connecter">Se connecter</button>

    {#if error}
      <p><strong>{error}</strong></p>
    {/if}
  </form>
</main>