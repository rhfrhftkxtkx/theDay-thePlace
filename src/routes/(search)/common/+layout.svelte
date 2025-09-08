<script lang="ts">
  import SearchHeader from '$/components/SearchHeader.svelte';
</script>

<div
  class="min-h-screen bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors duration-300"
>
  <SearchHeader />
  <slot />
</div>
