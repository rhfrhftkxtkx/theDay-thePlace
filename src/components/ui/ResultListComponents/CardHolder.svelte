<script lang="ts">
  export let title: string = 'Card Holder';
  export let value: string = '';
  export let more_title: string = '';
</script>

<div class="w-full flex flex-row items-center justify-between">
  <h4 class="text-lg font-semibold">{title}</h4>
  {#if value}
    <a
      class="bg-transparent cursor-pointer text-base focus:outline-none rounded-full p-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 ease-in-out"
      href={`/common/${value.toLocaleLowerCase()}`}
    >
      {more_title}
    </a>
  {/if}
</div>
<div class="flex flex-col items-start w-full p-4 overflow-auto mb-4 scrollbar">
  <div class="flex flex-row gap-4 justify-center">
    <slot />
  </div>
</div>

<style lang="postcss">
  @import 'tailwindcss';

  .scrollbar::-webkit-scrollbar {
    height: 8px;
  }

  .scrollbar::-webkit-scrollbar-track {
    @apply bg-transparent mx-1;
  }

  .scrollbar::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-500 rounded-full border-2 border-transparent;
  }

  .scrollbar::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }
</style>
