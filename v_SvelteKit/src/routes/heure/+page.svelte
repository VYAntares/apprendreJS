<script>
	export let data;

	let heure = '';

	function obtenirHeure() {
		heure = data.heure;
	}
</script>

<h1>Quelle heure est-il ?</h1>
<button on:click={obtenirHeure}>Obtenir l'heure</button>
<p>{heure ? `Il est ${heure}` : ''}</p>

<br><br>
<ul>
	<li><a href="/date">Aller à la page date</a></li>
	<li><a href="/">Retour à l'acceuil</a></li>
</ul>