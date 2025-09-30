document.getElementById('btnHeure').addEventListener('click', async () => {
	const response = await fetch('/api/heure');
	const data = await response.json();
	document.getElementById('resultat').textContent = `Il est ${data.heure}`;
});