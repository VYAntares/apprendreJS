<script>
  export let data;

  // Créer le chemin complet vers la vidéo dans static/videos/[slug]/filename
  const slug = data.categorie.nom.toLowerCase().replace(/\s/g, '-');
  const videoSrc = `/videos/${slug}/${data.video.filename}`;
</script>

<div style="max-width: 900px; margin: 40px auto; padding: 0 20px;">
  <a href="/catalogue/{slug}" style="color: #6366f1; text-decoration: none; display: inline-block; margin-bottom: 24px;">
    ← Retour à {data.categorie.nom}
  </a>

  <h1 style="font-size: 32px; margin-bottom: 16px;">{data.video.titre}</h1>
  {#if data.video.description}
    <p style="color: #666; margin-bottom: 24px;">{data.video.description}</p>
  {/if}

  <video controls width="100%" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);" src={videoSrc}>
    Votre navigateur ne supporte pas la vidéo HTML5.
  </video>
</div>
