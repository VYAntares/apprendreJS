<script>
  import { goto } from '$app/navigation';
  export let data;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/');
  }

  function slugify(nom) {
    return nom.toLowerCase().replace(/\s+/g, '-');
  }
</script>

<div style="min-height: 100vh; background: #f5f5f5;">
  <!-- Header -->
  <header style="background: white; border-bottom: 1px solid #ddd; padding: 20px; position: sticky; top: 0; z-index: 100;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <h1 style="margin: 0; font-size: 24px;">🎹 Piano Jazz Academy</h1>

      <div style="display: flex; align-items: center; gap: 20px;">
        {#if data?.user}
          <span style="font-size: 14px; color: #666;">
            {data.user.prenom} {data.user.nom}
            {#if data?.subscription?.plan === 'premium'}
              <span style="background: #6366f1; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">⭐ Premium</span>
            {/if}
          </span>
        {/if}
        <button
          on:click={logout}
          style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px;"
        >
          Déconnexion
        </button>
      </div>
    </div>
  </header>

  <!-- Contenu principal -->
  <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
    <h2 style="font-size: 32px; margin-bottom: 10px;">Choisissez une catégorie</h2>
    <p style="color: #666; margin-bottom: 40px;">Sélectionnez votre niveau ou explorez le répertoire jazz</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
      {#each data?.categories || [] as categorie}
        <a
          href={`/catalogue/${slugify(categorie.nom)}`}
          class="categorie-card-link"
        >
          <div class="categorie-card">
            <div style="font-size: 48px; margin-bottom: 16px;">
              {#if categorie.nom === 'Débutant'}
                🌱
              {:else if categorie.nom === 'Intermédiaire'}
                🎼
              {:else if categorie.nom === 'Expert'}
                🏆
              {:else if categorie.nom === 'Répertoire Jazz'}
                🎺
              {/if}
            </div>
            <h3 style="font-size: 24px; margin: 0 0 8px 0; color: #111;">{categorie.nom}</h3>
            <p style="font-size: 14px; color: #666; margin: 0;">{categorie.description}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  .categorie-card-link {
    text-decoration: none;
    display: block;
  }

  .categorie-card {
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .categorie-card:hover,
  .categorie-card-link:focus .categorie-card {
    border-color: #6366f1;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .categorie-card-link:focus {
    outline: none;
  }
</style>
