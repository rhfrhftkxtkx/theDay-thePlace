<script lang="ts">
  import { Badge } from '$/lib/components/ui/badge';
  import { Card, CardContent } from '$/lib/components/ui/card';
  import type { ServerResponseData } from '$/types/search.types';
  import FallbackImage from './FallbackImage.svelte';

  interface Props {
    data: ServerResponseData;
  }

  let { data }: Props = $props();

  const badgeName = () => {
    if (data.type === 'ccba') {
      return '문화재';
    } else if (data.type === 'A02060100') {
      return '박물관';
    } else if (data.type === 'A02060200') {
      return '기념관';
    } else if (data.type === 'A02060300') {
      return '전시관';
    } else {
      return '기타';
    }
  };

  function handleClick() {
    window.location.href = data.redirectUrl;
  }
</script>

<Card
  class="cursor-pointer hover:shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-shadow duration-200"
  onclick={handleClick}
>
  <CardContent class="p-4">
    <div class="flex gap-3">
      <div class="w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <FallbackImage imageUrl={data.imageUrl} imageAlt={data.imageAlt} />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between mb-2">
          <h3 class="truncate">
            {data.title}
          </h3>
          <Badge
            variant={data.type === 'ccba' ? 'default' : 'secondary'}
            class="text-xs ml-2 shrink-0"
          >
            {badgeName()}
          </Badge>
        </div>
        <p class="text-xs line-clamp-2 mt-2">
          {data.address}
        </p>
        {#if data.desc}
          <p class="text-xs mt-1">Tel: {data.desc}</p>
        {/if}
      </div>
    </div>
  </CardContent>
</Card>
