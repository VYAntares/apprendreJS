document.getElementById('btnDate').addEventListener('click', async () => {
	const response = await fetch('/api/date');
	const data = await response.json();
	document.getElementById('resultat').textContent = `Nous sommes le ${data.date}`;
});