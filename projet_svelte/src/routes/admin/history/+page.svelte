<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Calendar } from '@fullcalendar/core';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';

  let allOrders = [];
  let selectedDate = null;
  let ordersForSelectedDate = [];
  let selectedOrder = null;
  let calendarEl;
  let calendar;
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  onMount(async () => {
    const resSession = await fetch('/api/check-session');
    const dataSession = await resSession.json();
    
    if (!dataSession.authenticated || dataSession.role !== 'admin') {
      goto('/');
      return;
    }

    await loadOrders();
    initCalendar();
  });

  async function loadOrders() {
    const res = await fetch('/api/orders/history');
    if (res.ok) {
      allOrders = await res.json();
    }
  }

  function initCalendar() {
    const events = {};
    
    allOrders.forEach(order => {
      if (order.processed_at) {
        const date = order.processed_at.split(' ')[0];
        if (!events[date]) {
          events[date] = [];
        }
        events[date].push(order);
      }
    });

    const calendarEvents = Object.keys(events).map(date => ({
      title: `${events[date].length} commande${events[date].length > 1 ? 's' : ''}`,
      start: date,
      allDay: true,
      backgroundColor: '#4CAF50',
      borderColor: '#4CAF50',
      extendedProps: {
        orders: events[date]
      }
    }));

    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: 'fr',
      firstDay: 1,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''
      },
      buttonText: {
        today: "Aujourd'hui"
      },
      events: calendarEvents,
      dateClick: handleDateClick,
      eventClick: handleEventClick,
      height: 'auto'
    });

    calendar.render();
  }

  function handleDateClick(info) {
    const date = info.dateStr;
    selectDate(date);
  }

  function handleEventClick(info) {
    const date = info.event.startStr;
    selectDate(date);
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    selectedOrder = null;
    ordersForSelectedDate = allOrders.filter(order => {
      if (!order.processed_at) return false;
      const orderDate = order.processed_at.split(' ')[0];
      return orderDate === dateStr;
    });
  }

  async function viewOrderDetails(orderId) {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const orderData = await res.json();
      // Grouper les articles par catégorie
      const itemsByCategory = groupItemsByCategory(orderData.items);
      selectedOrder = { ...orderData, itemsByCategory };
    }
  }

  function groupItemsByCategory(items) {
    const grouped = {};
    items.forEach(item => {
      // Extraire la catégorie du nom du produit (ex: "Bags 312" -> "Bags")
      const category = item.name.split(' ')[0];
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }

  function closeOrderDetails() {
    selectedOrder = null;
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    goto('/');
  }

  function goBack() {
    goto('/admin');
  }

  function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function getCategoryTotal(items) {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }
</script>

<svelte:head>
  <link href='https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.10/main.min.css' rel='stylesheet' />
  <link href='https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.10/main.min.css' rel='stylesheet' />
</svelte:head>

<div>
  <button on:click={goBack}>← Retour au tableau de bord</button>
  <button on:click={handleLogout}>Déconnexion</button>
</div>

<h1>Historique des commandes traitées</h1>

<div>
  <h2>Calendrier</h2>
  <div bind:this={calendarEl}></div>
</div>

<hr>

{#if selectedOrder}
  <!-- Détails de la commande -->
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
{:else if selectedDate}
  <div>
    <h2>Commandes du {formatDateDisplay(selectedDate)}</h2>
    
    {#if ordersForSelectedDate.length === 0}
      <p>Aucune commande pour ce jour</p>
    {:else}
      <table border="1" cellpadding="10" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Heure de traitement</th>
            <th>Montant total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each ordersForSelectedDate as order}
            <tr>
              <td>{order.id}</td>
              <td>{order.username}</td>
              <td>{order.processed_at ? new Date(order.processed_at).toLocaleTimeString('fr-FR') : '-'}</td>
              <td><strong>CHF {order.total_amount.toFixed(2)}</strong></td>
              <td>
                <button on:click={() => viewOrderDetails(order.id)}>Voir détails</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <p>
        <strong>Total du jour: CHF {ordersForSelectedDate.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}</strong>
      </p>
    {/if}
  </div>
{:else}
  <p><em>Cliquez sur une date du calendrier pour voir les commandes de ce jour</em></p>
{/if}