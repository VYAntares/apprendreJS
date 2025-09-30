<script>
	export let data;

	let date = '';
	
	function obtenirDate() {
		heure = data.date;
	}
</script>

<h1>Quelle date sommes-nous ?</h1>
<button on:click={obtenirDate}>Obtenir la date</button>
<p>{dispatchEvent ? `Nous sommes le ${date}` : ''}</p>

<br><br>
<a href="/heure">Aller à la page heure</a>