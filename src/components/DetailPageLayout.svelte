<script lang="ts">
  import Button from '$/lib/components/ui/button/button.svelte';
  import { faArrowLeft, faMapPin } from '@fortawesome/free-solid-svg-icons';
  import Fa from 'svelte-fa';
</script>

<div class="min-h-screen bg-neutral-100 dark:bg-neutral-800">
  <!-- Header Image -->
  <div class="relative h-64 lg:h-96 overflow-hidden">
    <slot name="headerImage" />
  </div>
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
  <!-- Prev Button -->
  <Button
    variant="ghost"
    size="icon"
    onclick={() => history.back()}
    class="absolute top-4 left-4 bg-black/20 hover:bg-black/30 text-white"
  >
    <Fa icon={faArrowLeft} class="w-5 h-5" />
  </Button>
  <div class="absolute bottom-4 left-4 right-4 text-white">
    <slot name="badges" />
    <slot name="title" />
    <div class="flex items-center gap-1 text-sm opacity-90">
      <slot name="location" />
    </div>
  </div>
  <div class="p-4">
    <slot name="details" />
    <!-- Tabs -->
    <slot />
  </div>
</div>
