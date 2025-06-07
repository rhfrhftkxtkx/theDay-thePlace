<script lang="ts">
  import Card from '$/components/ui/ResultListComponents/Card.svelte';
  import type { SearchedCcbaItem, SearchedMuseumItem } from '$lib/searchTypes';

  let { ccba, muse }: { ccba?: SearchedCcbaItem; muse?: SearchedMuseumItem } =
    $props();
  let type: string = ccba === undefined ? 'museum' : 'ccba';

  function truncateText(
    text?: string,
    maxLength: number = 8,
    truncateAt: number = 5
  ) {
    if (!text) return '';
    if (text.length >= maxLength) {
      return text.slice(0, truncateAt) + '...';
    }
    return text;
  }
</script>

<Card>
  <!-- ccba가 없으면 museum card임 -->
  {#if type === 'ccba'}
    <div class="card-content">
      <div class="card-header">
        <h3>{truncateText(ccba?.ccbaMnm1)}</h3>
      </div>
      <div class="card-body">
        {#if ccba?.imageUrl}
          <img class="card-image" src={ccba?.imageUrl} alt={ccba?.ccimDesc} />
        {/if}
        <p>{ccba?.ccmaName} - {ccba?.ccbaCtcdNm}</p>
        <p>{ccba?.ccbaAdmin}</p>
      </div>
    </div>
  {:else}
    <div class="card-content">
      <div class="card-header">
        <h3>{truncateText(muse?.title)}</h3>
      </div>
      <div class="card-body">
        {#if muse?.firstimage}
          <img class="card-image" src={muse?.firstimage} alt={muse?.title} />
        {:else}
          <p>이미지가 없습니다.</p>
          <br />
        {/if}
        <p>{truncateText(muse?.title, 8, 7)}</p>
        <p>{truncateText(muse?.addr1, 10, 7)}</p>
        <p>{muse?.tel}</p>
      </div>
    </div>
  {/if}
</Card>

<style>
  .card-content {
    display: flex;
    flex-direction: column;
    width: 120px;
    height: 280px;
  }

  .card-image {
    width: auto;
    height: 100px;
    border-radius: 8px;
    margin-bottom: 1rem;
    object-fit: contain;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .card-body p {
    margin: 0.5rem 0;
    color: #666;
  }

  .card-body p:last-child {
    margin-bottom: 0;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-header {
    margin-bottom: 1rem;
  }

  .card-header h3 {
    font-size: 1.25rem;
    color: var(--text-color);
  }
</style>
