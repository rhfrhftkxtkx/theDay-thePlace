<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { PageData, LocationData } from '$lib/mapTypes';
	import OffcanvasTab from '$components/ui/OffcanvasTab/OffcanvasTab.svelte';

	import HamburgerButton from '$components/ui/HamburgerButton.svelte';
	import SideMenu from '$components/features/SideMenu.svelte';

	let isSideMenuOpen = false;

	export let data: PageData;

	const NATIONAL_MUSEUM_OF_KOREA_LAT = 37.5238506;
	const NATIONAL_MUSEUM_OF_KOREA_LNG = 126.9804702;

	let mapContainer: HTMLDivElement;
	let map: any;
	let currentDbMarkers: Array<{
		locationData: LocationData;
		marker: any;
		infowindow: any;
	}> = [];
	let mapClickListener: any = null;
	let selectedLocation: LocationData | null = null;
	let isBottomSheetOpen = false;
	let searchQuery: string = '';
	let searchResultItems: LocationData[] = [];
	let isSearchResultsPanelVisible = false;

	async function openBottomSheet(location: LocationData): Promise<void> {
		selectedLocation = location;
		isBottomSheetOpen = true;

		if (!location.overview) {
			try {
				const response = await fetch(`/api/detail/${location.contentid}`);
				const result = await response.json();
				if (response.ok && result.overview) {
					selectedLocation = { ...location, overview: result.overview };
				} else {
					selectedLocation = { ...location, overview: '정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
				}
			} catch (error) {
				console.error('상세 정보 로딩 실패:', error);
				selectedLocation = { ...location, overview: '서버와 통신할 수 없습니다. 네트워크 연결을 확인해 주세요.' };
			}
		}
	}

	function closeBottomSheet(): void {
		isBottomSheetOpen = false;
		selectedLocation = null;
	}

	function setDbMarkersVisibility(visible: boolean, options?: { filterIds?: Set<number> }): void {
		const filterIds = options?.filterIds;
		currentDbMarkers.forEach((item) => {
			let shouldBeVisible = visible;
			if (visible && filterIds && filterIds.size > 0) {
				shouldBeVisible = filterIds.has(item.locationData.contentid);
			}
			item.marker.setMap(shouldBeVisible ? map : null);
			if (!shouldBeVisible && item.infowindow) item.infowindow.close();
		});
	}

	function clearSearchResultsAndShowAllDbMarkers(): void {
		isSearchResultsPanelVisible = false;
		searchResultItems = [];
		searchQuery = '';
		if (isBottomSheetOpen) closeBottomSheet();
		setDbMarkersVisibility(true);
	}

	function handleMapClick(): void {
		if (isBottomSheetOpen) {
			closeBottomSheet();
		} else if (isSearchResultsPanelVisible || searchResultItems.length > 0) {
			clearSearchResultsAndShowAllDbMarkers();
		}
	}

	async function handleSearch(): Promise<void> {
		const query = searchQuery.toLowerCase().trim();
		if (!query) {
			clearSearchResultsAndShowAllDbMarkers();
			return;
		}

		closeBottomSheet();
		isSearchResultsPanelVisible = false;
		searchResultItems = [];
		const filteredDbLocations = (data.locations || []).filter(
			(loc) =>
				loc.title?.toLowerCase().includes(query) ||
				loc.addr1?.toLowerCase().includes(query) ||
				loc.overview?.toLowerCase().includes(query)
		);

		if (filteredDbLocations.length > 0) {
			searchResultItems = filteredDbLocations;
			isSearchResultsPanelVisible = true;
			const filteredContentIds = new Set(filteredDbLocations.map((loc) => loc.contentid));
			setDbMarkersVisibility(true, { filterIds: filteredContentIds });

			const bounds = new window.kakao.maps.LatLngBounds();
			let visibleMarkersForBounds = 0;
			currentDbMarkers.forEach((dbItem) => {
				if (dbItem.marker.getMap()) {
					bounds.extend(dbItem.marker.getPosition());
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
			setDbMarkersVisibility(false);
		}
	}

	function escapeHTML(str: string | null): string {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
	}

	onMount(() => {
		if (window.kakao && window.kakao.maps) {
			window.kakao.maps.load(() => {
				const mapOptions = {
					center: new window.kakao.maps.LatLng(NATIONAL_MUSEUM_OF_KOREA_LAT, NATIONAL_MUSEUM_OF_KOREA_LNG),
					level: 7
				};
				try {
					map = new window.kakao.maps.Map(mapContainer, mapOptions);
					mapClickListener = window.kakao.maps.event.addListener(map, 'click', handleMapClick);

					if (map && data && !data.error && data.locations && data.locations.length > 0) {
						currentDbMarkers = [];
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
								switch (loc.type) {
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
								window.kakao.maps.event.addListener(marker, 'mouseover', () => {
									infowindow.open(map, marker);
								});
								window.kakao.maps.event.addListener(marker, 'mouseout', () => {
									infowindow.close();
								});
								window.kakao.maps.event.addListener(marker, 'click', () => {
									openBottomSheet(loc);
								});
								currentDbMarkers.push({
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

					setTimeout(() => {
						if (map && map.relayout) map.relayout();
					}, 100);
				} catch (mapInitError: unknown) {
					console.error('(+page.svelte) 지도 또는 DB 마커 처리 중 에러 발생:', mapInitError);
				}
			});
		} else {
			console.error('(+page.svelte) Kakao Maps SDK 찾을 수 없음');
			alert('지도 서비스 초기화 불가.');
		}
	});

	onDestroy(() => {
		if (mapClickListener && window.kakao && window.kakao.maps && map) {
			window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
		}
	});
</script>

<div class="w-screen h-screen flex flex-col">

	<header class="flex-none bg-white shadow-md p-2 flex items-center gap-2 z-10">
		<HamburgerButton on:click={() => (isSideMenuOpen = true)} />
		<form
			class="flex-grow bg-gray-100 p-2 rounded-lg flex gap-2 items-center"
			on:submit|preventDefault={handleSearch}
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
				>검색</button
			>
		</form>
	</header>

	<main class="flex-grow relative">
		<div bind:this={mapContainer} class="w-full h-full"></div>

		<SideMenu bind:isOpen={isSideMenuOpen} />

		{#if data}
			{#if data.error}
				<div class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-red-100 text-red-800 text-sm text-center z-20">
					<strong>데이터 로딩 오류:</strong> {data.error}
				</div>
			{:else if data.locations && data.locations.length === 0}
				<div class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-blue-100 text-blue-800 text-sm text-center z-20">
					표시할 장소 데이터가 없습니다.
				</div>
			{/if}
		{:else}
			<div class="absolute top-4 left-1/2 -translate-x-1/2 p-3 px-4 rounded-md shadow-lg bg-gray-100 text-gray-800 text-sm text-center z-20">
				위치 데이터를 불러오는 중...
			</div>
		{/if}

		{#if isSearchResultsPanelVisible && searchResultItems.length > 0}
			<div class="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] max-h-[40vh] overflow-y-auto" transition:slide={{ duration: 200, axis: 'y' }}>
				<div class="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200 flex justify-between items-center">
					<h4 class="font-bold text-lg">검색 결과 ({searchResultItems.length}건)</h4>
					<button class="text-2xl text-gray-500 hover:text-gray-800" on:click={clearSearchResultsAndShowAllDbMarkers} aria-label="검색 결과 닫기">&times;</button>
				</div>
				<ul>
					{#each searchResultItems as loc (loc.contentid)}
						<li>
							<button type="button" class="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-200" on:click={() => {
								if (map && loc.mapy && loc.mapx) {
									const lat = parseFloat(loc.mapy);
									const lng = parseFloat(loc.mapx);
									if (!isNaN(lat) && !isNaN(lng)) {
										map.panTo(new window.kakao.maps.LatLng(lat, lng));
									}
								}
								openBottomSheet(loc);
							}}>
								<strong class="font-semibold">{loc.title}</strong>
								<p class="text-sm text-gray-600 mt-1">{loc.addr1 || '주소 정보 없음'}</p>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if selectedLocation}
			<OffcanvasTab title={selectedLocation.title || '상세 정보'} isOpen={isBottomSheetOpen} closeOffcanvas={closeBottomSheet} initialHeight={80}>
				<div class="p-5 h-full">
					<div class="w-full h-full overflow-y-auto">
						<p class="text-base text-center leading-relaxed">
							{#if selectedLocation.overview}
								{selectedLocation.overview}
							{:else}
								정보를 불러오는 중...
							{/if}
						</p>
					</div>
				</div>
			</OffcanvasTab>
		{/if}
	</main>
</div>