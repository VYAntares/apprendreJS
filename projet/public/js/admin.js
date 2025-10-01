// Vérifier l'authentification
fetch('/api/check-session')
	.then(res => res.json())
	.then(data => {
		if (!data.authenticated || data.role !== 'admin') {
			window.location.href = '/';
		} else {
			document.getElementById('username').textContent = data.username;
		}
	});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
	await fetch('/api/logout', { method: 'POST' });
	window.location.href = '/';
});

// Aller à l'historique
document.getElementById('historyBtn').addEventListener('click', () => {
	window.location.href = '/history.html';
});

// Charger les commandes en attente
function loadOrders() {
	fetch('/api/orders/pending')
		.then(res => res.json())
		.then(orders => {
			const tbody = document.getElementById('ordersList');
			tbody.innerHTML = '';
			
			if (orders.length === 0) {
				document.getElementById('noOrders').style.display = 'block';
			} else {
				document.getElementById('noOrders').style.display = 'none';
				
				orders.forEach(order => {
					const tr = document.createElement('tr');
					const date = new Date(order.created_at).toLocaleString('fr-FR');
					tr.innerHTML = `
						<td>${order.id}</td>
						<td>${order.username}</td>
						<td>${date}</td>
						<td>${order.status}</td>
						<td><button onclick="processOrder(${order.id})">Traiter</button></td>
					`;
					tbody.appendChild(tr);
				});
			}
		});
}

function processOrder(orderId) {
	window.location.href = `/process.html?id=${orderId}`;
}

// Charger les commandes au démarrage
loadOrders();

// Recharger toutes les 10 secondes
setInterval(loadOrders, 10000);