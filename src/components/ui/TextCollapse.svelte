<script lang="ts">
  import { onMount } from 'svelte';

  const {
    text = '',
    maxLines = 5,
    showMoreText = '더 읽기',
    showLessText = '간단히 보기',
  } = $props();

  let isCollapsed = $state(true);
  let isOverflowing = $state(false);
  // Reference to the text container
  let textContainer = $state<HTMLDivElement | null>(null);
  // Default max height
  let maxHeight: number = $state(100);

  onMount(() => {
    if (textContainer) {
      const computedStyle = window.getComputedStyle(textContainer);
      const currentHeight = parseFloat(computedStyle.lineHeight);

      maxHeight = currentHeight * maxLines;

      isOverflowing = textContainer.scrollHeight > maxHeight;
    }
  });

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }
</script>

<div class="relative mb-4">
  <div
    class="overflow-hidden transition-all duration-400 relative"
    bind:this={textContainer}
    style="max-height: {isCollapsed
      ? `${maxHeight}px`
      : `${textContainer?.scrollHeight}px`}"
  >
    <p>{text}</p>
  </div>

  {#if isOverflowing}
    <div class="relative w-full text-center items-center">
      {#if isCollapsed}
        <div
          class="absolute left-0 bottom-0 z-10 right-0 h-20 pointer-events-none bg-linear-to-t from-white to-transparent dark:from-neutral-800"
        ></div>
      {/if}
      <button
        type="button"
        class="mt-2 text-blue-500 hover:underline focus:outline-none z-20 relative"
        onclick={toggleCollapse}
      >
        {isCollapsed ? showMoreText : showLessText}
      </button>
    </div>
  {/if}
</div>
