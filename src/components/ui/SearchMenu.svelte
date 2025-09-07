<script lang="ts">
  import Fa from 'svelte-fa';
  import CategorySelector from '$components/features/CategorySeletor/CategorySelector.svelte';
  import { faSearch, faList } from '@fortawesome/free-solid-svg-icons';
  import {
    searchKeyword,
    searchedCcbaItems,
    searchedMuseumItems,
  } from '$/stores/store';
  import { onMount } from 'svelte';

  interface Props {
    isLoading: boolean;
    handleSubmitClick: () => Promise<void>;
  }

  // 검색어를 저장하는 상태 변수
  let keywordString: string = $state($searchKeyword || '');
  let inputElement: HTMLInputElement | null;

  let { isLoading, handleSubmitClick }: Props = $props();

  onMount(async () => {
    if ($searchedCcbaItems.length == 0 && $searchedMuseumItems.length == 0) {
      // 페이지가 처음 로드될 때 검색어가 비어있으면 기본 검색어로 검색
      keywordString = '';
      await handleSubmitClick();
    }
  });

  const handleEnterKey = async (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleSubmitClick();
    }

    if (inputElement) {
      inputElement.focus();
    }
  };
</script>

<!-- 검색바 컨테이너 -->
<div class="container">
  <!-- 검색바 타이틀 -->
  <div class="inline-flex items-center gap-2 text-xl">
    <h5 class="text-lg">검색어</h5>
    <Fa icon={faSearch} />
  </div>
  <!-- 검색바 타이틀 -->
  <!-- 검색 바 -->
  <input
    type="text"
    placeholder="검색어를 입력하세요"
    bind:value={keywordString}
    bind:this={inputElement}
    onchange={() => {
      searchKeyword.set(keywordString.trim());
    }}
    onkeydown={handleEnterKey}
    id="search-input"
    disabled={isLoading}
    class="w-full my-2 border rounded-2xl text-base h-10 px-4 bg-neutral-100 dark:bg-neutral-700 focus:outline-none focus:bg-neutral-200 dark:focus:bg-neutral-500"
  />
  <!-- 검색 바 -->
</div>
<!-- 검색바 컨테이너 -->
<!-- 카테고리 선택기 컨테이너 -->
<div class="container">
  <div class="inline-flex items-center gap-2 text-xl">
    <h5 class="text-lg">카테고리 필터</h5>
    <Fa icon={faList} />
  </div>
  <CategorySelector />
</div>
<!-- 카테고리 선택기 컨테이너 -->
<!-- 검색 버튼 컨테이너 -->
<div class="container">
  <button
    type="submit"
    class="inline-flex items-center text-center justify-center gap-4 w-full h-10 rounded-2xl text-white text-base cursor-pointer transition-color duration-300 ease bg-sky-600 hover:bg-sky-500 focus:outline-none focus:border-3 focus:border-blue-700 dark:focus:border-blue-300"
    onclick={handleSubmitClick}
    disabled={isLoading}
  >
    검색
    <Fa icon={faSearch} />
  </button>
</div>
<!-- 검색 버튼 컨테이너 -->
<hr class="w-[90%] my-12 mx-auto" />
