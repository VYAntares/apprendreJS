<script>
	export let data;

	let date = '';
	
	function obtenirDate() {
		date = data.date;
	}
</script>

<h1>Quelle date sommes-nous ?</h1>
<button on:click={obtenirDate}>Obtenir la date</button>
<p>{date ? `Nous sommes le ${date}` : ''}</p>

<br><br>
<ul>
	<li><a href="/heure">Aller à la page heure</a></li>
	<li><a href="/">Retour à l'acceuil</a></li>
</ul>