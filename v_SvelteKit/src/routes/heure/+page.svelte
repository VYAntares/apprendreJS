<script>
	export let data;

	let heure = '';

	function obtenirHeure() {
		heure = data.heure;
	}
</script>

<h1>Quelle heure est-il ?</h1>
<button on:click={obtenirHeure}>Obtenir l'heure</button>
<p>{heure ? `Il est ${Heure}` : ''}</p>

<br><br>
<a href="/date">Aller à la page date</a>