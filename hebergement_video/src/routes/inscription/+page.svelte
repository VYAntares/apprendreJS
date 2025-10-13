<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Récupérer le plan depuis l'URL (?plan=normal ou ?plan=premium)
  $: plan = $page.url.searchParams.get('plan') || 'normal';
  
  let formData = {
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'Suisse',
    telephone: '',
    plan: plan
  };
  
  let error = '';
  let loading = false;

  // Mettre à jour le plan dans formData quand il change
  $: formData.plan = plan;

  async function handleRegister() {
    error = '';
    
    if (formData.password !== formData.confirmPassword) {
      error = 'Les mots de passe ne correspondent pas';
      return;
    }
    
    if (formData.password.length < 8) {
      error = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.checkoutUrl;
      } else {
        error = data.error || 'Erreur lors de l\'inscription';
      }
    } catch (e) {
      error = 'Erreur réseau';
    } finally {
      loading = false;
    }
  }
</script>

<div style="max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <a href="/inscription/choix-plan" style="color: #6366f1; text-decoration: none;">← Changer de plan</a>
  
  <h1>Créer un compte</h1>
  <p>Plan sélectionné : <strong>{plan === 'premium' ? '⭐ Premium (19 CHF/mois)' : '🎹 Normal (12 CHF/mois)'}</strong></p>

  <form on:submit|preventDefault={handleRegister}>
    
    <h3 style="margin-top: 30px; margin-bottom: 15px;">Informations personnelles</h3>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label for="prenom">Prénom *</label><br>
        <input
          id="prenom"
          type="text"
          bind:value={formData.prenom}
          required
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
      
      <div>
        <label for="nom">Nom *</label><br>
        <input
          id="nom"
          type="text"
          bind:value={formData.nom}
          required
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
    </div>

    <div style="margin-bottom: 15px;">
      <label for="email">Email *</label><br>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        required
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>

    <div style="margin-bottom: 15px;">
      <label for="adresse">Adresse *</label><br>
      <input
        id="adresse"
        type="text"
        bind:value={formData.adresse}
        required
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label for="codePostal">Code postal *</label><br>
        <input
          id="codePostal"
          type="text"
          bind:value={formData.codePostal}
          required
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
      
      <div>
        <label for="ville">Ville *</label><br>
        <input
          id="ville"
          type="text"
          bind:value={formData.ville}
          required
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label for="pays">Pays *</label><br>
        <input
          id="pays"
          type="text"
          bind:value={formData.pays}
          required
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
      
      <div>
        <label for="telephone">Téléphone</label><br>
        <input
          id="telephone"
          type="tel"
          bind:value={formData.telephone}
          style="width: 100%; padding: 8px; margin-top: 5px;"
        />
      </div>
    </div>

    <h3 style="margin-top: 30px; margin-bottom: 15px;">Mot de passe</h3>
    
    <div style="margin-bottom: 15px;">
      <label for="password">Mot de passe * (minimum 8 caractères)</label><br>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        required
        minlength="8"
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>

    <div style="margin-bottom: 15px;">
      <label for="confirmPassword">Confirmer le mot de passe *</label><br>
      <input
        id="confirmPassword"
        type="password"
        bind:value={formData.confirmPassword}
        required
        style="width: 100%; padding: 8px; margin-top: 5px;"
      />
    </div>

    {#if error}
      <div style="background: #fee; color: #c00; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
        {error}
      </div>
    {/if}

    <div style="background: #f0f0f0; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        💳 En continuant, vous serez redirigé vers Stripe pour finaliser votre abonnement
      </p>
    </div>

    <button
      type="submit"
      disabled={loading}
      style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
    >
      {loading ? 'Traitement...' : 'Continuer vers le paiement'}
    </button>
  </form>
</div>