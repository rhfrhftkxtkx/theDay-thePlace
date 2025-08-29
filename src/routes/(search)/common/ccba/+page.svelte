<script lang="ts">
  import Fa from 'svelte-fa';
  import CategorySelector from '$components/features/CategorySeletor/CategorySelector.svelte';
  import DetailCardHolder from '$/components/ui/ResultListComponents/DetailCardHolder.svelte';
  import ResultCard from '$components/features/ResultList/ResultCard.svelte';
  import {
    faSearch,
    faList,
    faAngleLeft,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    ccbaList,
    searchFilter,
    searchKeyword,
    searchedCcbaItems,
    searchedMuseumItems,
  } from '$/stores/store';
  import type {
    ServerResponse,
    SearchedCcbaItem,
    Category,
  } from '$lib/searchTypes';
  import { onMount } from 'svelte';
  import SearchMenu from '$/components/ui/SearchMenu.svelte';

  // 검색어를 저장하는 상태 변수
  let keywordString: string = $state('');

  // 로딩 상태 저장
  let isLoading: boolean = $state(false);

  let isMoreLoading: boolean = $state(false);
  let currentPageNo: number = $state(1);

  const ccbaItems: SearchedCcbaItem[] = $derived($searchedCcbaItems);

  const ccbaCategories: Category[] = [
    {
      code: 'ccba',
      name: '문화유산',
      item: ccbaList,
    },
  ];

  // 검색 요청에 따른 json 응답 데이터를 searchedCcbaItems와 searchedMuseumItems에 저장
  async function formatSearchedResponse(data: ServerResponse): Promise<void> {
    searchedCcbaItems.set(data.ccbaItems);
    searchedMuseumItems.set(data.museumItems);
  }

  // 클릭 시, searchKeyword와 searchFilter를 사용하여 검색 요청
  async function handleSubmitClick(): Promise<void> {
    isLoading = true;
    currentPageNo = 1; // 검색 요청 시 페이지 번호를 1로 초기화
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
          searchCcba: true,
          searchMuseum: false,
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

  async function addSearchedResponse(
    responseData: ServerResponse
  ): Promise<void> {
    // 기존 검색 결과에 새로운 검색 결과를 추가
    const currentCcbaItems = $searchedCcbaItems;
    searchedCcbaItems.set([...currentCcbaItems, ...responseData.ccbaItems]);
  }

  async function handleMoreClick(): Promise<void> {
    isMoreLoading = true;
    try {
      // 현재 페이지 번호를 가져와서 1 증가
      currentPageNo = currentPageNo + 1;

      // Svelte server side에 서버로 추가 검색 요청
      await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchKeyword: $searchKeyword,
          searchFilter: $searchFilter,
          searchCcba: true,
          searchMuseum: false,
          pageNo: currentPageNo,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('추가 검색 요청이 실패했습니다.');
        }
        // 추가 검색 요청이 성공하면 응답을 JSON으로 파싱
        const responseData: ServerResponse = await response.json();
        // 파싱된 응답 데이터를 포맷팅 및 저장
        await addSearchedResponse(responseData);
      });
    } catch (error) {
      console.error('추가 검색 요청 중 오류 발생:', error);
    } finally {
      // 추가 검색이 완료되면 로딩 상태를 false로 설정
      isMoreLoading = false;
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

<!-- 검색 페이지 본문 -->
<main
  class="flex flex-col h-auto w-full items-center text-black dark:text-white"
>
  <SearchMenu {isLoading} {handleSubmitClick} />

  <!-- 검색 결과 컨테이너 -->
  <div class="container">
    <DetailCardHolder title="국가 유산">
      {#if isLoading}
        <p>로딩 중...</p>
      {:else if ccbaItems.length === 0}
        <p>검색 결과가 없습니다.</p>
      {:else}
        {#each ccbaItems as ccba}
          <ResultCard {ccba} />
        {/each}
      {/if}
    </DetailCardHolder>
  </div>
  <!-- 검색 결과 컨테이너 -->
  <!-- 더보기 버튼 컨테이너-->
  <div>
    <button
      aria-label="더보기"
      class="detail-more-button"
      onclick={() => {
        // 더보기 버튼 클릭 시 추가 검색 요청
        handleMoreClick();
      }}
      disabled={isMoreLoading || isLoading}
    >
      {#if isMoreLoading}
        <span>로딩 중...</span>
      {:else}
        <span>더보기</span>
      {/if}
    </button>
  </div>
  <!-- 더보기 버튼 컨테이너-->
</main>

<style>
  /* 컨테이너너 스타일 */
  .container {
    display: flex;
    justify-content: center;
    align-items: start;
    flex-direction: column;
    padding: 0 5%;
    height: auto;
  }

  .detail-more-button {
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 10px;
    background-color: var(--primary-color);
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
</style>
