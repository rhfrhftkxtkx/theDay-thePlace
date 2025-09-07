<script lang="ts">
  import { Fa } from 'svelte-fa';
  import {
    faChevronUp,
    faChevronDown,
  } from '@fortawesome/free-solid-svg-icons';
  import { ccbaList, visitKorAreaCode2, searchFilter } from '$/stores/store';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import Button from '$/lib/components/ui/button/button.svelte';
  import * as Select from '$/lib/components/ui/select/index';
  import { type Category } from '$/types/search.types';

  // 오프캔버스 탭을 열고 닫기 위한 상태 변수
  let isSelectorOpen = $state(false);

  let categoryList: Category[] = $state([]);
  let cat2List: Category[] = $state([]);
  let cat3List: Category[] = $state([]);

  // 컴포넌트가 마운트되었는지 여부를 나타내는 변수
  let mounted = $state(false);

  let selectedCategory: Category | undefined = $state(undefined);

  // 현재 선택하려는 카테고리들을 저장하는 변수
  let selectedCat1: string | undefined = $state(undefined);
  let selectedCat2: string | undefined = $state(undefined);
  let selectedCat3: string | undefined = $state(undefined);

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
    // 컴포넌트가 마운트될 때 실행되는 함수
    mounted = true;
    setDefaultCategoryList();
  });
</script>

<!-- CategorySelector.svelte -->
<!-- 카테고리 선택 버튼 -->
<Button
  variant="outline"
  class="w-full justify-between border border-neutral-400 bg-neutral-50 text-black dark:bg-neutral-800 dark:border-neutral-500 rounded-lg px-4 py-2 flex items-center dark:text-white dark:hover:text-white hover:bg-neutral-200 hover:text-black dark:hover:bg-neutral-700 transition-colors duration-300"
  onclick={() => (isSelectorOpen = !isSelectorOpen)}
>
  <span class="text-base">카테고리 필터</span>
  {#if isSelectorOpen}
    <Fa icon={faChevronUp} />
  {:else}
    <Fa icon={faChevronDown} />
  {/if}
</Button>
<!-- 카테고리 선택 영역 -->
{#if isSelectorOpen}
  <div class="my-4 w-full" transition:slide>
    <div class="my-3">
      <div>
        <!-- 대분류 선택 -->
        <label class="block text-sm my-2" for="category1">대분류</label>
        <Select.Root
          type="single"
          bind:value={selectedCat1}
          onValueChange={() => {
            // 대분류가 변하면, categoryList에서 선택된 대분류를 찾아 selectedCategory에 저장
            const cat1 = categoryList.find((cat) => cat.code === selectedCat1);

            // selectedCategory를 대분류로 초기화
            selectedCategory = {
              name: cat1?.name || '',
              code: cat1?.code || '',
              item: [],
            };

            // 중분류 및 소분류 선택 초기화
            selectedCat2 = undefined;
            selectedCat3 = undefined;
            cat2List = cat1?.item || [];
            cat3List = [];

            // 검색 필터 업데이트(교체)
            searchFilter.set(selectedCategory ? [selectedCategory] : []);
          }}
          name="category1"
        >
          <!-- 대분류 선택 트리거 -->
          <Select.Trigger
            class="w-full bg-white dark:bg-neutral-800 text-black dark:text-white transition-colors duration-300"
          >
            {selectedCategory ? selectedCategory.name : '대분류 선택'}
          </Select.Trigger>
          <!-- 대분류 선택 내용 -->
          <Select.Content>
            <!-- categoryList에서 대분류를 선택할 수 있는 항목들 -->
            {#each categoryList as category}
              <Select.Item value={category.code} label={category.name}>
                {category.name}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <!-- 중분류 선택 -->
        <label class="block text-sm my-2" for="category2">중분류</label>
        <Select.Root
          type="single"
          bind:value={selectedCat2}
          name="category2"
          onValueChange={() => {
            // categoryList에서 선택된 대분류를 찾아 그 안에서 중분류를 찾음
            const cat2 = cat2List.find(
              (subcat) => subcat.code === selectedCat2
            );

            // 중분류가 변하면, selectedCategory의 item에 중분류를 설정
            if (cat2 && selectedCategory) {
              selectedCategory.item = [
                {
                  code: cat2.code,
                  name: cat2.name,
                  item: [],
                },
              ];

              // 소분류 초기화
              cat3List = cat2.item || [];
              selectedCat3 = undefined;

              // 검색 필터 업데이트(교체)
              searchFilter.set(selectedCategory ? [selectedCategory] : []);
            }
          }}
        >
          <Select.Trigger
            class="w-full bg-white dark:bg-neutral-800 text-black dark:text-white transition-colors duration-300"
          >
            {selectedCat2 ? selectedCategory?.item[0]?.name : '중분류 선택'}
          </Select.Trigger>
          <Select.Content>
            {#if selectedCategory && cat2List.length > 0}
              <!-- 중분류 선택 항목들 -->
              {#each cat2List as subcategory}
                <Select.Item value={subcategory.code} label={subcategory.name}>
                  {subcategory.name}
                </Select.Item>
              {/each}
              <!-- 중분류가 선택되지 않았을 때의 메시지 -->
            {:else}
              <Select.Group>
                <span class="text-sm text-neutral-500 px-2">
                  대분류를 먼저 선택하세요
                </span>
              </Select.Group>
            {/if}
          </Select.Content>
        </Select.Root>

        <!-- 소분류 선택 -->
        <label class="block text-sm my-2" for="category3">소분류</label>
        <Select.Root
          type="single"
          bind:value={selectedCat3}
          name="category3"
          onValueChange={() => {
            // categoryList에서 선택된 대분류와 중분류를 찾아 그 안에서 소분류를 찾음
            const cat3 = cat3List.find(
              (subsubcat) => subsubcat.code === selectedCat3
            );

            // 소분류가 변하면, selectedCategory의 item[0].item에 소분류를 설정
            if (cat3 && selectedCategory && selectedCategory.item[0]) {
              selectedCategory.item[0].item = [
                {
                  code: cat3.code,
                  name: cat3.name,
                  item: [],
                },
              ];
              // 검색 필터 업데이트(교체)
              searchFilter.set(selectedCategory ? [selectedCategory] : []);
            }
          }}
        >
          <!-- 소분류 선택 트리거 -->
          <Select.Trigger
            class="w-full bg-white dark:bg-neutral-800 text-black dark:text-white transition-colors duration-300"
          >
            <!-- 소분류 선택 트리거 내용 -->
            {selectedCat3
              ? selectedCategory?.item[0]?.item[0]?.name
              : '소분류 선택'}
          </Select.Trigger>
          <!-- 소분류 선택 내용 -->
          <Select.Content>
            {#if selectedCategory && cat3List.length > 0}
              {#if selectedCat2}
                <!-- 소분류 선택 항목들 -->
                {#each cat3List as subSubcategory (subSubcategory.code)}
                  <Select.Item
                    value={subSubcategory.code}
                    label={subSubcategory.name}
                  >
                    {subSubcategory.name}
                  </Select.Item>
                {/each}
                <!-- 중분류가 선택되지 않았을 때의 메시지 -->
              {:else}
                <Select.Group>
                  <span class="text-sm text-neutral-500 px-2">
                    중분류를 먼저 선택하세요
                  </span>
                </Select.Group>
              {/if}
              <!-- 대분류가 선택되지 않았을 때의 메시지 -->
            {:else}
              <Select.Group>
                <span class="text-sm text-neutral-500 px-2">
                  대분류를 먼저 선택하세요
                </span>
              </Select.Group>
            {/if}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>
{/if}
