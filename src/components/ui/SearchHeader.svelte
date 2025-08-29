<script lang="ts">
  import Fa from 'svelte-fa';
  import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
  import ThemeButton from '../features/ThemeButton.svelte';
</script>

<!-- 검색 페이지 헤더 -->
<header
  class="flex justify-center items-center h-15 text-base font-bold text-black dark:text-white shadow-xl/10 shadow-black/80 dark:shadow-gray-200 fixed top-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 z-10"
>
  <button
    class="absolute left-4 cursor-pointer text-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 ease-in-out rounded-full px-4 py-3"
    onclick={() => {
      history.back();
    }}
    aria-label="뒤로가기"
  >
    <Fa icon={faAngleLeft} />
  </button>
  <h1 class="text-2xl">상세 검색</h1>
  <div class="absolute right-4">
    <ThemeButton />
  </div>
</header>
<!-- 검색 페이지 헤더 -->
