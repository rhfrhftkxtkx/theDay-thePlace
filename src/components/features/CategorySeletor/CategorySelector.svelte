<script lang="ts">
  import OffcanvasTab from '$components/ui/OffcanvasTab/OffcanvasTab.svelte';
  import { ccbaList, visitKorAreaCode2, searchFilter } from '$/stores/store';
  import type { Category } from '$lib/searchTypes';
  import { Fa } from 'svelte-fa';
  import {
    faChevronRight,
    faRotateLeft,
    faXmark,
    faCheck,
  } from '@fortawesome/free-solid-svg-icons';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  let { initCategoryList }: { initCategoryList?: Category[] } = $props();

  let categoryList: Category[] = $state([]);

  // 오프캔버스 탭을 열고 닫기 위한 상태 변수
  let isSelectorOpen = $state(false);

  // 로딩 상태를 나타내는 변수
  let isLoading = $state(false);
  // 컴포넌트가 마운트되었는지 여부를 나타내는 변수
  let mounted = $state(false);

  // 현재 선택하려는 카테고리들을 저장하는 변수
  let selectedCat1: Category | null = $state(null);
  let selectedCat2: Category | null = $state(null);

  // 선택이 된 카테고리들을 저장하는 변수
  let selectedCats: Category[] = $state([]);

  // Dock이 열려있는지 여부를 나타내는 변수
  // 선택된 카테고리가 있는 경우 Dock이 열려있다고 판단
  let isDockOpen = $derived(checkDockOpen(selectedCats));

  // 카테고리 리스트의 높이를 동적으로 설정
  let categoryListHeight: string = $derived(
    isDockOpen
      ? 'calc(100% - 115px - 2rem)' // Dock이 열려있을 때
      : 'calc(100% - 35px)' // Dock이 닫혀있을 때
  );

  function toggleSelectedCats(
    cat1: Category,
    cat2: Category,
    cat3: Category
  ): void {
    const parameterCat = {
      code: cat1.code,
      name: cat1.name,
      item: [
        {
          code: cat2.code,
          name: cat2.name,
          item: [cat3],
        },
      ],
    };
    toggleSelectedCat(parameterCat);
  }

  function toggleSelectedCat(target: Category): void {
    // target의 유효성 검사
    if (
      !target ||
      target.item.length === 0 ||
      target.item[0].item.length === 0
    ) {
      console.error(
        '[CategorySelector] toggleSelectedCats: Invalid target category'
      );
      return;
    }

    const selectedCat1 = selectedCats.find((cat) => cat.code === target.code);
    if (selectedCat1 === undefined) {
      // selectedCat(SelectedCats에서 target를 검색한 결과)가 undefined이면
      // seletectedCats에는 cat1부터 없는 경우임
      selectedCats = [...selectedCats, target];
      return;
    }

    // selectedCat이 undefined가 아니면
    // selectedCats에서 cat2부터 순차적으로 탐색하여 확인
    const selectedCat2 = selectedCat1.item.find(
      (cat) => cat.code === target.item[0].code
    );

    if (selectedCat2 === undefined) {
      // selectedCat2가 undefined이면
      // selectedCats에는 cat2부터 없는 경우임

      selectedCat1.item = [...selectedCat1.item, target.item[0]];
      selectedCats = [...selectedCats];
      return;
    }

    // selectedCat2가 undefined가 아니면
    // selectedCats에서 cat3부터 순차적으로 탐색하여 확인
    const selectedCat3 = selectedCat2.item.find(
      (cat) => cat.code === target.item[0].item[0].code
    );
    if (selectedCat3 === undefined) {
      // selectedCat3가 undefined이면
      // selectedCats에는 cat3부터 없는 경우임

      // 만약 선택된 cat3 level 카테고리의 name이 '전체'이면
      // 해당 카테고리 cat3를 선택하지 않고, '전체' 카테고리를 선택하도록 함
      if (target.item[0].item[0].name === '전체') {
        selectedCat2.item = [target.item[0].item[0]];
        selectedCats = [...selectedCats];
        return;
        // 만약 '전체'가 아니고, '전체'가 선택되어 있으면,
        // '전체'를 선택 해제하고, 해당 카테고리를 선택하도록 함
      } else if (
        selectedCat2.item.some((cat) => cat.name === '전체') &&
        target.item[0].item[0].name !== '전체'
      ) {
        selectedCat2.item = selectedCat2.item.filter(
          (cat) => cat.name !== '전체'
        );
      }

      // selectedCat2에 item을 추가
      selectedCat2.item = [...selectedCat2.item, target.item[0].item[0]];
      selectedCats = [...selectedCats];
      return;
    }

    selectedCat2.item = selectedCat2.item.filter(
      (cat) => cat.code !== target.item[0].item[0].code
    );
    selectedCats = [...selectedCats];

    // 만약 selectedCat2가 비어있으면
    // selectedCat1에서 해당 카테고리를 제거
    if (selectedCat2.item.length === 0) {
      selectedCat1.item = selectedCat1.item.filter(
        (cat) => cat.code !== target.item[0].code
      );
      selectedCats = [...selectedCats];
    }

    // 만약 selectedCat1이 비어있으면
    // selectedCats에서 해당 카테고리를 제거
    if (selectedCat1.item.length === 0) {
      selectedCats = selectedCats.filter((cat) => cat.code !== target.code);
    }

    if (selectedCats.length === 0) {
      // 선택된 카테고리가 없으면 Dock을 닫음
      isDockOpen = false;
    } else {
      // 선택된 카테고리가 있으면 Dock을 열음
      isDockOpen = true;
    }
  }

  // 선택된 카테고리가 현재 선택된 카테고리인지 확인하는 함수
  function checkSelected(
    depth: 1 | 2 | 3,
    category: Category,
    _: any
  ): boolean {
    if (!mounted) return false; // 컴포넌트가 마운트되지 않았으면 false 반환

    if (depth === 1) {
      if (!selectedCat1) return false;
      return selectedCat1.code === category.code;
    } else if (depth === 2) {
      if (!selectedCat2) return false;
      return selectedCat2.code === category.code;
    } else {
      if (!selectedCats) return false;
      return selectedCats.some((cat) => {
        if (!selectedCat1 || !selectedCat2) return false;
        return (
          cat.code === selectedCat1.code &&
          cat.item.some((subCat) => {
            if (!selectedCat2) return false; // item이 없으면 false
            return (
              subCat.code === selectedCat2.code &&
              subCat.item.some((detailCat) => detailCat.code === category.code)
            );
          })
        );
      });
    }
  }

  // 오프캔버스 탭을 열고 닫는 함수
  function openOffcavans(): void {
    isSelectorOpen = true;
    // 오프캔버스가 열릴 때 선택된 카테고리와 상태를 초기화
    if (mounted) {
      selectedCat1 = null;
      selectedCat2 = null;
      // 선택된 카테고리들을 초기화
      selectedCats = get(searchFilter);
    }
  }

  // 오프캔버스 탭을 닫는 함수
  function closeSelectorOffcanvas(): void {
    isSelectorOpen = false;
    // 오프캔버스가 닫힐 때 선택된 카테고리와 상태를 초기화
  }

  function checkDockOpen(catsList: Category[]): boolean {
    if (!mounted) return false; // 컴포넌트가 마운트되지 않았으면 false 반환
    if (catsList.length > 0) return true;

    const dock = document.getElementById('selected-categories-dock');
    if (dock) {
      dock.classList.remove('dock-display');
      dock.classList.add('dock-closed');
      setTimeout(() => {
        dock.classList.remove('dock-closed');
      }, 500); // 애니메이션 시간과 일치시킴
    }
    return false;
  }

  function setDefaultCategoryList(): void {
    // 기본 카테고리 리스트를 설정하는 함수
    categoryList = [
      {
        code: 'ccba',
        name: '문화유산',
        item: ccbaList,
      },
      {
        code: 'museum',
        name: '박물관',
        item: [
          {
            code: 'areaCode',
            name: '지역',
            item: visitKorAreaCode2,
          },
        ],
      },
    ];
  }

  onMount(() => {
    mounted = true;
    if (initCategoryList && initCategoryList.length > 0) {
      // 초기 카테고리 리스트가 주어지면 해당 리스트를 사용
      categoryList = initCategoryList;
    } else {
      // 초기 카테고리 리스트가 없으면 기본 카테고리 리스트를 설정
      setDefaultCategoryList();
    }
  });
</script>

<!-- CategorySelector.svelte -->
<!-- 카테고리 선택 버튼 -->
<div class="category-selector">
  <button class="select-button" onclick={openOffcavans}>
    <span>분류를 선택해주세요</span>
    <Fa icon={faChevronRight} />
  </button>
</div>
<!-- 카테고리 선택 버튼 -->
<!-- div tag list -->
<div class="category-main">
  <div class="category-tag-area my-2">
    <ul class="category-tag-list">
      {#each selectedCats as cat1 (cat1.code)}
        {#each cat1.item as cat2 (cat2.code)}
          {#each cat2.item as cat3 (cat3.code)}
            <li class="category-tag-item">
              <button
                class="tag-remove-button"
                onclick={() => toggleSelectedCats(cat1, cat2, cat3)}
              >
                <Fa icon={faXmark} />
              </button>
              <span class="category-item-name">
                {`${cat1.name}/${cat2.name}/${cat3.name}`}
              </span>
            </li>
          {/each}
        {/each}
      {/each}
    </ul>
  </div>
</div>
<!-- div tag list -->

{#if isSelectorOpen}
  <!-- OffcanvasTab 컴포넌트로 카테고리 선택 UI -->
  <OffcanvasTab
    title="분류 선택"
    initialHeight={browser ? Math.round(window.innerHeight * 0.6) : 300}
    isOpen={isSelectorOpen}
    closeOffcanvas={closeSelectorOffcanvas}
  >
    <!-- Offcanvas body -->
    <div class="offcanvas-body">
      <!-- cat1 -->
      <div class="cat1-categories category-sector">
        <!-- 대분류 카테고리 리스트 -->
        <div class="category-sector-header">
          <h4>분류</h4>
        </div>
        <!-- 선택된 카테고리들을 보여주는 영역 -->
        <ul class="category-list" style="height: {categoryListHeight};">
          {#each categoryList as category (category.code)}
            <li
              class:selected={checkSelected(1, category, [selectedCat1])}
              class="category-item"
            >
              <!-- li를 클릭하면 선택되도록하는 버튼 === 투명, wh 100% -->
              <button
                class="category-button"
                onclick={() => {
                  selectedCat1 = category;
                  selectedCat2 = null;
                }}
              >
                {category.name}
              </button>
            </li>
          {/each}
        </ul>
        <!-- 선택된 카테고리들을 보여주는 영역 -->
      </div>
      <!-- cat1 -->

      <!-- cat2 -->
      <div class="cat2-categories category-sector">
        <div class="category-sector-header">
          <h4>중분류</h4>
        </div>
        <ul class="category-list" style="height: {categoryListHeight};">
          {#if selectedCat1}
            {#each selectedCat1.item as category (category.code)}
              <li
                class:selected={checkSelected(2, category, [
                  selectedCat1,
                  selectedCat2,
                ])}
                class="category-item"
              >
                <button
                  class="category-button"
                  onclick={async () => {
                    selectedCat2 = category;
                  }}
                >
                  {category.name}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
      <!-- cat2 -->

      <!-- cat3 -->
      <div class="cat3-categories category-sector">
        <div class="category-sector-header">
          <h4>소분류</h4>
        </div>
        <ul class="category-list" style="height: {categoryListHeight};">
          {#if isLoading}
            <p>로딩 중...</p>
          {/if}
          {#if selectedCat1 && selectedCat2}
            {#each selectedCat2.item as category (category.code)}
              <li
                class:selected={checkSelected(3, category, [
                  selectedCat1,
                  selectedCat2,
                  selectedCats,
                ])}
                class="category-item"
              >
                <button
                  class="category-button"
                  onclick={() => {
                    if (!selectedCat1 || !selectedCat2) return;
                    toggleSelectedCats(selectedCat1, selectedCat2, category);
                  }}
                >
                  {category.name}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
      <!-- cat3 -->
    </div>
    <!-- offcanvas body -->

    <!-- 선택 Dock -->
    {#if isDockOpen}
      <div
        id="selected-categories-dock"
        class="selected-categories-dock"
        transition:fly={{ y: 100, duration: 200, easing: backOut }}
      >
        <div class="dock-header">
          <!-- 초기화 버튼 section. 정사각형 -->
          <div class="clear-button-section">
            <!-- 초기화 버튼 -->
            <button
              class="clear-button"
              aria-label="선택된 카테고리 초기화"
              onclick={() => {
                selectedCats = [];
                selectedCat1 = null;
                selectedCat2 = null;
                searchFilter.set(selectedCats); // 카테고리 스토어 초기화
              }}
            >
              <span class="clear-button-text">초기화</span>
              <Fa icon={faRotateLeft} />
            </button>
            <!-- 초기화 버튼 -->
          </div>
          <!-- 초기화 버튼 section -->
          <!-- 적용 버튼 section -->
          <div class="apply-button-section">
            <!-- 적용 버튼 -->
            <button
              class="apply-button"
              aria-label="선택된 카테고리 적용"
              onclick={() => {
                // 선택된 카테고리를 searchFilters에 저장
                searchFilter.set(selectedCats);
                closeSelectorOffcanvas();
              }}
            >
              <span class="clear-button-text">적용</span>
              <Fa icon={faCheck} />
            </button>
          </div>
          <!-- 적용 버튼 section -->
        </div>

        <!-- 선택된 카테고리들을 보여주는 Dock -->
        <div class="dock-body">
          <!-- div clear button section -->
          <!-- div tag list -->
          <div class="category-tag-area">
            <ul class="category-tag-list">
              {#each selectedCats as cat1 (cat1.code)}
                {#each cat1.item as cat2 (cat2.code)}
                  {#each cat2.item as cat3 (cat3.code)}
                    <li class="category-tag-item">
                      <button
                        class="tag-remove-button"
                        onclick={() => toggleSelectedCats(cat1, cat2, cat3)}
                      >
                        <Fa icon={faXmark} />
                      </button>
                      <span class="category-item-name">
                        {`${cat1.name}/${cat2.name}/${cat3.name}`}
                      </span>
                    </li>
                  {/each}
                {/each}
              {/each}
            </ul>
          </div>
          <!-- div tag list -->
        </div>
      </div>
    {/if}
    <!-- 선택 Dock -->
  </OffcanvasTab>
{/if}

<style lang="postcss">
  @import 'tailwindcss';

  .category-selector {
    @apply flex justify-center items-center my-1 w-full h-12;
  }

  .select-button {
    @apply flex border border-slate-400 py-1 px-2 text-base cursor-pointer rounded-md justify-between items-center transition-colors duration-300 w-full h-full;
  }

  .select-button:hover {
    @apply bg-sky-600 text-white;
  }

  .category-main {
    @apply flex flex-col items-center justify-center w-full h-auto overflow-y-auto overflow-x-hidden;
  }

  .offcanvas-body {
    @apply flex flex-row h-full justify-between;
  }

  /* 카테고리 섹터 */
  .category-sector {
    @apply flex-1;
  }

  .cat1-categories {
    @apply grow-3;
  }

  .cat2-categories {
    @apply grow-3;
  }

  .cat3-categories {
    @apply grow-5;
  }

  /* 카테고리 섹터 헤더 */
  .category-sector-header {
    @apply flex h-10 text-center items-center justify-center;
  }

  /* 카테고리 리스트 */
  .category-list {
    @apply border overflow-y-auto min-h-0;
    transition: height 0.5s ease-out;
  }

  /* Webkit 브라우저 스크롤바 상세 스타일 */
  .category-list::-webkit-scrollbar {
    width: 10px;
  }

  /* 스크롤바 트랙과 막대의 스타일 */
  .category-list::-webkit-scrollbar-track {
    @apply bg-transparent my-1;
  }

  /* 스크롤바 막대의 스타일 */
  .category-list::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full border-2 border-transparent bg-clip-content;
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-list::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }

  /* 카테고리 아이템 */
  .category-item {
    @apply w-full border-b border-gray-300 cursor-pointer text-gray-700;
  }

  /* 카테고리 아이템 선택 상태 */
  .category-button {
    @apply w-full h-full text-left py-3 px-2 pr-0 text-base cursor-pointer;
  }

  /* 카테고리 아이템 선택 상태 hover 효과 */
  .category-item:hover {
    @apply bg-gray-100;
  }

  /* 카테고리 아이템 선택 상태 */
  .category-item.selected {
    @apply bg-sky-500 text-white;
  }

  .category-item.selected:hover {
    @apply bg-sky-400;
  }

  /* dock 스타일 */
  .selected-categories-dock {
    @apply flex fixed flex-col h-22 inset-x-0 bottom-0 m-4 px-4 py-2 border border-gray-300 rounded-xl bg-gray-100 z-1050;
  }

  /* dock 헤더 */
  .dock-header {
    @apply flex items-center justify-between pb-2 border-b-3 border-gray-300 w-full h-5;
  }

  /* 초기화 버튼 섹션 */
  .clear-button-section {
    @apply flex flex-row justify-start h-full w-auto ml-2 items-center;
  }

  /* 초기화 버튼 */
  .clear-button {
    @apply rounded-full text-base cursor-pointer justify-center items-center inline-flex gap-2 px-2 transition-colors duration-500 ease-out;
  }

  /* 초기화 버튼 */
  .clear-button:hover {
    @apply bg-gray-300;
  }

  /* 초기화 버튼 텍스트 */
  .clear-button-text {
    @apply font-bold text-center;
  }

  /* 적용 버튼 섹션 */
  .apply-button-section {
    @apply flex flex-row justify-end h-full w-auto mr-2 items-center;
  }

  /* 적용 버튼 */
  .apply-button {
    @apply rounded-full text-base cursor-pointer justify-center items-center inline-flex gap-2 px-2 transition-colors duration-500 ease-out;
  }

  /* 적용 버튼 hover 효과 */
  .apply-button:hover {
    @apply bg-gray-300;
  }

  /* dock의 본문 */
  .dock-body {
    @apply flex flex-row overflow-hidden h-full items-center;
  }

  .category-tag-area {
    @apply inline-flex w-full h-full overflow-x-auto overflow-y-hidden pl-2 items-center;
  }

  .category-tag-area::-webkit-scrollbar {
    @apply h-2;
  }

  .category-tag-area::-webkit-scrollbar-track {
    @apply rounded-full;
  }

  /* 스크롤바 막대의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full border-2 border-transparent bg-clip-content;
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }

  /* dock의 선택된 카테고리 태그 영역 */
  .category-tag-list {
    @apply inline-flex flex-nowrap items-center px-2 list-none gap-1;
  }

  /* 카테고리 태그 아이템 */
  .category-tag-item {
    @apply px-2 flex items-center h-8 justify-center bg-gray-300 rounded-full text-black shrink-0;
  }

  /* 카테고리 태그 제거 버튼 */
  .tag-remove-button {
    @apply bg-transparent text-black cursor-pointer text-base h-5 w-5 rounded-full flex items-center justify-center;
  }

  /* 카테고리 태그 제거 버튼 hover 효과 */
  .tag-remove-button:hover {
    @apply bg-gray-400;
  }

  /* 카테고리 아이템 이름 */
  .category-item-name {
    @apply px-1 text-sm text-black cursor-default;
  }
</style>
