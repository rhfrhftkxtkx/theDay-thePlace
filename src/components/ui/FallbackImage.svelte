<script lang="ts">
  interface Props {
    imageUrl?: string;
    imageAlt?: string;
  }

  const { imageUrl, imageAlt }: Props = $props();

  const ERROR_IMG_URL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';
</script>

{#if imageUrl}
  <img src={imageUrl} alt={imageAlt} class="w-full h-full object-cover" />
{:else}
  <div
    class="inline-block bg-neutral-200 text-center align-middle w-full h-full object-cover"
  >
    <span class="flex items-center justify-center w-full h-full">
      <img src={ERROR_IMG_URL} alt="Error" />
    </span>
  </div>
{/if}
