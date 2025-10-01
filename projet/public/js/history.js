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

// Charger l'historique
fetch('/api/orders/history')
	.then(res => res.json())
	.then(orders => {
		const tbody = document.getElementById('historyList');
		tbody.innerHTML = '';
		
		if (orders.length === 0) {
			document.getElementById('noHistory').style.display = 'block';
		} else {
			document.getElementById('noHistory').style.display = 'none';
			
			orders.forEach(order => {
				const tr = document.createElement('tr');
				const date = new Date(order.processed_at).toLocaleString('fr-FR');
				
				// Formater les articles
				const itemsText = order.items
					.map(item => `${item.name} (${item.quantity})`)
					.join(', ');
				
				tr.innerHTML = `
					<td>${order.id}</td>
					<td>${order.username}</td>
					<td>${date}</td>
					<td>${itemsText}</td>
				`;
				tbody.appendChild(tr);
			});
		}
	});