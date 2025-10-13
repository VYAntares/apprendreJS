<script>
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        goto('/catalogue');
      } else {
        error = data.error || 'Erreur de connexion';
      }
    } catch (e) {
      error = 'Erreur réseau';
    } finally {
      loading = false;
    }
  }
</script>

<div style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <h1>🎹 Piano Jazz Academy</h1>
  <p>Apprenez le piano jazz - 12 CHF/mois</p>
  
  <form on:submit|preventDefault={handleLogin}>
    <div style="margin-bottom: 15px;">
      <label for="email">Email</label><br>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>
    
    <div style="margin-bottom: 15px;">
      <label for="password">Mot de passe</label><br>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>

    {#if error}
      <div style="background: #fee; color: #c00; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
        {error}
      </div>
    {/if}

    <button
      type="submit"
      disabled={loading}
      style="width: 100%; padding: 10px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      {loading ? 'Connexion...' : 'Se connecter'}
    </button>
  </form>

  <p style="text-align: center; margin-top: 20px;">
    <a href="/inscription/choix-plan" style="color: #6366f1;">Créer un compte</a>
  </p>
</div>