<script>
  import { goto } from '$app/navigation';
  
  function selectPlan(plan) {
    goto(`/inscription?plan=${plan}`);
  }
</script>

<div style="max-width: 900px; margin: 50px auto; padding: 20px;">
  <a href="/" style="color: #6366f1; text-decoration: none;">← Retour</a>
  
  <h1 style="text-align: center; margin: 30px 0;">Choisissez votre abonnement</h1>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px;">
    
    <!-- Plan Normal -->
    <div style="border: 2px solid #ddd; border-radius: 12px; padding: 30px; text-align: center;">
      <h2>🎹 Normal</h2>
      <div style="font-size: 48px; font-weight: bold; color: #6366f1; margin: 20px 0;">
        12 CHF
      </div>
      <p style="color: #666; margin-bottom: 30px;">par mois</p>
      
      <ul style="text-align: left; margin: 20px 0; padding-left: 20px;">
        <li>Accès à tous les cours de base</li>
        <li>Vidéos en qualité standard</li>
        <li>Support par email</li>
        <li>Accès sur 1 appareil</li>
      </ul>
      
      <button
        on:click={() => selectPlan('normal')}
        style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;"
      >
        Choisir Normal
      </button>
    </div>
    
    <!-- Plan Premium -->
    <div style="border: 3px solid #6366f1; border-radius: 12px; padding: 30px; text-align: center; position: relative; background: #f8f9ff;">
      <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #6366f1; color: white; padding: 5px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
        RECOMMANDÉ
      </div>
      
      <h2>⭐ Premium</h2>
      <div style="font-size: 48px; font-weight: bold; color: #6366f1; margin: 20px 0;">
        19 CHF
      </div>
      <p style="color: #666; margin-bottom: 30px;">par mois</p>
      
      <ul style="text-align: left; margin: 20px 0; padding-left: 20px;">
        <li><strong>Tous les avantages du plan Normal</strong></li>
        <li>Accès aux cours avancés et masterclass</li>
        <li>Vidéos en qualité HD</li>
        <li>Support prioritaire (chat en direct)</li>
        <li>Accès sur 3 appareils</li>
        <li>Partitions PDF téléchargeables</li>
        <li>Sessions live mensuelles</li>
      </ul>
      
      <button
        on:click={() => selectPlan('premium')}
        style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;"
      >
        Choisir Premium
      </button>
    </div>
    
  </div>
</div>