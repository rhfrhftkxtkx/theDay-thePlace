<script lang="ts">
  import DetailPageLayout from '$/components/DetailPageLayout.svelte';
  import Fa from 'svelte-fa';
  import { faClock } from '@fortawesome/free-solid-svg-icons';
  import { Button } from '$/lib/components/ui/button';
  import * as Card from '$/lib/components/ui/card';
  import * as Carousel from '$/lib/components/ui/carousel';
  import * as Tabs from '$/lib/components/ui/tabs';
  import Badge from '$/lib/components/ui/badge/badge.svelte';
  import TextCollapse from '$/components/ui/TextCollapse.svelte';
  import type {
    ccbaDtApiResponse,
    ccbaImageApiItem,
  } from '$/types/detail.types';
  import type { PageData } from './$types';
  import type { CarouselAPI } from '$/lib/components/ui/carousel/context';
  import { onMount } from 'svelte';
  import PinIcon from '$/assets/PinIcon.svelte';

  // page loaded data
  let { data }: { data: PageData } = $props();
  // ccba data
  const ccba: ccbaDtApiResponse | null = $derived(data.ccba);
  const images: ccbaImageApiItem[] | null = $derived(data.imgs);
  const badges: string[] = $derived([
    ccba!.item.bcodeName,
    ccba!.item.ccbaPoss,
    ccba!.item.gcodeName,
    ccba!.item.mcodeName,
    ccba!.item.scodeName,
  ]);

  // carousel api
  let carouselApi = $state<CarouselAPI>();
  let current = $state(0);
  const count = $derived(carouselApi?.scrollSnapList().length || 0);

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
    // console.log(ccba);
    // carousel api initialization
    if (carouselApi) {
      current = carouselApi.selectedScrollSnap() + 1;
      carouselApi.on('select', () => {
        current = carouselApi!.selectedScrollSnap() + 1;
      });
    }
  });

  onMount(() => {
    // kakao maps initialization
    if (mapContainer && ccba && window.kakao && window.kakao.maps) {
      const pos = new window.kakao.maps.LatLng(ccba.latitude, ccba.longitude);

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

{#if ccba === null}
  <div class="p-4">No data available.</div>
{:else}
  <DetailPageLayout>
    <img
      slot="headerImage"
      src={ccba.item.imageUrl}
      alt={ccba.item.ccmaName}
      class="w-full lg:w-[80%] h-full object-cover lg:mx-auto"
    />

    <div slot="badges" class="flex items-center gap-2 mb-2">
      <Badge variant="default">{ccba.item.ccmaName}</Badge>
      {#each badges as badge (badge)}
        <Badge variant="outline" class="text-white border-white">
          {badge}
        </Badge>
      {/each}
    </div>

    <div slot="title" class="text-2xl mb-1">
      <h1 class="text-2xl mb-1">
        {ccba.item.ccbaMnm1}
      </h1>
      <h2 class="text-xl opacity-90">
        ({ccba.item.ccbaMnm2})
      </h2>
    </div>

    <div slot="location" class="flex items-center gap-1 text-sm opacity-90">
      <PinIcon />
      <span>{ccba.item.ccbaLcad}</span>
    </div>

    <div slot="details" class="p-4">
      <div class="flex items-center gap-1 mb-6 text-sm text-muted-foreground">
        <Fa icon={faClock} class="h-3 w-4" />
        <span>{ccba.item.ccceName}</span>
      </div>
    </div>

    <Tabs.Root
      value="overview"
      class="w-full"
      onValueChange={tabActivateChange}
    >
      <Tabs.List
        class="grid w-full grid-cols-2 bg-neutral-300 dark:bg-neutral-900 px-1 py-1/2 rounded-full"
      >
        <Tabs.Trigger value="overview" class="rounded-full">
          기본 정보
        </Tabs.Trigger>
        <Tabs.Trigger value="images" class="rounded-full">사진</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview" class="mb-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>상세 정보</Card.Title>
          </Card.Header>
          <Card.Content class="mb-4">
            <TextCollapse
              text={ccba.item.content}
              maxLines={5}
              showLessText="접기"
              showMoreText="더보기"
            />

            <div class="grid grid-cols-1 gap-4 text-sm">
              <div>
                <h4>위치</h4>
                <div
                  class="rounded-lg bg-secondary/10 h-96 border border-border shadow-md"
                >
                  <div
                    bind:this={mapContainer}
                    class="w-full h-full rounded-lg"
                  ></div>
                </div>
                <Button
                  variant="outline"
                  class="mt-4 p-0 w-full"
                  onclick={() => {
                    const naverMapAppUrl = `nmap://place?lat=${ccba.latitude}&lng=${ccba.longitude}&name=${ccba.item.ccbaMnm1}&appname=${import.meta.env.VITE_APP_NAME}`;
                    const naverMapWebUrl = `https://map.naver.com?lng=${ccba.longitude}&lat=${ccba.latitude}&title=${ccba.item.ccbaMnm1}`;

                    location.href = naverMapAppUrl;
                    setTimeout(() => {
                      window.open(naverMapWebUrl, '_blank');
                    }, 500);
                  }}
                >
                  <PinIcon />
                  길 찾기 (네이버 지도)
                </Button>
                <Button
                  variant="outline"
                  class="mt-4 p-0 w-full"
                  onclick={() => {
                    const googleMapWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${ccba.latitude},${ccba.longitude}`;
                    setTimeout(() => {
                      window.open(googleMapWebUrl, '_blank');
                    }, 500);
                  }}
                >
                  <PinIcon />
                  길 찾기 (구글 지도)
                </Button>
                <Button
                  variant="outline"
                  class="mt-4 p-0 w-full"
                  onclick={() => {
                    if (map) {
                      const kakaoMapAppUrl = `kakaomap://map?p=${ccba.latitude},${ccba.longitude}(${ccba.item.ccbaMnm1})`;
                      const kakaoMapWebUrl = `https://map.kakao.com/link/map/${ccba.item.ccbaMnm1},${ccba.latitude},${ccba.longitude}`;

                      location.href = kakaoMapAppUrl;
                      setTimeout(() => {
                        window.open(kakaoMapWebUrl, '_blank');
                      }, 500);
                    }
                  }}
                >
                  <PinIcon />
                  길 찾기 (카카오맵)
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
      <Tabs.Content value="images" class="mb-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>사진</Card.Title>
          </Card.Header>
          <Card.Content
            class="mb-4 flex flex-col items-center justify-center px-15"
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
                  {#if images && images.length > 0}
                    {#each images as img (img.imageUrl)}
                      <Carousel.Item class="md:basis-1/2 lg:basis-1/3 p-2">
                        <Card.Root class="h-full">
                          <Card.Content
                            class="flex aspect-square items-center justify-center p-6 flex-col my-auto"
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.ccimDesc}
                              class="max-h-full max-w-full object-contain"
                            />
                            {#if img.ccimDesc}
                              <div
                                class="mt-2 text-sm text-center text-muted-foreground"
                              >
                                {img.ccimDesc}
                              </div>
                            {/if}
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
    </Tabs.Root>
  </DetailPageLayout>
{/if}
