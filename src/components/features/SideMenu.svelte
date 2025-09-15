<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  export let isOpen = false;

  const closeMenu = () => {
    isOpen = false;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-black/50 z-[1001]"
    onclick={closeMenu}
    transition:fade={{ duration: 200 }}
  ></div>

  <aside
    class="fixed top-0 left-0 bottom-0 w-64 bg-neutral-100 dark:bg-neutral-800 shadow-xl z-[1002] flex flex-col whitespace-nowrap"
    transition:slide={{ duration: 300, axis: 'x' }}
  >
    <div
      class="p-4 border-b border-neutral-300 dark:border-neutral-600 flex items-center gap-3"
    >
      <button
        onclick={closeMenu}
        class="p-3 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none transition-colors duration-200"
        aria-label="메뉴 닫기"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
      <h2 class="text-xl font-bold">그 날 그 곳</h2>
    </div>

    <nav class="flex-1 p-4 space-y-2">
      <a
        href="/login"
        class="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <span>👤</span>
        <span>로그인</span>
      </a>
      <a
        href="/common"
        class="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <span>🔍</span>
        <span>상세검색</span>
      </a>
      <a
        href="/favorites"
        class="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <span>⭐</span>
        <span>즐겨찾기</span>
      </a>
    </nav>
    <div class="p-4 mt-auto text-xs text-neutral-500">
      <p>한국의 아름다운 문화유산을 탐험하세요</p>
    </div>
  </aside>
{/if}
