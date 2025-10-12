<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let orderId = '';
  let clientName = '';
  let orderDate = '';
  let items = [];

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    orderId = $page.url.searchParams.get('id');
    
    if (!orderId) {
      goto('/admin');
      return;
    }

    const res = await fetch(`/api/orders/${orderId}`);
    const order = await res.json();
    
    clientName = order.username;
    orderDate = new Date(order.created_at).toLocaleString('fr-FR');
    
    // On ajoute une propriété 'processed' initialisée à 0 pour chaque item
    items = order.items.map(item => ({ ...item, processed: 0 }));
  });

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }

  async function handleSubmit(event) {
    // Récupérer les quantités traitées depuis les items liés à processed
    const processedQuantities = items.reduce((acc, item) => {
      acc[item.id] = parseInt(item.processed) || 0;
      return acc;
    }, {});
    
    const response = await fetch(`/api/orders/${orderId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processedQuantities })
    });
    
    if (response.ok) {
      alert('Commande traitée avec succès!');
      goto('/admin');
    } else {
      alert('Erreur lors du traitement de la commande');
    }
  }
</script>

<div>
  <button on:click={goBack}>← Retour</button>
  <button on:click={handleLogout}>Logout</button>
</div>

<main>
  <h1>Traiter la commande #{orderId}</h1>

  <section>
    <p><strong>Client :</strong> {clientName}</p>
    <p><strong>Date :</strong> {orderDate}</p>
  </section>

  <section>
    <h2>Articles commandés</h2>

    <form on:submit|preventDefault={handleSubmit}>
      <table border="1" cellpadding="10" cellspacing="0">
        <thead>
          <tr>
            <th>Image</th>
            <th>Article</th>
            <th>Quantité demandée</th>
            <th>Quantité traitée</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item}
            <tr>
              <td>
                {#if item.image_path}
                  <img src={item.image_path} alt={item.name} width="50" height="50" />
                {:else}
                  <span>—</span>
                {/if}
              </td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>
                <div>
                  <input
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    name="item_{item.id}"
                    bind:value={item.processed}
                    placeholder="0"
                    min="0"
                    max={item.quantity}
                    on:focus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    aria-label={`Quantité traitée pour ${item.name}`}
                  />

                  <button
                    type="button"
                    title="Mettre 0"
                    on:click={() => item.processed = 0}
                  >✕</button>
                  <button
                    type="button"
                    title="Mettre tout"
                    on:click={() => item.processed = item.quantity}
                  >✓</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <br>
      <button type="submit">Valider le traitement</button>
    </form>
  </section>
</main>