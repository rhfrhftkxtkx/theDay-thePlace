<script lang="ts">
  import { searchedCcbaItems, searchedMuseumItems } from '$/stores/store';
  import type {
    SearchedCcbaItem,
    SearchedMuseumItem,
  } from '$/types/search.types';
  import ResultCard from './ui/ResultCard.svelte';
  import SkeletonCard from './ui/SkeletonCard.svelte';

  interface ResultListProps {
    isLoading: boolean;
  }

  let { isLoading }: ResultListProps = $props();

  const ccbaItems: SearchedCcbaItem[] = $derived($searchedCcbaItems);
  const museumItems: SearchedMuseumItem[] = $derived($searchedMuseumItems);
</script>

<div class="my-3">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold">검색 결과</h2>
    <span class="text-base text-neutral-700 dark:text-neutral-200">
      {isLoading
        ? '로딩 중... 잠시만 기다려 주세요.'
        : `${ccbaItems.length + museumItems.length}개의 결과`}
    </span>
  </div>
  {#if ccbaItems.length === 0 && museumItems.length === 0 && !isLoading}
    <p class="mt-4 text-center text-neutral-600 dark:text-neutral-400">
      검색 결과가 없습니다.
    </p>
  {:else}
    <div class="my-3 flex flex-col gap-4">
      {#if isLoading}
        {#each Array(5) as _}
          <SkeletonCard />
        {/each}
      {:else}
        {#each ccbaItems as item}
          <ResultCard ccba={item} type="ccba" />
        {/each}
        {#each museumItems as item}
          <ResultCard museum={item} type="museum" />
        {/each}
      {/if}
    </div>
  {/if}
</div>
