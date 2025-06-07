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

  let { initCategoryList }: { initCategoryList?: Category[] } = $props();

  let categoryList: Category[] = $state([]);

  // 오프캔버스 탭을 열고 닫기 위한 상태 변수
  let isOpen = $state(false);

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
      ? 'calc(100% - 115px - 3rem)' // Dock이 열려있을 때
      : 'calc(100% - 35px)' // Dock이 닫혀있을 때
  );

  function toggleSelectedCats(target: Category): void {
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
  }

  // 선택된 카테고리가 현재 선택된 카테고리인지 확인하는 함수
  function checkSelected(
    depth: 1 | 2 | 3,
    category: Category,
    dependency: any
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
    isOpen = true;
    // 오프캔버스가 열릴 때 선택된 카테고리와 상태를 초기화
    if (mounted) {
      selectedCat1 = null;
      selectedCat2 = null;
      // 선택된 카테고리들을 초기화
      selectedCats = get(searchFilter);
    }
  }

  // 오프캔버스 탭을 닫는 함수
  function closeOffcanvas(): void {
    isOpen = false;
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
  <div class="category-tag-area">
    <ul class="category-tag-list">
      {#each selectedCats as cat1 (cat1.code)}
        {#each cat1.item as cat2 (cat2.code)}
          {#each cat2.item as cat3 (cat3.code)}
            <li class="category-tag-item">
              <button
                class="tag-remove-button"
                onclick={() => {
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
                  toggleSelectedCats(parameterCat);
                }}
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

<!-- OffcanvasTab 컴포넌트로 카테고리 선택 UI -->
<OffcanvasTab title="분류 선택" bind:isOpen {closeOffcanvas}>
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
                  toggleSelectedCats({
                    code: selectedCat1.code,
                    name: selectedCat1.name,
                    item: [
                      {
                        code: selectedCat2.code,
                        name: selectedCat2.name,
                        item: [category],
                      },
                    ],
                  });
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
  <div
    id="selected-categories-dock"
    class="selected-categories-dock"
    class:dock-display={isDockOpen}
    class:dock-closed={false}
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
            closeOffcanvas();
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
                    onclick={() => {
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
                      toggleSelectedCats(parameterCat);
                    }}
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
  <!-- 선택 Dock -->
</OffcanvasTab>

<style>
  /* 카테고리 선택기 */
  .category-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.5rem 0;
    padding: 0;
    width: 100%;
    height: 60px;
  }

  /* 카테고리 선택 버튼 */
  .select-button {
    display: flex;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 10px;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.3s ease;
    width: 100%;
    height: 100%;
  }

  /* 카테고리 선택 버튼 hover 효과 */
  .select-button:hover {
    background-color: var(--hover-color);
  }

  .category-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  /* 오프캔버스 탭 */
  .offcanvas-body {
    display: flex;
    flex-direction: row;
    margin: 0;
    padding: 0;
    height: 100%;
    justify-content: space-between;
  }

  /* 카테고리 섹터 */
  .category-sector {
    flex: 1;
  }

  .cat1-categories {
    flex-grow: 3;
  }

  .cat2-categories {
    flex-grow: 3;
  }

  .cat3-categories {
    flex-grow: 5;
  }

  /* 카테고리 섹터 헤더 */
  .category-sector-header {
    display: flex;
    height: 35px;
    margin: 0;
    padding: 0;
    text-align: center;
    justify-content: center;
    align-items: center;
  }

  /* 카테고리 섹터 헤더 제목 */
  .category-sector-header h4 {
    margin: 0;
    padding: 0;
  }

  /* 카테고리 리스트 */
  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid #999;
    overflow-y: auto;
    min-height: 0;
    transition: height 0.5s ease-in-out;
  }

  /* Webkit 브라우저 스크롤바 상세 스타일 */
  .category-list::-webkit-scrollbar {
    width: 10px; /* 스크롤바의 너비 */
  }

  /* 스크롤바 트랙과 막대의 스타일 */
  .category-list::-webkit-scrollbar-track {
    background: transparent; /* 스크롤바 트랙 배경을 투명하게 */
    margin: 2px 0; /* 트랙의 상하 여백 (선택 사항) */
  }

  /* 스크롤바 막대의 스타일 */
  .category-list::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3); /* 스크롤바 막대 색상 */
    border-radius: 10px; /* 스크롤바 막대 둥글게 */
    border: 2px solid transparent; /* 막대 주변에 투명 테두리를 주어 트랙과 약간의 간격을 만듦 (선택 사항) */
    background-clip: content-box; /* 테두리 안쪽으로 배경색을 적용 */
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-list::-webkit-scrollbar-thumb:hover {
    background-color: #555; /* 마우스 오버 시 스크롤바 막대 색상 */
  }

  /* 카테고리 아이템 */
  .category-item {
    width: 100%;
    margin: 0;
    padding: 0.5rem 0;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
  }

  /* 카테고리 아이템 선택 상태 */
  .category-button {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    text-align: left;
    padding: 0.5rem;
    padding-right: 0;
    font-size: 1rem;
    color: #333;
    cursor: pointer;
  }

  /* 카테고리 아이템 선택 상태 hover 효과 */
  .category-button:hover {
    background-color: var(--hover-background-color);
  }

  /* 카테고리 아이템 선택 상태 */
  .category-item.selected {
    background-color: var(--selected-background-color);
    color: var(--selected-text-color);
  }

  /* dock 스타일 */
  .selected-categories-dock {
    display: flex;
    position: fixed;
    flex-direction: column;
    height: 80px;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 1rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 30px;
    background-color: var(--background-color);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1050;
    transform: translateY(calc(100% - 2rem)); /* 초기 상태: 화면 아래로 숨김 */
    opacity: 0;
    transition:
      opacity 0.2s ease-in-out,
      transform 0.5s ease-in-out;
  }

  /* dock 헤더 */
  .dock-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    padding-bottom: 0.5rem;
    width: calc(100% - 1rem);
    height: 25%;
    border-bottom: 3px solid var(--border-color);
  }

  /* 초기화 버튼 섹션 */
  .clear-button-section {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: start;
    flex-direction: row;
    height: 100%;
    width: 100px;
    margin: 0 0 0 1rem;
    padding: 0;
  }

  /* 초기화 버튼 */
  .clear-button {
    background: transparent;
    border: none;
    border-radius: 100%;
    font-size: 95%;
    color: var(--text-color);
    cursor: pointer;
    padding: 0;
    transition: color 0.3s ease;
    justify-content: center;
    align-items: center;
  }

  /* 초기화 버튼 hover 효과 */
  .clear-button-text {
    font-weight: bold;
    color: var(--text-color);
    text-align: center;
  }

  .apply-button-section {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: end;
    flex-direction: row;
    height: 100%;
    width: 100%;
    margin: 0 1rem 0 0;
    padding: 0;
    right: 0;
  }

  /* 적용 버튼 */
  .apply-button {
    background: none;
    border: none;
    font-size: 95%;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
    justify-content: center;
    align-items: center;
  }

  /* dock의 본문 */
  .dock-body {
    display: flex;
    /*align-items: center;*/
    overflow: hidden;
    flex-direction: row;
    margin: 0.5rem 0 0 0;
    padding: 0;
    height: 75%;
  }

  .category-tag-area {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 0 0 0;
  }

  .category-tag-area::-webkit-scrollbar {
    height: 8px;
  }

  .category-tag-area::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }

  /* 스크롤바 막대의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3); /* 스크롤바 막대 색상 */
    border-radius: 10px; /* 스크롤바 막대 둥글게 */
    border: 2px solid transparent; /* 막대 주변에 투명 테두리를 주어 트랙과 약간의 간격을 만듦 (선택 사항) */
    background-clip: content-box; /* 테두리 안쪽으로 배경색을 적용 */
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb:hover {
    background-color: #555; /* 마우스 오버 시 스크롤바 막대 색상 */
  }

  .category-tag-area {
    scrollbar-width: thin; /* Firefox에서 스크롤바를 얇게 */
    scrollbar-color: rgba(0, 0, 0, 0.3) transparent; /* Firefox에서 스크롤바 색상 */
  }

  /* dock의 선택된 카테고리 태그 영역 */
  .category-tag-list {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    padding: 0 1rem;
    margin: 0;
    display: flex;
    list-style: none;
    gap: 0.5rem;
  }

  /* 카테고리 태그 아이템 */
  .category-tag-item {
    margin: 0;
    padding: 0.25rem 0.5rem;
    display: flex;
    align-items: center;
    height: 26px;
    justify-content: center;
    background-color: #bdbdbd;
    border-radius: 26px;
    color: var(--tag-text-color);
    flex-shrink: 0;
  }

  /* 카테고리 태그 제거 버튼 */
  .tag-remove-button {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    font-size: 1rem;
    margin: 0;
    padding: 0;
    height: 20px;
    width: 20px;
    border-radius: 20px;
  }

  /* 카테고리 태그 제거 버튼 hover 효과 */
  .tag-remove-button:hover {
    background-color: #777;
  }

  /* 카테고리 아이템 이름 */
  .category-item-name {
    padding: 0 0.25rem;
    background-color: var(--tag-background-color);
    border-radius: 4px;
    color: var(--tag-text-color);
    font-size: 0.9rem;
    cursor: default;
  }

  /* dock이 열릴 때 애니메이션 효과 */
  @keyframes dockSlideUp {
    0% {
      opacity: 0;
      transform: translateY(calc(100% + 1rem));
    }
    30% {
      opacity: 1;
      transform: translateY(-10px); /* 살짝 위로 튕기는 효과 */
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* dock이 닫힐 때 애니메이션 효과 */
  @keyframes dockSlideDown {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(-10px); /* 살짝 위로 튕기는 효과 */
    }
    100% {
      opacity: 0;
      transform: translateY(100%);
    }
  }

  /* dock이 열려있을 때와 닫혀있을 때의 클래스 */
  .dock-display {
    animation: dockSlideUp 0.5s ease-in-out forwards;
  }
  .dock-closed {
    animation: dockSlideDown 0.5s ease-in-out forwards;
  }
</style>
