<script lang="ts">
  import Card from '$/components/ui/ResultListComponents/Card.svelte';
  import type {
    SearchedCcbaItem,
    SearchedMuseumItem,
  } from '$/types/search.types';

  let { ccba, muse }: { ccba?: SearchedCcbaItem; muse?: SearchedMuseumItem } =
    $props();
  let type: string = ccba === undefined ? 'museum' : 'ccba';

  function truncateText(
    text?: string,
    maxLength: number = 15,
    truncateAt: number = 12
  ) {
    if (!text) return '';
    if (text.length >= maxLength) {
      return text.slice(0, truncateAt) + '...';
    }
    return text;
  }

  let headerText: string = $state('');
  let imageUrl: string = $state('');
  let imageAlt: string = $state('');
  $effect(() => {
    if (type === 'ccba') {
      headerText = truncateText(ccba?.ccbaMnm1);
      imageUrl = ccba?.imageUrl || '';
      imageAlt = ccba?.ccimDesc || '';
    } else {
      headerText = truncateText(muse?.title);
      imageUrl = muse?.firstimage || '';
      imageAlt = muse?.title || '';
    }
  });
</script>

<Card>
  <div slot="header" class="mb-4">
    <h3 class="text-xl font-bold">{headerText}</h3>
  </div>
  <div class="flex flex-col gap-1 items-center justify-center">
    {#if imageUrl}
      <img
        class="w-auto max-h-50 rounded-xl mb-2 object-contain"
        src={imageUrl}
        alt={imageAlt}
      />
    {:else}
      <div
        class="w-auto h-50 rounded-xl mb-2 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      >
        이미지가 없습니다.
      </div>
    {/if}
  </div>
  <div slot="footer" class="h-20">
    {#if type === 'ccba'}
      <p class="text-base text-gray-500 dark:text-gray-400">
        {ccba?.ccmaName} - {ccba?.ccbaCtcdNm}
      </p>
      <p class="text-base text-gray-500 dark:text-gray-400">
        {ccba?.ccbaAdmin}
      </p>
    {:else}
      <p class="text-base text-gray-500 dark:text-gray-400">
        {truncateText(muse?.title, 20, 17)}
      </p>
      <p class="text-base text-gray-500 dark:text-gray-400">
        {truncateText(muse?.addr1, 20, 17)}
      </p>
      <p class="text-base text-gray-500 dark:text-gray-400">
        {muse?.tel}
      </p>
    {/if}
  </div>
  <!-- ccba가 없으면 museum card임 -->
  <!-- {#if type === 'ccba'}
    <div class="card-content">
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
  {/if} -->
</Card>
