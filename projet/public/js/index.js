// Vérifier si déjà connecté
fetch('/api/check-session')
	.then(res => res.json())
	.then(data => {
		if (data.authenticated) {
			if (data.role === 'client') {
				window.location.href = '/client.html';
			} else if (data.role === 'admin') {
				window.location.href = '/admin.html';
			}
		}
	});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	
	const response = await fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	
	const data = await response.json();
	
	if (data.success) {
		if (data.role === 'client') {
			window.location.href = '/client.html';
		} else if (data.role === 'admin') {
			window.location.href = '/admin.html';
		}
	} else {
		document.getElementById('error').textContent = 'Identifiants incorrects';
	}
});