<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { PageData, LocationData } from '$lib/mapTypes';
	// import OffcanvasTab from '$components/ui/OffcanvasTab.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import HamburgerButton from '$components/ui/HamburgerButton.svelte';
	import SideMenu from '$components/features/SideMenu.svelte';
	import StarIcon from '$/lib/components/ui/StarIcon.svelte';
	import TextCollapse from '$/components/ui/TextCollapse.svelte';
	import { enhance } from '$app/forms'; // use:enhance를 위해 추가

	// 1. Props 인터페이스
	interface Props {
		data: PageData;
		form: { message?: string; error?: string } | undefined;
	}

	// 2. $props()
	const { data, form }: Props = $props();

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

	// --- 일반 변수 ---
	let mapContainer: HTMLDivElement; // 지도가 그려질 HTML 요소를 담을 변수
	let map: any; // kakao.maps.Map 객체
	let currentMarkers: Array<{
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
						overview: '정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
					};
				}
			} catch (error) {
				// 네트워크 오류 등 fetch 실패 시 기본 메시지 설정
				console.error('상세 정보 로딩 실패:', error);
				selectedLocation = {
					...location,
					overview: '서버와 통신할 수 없습니다. 네트워크 연결을 확인해 주세요.'
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
			(loc) =>
				loc.title?.toLowerCase().includes(query) || // 제목
				loc.addr1?.toLowerCase().includes(query) || // 주소
				loc.overview?.toLowerCase().includes(query) // 개요
		);

		if (filteredLocations.length > 0) {
			isSearchActive = true; // 검색 중 상태로 변경
			searchResultItems = filteredLocations; // 필터링 된 결과를 상태 변수에 저장
			isSearchResultsPanelVisible = true; // 검색 결과 패널 표시
			const filteredContentIds = new Set(filteredLocations.map((loc) => loc.contentid));
			setMarkersVisibility(true, { filterIds: filteredContentIds }); // 필터링 된 마커만 지도에 표시

			// 필터링 된 검색 결과 마커가 모두 보이도록 지도 중심과 줌 레벨 조정
			const bounds = new window.kakao.maps.LatLngBounds();
			let visibleMarkersForBounds = 0;
			currentMarkers.forEach((Item) => {
				if (Item.marker.getMap()) {
					bounds.extend(Item.marker.getPosition());
					visibleMarkersForBounds++;
				}
			});

			if (map && visibleMarkersForBounds > 0 && !bounds.isEmpty()) {
				map.setBounds(bounds);
				if (map.getLevel() > 10 && visibleMarkersForBounds <= 3) map.setLevel(10);
				else if (map.getLevel() < 5 && visibleMarkersForBounds === 1) map.setLevel(5);
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
					level: 7
				};
				try {
					// 지도 생성 및 클릭 이벤트 리스너 등록
					map = new window.kakao.maps.Map(mapContainer, mapOptions);
					mapClickListener = window.kakao.maps.event.addListener(map, 'click', handleMapClick);

					// 장소 데이터가 있으면 마커 생성
					if (
						map &&
						data &&
						!data.error &&
						data.locations &&
						data.locations.length > 0
					) {
						currentMarkers = [];
						data.locations.forEach((loc) => {
							const lat = loc.mapy ? parseFloat(loc.mapy) : NaN;
							const lng = loc.mapx ? parseFloat(loc.mapx) : NaN;
							if (!isNaN(lat) && !isNaN(lng) && loc.title) {
								const markerPosition = new window.kakao.maps.LatLng(lat, lng);
								const marker = new window.kakao.maps.Marker({
									position: markerPosition,
									map: map
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
									content: iwContent
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
									locationData: loc
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
					console.error('(+page.svelte) 지도 또는 마커 처리 중 에러 발생:', mapInitError);
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
					<h4 class="font-bold text-lg">검색 결과 ({searchResultItems.length}건)</h4>
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
    <Drawer.Content>
        {#if selectedLocation}
            {#if data.session}
                <form
                    method="POST"
                    action="?/addFavorite"
                    use:enhance={() => {
                        return ({ result }) => {
                            if (result.type === 'success' && result.data?.message) {
                                alert(result.data.message);
                            } else if (result.type === 'failure' && result.data?.error) {
                                alert(result.data.error); // 서버에서 error로 보낸 메시지를 받도록 수정
                            }
                        };
                    }}
                >
                    <div
                        class="flex justify-between items-center py-3 px-4 border-b border-neutral-300 dark:border-neutral-600"
                    >
                        <span class="w-8">&nbsp;</span>
                        <h3 class="items-center text-xl justify-center text-center font-bold">
                            {selectedLocation?.title || '상세 정보'}
                        </h3>
                        
                        <button
                            type="submit"
                            class="w-auto flex items-center justify-center gap-1 px-2 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            <StarIcon solid={true} class="w-4 h-4" />
                        </button>
                    </div>

                    <div class="grow">
                        <div class="p-5 h-full overflow-y-auto">
                            <input type="hidden" name="locationId" value={selectedLocation.contentid} />
                            <input type="hidden" name="title" value={selectedLocation.title} />
                            <input type="hidden" name="addr1" value={selectedLocation.addr1} />

                            {#if form?.message}
                                <p class="text-center text-sm mb-4 text-green-500">{form.message}</p>
                            {/if}
                            {#if form?.error}
                                <p class="text-center text-sm mb-4 text-red-500">{form.error}</p>
                            {/if}

                            <p class="text-base text-center leading-relaxed">
                                {#if selectedLocation.overview}
                                    <TextCollapse text={selectedLocation.overview} />
                                {:else}
                                    정보를 불러오는 중...
                                {/if}
                            </p>
                        </div>
                    </div>
                </form> {:else}
                <div
                    class="flex justify-between items-center py-3 px-4 border-b border-neutral-300 dark:border-neutral-600"
                >
                    <span class="w-8">&nbsp;</span>
                    <h3 class="items-center text-xl justify-center text-center font-bold">
                        {selectedLocation?.title || '상세 정보'}
                    </h3>
                    <span class="w-8">&nbsp;</span> </div>
                <div class="grow">
                    <div class="p-5 h-full overflow-y-auto">
                         <p class="text-base text-center leading-relaxed">
                            {#if selectedLocation.overview}
                                <TextCollapse text={selectedLocation.overview} />
                            {:else}
                                정보를 불러오는 중...
                            {/if}
                        </p>
                    </div>
                </div>
            {/if}
        {/if}
    </Drawer.Content>
</Drawer.Root>

		</main>
</div>