// Vérifier l'authentification
fetch('/api/check-session')
	.then(res => res.json())
	.then(data => {
		if (!data.authenticated || data.role !== 'admin') {
			window.location.href = '/';
		}
	});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
	await fetch('/api/logout', { method: 'POST' });
	window.location.href = '/';
});

// Récupérer l'ID de la commande depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');

if (!orderId) {
	window.location.href = '/admin.html';
}

document.getElementById('orderId').textContent = orderId;

// Charger les détails de la commande
fetch(`/api/orders/${orderId}`)
	.then(res => res.json())
	.then(order => {
		document.getElementById('clientName').textContent = order.username;
		document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleString('fr-FR');
		
		const tbody = document.getElementById('itemsList');
		order.items.forEach(item => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${item.name}</td>
				<td>${item.quantity}</td>
				<td><input type="number" name="item_${item.id}" min="0" max="${item.quantity}" value="${item.quantity}" style="width: 60px;"></td>
			`;
			tbody.appendChild(tr);
		});
	});

// Traiter la commande
document.getElementById('processForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	
	const formData = new FormData(e.target);
	const processedQuantities = {};
	
	for (const [key, value] of formData.entries()) {
		if (key.startsWith('item_')) {
			const itemId = key.replace('item_', '');
			processedQuantities[itemId] = parseInt(value);
		}
	}
	
	const response = await fetch(`/api/orders/${orderId}/process`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ processedQuantities })
	});
	
	if (response.ok) {
		alert('Commande traitée avec succès!');
		window.location.href = '/admin.html';
	} else {
		alert('Erreur lors du traitement de la commande');
	}
});