<script lang="ts">
  import { Badge } from '$/lib/components/ui/badge';
  import { Card, CardContent } from '$/lib/components/ui/card';
  import { Skeleton } from '$/lib/components/ui/skeleton';
</script>

<Card class="cursor-default">
  <CardContent class="p-4">
    <div class="flex gap-3">
      <Skeleton class="w-20 h-20 rounded-lg" />
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between mb-2">
          <Skeleton class="w-80 h-8 rounded-md" />
        </div>
        <p class="text-xs line-clamp-2 mt-2">
          <Skeleton class="w-120 h-5 rounded-md" />
        </p>
        <p class="text-xs mt-1">
          <Skeleton class="w-60 h-5 rounded-md" />
        </p>
      </div>
    </div>
  </CardContent>
</Card>
