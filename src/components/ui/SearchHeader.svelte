<script lang="ts">
  import Fa from 'svelte-fa';
  import { faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
  import ThemeButton from '../features/ThemeButton.svelte';
</script>

<!-- 검색 페이지 헤더 -->
<header
  class="sticky top-0 z-50 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-500 transition-colors duration-300"
>
  <!-- 이전 버튼 및 제목 -->
  <div class="flex items-center gap-3 p-4">
    <button
      class="p-3 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none transition-colors duration-200"
      onclick={() => history.back()}
    >
      <!-- Font Awesome icon -->
      <Fa icon={faArrowLeft} />
    </button>
    <h1 class="flex-1">상세검색</h1>
    <div class="absolute right-4">
      <!-- 테마 전환 버튼 -->
      <ThemeButton />
    </div>
  </div>
</header>
<!-- 검색 페이지 헤더 -->
