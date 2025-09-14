<script lang="ts">
  import { Badge } from '$/lib/components/ui/badge';
  import { Card, CardContent } from '$/lib/components/ui/card';
  import { searchedCcbaItems, searchedMuseumItems } from '$/stores/store';
  import type {
    SearchedCcbaItem,
    SearchedMuseumItem,
  } from '$/types/search.types';
  import FallbackImage from './FallbackImage.svelte';

  interface Props {
    ccba?: SearchedCcbaItem;
    museum?: SearchedMuseumItem;
    type: 'ccba' | 'museum';
  }

  const ERROR_IMG_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

  let { ccba, museum, type }: Props = $props();

  const imageUrl = type === 'ccba' ? ccba?.imageUrl : museum?.firstimage;
  const imageAlt = type === 'ccba' ? ccba?.ccimDesc : museum?.title;
  const title = type === 'ccba' ? ccba?.ccbaMnm1 : museum?.title;

  function handleClick() {
    if (type === 'ccba' && ccba) {
      window.location.href = `/ccba?ccbaAsno=${ccba.ccbaAsno}&ccbaCtcd=${ccba.ccbaCtcd}&ccbaKdcd=${ccba.ccbaKdcd}`;
    } else if (type === 'museum' && museum) {
      window.location.href = `/museum?contentId=${museum.contentid}`;
    }
  }
</script>

<Card
  class="cursor-pointer hover:shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-shadow duration-200"
  onclick={handleClick}
>
  <CardContent class="p-4">
    <div class="flex gap-3">
      <div class="w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <FallbackImage {imageUrl} {imageAlt} />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between mb-2">
          <h3 class="truncate">
            {title}
          </h3>
          <Badge
            variant={type === 'ccba' ? 'default' : 'secondary'}
            class="text-xs ml-2 shrink-0"
          >
            {type === 'ccba' ? '문화재' : '박물관'}
          </Badge>
        </div>
        <p class="text-xs line-clamp-2 mt-2">
          {#if type === 'ccba'}
            {ccba?.ccbaCtcdNm} - {ccba?.ccbaAdmin}
          {:else}
            {museum?.addr1}
          {/if}
        </p>
        {#if type === 'museum' && museum?.tel}
          <p class="text-xs mt-1">Tel: {museum.tel}</p>
        {/if}
      </div>
    </div>
  </CardContent>
</Card>
