<script lang="ts">
  // import SearchMenu from '$/components/ui/SearchMenu.svelte';
  import {
    ccbaList,
    searchFilter,
    searchKeyword,
    searchedItems,
    visitKorAreaCode2,
  } from '$/stores/store';
  import type { ServerResponseData } from '$/types/search.types';
  import ResultList from '$/components/ResultList.svelte';
  import { Fa } from 'svelte-fa';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import CategorySelector from '$/components/CategorySelector.svelte';
  import { onMount } from 'svelte';

  // 로딩 상태 저장
  let isLoading: boolean = $state(false);
  let categoryListLoading: boolean = $state(false);

  // 검색 요청에 따른 json 응답 데이터를 searchedCcbaItems와 searchedMuseumItems에 저장
  async function formatSearchedResponse(
    data: ServerResponseData[]
  ): Promise<void> {
    console.log('검색 결과:', data);
    searchedItems.set(data);
  }

  // 클릭 시, searchKeyword와 searchFilter를 사용하여 검색 요청
  async function handleSubmitClick(): Promise<void> {
    isLoading = true;

    let isCcbaSelected = undefined;
    let isMuseumSelected = undefined;

    if ($searchFilter) {
      const ccbaFilter = $searchFilter.find((filter) => filter.code === 'ccba');
      const museumFilter = $searchFilter.find(
        (filter) => filter.code === 'museum'
      );
      if (ccbaFilter && ccbaFilter.item.length > 0) {
        isCcbaSelected = true;
      } else if (museumFilter && museumFilter.item.length > 0) {
        isMuseumSelected = true;
      }
    }

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
          searchCcba: isCcbaSelected,
          searchMuseum: isMuseumSelected,
          pageNo: 1,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('검색 요청이 실패했습니다.');
        }
        // 검색 요청이 성공하면 응답을 JSON으로 파싱
        const { responseData, status } = await response.json();

        if (status !== 200) {
          throw new Error('검색 응답이 올바르지 않습니다.');
        }

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

  async function setDefaultLists(): Promise<void> {
    categoryListLoading = true;
    const ccbaResponse = await fetch('/api/khs/categories');
    if (!ccbaResponse.ok) {
      console.error('Failed to fetch ccba categories');
    } else {
      const ccbaCategories = await ccbaResponse.json();
      console.log('Fetched ccba categories:', ccbaCategories);
      ccbaList.set(ccbaCategories);
    }

    const visitKorResponse = await fetch('/api/visitKor/areaCode');
    if (!visitKorResponse.ok) {
      console.error('Failed to fetch visitKor area codes');
    } else {
      visitKorAreaCode2.set(await visitKorResponse.json());
    }
    categoryListLoading = false;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      handleSubmitClick();
    }
  }

  onMount(() => {
    setDefaultLists();
    handleSubmitClick();
  });
</script>

<main class="p-4 my-6">
  <!-- Search Bar -->
  <div class="my-3">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Fa
          icon={faSearch}
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          placeholder="박물관, 기념관, 전시관 검색..."
          bind:value={$searchKeyword}
          onkeydown={handleKeydown}
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-3 focus:ring-neutral-300 dark:focus:ring-neutral-500 transition-all duration-200"
        />
      </div>
      <button
        class="px-6 py-2 bg-neutral-800 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-600 dark:bg-neutral-200 dark:hover:bg-neutral-400 transition-colors duration-200"
        onclick={handleSubmitClick}
      >
        검색
      </button>
    </div>
  </div>

  <!-- Search Menu -->
  <CategorySelector
    searchedCallback={handleSubmitClick}
    isLoading={categoryListLoading}
  />
  <!-- <SearchMenu isLoading={true} handleSubmitClick={async () => {}} /> -->

  <!-- 검색 결과 컨테이너 -->
  <div
    class="my-4 border-t border-neutral-300 dark:border-neutral-600 pt-4 transition-all duration-300"
  >
    <ResultList {isLoading} />
  </div>
  <!-- 검색 결과 컨테이너 -->
</main>
