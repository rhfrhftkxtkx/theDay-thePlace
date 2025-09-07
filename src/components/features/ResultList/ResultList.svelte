<script lang="ts">
  import type { ResultListProps } from './ResultList.type';
  import { searchedCcbaItems, searchedMuseumItems } from '$stores/store';
  import { onMount } from 'svelte';
  import CardHolder from '$/components/ui/ResultListComponents/CardHolder.svelte';
  import ResultCard from './ResultCard.svelte';
  import type {
    SearchedCcbaItem,
    SearchedMuseumItem,
  } from '$/types/search.types';

  const ccbaItems: SearchedCcbaItem[] = $derived($searchedCcbaItems);
  const museumItems: SearchedMuseumItem[] = $derived($searchedMuseumItems);

  let { isLoading }: ResultListProps = $props();

  onMount(() => {});
</script>

<div class="flex items-center justify-between">
  <h2 class="text-xl font-bold">검색 결과</h2>
  <span class="text-base text-neutral-700 dark:text-neutral-200">
    {ccbaItems.length + museumItems.length}개의 결과
  </span>
</div>
<CardHolder title="국가 유산" value={'ccba'} more_title={'국가 유산 더보기'}>
  {#if isLoading}
    <p>로딩 중...</p>
  {:else if ccbaItems.length === 0 && museumItems.length === 0}
    <p>검색 결과가 없습니다.</p>
  {:else}
    {#each ccbaItems.slice(0, 10) as ccba}
      <ResultCard {ccba} />
    {/each}
  {/if}
</CardHolder>
<CardHolder title="박물관" value={'museum'} more_title={'박물관 더보기'}>
  {#if isLoading}
    <p>로딩 중...</p>
  {:else if ccbaItems.length === 0 && museumItems.length === 0}
    <p>검색 결과가 없습니다.</p>
  {:else}
    {#each museumItems.slice(0, 10) as muse}
      <ResultCard {muse} />
    {/each}
  {/if}
</CardHolder>
