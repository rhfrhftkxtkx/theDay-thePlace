<script lang="ts">
</script>

<div
  class="flex flex-col border border-neutral-300 dark:border-neutral-700 rounded-lg p-4 aspect-3/4 h-100 bg-neutral-100 dark:bg-neutral-800 shadow-md shadow-black/30 dark:shadow-white/10 hover:shadow-lg hover:-translate-y-1 transition-transform duration-200 ease-in-out"
>
  <div class="text-lg font-bold mb-2">
    <slot name="header" />
  </div>
  <div class="flex-grow flex text-base items-center justify-center">
    <slot />
  </div>
  <div class="mt-auto text-right">
    <slot name="footer" />
  </div>
</div>
