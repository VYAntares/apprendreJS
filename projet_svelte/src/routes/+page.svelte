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

<main class="login-container">
  <form class="login-form" on:submit|preventDefault={handleSubmit} aria-label="formulaire de connexion">
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

    <label for="password">Mot de passe</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      placeholder="Votre mot de passe"
      required
      autocomplete="current-password"
    />

    <button type="submit" aria-label="Se connecter">Se connecter</button>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </form>
</main>

<style>
  /* Reset simple */
  * {
    box-sizing: border-box;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .login-form {
    background: white;
    padding: 2.5rem 3rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
  }

  .login-form h1 {
    margin-bottom: 2rem;
    font-weight: 700;
    color: #4b2cbf;
    text-align: center;
  }

  label {
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #4a4a4a;
  }

  input[type="text"],
  input[type="password"] {
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }

  input[type="text"]:focus,
  input[type="password"]:focus {
    outline: none;
    border-color: #4b2cbf;
    box-shadow: 0 0 8px rgba(75, 44, 191, 0.4);
  }

  button {
    background-color: #4b2cbf;
    color: white;
    padding: 0.85rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #392086;
  }

  .error {
    margin-top: 1rem;
    color: #d93025;
    font-weight: 600;
    text-align: center;
  }

  @media (max-width: 480px) {
    .login-form {
      padding: 2rem 1.5rem;
    }

    button {
      font-size: 1rem;
      padding: 0.75rem;
    }
  }
</style>
