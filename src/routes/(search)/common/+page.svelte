<script lang="ts">
  import SearchMenu from '$/components/ui/SearchMenu.svelte';
  import {
    searchFilter,
    searchKeyword,
    searchedCcbaItems,
    searchedMuseumItems,
  } from '$/stores/store';
  import type { ServerResponse } from '$/lib/searchTypes';
  import ResultList from '$/components/features/ResultList/ResultList.svelte';

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
</script>

<main
  class="flex flex-col h-auto w-full items-center text-black dark:text-white"
>
  <SearchMenu {isLoading} {handleSubmitClick} />
  <!-- <SearchMenu isLoading={true} handleSubmitClick={async () => {}} /> -->

  <!-- 검색 결과 컨테이너 -->
  <div class="container">
    <ResultList {isLoading} />
  </div>
  <!-- 검색 결과 컨테이너 -->
</main>

<style lang="postcss">
  @import 'tailwindcss';

  @custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

  /* 컨테이너 스타일 */
  .container {
    @apply flex justify-center items-start flex-col h-auto px-10;
  }
</style>
