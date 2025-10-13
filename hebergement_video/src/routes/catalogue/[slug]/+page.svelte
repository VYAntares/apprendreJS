<script>
  export let data;
</script>

<div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
  <a href="/catalogue" style="color: #6366f1; text-decoration: none; display: inline-block; margin-bottom: 24px;">
    ← Retour aux catégories
  </a>

  <h2 style="font-size: 32px; margin-bottom: 10px;">{data.categorie.nom}</h2>
  <p style="color: #666; margin-bottom: 40px;">{data.categorie.description}</p>

  {#if data.videos.length === 0}
    <div style="background: white; border-radius: 12px; padding: 48px; text-align: center;">
      <p style="font-size: 18px; color: #666;">Aucune vidéo disponible pour le moment dans cette catégorie.</p>
      <p style="font-size: 14px; color: #999; margin-top: 8px;">De nouveaux cours seront ajoutés prochainement !</p>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
      {#each data.videos as video}
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="aspect-ratio: 16/9; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            ▶
          </div>
          <div style="padding: 16px;">
            <h3 style="font-size: 18px; margin: 0 0 8px 0;">{video.titre}</h3>
            {#if video.description}
              <p style="font-size: 14px; color: #666; margin: 0 0 12px 0; line-height: 1.5;">
                {video.description}
              </p>
            {/if}
            <div style="display: flex; justify-content: space-between; align-items: center;">
              {#if video.duree}
                <span style="font-size: 12px; color: #999;">
                  {Math.floor(video.duree / 60)}:{(video.duree % 60).toString().padStart(2, '0')}
                </span>
              {/if}
              <a
                href={`/catalogue/video/${video.id}`}
                style="color: #6366f1; text-decoration: none; font-size: 14px; font-weight: 500;"
              >
                Regarder →
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
