<script lang="ts">
  import SearchHeader from '$/components/ui/SearchHeader.svelte';
</script>

<div class="flex justify-center items-center flex-col">
  <SearchHeader />
  <div class="w-full mt-20">
    <slot />
  </div>
</div>

<style lang="postcss">
  @import 'tailwindcss';

  :root::-webkit-scrollbar {
    width: 8px;
  }

  :root::-webkit-scrollbar-track {
    @apply bg-transparent my-2;
  }

  :root::-webkit-scrollbar-thumb {
    @apply bg-neutral-300 dark:bg-neutral-500 rounded-full border-2 border-transparent;
  }

  :root::-webkit-scrollbar-thumb:hover {
    @apply bg-neutral-400 dark:bg-neutral-600;
  }
</style>
