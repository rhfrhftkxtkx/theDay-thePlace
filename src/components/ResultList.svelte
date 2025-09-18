<script lang="ts">
  import { searchedItems } from '$/stores/store';
  import type { ServerResponseData } from '$/types/search.types';
  import ResultCard from './ui/ResultCard.svelte';
  import SkeletonCard from './ui/SkeletonCard.svelte';

  interface ResultListProps {
    isLoading: boolean;
  }

  let { isLoading }: ResultListProps = $props();

  const resultItems: ServerResponseData[] = $derived($searchedItems);
</script>

<div class="my-3">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold">검색 결과</h2>
    <span class="text-base text-neutral-700 dark:text-neutral-200">
      {isLoading
        ? '로딩 중... 잠시만 기다려 주세요.'
        : `${resultItems.length}개의 결과`}
    </span>
  </div>
  {#if resultItems.length === 0 && !isLoading}
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
        {#each resultItems as item}
          <ResultCard data={item} />
        {/each}
      {/if}
    </div>
  {/if}
</div>
