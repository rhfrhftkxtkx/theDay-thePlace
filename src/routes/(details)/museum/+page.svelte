<script lang="ts">
  import DetailPageLayout from '$/components/DetailPageLayout.svelte';
  import Fa from 'svelte-fa';
  import { faClock } from '@fortawesome/free-solid-svg-icons';
  import * as Card from '$/lib/components/ui/card';
  import * as Carousel from '$/lib/components/ui/carousel';
  import * as Tabs from '$/lib/components/ui/tabs';
  import Badge from '$/lib/components/ui/badge/badge.svelte';
  import TextCollapse from '$/components/ui/TextCollapse.svelte';
  import type {
    VisitKorDetailItem,
    VisitKorDetailIntroItem,
    VisitKorImageItem,
  } from '$/types/detail.types';
  import type { PageData } from './$types';

  import type { CarouselAPI } from '$/lib/components/ui/carousel/context';
  import { onMount } from 'svelte';

  // 즐겨찾기 추가
  import { enhance } from '$app/forms';
	import HeartIcon from '$/lib/components/ui/HeartIcon.svelte';

  // page loaded data
  let { data }: { data: PageData } = $props();
  //  data
  let museum = $state<VisitKorDetailItem | null>(data.museumDetails);
  let museumIntro = $state<VisitKorDetailIntroItem | null>(
    data.museumIntro || null
  );
  let museumImg = $state<VisitKorImageItem[] | null>(data.museumImg || null);
  let cat = $state<string | null>(data.catName || null);
  let exhibitionList = $state(data.exhibitionList || null);

  // 즐겨찾기 추가
  let favoriteIds = $state(data.favoriteLocationIds);
	$effect(() => {
		favoriteIds = data.favoriteLocationIds;
	});
	// 강제 리렌더링을 위한 키
	let rerenderKey = $state(0);


  // carousel api
  let carouselApi = $state<CarouselAPI>();
  let current = $state(0);
  const count = $derived(carouselApi?.scrollSnapList().length || 0);

  let exhibitCarouselApi = $state<CarouselAPI>();
  let exhibitCurrent = $state(0);
  const exhibitCount = $derived(
    exhibitCarouselApi?.scrollSnapList().length || 0
  );

  // 현재 shadcn/ui Carousel 컴포넌트가 탭 변경 시 Embla가 재렌더링되지 않는 문제가 있어
  // 탭 변경 시 key를 변경하여 강제 재렌더링 처리
  // 탭 변경을 감지하고, key를 변경하기 위해 tabValue 상태를 추가함.
  let tabValue = $state('overview');

  // kakao maps
  // map container
  let mapContainer: HTMLDivElement | null = $state(null);
  // map instance
  let map = $state(null);
  // map marker
  let mapMarker = $state(null);

  $effect(() => {
    console.log(data);
    // console.log(ccba);
    // carousel api initialization
    if (carouselApi) {
      current = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        current = carouselApi!.selectedScrollSnap() + 1;
      });
    }

    if (exhibitCarouselApi) {
      exhibitCurrent = exhibitCarouselApi.selectedScrollSnap() + 1;
      exhibitCarouselApi.on('select', () => {
        exhibitCurrent = exhibitCarouselApi!.selectedScrollSnap() + 1;
      });
    }
  });

  onMount(() => {
    // kakao maps initialization
    if (mapContainer && museum && window.kakao && window.kakao.maps) {
      const pos = new window.kakao.maps.LatLng(museum!.mapy, museum!.mapx);
      const options = {
        center: pos,
        level: 3,
      };
      map = new window.kakao.maps.Map(mapContainer, options);
      mapMarker = new window.kakao.maps.Marker({
        position: pos,
        map: map,
      });
    }
  });

  function tabActivateChange(value: string) {
    tabValue = value;
  }
</script>

{#if museum === null || data.result !== 200}
  <div class="p-4">No data available.</div>
{:else}
  <DetailPageLayout>
    <img
      slot="headerImage"
      src={museum!.firstimage}
      alt={museum!.title}
      class="w-full lg:w-[80%] h-full object-cover lg:mx-auto"
    />

    <div slot="badges" class="flex items-center gap-2 mb-2">
      <Badge variant="default">{cat}</Badge>
    </div>

    <div slot="title" class="text-2xl mb-1">
      <h1 class="text-2xl mb-1">
        {museum.title}
      </h1>

      <!-- 즐겨찾기 추가 -->
      {#if data.session}
				{#key rerenderKey}
					{@const isFavorite = museum && favoriteIds?.has(parseInt(museum.contentid))}
					<form
						method="POST"
						action={isFavorite ? '?/deleteFavorite' : '?/addFavorite'}
						use:enhance={() => {
							if (!museum) return;
							// 폼 제출 시작 시: 낙관적 UI 업데이트
							if (isFavorite) {
								favoriteIds.delete(parseInt(museum.contentid));
							} else {
								favoriteIds.add(parseInt(museum.contentid));
							}
							rerenderKey++; // UI 강제 리렌더링

							return ({ result }) => {
								if (!museum) return;
								// 폼 제출 완료 후: 서버 응답 실패 시 롤백
								if (result.type === 'failure') {
									console.error('즐겨찾기 업데이트 실패:', result.data?.error);
									if (isFavorite) {
										favoriteIds.add(parseInt(museum.contentid));
									} else {
										favoriteIds.delete(parseInt(museum.contentid));
									}
									rerenderKey++; // 롤백된 UI 강제 리렌더링
								}
							};
						}}
						class="flex-shrink-0"
					>
						<input type="hidden" name="locationId" value={museum.contentid} />
						<input type="hidden" name="title" value={museum.title} />
						<input type="hidden" name="addr1" value={museum.addr1} />
						<button
							type="submit"
							aria-label={isFavorite ? '즐겨찾기 삭제' : '즐겨찾기 추가'}
							class="flex items-center justify-center w-10 h-10 rounded-full transition-colors {isFavorite
								? 'text-red-500 bg-red-100 hover:bg-red-200'
								: 'text-gray-400 bg-gray-100 hover:bg-gray-200'}"
						>
							<HeartIcon solid={isFavorite} class="w-5 h-5" />
						</button>
					</form>
				{/key}
			{/if}
		</div>

    <div slot="location" class="flex items-center gap-1 text-sm opacity-90">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="9" r="2.5" fill="currentColor" fill-opacity="0">
          <animate
            fill="freeze"
            attributeName="fill-opacity"
            begin="0.7s"
            dur="0.15s"
            values="0;1"
          />
        </circle>
        <path
          fill="none"
          stroke="currentColor"
          stroke-dasharray="48"
          stroke-dashoffset="48"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 20.5c0 0 -6 -7 -6 -11.5c0 -3.31 2.69 -6 6 -6c3.31 0 6 2.69 6 6c0 4.5 -6 11.5 -6 11.5Z"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.6s"
            values="48;0"
          />
        </path>
      </svg>
      <span>{museum.addr1 + museum.addr2}</span>
    </div>

    <div slot="details" class="p-4">
      <div class="flex items-center gap-1 mb-6 text-sm text-muted-foreground">
        <Fa icon={faClock} class="h-3 w-4" />
        <span>{cat}</span>
      </div>
    </div>

    <Tabs.Root
      value="overview"
      class="w-full"
      onValueChange={tabActivateChange}
    >
      <Tabs.List
        class="grid w-full grid-cols-3 bg-neutral-300 dark:bg-neutral-900 px-1 py-1/2 rounded-full"
      >
        <Tabs.Trigger value="overview" class="rounded-full">
          기본 정보
        </Tabs.Trigger>
        <Tabs.Trigger value="images" class="rounded-full">사진</Tabs.Trigger>
        <Tabs.Trigger value="exhibitions" class="rounded-full">
          전시 정보
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview" class="mb-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>상세 정보</Card.Title>
          </Card.Header>
          <Card.Content class="mb-4">
            <TextCollapse
              text={museum.overview || 'No overview available.'}
              maxLines={5}
              showLessText="접기"
              showMoreText="더보기"
            />

            <div class="grid grid-cols-1 gap-4 text-sm">
              <div>
                <h4 class="mb-2 text-muted-foreground">개방</h4>
                <p>
                  운영 시간: {museumIntro!.usetimeculture
                    ? museumIntro!.usetimeculture
                    : '정보 없음'}
                </p>
                <p>
                  휴일: {museumIntro!.restdateculture
                    ? museumIntro!.restdateculture
                    : '정보 없음'}
                </p>
              </div>
              <div>
                <h4 class="mb-2 text-muted-foreground">관람</h4>
                <p>
                  관람 요금: {museumIntro!.usefee
                    ? museumIntro!.usefee
                    : '정보 없음'}
                </p>
                <p>
                  관람 소요 시간: {museumIntro!.spendtime
                    ? museumIntro!.spendtime
                    : '정보 없음'}
                </p>
                <p>
                  유모차 대여: {museumIntro!.chkbabycarriageculture
                    ? museumIntro!.chkbabycarriageculture
                    : '정보 없음'}
                </p>
                <p>
                  애완동물 동반: {museumIntro!.chkpetculture
                    ? museumIntro!.chkpetculture
                    : '정보 없음'}
                </p>
              </div>
              <div>
                <h4 class="mb-2 text-muted-foreground">주차 시설</h4>
                <p>
                  시설: {museumIntro!.parkingculture
                    ? museumIntro!.parkingculture
                    : '정보 없음'}
                </p>
                <p>
                  주차 요금: {museumIntro!.parkingfee
                    ? museumIntro!.parkingfee
                    : '정보 없음'}
                </p>
              </div>
              <div>
                <h4 class="mb-2 text-muted-foreground">위치</h4>
                <div
                  class="rounded-lg bg-secondary/10 h-96 border border-border shadow-md"
                >
                  <div
                    bind:this={mapContainer}
                    class="w-full h-full rounded-lg"
                  ></div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- 사진 -->
      <Tabs.Content value="images" class="mb-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>사진</Card.Title>
          </Card.Header>
          <Card.Content
            class="mb-4 flex flex-col items-center justify-center px-15 my-auto"
          >
            <!-- 현재 Sadcn/ui Carousel 컴포넌트가 탭 변경 시 Embla가 재렌더링되지 않는 문제가 있어
              탭 변경 시 key를 변경하여 강제 재렌더링 처리 -->
            {#key tabValue}
              <Carousel.Root
                orientation="horizontal"
                class="w-full h-full"
                setApi={(emblaApi) => (carouselApi = emblaApi)}
                plugins={[]}
                opts={{
                  loop: false,
                  align: 'center',
                }}
              >
                <Carousel.Content class="">
                  {#if museumImg && museumImg.length > 0}
                    {#each museumImg as mImg (mImg)}
                      <Carousel.Item class="md:basis-1/2 lg:basis-1/3 p-2">
                        <Card.Root class="h-full">
                          <Card.Content
                            class="flex aspect-square items-center justify-center p-6 flex-col"
                          >
                            <img
                              src={mImg.originimgurl}
                              alt={mImg.imgname}
                              class="max-h-full max-w-full object-contain"
                            />
                          </Card.Content>
                        </Card.Root>
                      </Carousel.Item>
                    {/each}
                  {:else}
                    <div class="p-4">No images available.</div>
                  {/if}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
              </Carousel.Root>
            {/key}
            <div class="mt-2 text-sm text-muted-foreground md:hidden">
              {current} / {count}
            </div>
            <div class="mb-4 grid grid-cols-1 gap-4 text-sm">
              <div>
                <strong>출처:</strong>
                문화재청 국가문화유산포털
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- 전시 정보 -->
      <Tabs.Content value="exhibitions" class="mb-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>전시 정보</Card.Title>
          </Card.Header>
          <Card.Content
            class="mb-4 flex flex-col items-center justify-center px-15 my-auto"
          >
            {#key tabValue}
              <Carousel.Root
                orientation="horizontal"
                class="w-full h-full"
                setApi={(emblaApi) => (exhibitCarouselApi = emblaApi)}
                plugins={[]}
                opts={{
                  loop: false,
                  align: 'center',
                }}
              >
                <Carousel.Content class="w-full">
                  {#if exhibitionList && exhibitionList.length > 0}
                    {#each exhibitionList as exhibit (exhibit.exhibition_id)}
                      <Carousel.Item
                        class="md:basis-1/2 lg:basis-1/3 p-2 shadow-lg"
                      >
                        <Card.Root class="h-full">
                          <Card.Content
                            class="h-full p-0 cursor-pointer"
                            onclick={() =>
                              window.open(exhibit.source_url, '_blank')}
                          >
                            <div class="flex flex-col h-full w-full">
                              <img
                                src={exhibit.image_url}
                                alt={exhibit.title}
                                class="h-full w-full object-contain"
                              />
                              <div class="mt-2 text-center text-pretty">
                                <h3 class="font-medium">{exhibit.title}</h3>
                                <p class="text-sm text-muted-foreground">
                                  {exhibit.start_date} ~ {exhibit.end_date}
                                </p>
                              </div>
                            </div>
                          </Card.Content>
                        </Card.Root>
                      </Carousel.Item>
                    {/each}
                  {:else}
                    <div class="p-4 text-pretty">
                      진행 중이거나 진행 예정인 전시정보가 없습니다.
                    </div>
                  {/if}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
              </Carousel.Root>
            {/key}
            <div class="mt-2 text-sm text-muted-foreground md:hidden">
              {exhibitCurrent} / {exhibitCount}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </DetailPageLayout>
{/if}
