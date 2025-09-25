<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { PageData } from './$types'; // SvelteKit이 생성한 PageData 타입을 가져와 layout 데이터까지 인식하도록 합니다.
  import type { LocationData } from '$lib/mapTypes';
  import * as Drawer from '$lib/components/ui/drawer';
  import HamburgerButton from '$components/ui/HamburgerButton.svelte';
  import SideMenu from '$components/features/SideMenu.svelte';
  import HeartIcon from '$/lib/components/ui/HeartIcon.svelte';
  import TextCollapse from '$/components/ui/TextCollapse.svelte';
  import { enhance } from '$app/forms'; // use:enhance를 위해 추가
  import { Button } from '$/lib/components/ui/button';
  import { Badge } from '$/lib/components/ui/badge';
  import { getCcbaItemResponse } from './(search)/api/search/ccbaSearch';

  // Props 인터페이스에서 사용하는 PageData 타입은 './$types'에서 가져온 것
  interface Props {
    data: PageData;
    form: { message?: string; error?: string } | undefined;
  }

  const { data, form }: Props = $props();

  // data prop을 기반으로 한 로컬 반응형 상태(state)를 생성합니다.
  let favoriteIds = $state(data.favoriteLocationIds);

  // $effect 룬을 사용해 data.favoriteLocationIds prop이 변경될 때마다 로컬 상태(favoriteIds)를 동기화
  $effect(() => {
    favoriteIds = data.favoriteLocationIds;
  });

  // 지도 초기 포커스 (국립중앙박물관)
  const NATIONAL_MUSEUM_OF_KOREA_LAT = 37.5238506;
  const NATIONAL_MUSEUM_OF_KOREA_LNG = 126.9804702;

  // --- 상태 변수 ---
  let isSideMenuOpen = $state(false); // 사이드 메뉴 열림 여부 default: 닫힘
  let isBottomSheetOpen = $state(false); // 하단 시트 열림 여부 default: 닫힘
  let selectedLocation: LocationData | null = $state(null); // 선택한 위치(마커) 정보
  let searchQuery: string = $state(''); // 검색어
  let searchResultItems: LocationData[] = $state([]); // 검색 결과 목록
  let isSearchResultsPanelVisible = $state(false); // 검색 결과 패널 표시 여부
  let isSearchActive = $state(false); // 검색 중인지 여부

  let rerenderKey = $state(0); // 강제 리렌더링을 위한 키

  // --- 일반 변수 ---
  let mapContainer: HTMLDivElement; // 지도가 그려질 HTML 요소를 담을 변수
  let map: any; // kakao.maps.Map 객체
  let currentMarkers: Array<{
    locationData: LocationData;
    marker: any;
    infowindow: any;
  }> = []; // 현재 지도에 표시된 모든 마커와 관련 데이터가 담긴 배열
  let currentCcbaMarkers: Array<{
    locationData: LocationData;
    marker: any;
    infowindow: any;
  }> = []; // 현재 지도에 표시된 모든 마커와 관련 데이터가 담긴 배열
  let mapClickListener: any = null; // 지도 클릭 이벤트를 나중에 제거하기 위한 변수

  // --- 함수 ---
  // 위치(마커) 클릭 시 하단 시트 여는 함수
  async function openBottomSheet(location: LocationData): Promise<void> {
    selectedLocation = location; // 클릭된 위치 정보를 상태 변수에 저장
    isBottomSheetOpen = true; // 하단 시트 열기

    if (location.type === 'ccba') {
      if (!location.overviewSource) {
        selectedLocation = {
          ...location,
          overview: '상세 정보가 없습니다.',
        };
        return;
      }
      try {
        const response = await fetch(
          `/api/search/ccbaOverview${location.overviewSource}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const result = await response.json();

        if (response.ok && result) {
          // 상세 정보가 정상적으로 로딩된 경우 상태 변수 업데이트
          selectedLocation = { ...location, overview: result };
        } else {
          // 상세 정보 로딩 실패 시 기본 메시지 설정
          selectedLocation = {
            ...location,
            overview:
              '정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          };
        }
      } catch (error) {
        // 네트워크 오류 등 fetch 실패 시 기본 메시지 설정
        console.error('상세 정보 로딩 실패:', error);
        selectedLocation = {
          ...location,
          overview: '서버와 통신할 수 없습니다. 네트워크 연결을 확인해 주세요.',
        };
      }
      return;
    }

    // 상세 정보(overview)가 없으면 API 호출하여 불러오기
    if (!location.overview) {
      try {
        const response = await fetch(`/api/detail/${location.contentid}`);
        const result = await response.json();
        if (response.ok && result.overview) {
          // 상세 정보가 정상적으로 로딩된 경우 상태 변수 업데이트
          selectedLocation = { ...location, overview: result.overview };
        } else {
          // 상세 정보 로딩 실패 시 기본 메시지 설정
          selectedLocation = {
            ...location,
            overview:
              '정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          };
        }
      } catch (error) {
        // 네트워크 오류 등 fetch 실패 시 기본 메시지 설정
        console.error('상세 정보 로딩 실패:', error);
        selectedLocation = {
          ...location,
          overview: '서버와 통신할 수 없습니다. 네트워크 연결을 확인해 주세요.',
        };
      }
    }
  }

  // 하단 시트 닫는 함수
  function closeBottomSheet(): void {
    isBottomSheetOpen = false;
    selectedLocation = null;
  }

  // 마커 표시/숨기기 함수
  function setMarkersVisibility(
    visible: boolean,
    options?: { filterIds?: Set<number> }
  ): void {
    const filterIds = options?.filterIds;
    currentMarkers.forEach((item) => {
      let shouldBeVisible = visible;
      if (visible && filterIds && filterIds.size > 0) {
        shouldBeVisible = filterIds.has(item.locationData.contentid);
      }
      item.marker.setMap(shouldBeVisible ? map : null);
      if (!shouldBeVisible && item.infowindow) item.infowindow.close();
    });
  }

  // 검색 결과 초기화 및 모든 마커 다시 표시 함수
  function clearSearchResultsAndShowAllMarkers(): void {
    isSearchActive = false;
    isSearchResultsPanelVisible = false;
    searchResultItems = [];
    searchQuery = '';

    // ccba markers만 삭제
    currentCcbaMarkers.forEach((item) => {
      item.marker.setMap(null);
      if (item.infowindow) item.infowindow.close();
    });

    if (isBottomSheetOpen) closeBottomSheet();
    setMarkersVisibility(true);
    // 검색 종료 후 모든 마커를 재 생성할 때 줌 레벨이 9보다 크면 마커 숨기기
    if (map) {
      const currentLevel = map.getLevel();
      if (currentLevel > 9) {
        setMarkersVisibility(false);
      }
    }
  }

  // 지도 클릭 시 동작 처리 함수
  function handleMapClick(): void {
    if (isBottomSheetOpen) {
      closeBottomSheet();
    } else if (isSearchResultsPanelVisible || searchResultItems.length > 0) {
      clearSearchResultsAndShowAllMarkers();
    }
  }

  // 검색 폼 제출 시 동작 처리 함수
  async function handleSearch(event: Event): Promise<void> {
    event.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      clearSearchResultsAndShowAllMarkers();
      return;
    }
    closeBottomSheet();
    isSearchResultsPanelVisible = false;
    searchResultItems = [];
    // 전체 장소 데이터 중 검색어와 일치하는 항목 필터링
    const filteredLocations = (data.locations || []).filter(
      (loc: LocationData) =>
        loc.title?.toLowerCase().includes(query) || // 제목
        loc.addr1?.toLowerCase().includes(query) || // 주소
        loc.overview?.toLowerCase().includes(query) // 개요
    );

    // 유적지나 문화유산을 검색해서 마커를 추가하는 기능
    const searhedCcbaLocations = await getCcbaItemResponse(query, 1, 100);
    // ccba 정보 파싱 및 정보 정리
    const ccbaLocations = searhedCcbaLocations
      .map((item) => ({
        contentid: Number(item.ccbaKdcd + item.ccbaAsno),
        title: item.ccbaMnm1 || '제목 없음',
        mapy: item.latitude || '',
        mapx: item.longitude || '',
        type: 'ccba',
        addr1:
          `${item.ccbaCtcdNm || ''} ${item.ccsiName || ''}`.trim() ||
          '주소 정보 없음',
        overview: null,
        overviewSource: `?ccbaKdcd=${item.ccbaKdcd}&ccbaAsno=${item.ccbaAsno}&ccbaCtcd=${item.ccbaCtcd}`,
      }))
      .filter((loc) => loc.mapx !== '0' && loc.mapy !== '0'); // 유효한 좌표가 있는 항목만 필터링

    // 찾은 ccba 정보에 기반 하여 마커 생성
    ccbaLocations.forEach((loc) => {
      // marker의 위치 정보 확인
      const markerPos = new window.kakao.maps.LatLng(
        parseFloat(loc.mapy),
        parseFloat(loc.mapx)
      );
      const marker = new window.kakao.maps.Marker({
        position: markerPos,
        // map은 현재 메인 화면에 표시된 지도 객체
        map: map,
      });
      const safeTitle = escapeHTML(loc.title);
      const iwContent = `<div style="padding:5px;font-size:12px;text-align:center;min-width:120px;"><strong>${safeTitle}</strong><br><span style="font-size:10px;color:gray;">(유적지/문화재)</span></div>`;
      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent,
      });

      // 이벤트 리스너 등록
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(map, marker);
      });
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
      });
      window.kakao.maps.event.addListener(marker, 'click', () => {
        openBottomSheet(loc);
      });

      // 현재 지도에 표시된 ccba 마커 배열에 추가
      currentCcbaMarkers.push({
        marker,
        infowindow: infowindow,
        locationData: loc,
      });
    });

    if (filteredLocations.length > 0 || ccbaLocations.length > 0) {
      isSearchActive = true; // 검색 중 상태로 변경
      searchResultItems = filteredLocations; // 필터링 된 결과를 상태 변수에 저장
      searchResultItems = searchResultItems.concat(ccbaLocations);
      isSearchResultsPanelVisible = true; // 검색 결과 패널 표시
      const filteredContentIds = new Set(
        filteredLocations.map((loc: LocationData) => Number(loc.contentid))
      ) as Set<number>;

      if (filteredContentIds.size === 0) {
        // 필터링 된 결과가 없으면 빈 Set으로 모든 마커 숨기기
        setMarkersVisibility(false);
      } else {
        setMarkersVisibility(true, { filterIds: filteredContentIds }); // 필터링 된 마커만 지도에 표시
      }

      // 필터링 된 검색 결과 마커가 모두 보이도록 지도 중심과 줌 레벨 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      let visibleMarkersForBounds = 0;

      // 현재 표시된 마커들 중에서 지도에 보이는 마커들의 위치를 기준으로 bounds 확장
      // ccba 마커들도 포함하여 bounds 확장
      [...currentMarkers, ...currentCcbaMarkers].forEach((item) => {
        if (item.marker.getMap()) {
          // marker가 지도에 표시된 Position 가져오기
          const pos = item.marker.getPosition();
          // 위치 정보가 유효한지 확인
          if (isNaN(pos.getLat()) || isNaN(pos.getLng())) return;

          // 위치 정보를 기반으로 bounds 확장
          bounds.extend(item.marker.getPosition());
          visibleMarkersForBounds++;
        }
      });

      if (map && visibleMarkersForBounds > 0 && !bounds.isEmpty()) {
        map.setBounds(bounds);
        if (map.getLevel() > 10 && visibleMarkersForBounds <= 3)
          map.setLevel(10);
        else if (map.getLevel() < 5 && visibleMarkersForBounds === 1)
          map.setLevel(5);
      }
    } else {
      alert('검색된 장소가 없습니다.');
      setMarkersVisibility(false);
    }
  }

  // HTML 특수문자 이스케이프 처리 함수
  function escapeHTML(str: string | null): string {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 장소 유형(type)에 따른 한글명 반환 함수
  function getTypeName(type: string | null): string {
    switch (type) {
      case 'museum':
        return '박물관';
      case 'memorial':
        return '기념관';
      case 'exhibition':
        return '전시관';
      case 'ccba':
        return '문화재/유적지';
      default:
        return '장소';
    }
  }

  // --- 생명주기(Lifecycle) 함수 ---

  // kakao 지도 생성 및 KTO 마커 표시
  onMount(() => {
    // Kakao Maps SDK가 로드된 후 지도 생성
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        const mapOptions = {
          center: new window.kakao.maps.LatLng(
            NATIONAL_MUSEUM_OF_KOREA_LAT,
            NATIONAL_MUSEUM_OF_KOREA_LNG
          ),
          level: 7,
        };
        try {
          // 지도 생성 및 클릭 이벤트 리스너 등록
          map = new window.kakao.maps.Map(mapContainer, mapOptions);
          mapClickListener = window.kakao.maps.event.addListener(
            map,
            'click',
            handleMapClick
          );

          // 장소 데이터가 있으면 마커 생성
          if (
            map &&
            data &&
            !data.error &&
            data.locations &&
            data.locations.length > 0
          ) {
            currentMarkers = [];
            data.locations.forEach((loc: LocationData) => {
              const lat = loc.mapy ? parseFloat(loc.mapy) : NaN;
              const lng = loc.mapx ? parseFloat(loc.mapx) : NaN;
              if (!isNaN(lat) && !isNaN(lng) && loc.title) {
                const markerPosition = new window.kakao.maps.LatLng(lat, lng);
                const marker = new window.kakao.maps.Marker({
                  position: markerPosition,
                  map: map,
                });
                let typeName = '장소';
                switch (
                  loc.type // type에 따른 한글명 매핑
                ) {
                  case 'museum':
                    typeName = '박물관';
                    break;
                  case 'memorial':
                    typeName = '기념관';
                    break;
                  case 'exhibition':
                    typeName = '전시관';
                    break;
                }
                const safeTitle = escapeHTML(loc.title);
                const iwContent = `<div style="padding:5px;font-size:12px;text-align:center;min-width:120px;"><strong>${safeTitle}</strong><br><span style="font-size:10px;color:gray;">(${typeName})</span></div>`;
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: iwContent,
                });

                // 마커에 마우스오버/아웃 및 클릭 이벤트 리스너 등록
                window.kakao.maps.event.addListener(marker, 'mouseover', () => {
                  infowindow.open(map, marker);
                });
                window.kakao.maps.event.addListener(marker, 'mouseout', () => {
                  infowindow.close();
                });
                window.kakao.maps.event.addListener(marker, 'click', () => {
                  openBottomSheet(loc);
                });
                currentMarkers.push({
                  marker,
                  infowindow,
                  locationData: loc,
                });
              } else {
                console.warn(
                  `[${
                    loc.title || '제목 없음'
                  }] 유효하지 않은 위치 데이터: mapy=${loc.mapy}, mapx=${loc.mapx}`
                );
              }
            });
          }

          // 지도의 줌 레벨 변경될 때마다 실행될 이벤트 리스너 등록
          window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
            // 검색 중이 아닌 경우, 줌 레벨이 9보다 크면 마커 숨기기
            if (!isSearchActive) {
              const currentLevel = map.getLevel();
              if (currentLevel > 9) {
                setMarkersVisibility(false);
              } else {
                setMarkersVisibility(true);
              }
            }
          });

          // 지도를 다시 렌더링할 때 약간의 지연으로 안정성 확보
          setTimeout(() => {
            if (map && map.relayout) map.relayout();
          }, 100);
        } catch (mapInitError: unknown) {
          console.error(
            '(+page.svelte) 지도 또는 마커 처리 중 에러 발생:',
            mapInitError
          );
        }
      });
    } else {
      console.error('(+page.svelte) Kakao Maps SDK 찾을 수 없음');
      alert('지도 서비스 초기화 불가.');
    }
  });

  // 컴포넌트가 닫힐 때 이벤트 리스너 제거
  onDestroy(() => {
    if (mapClickListener && window.kakao && window.kakao.maps && map) {
      window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
      window.kakao.maps.event.removeListener(map, 'zoom_changed', () => {});
    }
  });
</script>

<div class="w-screen h-screen flex flex-col">
  <header class="flex-none bg-white shadow-md p-2 flex items-center gap-2 z-10">
    <HamburgerButton on:click={() => (isSideMenuOpen = true)} />
    <form
      class="flex-grow bg-gray-100 p-2 rounded-lg flex gap-2 items-center"
      onsubmit={handleSearch}
    >
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="박물관, 기념관, 전시관 검색..."
        class="px-2 py-1 w-full text-base border-none outline-none bg-transparent"
      />
      <button
        type="submit"
        class="px-4 py-1 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 whitespace-nowrap"
      >
        검색
      </button>
    </form>
  </header>

  <main class="flex-grow relative">
    <div bind:this={mapContainer} class="w-full h-full"></div>

    <SideMenu bind:isOpen={isSideMenuOpen} session={data.session} />

    {#if data}
      {#if data.error}
        <div
          class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-red-100 text-red-800 text-sm text-center z-20"
        >
          <strong>데이터 로딩 오류:</strong>
          {data.error}
        </div>
      {:else if data.locations && data.locations.length === 0}
        <div
          class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-blue-100 text-blue-800 text-sm text-center z-20"
        >
          표시할 장소 데이터가 없습니다.
        </div>
      {/if}
    {:else}
      <div
        class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-gray-100 text-gray-800 text-sm text-center z-20"
      >
        위치 데이터를 불러오는 중...
      </div>
    {/if}

    {#if isSearchResultsPanelVisible && searchResultItems.length > 0}
      <div
        class="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] max-h-[40vh] overflow-y-auto"
        transition:slide={{ duration: 200, axis: 'y' }}
      >
        <div
          class="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200 flex justify-between items-center"
        >
          <h4 class="font-bold text-lg">
            검색 결과 ({searchResultItems.length}건)
          </h4>
          <button
            class="text-2xl text-gray-500 hover:text-gray-800"
            onclick={clearSearchResultsAndShowAllMarkers}
            aria-label="검색 결과 닫기"
          >
            &times;
          </button>
        </div>
        <ul>
          {#each searchResultItems as loc (loc.contentid)}
            <li>
              <button
                type="button"
                class="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-200"
                onclick={() => {
                  if (map && loc.mapy && loc.mapx) {
                    const lat = parseFloat(loc.mapy);
                    const lng = parseFloat(loc.mapx);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      map.panTo(new window.kakao.maps.LatLng(lat, lng));
                    }
                  }
                  openBottomSheet(loc);
                }}
              >
                <strong class="font-semibold">{loc.title}</strong>
                <p class="text-sm text-gray-600 mt-1">
                  {loc.addr1 || '주소 정보 없음'}
                </p>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <Drawer.Root bind:open={isBottomSheetOpen}>
      <Drawer.Content class="flex flex-col">
        {#if selectedLocation}
          {#if data.session}
            {#key rerenderKey}
              {@const isFavorite =
                selectedLocation &&
                favoriteIds?.has(selectedLocation.contentid)}
              <form
                method="POST"
                action={isFavorite ? '?/deleteFavorite' : '?/addFavorite'}
                use:enhance={() => {
                  if (!selectedLocation) return;
                  // 폼 제출 시작 시: 낙관적 UI 업데이트
                  if (isFavorite) {
                    favoriteIds.delete(selectedLocation.contentid);
                  } else {
                    favoriteIds.add(selectedLocation.contentid);
                  }

                  // UI 상태를 변경한 후, key 값을 바꿔서 리렌더링을 강제로 실행
                  rerenderKey++;

                  return ({ result }) => {
                    if (!selectedLocation) return;
                    // 폼 제출 완료 후: 서버 응답에 따라 최종 처리
                    if (result.type === 'failure' && result.data?.error) {
                      console.error(
                        '즐겨찾기 업데이트 실패:',
                        result.data.error
                      );

                      // 만약 원래 즐겨찾기 상태였다면 (isFavorite === true),
                      // UI는 미리 삭제된 것처럼 보였을 것이므로, 실패 시 다시 '추가'해서 원상 복구
                      if (isFavorite) {
                        favoriteIds.add(selectedLocation.contentid);
                      } else {
                        // 반대로 원래 즐겨찾기가 아니었다면 (isFavorite === false),
                        // UI는 미리 추가된 것처럼 보였을 것이므로, 실패 시 다시 '삭제'해서 원상 복구
                        favoriteIds.delete(selectedLocation.contentid);
                      }

                      // 실패 시에도 key 값을 바꿔서 롤백된 상태를 즉시 UI에 반영합니다.
                      rerenderKey++;
                    }
                  };
                }}
                class="flex flex-col grow"
              >
                <div
                  class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700"
                >
                  <div class="w-10"></div>
                  <h3 class="text-lg font-semibold text-center">
                    {selectedLocation?.title || '상세 정보'}
                    <Badge variant="default">
                      {getTypeName(selectedLocation?.type)}
                    </Badge>
                  </h3>
                  <button
                    type="submit"
                    aria-label={isFavorite ? '즐겨찾기 삭제' : '즐겨찾기 추가'}
                    class="flex items-center justify-center w-10 h-10 rounded-full transition-colors {isFavorite
                      ? 'text-red-500 bg-red-100 hover:bg-red-200'
                      : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}"
                  >
                    <HeartIcon solid={isFavorite} class="w-5 h-5" />
                  </button>
                </div>

                <div class="grow overflow-y-auto p-5">
                  <input
                    type="hidden"
                    name="locationId"
                    value={selectedLocation.contentid}
                  />
                  <input
                    type="hidden"
                    name="title"
                    value={selectedLocation.title}
                  />
                  <input
                    type="hidden"
                    name="addr1"
                    value={selectedLocation.addr1}
                  />

                  <div
                    class="text-gray-700 dark:text-gray-300 leading-relaxed text-center"
                  >
                    {#if selectedLocation.overview}
                      <TextCollapse text={selectedLocation.overview} />
                      <Button
                        variant="outline"
                        class="mt-2 w-full"
                        onclick={() => {
                          if (
                            selectedLocation?.type === 'museum' ||
                            selectedLocation?.type === 'memorial' ||
                            selectedLocation?.type === 'exhibition'
                          ) {
                            window.location.href = `/museum?contentId=${selectedLocation.contentid}`;
                            // ccba이면 개별 페이지로 이동
                          } else if (
                            selectedLocation?.type === 'ccba' &&
                            selectedLocation?.overviewSource
                          ) {
                            window.location.href = `/ccba${selectedLocation.overviewSource}`;
                          }
                        }}
                      >
                        자세히 보기
                      </Button>
                    {:else}
                      <p>정보를 불러오는 중...</p>
                    {/if}
                  </div>
                </div>
              </form>
            {/key}
          {:else}
            <div
              class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700"
            >
              <div class="w-10"></div>
              <h3 class="text-lg font-semibold text-center">
                {selectedLocation?.title || '상세 정보'}
                <Badge variant="default">
                  {getTypeName(selectedLocation?.type)}
                </Badge>
              </h3>
              <div class="w-10"></div>
            </div>
            <div class="grow overflow-y-auto p-5">
              <div
                class="text-gray-700 dark:text-gray-300 leading-relaxed text-center"
              >
                {#if selectedLocation.overview}
                  <TextCollapse text={selectedLocation.overview} />
                  <Button
                    variant="outline"
                    class="mt-2 w-full"
                    onclick={() => {
                      if (
                        selectedLocation?.type == 'museum' ||
                        selectedLocation?.type == 'memorial' ||
                        selectedLocation?.type == 'exhibition'
                      ) {
                        window.location.href = `/museum?contentId=${selectedLocation.contentid}`;
                        // ccba이면 개별 페이지로 이동
                      } else if (
                        selectedLocation?.type === 'ccba' &&
                        selectedLocation?.overviewSource
                      ) {
                        window.location.href = `/ccba${selectedLocation.overviewSource}`;
                      }
                    }}
                  >
                    자세히 보기
                  </Button>
                {:else}
                  <p>정보를 불러오는 중...</p>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      </Drawer.Content>
    </Drawer.Root>
  </main>
</div>
