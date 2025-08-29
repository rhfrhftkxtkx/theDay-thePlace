<script lang="ts">
  import Fa from 'svelte-fa';
  import CategorySelector from '$components/features/CategorySeletor/CategorySelector.svelte';
  import ResultList from '$components/features/ResultList/ResultList.svelte';
  import {
    faSearch,
    faList,
    faAngleLeft,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    searchFilter,
    searchKeyword,
    searchedCcbaItems,
    searchedMuseumItems,
  } from '$/stores/store';
  import type { ServerResponse } from '$lib/searchTypes';
  import { onMount } from 'svelte';

  // 검색어를 저장하는 상태 변수
  let keywordString: string = $state('');

  // 로딩 상태 저장
  let isLoading: boolean = $state(false);

  // 검색 요청에 따른 json 응답 데이터를 searchedCcbaItems와 searchedMuseumItems에 저장
  async function formatSearchedResponse(data: ServerResponse): Promise<void> {
    console.log('검색 결과:', data);
    searchedCcbaItems.set(data.ccbaItems);
    searchedMuseumItems.set(data.museumItems);
  }

  // 클릭 시, searchKeyword와 searchFilter를 사용하여 검색 요청
  async function handleSubmitClick(): Promise<void> {
    isLoading = true;
    try {
      // Svelte server side에 서버로 검색 요청
      // 검색어와 필터를 JSON 형태로 서버에 POST 요청
      await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchKeyword: $searchKeyword,
          searchFilter: $searchFilter,
          pageNo: 1,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('검색 요청이 실패했습니다.');
        }
        // 검색 요청이 성공하면 응답을 JSON으로 파싱
        const responseData: ServerResponse = await response.json();
        // 파싱된 응답 데이터를 포맷팅 및 저장
        await formatSearchedResponse(responseData);
      });
    } catch (error) {
      console.error('검색 요청 중 오류 발생:', error);
    } finally {
      // 검색이 완료되면 로딩 상태를 false로 설정
      isLoading = false;
    }
  }

  onMount(async () => {
    if ($searchedCcbaItems.length == 0 && $searchedMuseumItems.length == 0) {
      // 페이지가 처음 로드될 때 검색어가 비어있으면 기본 검색어로 검색
      keywordString = '';
      await handleSubmitClick();
    }
  });
</script>

<div class="flex justify-center items-center flex-col">
  <!-- 검색 페이지 헤더 -->
  <header class="flex justify-center items-center h-15 text-base font-bold">
    <button
      class="absolute left-4 cursor-pointer text-xl hover:bg-gray-300 rounded-full px-3 py-2"
      onclick={() => {
        history.back();
      }}
      aria-label="뒤로가기"
    >
      <Fa icon={faAngleLeft} />
    </button>
    <h1 class="text-2xl">상세 검색</h1>
  </header>
  <!-- 검색 페이지 헤더 -->
  <!-- 검색 페이지 본문 -->
  <main class="flex flex-col h-auto w-full items-center">
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
        onchange={() => {
          searchKeyword.set(keywordString.trim());
        }}
        disabled={isLoading}
        class="w-full my-2 border rounded-2xl text-base h-10 px-4 bg-gray-200 focus:outline-none focus:bg-gray-100"
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
        class="inline-flex items-center text-center justify-center gap-4 w-full h-10 rounded-2xl text-white text-base cursor-pointer transition-color duration-300 ease bg-sky-600 hover:bg-sky-500"
        onclick={handleSubmitClick}
        disabled={isLoading}
      >
        검색
        <Fa icon={faSearch} />
      </button>
    </div>
    <!-- 검색 버튼 컨테이너 -->
    <hr style="width: 90%; margin: 2rem 5%;" />

    <!-- 검색 결과 컨테이너 -->
    <div class="result-container container">
      <ResultList {isLoading} />
    </div>
    <!-- 검색 결과 컨테이너 -->
  </main>
  <!-- 검색 페이지 본문 -->
</div>

<style lang="postcss">
  @import 'tailwindcss';

  /* 컨테이너 스타일 */
  .container {
    @apply flex justify-center items-start flex-col h-auto px-10;
  }
</style>
