<script lang="ts">
	// Svelte Imports
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';

	// Type Imports
	import type { PageData, ApiLocationData } from './+page'; // +page.ts에서 타입 가져오기

	// Props
	export let data: PageData;

	// Constants
	const NATIONAL_MUSEUM_OF_KOREA_LAT = 37.5238506;
	const NATIONAL_MUSEUM_OF_KOREA_LNG = 126.9804702;

	// Map State: 지도와 관련된 상태를 저장하는 변수들
	let mapContainer: HTMLDivElement;
	let map: any; // 카카오맵 지도 객체 (타입은 kakao.maps.Map)
	let currentDbMarkers: Array<{ marker: any; infowindow: any }> = []; // DB 데이터로 생성된 마커, 마커 객체와 마커의 정보창 객체
	let mapClickListener: any = null; // 지도 클릭 이벤트 리스너 참조

	// Bottom Sheet (상세 정보 패널) State : 마커 클릭 시 나타나는 하단 상세 정보 패널 관련 변수들
	let selectedLocation: ApiLocationData | null = null;
	let isBottomSheetOpen = false;
	
	// Search Functionality State : 검색 기능 관련 변수들들
	let searchQuery: string = '';
	let placesService: any; // kakao.maps.services.Places 객체
	let searchResultItems: any[] = []; // 검색 결과 목록 데이터 (Kakao Place 객체)
	let searchResultMapMarkers: any[] = []; // 검색 결과로 지도에 표시된 마커 객체 배열
	let isSearchResultsPanelVisible = false; // 검색 결과 패널 표시 여부

	// --- Helper Functions ---

	// 상세 정보 바텀 시트를 여는 함수
	function openBottomSheet(location: ApiLocationData): void {
		selectedLocation = location;
		isBottomSheetOpen = true;
		isSearchResultsPanelVisible = false; // 상세 정보 열면 검색 결과 목록은 닫기
	}
	// 상세 정보 바텀 시트를 닫는 함수
	function closeBottomSheet(): void {
		isBottomSheetOpen = false;
	}

	// 검색 결과(Kakao Place) 객체를 바텀 시트에서 사용할 ApiLocationData와 유사한 형태로 변환
	function mapPlaceToApiLocationData(place: any): ApiLocationData {
		return {
			contentid: parseInt(place.id) || Date.now() + Math.random(),
			title: place.place_name,
			mapx: place.x, // 경도(string)
			mapy: place.y, // 위도(string)
			type: 'search_result' as any, // 데이터가 '검색 결과'를 나타내는 임시 타입
			addr1: place.address_name, //주소
			overview: place.road_address_name || place.category_name || place.phone || '' //개요요
		};
	}

	// 전체 마커 표시/숨기기 함수
	function setDbMarkersVisibility(visible: boolean): void {
		currentDbMarkers.forEach(item => {
			item.marker.setMap(visible ? map : null);
			if (!visible && item.infowindow) { // 숨길 때 인포윈도우도 닫기
				item.infowindow.close();
			}
		});
	}

	// 검색 결과 초기화 및 DB 마커 다시 표시 함수
	function clearSearchResults(): void {
		isSearchResultsPanelVisible = false;
		searchResultItems = [];
		searchResultMapMarkers.forEach(marker => marker.setMap(null)); // 검색 결과 마커 제거
		searchResultMapMarkers = [];
		setDbMarkersVisibility(true); // DB 마커 다시 표시
		console.log('검색 결과가 초기화되고 DB 마커가 다시 표시되었습니다.');
	}

	// 지도 클릭 시 검색 결과 및 바텀 시트 닫기
	function handleMapClick(): void {
		if (isSearchResultsPanelVisible) {
			clearSearchResults();
		}
		if (isBottomSheetOpen) {
			closeBottomSheet();
		}
	}
	
	// 검색 실행 함수
	async function handleSearch(): Promise<void> {
		if (!searchQuery.trim()) {
			alert('검색어를 입력해주세요.');
			return;
		}
		if (!placesService) {
			alert('검색 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
			return;
		}

		clearSearchResults(); // 이전 검색 결과 및 관련 상태 초기화
		closeBottomSheet();   // 열려있을 수 있는 상세 정보 바텀 시트도 닫기
		setDbMarkersVisibility(false); // 검색 시작 시 DB 마커 숨기기

		const callback = (result: any[], status: any /* kakao.maps.services.Status */): void => {
			if (status === window.kakao.maps.services.Status.OK) {
				if (result.length > 0) {
					searchResultItems = result; // 검색 결과 데이터 저장
					isSearchResultsPanelVisible = true; // 검색 결과 패널 표시

					const bounds = new window.kakao.maps.LatLngBounds();
					
					result.forEach(place => {
						const placeLat = parseFloat(place.y);
						const placeLng = parseFloat(place.x);
						if (isNaN(placeLat) || isNaN(placeLng)) return;

						const placePosition = new window.kakao.maps.LatLng(placeLat, placeLng);
						const marker = new window.kakao.maps.Marker({ position: placePosition, map: map });
						searchResultMapMarkers.push(marker);
						bounds.extend(placePosition);

						const iwContent = `<div style="padding:5px;font-size:12px;text-align:center;">${place.place_name} (검색)</div>`;
						const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });
						window.kakao.maps.event.addListener(marker, 'mouseover', () => { infowindow.open(map, marker); });
						window.kakao.maps.event.addListener(marker, 'mouseout', () => { infowindow.close(); });
						window.kakao.maps.event.addListener(marker, 'click', () => { openBottomSheet(mapPlaceToApiLocationData(place)); });
					});
					map.setBounds(bounds); // 검색된 장소들이 모두 보이도록 지도 범위 조정
				} else {
					alert('검색 결과가 없습니다.');
					setDbMarkersVisibility(true); // 검색 결과 없으면 DB 마커 다시 표시
				}
			} else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
				alert('검색 결과가 없습니다.');
				setDbMarkersVisibility(true);
			} else {
				alert('검색 중 오류가 발생했습니다: ' + status);
				setDbMarkersVisibility(true);
				console.error('장소 검색 오류 상태:', status);
			}
		};
		placesService.keywordSearch(searchQuery, callback); // 검색 실행
	}

	// --- Lifecycle Functions ---

	onMount(() => {
		console.log('(+page.svelte) onMount 시작됨');
		console.log('(+page.svelte) load 함수로부터 받은 data:', data);

		if (window.kakao && window.kakao.maps) {
			window.kakao.maps.load(() => { // SDK의 모든 서비스가 로드된 후 실행
				console.log('(+page.svelte) Kakao Maps SDK 모든 기능 로드 완료됨.');
				
				try {
					placesService = new window.kakao.maps.services.Places();
					console.log('(+page.svelte) Places 서비스 초기화 성공:', placesService);
				} catch (serviceError: unknown) {
					console.error('(+page.svelte) Places 서비스 초기화 실패:', serviceError);
					alert('장소 검색 서비스를 초기화하는 데 실패했습니다.');
					// placesService가 없으면 검색 기능이 동작하지 않으므로, 여기서 추가적인 오류 처리를 할 수 있습니다.
				}

				const mapOptions = { 
					center: new window.kakao.maps.LatLng(NATIONAL_MUSEUM_OF_KOREA_LAT, NATIONAL_MUSEUM_OF_KOREA_LNG),
					level: 7, // 초기 확대 레벨
				};

				try {
					map = new window.kakao.maps.Map(mapContainer, mapOptions);
					console.log('(+page.svelte) 지도 생성 성공:', map);

					mapClickListener = window.kakao.maps.event.addListener(map, 'click', handleMapClick);

					// DB에서 가져온 데이터로 마커 생성
					if (map && data && !data.error && data.locations && data.locations.length > 0) {
						currentDbMarkers.forEach(item => { item.marker.setMap(null); if (item.infowindow) item.infowindow.close(); });
						currentDbMarkers = [];

						data.locations.forEach(loc => {
							const lat = loc.mapy ? parseFloat(loc.mapy) : NaN;
							const lng = loc.mapx ? parseFloat(loc.mapx) : NaN;

							if (!isNaN(lat) && !isNaN(lng) && loc.title) {
								const markerPosition = new window.kakao.maps.LatLng(lat, lng);
								const marker = new window.kakao.maps.Marker({ position: markerPosition, map: map });
								
								let typeName = '';
								switch(loc.type) {
									case 'museum': typeName = '박물관'; break;
									case 'memorial': typeName = '기념관'; break;
									case 'exhibition': typeName = '전시관'; break;
									default: typeName = '장소';
								}
								const iwContent = `<div style="padding:5px;font-size:12px;text-align:center;min-width:120px;"><strong>${loc.title}</strong><br><span style="font-size:10px;color:gray;">(${typeName})</span></div>`;
								const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });

								window.kakao.maps.event.addListener(marker, 'mouseover', () => { infowindow.open(map, marker); });
								window.kakao.maps.event.addListener(marker, 'mouseout', () => { infowindow.close(); });
								window.kakao.maps.event.addListener(marker, 'click', () => { openBottomSheet(loc); });
								
								currentDbMarkers.push({ marker, infowindow });
							} else { 
								console.warn(`[${loc.title || '제목 없음'}] 유효하지 않은 위치 데이터 또는 제목으로 마커/인포윈도우를 생성할 수 없습니다: mapy=${loc.mapy}, mapx=${loc.mapx}`);
							}
						});
						console.log(`(+page.svelte) ${currentDbMarkers.length}개의 DB 마커 생성 완료`);
					} else if (data && data.error) {
						console.error('(+page.svelte) 위치 데이터 로딩 에러:', data.error);
					} else if (data && (!data.locations || data.locations.length === 0)) {
						console.log('(+page.svelte) 표시할 위치 데이터가 없습니다 (DB 데이터).');
					}

					// 초기 로드 시 안정성을 위한 relayout
					setTimeout(() => { 
						if (map && typeof map.relayout === 'function') { 
							map.relayout(); 
							console.log('map.relayout() called'); 
						} 
					}, 100);

				} catch (mapInitError: unknown) { 
					console.error('(+page.svelte) 지도 생성 또는 DB 마커 처리 중 에러 발생:', mapInitError); 
				}
			}); // kakao.maps.load() 콜백의 끝
		} else { 
			console.error('(+page.svelte) Kakao Maps SDK (window.kakao 또는 window.kakao.maps)를 찾을 수 없습니다.');
			alert('지도 서비스를 초기화할 수 없습니다. SDK 로드 상태를 확인해주세요.');
		}
	});

	onDestroy(() => { // 컴포넌트가 파괴될 때 실행
		if (mapClickListener && window.kakao && window.kakao.maps && map) {
			window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
			console.log('Map click listener removed.');
		}
		// 다른 정리 작업이 필요하다면 여기에 추가 (예: 다른 이벤트 리스너 제거)
	});

</script>

<div class="search-bar-container">
	<input 
		type="text" 
		bind:value={searchQuery} 
		placeholder="장소, 주소 검색" 
		on:keydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
		on:click|stopPropagation  
	/>
	<button on:click|stopPropagation={handleSearch}>검색</button>
</div>

{#if data}
	{#if data.error && !isSearchResultsPanelVisible}
		<div class="status-message error-message" style="top: 80px;">
			데이터 로딩 오류: {data.error}
			{#if data.partialErrorDetails && data.partialErrorDetails.length > 0}
				<ul style="font-size: 0.8em; margin-top: 5px; padding-left: 15px;">
					{#each data.partialErrorDetails as detail}
						<li>{detail.table}: {detail.message}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if data.locations && data.locations.length === 0 && !data.error && !isSearchResultsPanelVisible}
		<div class="status-message info-message" style="top: 80px;">
			표시할 서울특별시 장소 데이터가 없습니다.
		</div>
	{/if}
{:else if !data && !isSearchResultsPanelVisible} 
	<div class="status-message loading-message" style="top: 80px;">
		위치 데이터를 불러오는 중...
	</div>
{/if}

<div bind:this={mapContainer} class="map-fullscreen"></div>

{#if isSearchResultsPanelVisible && searchResultItems.length > 0}
	<div class="search-results-panel" transition:slide={{ duration: 200, axis: 'y' }}>
		<div class="panel-header">
			<h4>검색 결과 ({searchResultItems.length}건)</h4>
			<button class="close-panel-button" on:click={clearSearchResults} aria-label="검색 결과 닫기">&times;</button>
		</div>
		<ul>
			{#each searchResultItems as place (place.id)}
				<li>
                    <button 
                        type="button" 
                        class="list-item-button"
                        on:click={() => { 
                            if (map && place.y && place.x) { // map 객체 및 좌표 존재 확인
                                map.panTo(new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)));
                            }
                            openBottomSheet(mapPlaceToApiLocationData(place));
                        }}
                    >
                        <strong>{place.place_name}</strong>
                        <p>{place.road_address_name || place.address_name}</p>
                    </button>
                </li>
			{/each}
		</ul>
	</div>
{/if}

{#if isBottomSheetOpen && selectedLocation}
	<button 
		class="bottom-sheet-overlay" 
		on:click={() => { closeBottomSheet(); if (isSearchResultsPanelVisible) clearSearchResults(); }} 
		aria-label="상세 정보 패널 닫기"
		transition:slide={{ duration: 100, axis: 'y' }}
	></button>
	<div class="bottom-sheet" transition:slide={{ duration: 300, axis: 'y' }} role="dialog" aria-modal="true" aria-labelledby="bottomSheetTitle">
		<div class="bottom-sheet-header">
			<h3 id="bottomSheetTitle">{selectedLocation.title || '상세 정보'}</h3>
			<button class="close-button" on:click={() => { closeBottomSheet(); if (isSearchResultsPanelVisible) clearSearchResults(); }} aria-label="닫기">&times;</button>
		</div>
		<div class="bottom-sheet-content">
			<p><strong>종류:</strong> 
				{#if selectedLocation.type === 'museum'}박물관
				{:else if selectedLocation.type === 'memorial'}기념관
				{:else if selectedLocation.type === 'exhibition'}전시관
				{:else if selectedLocation.type === 'search_result'}검색된 장소
				{:else}장소{/if}
			</p>
			{#if selectedLocation.addr1} <p><strong>주소:</strong> {selectedLocation.addr1}</p> {/if}
			{#if selectedLocation.overview} <div class="overview-content"><strong>개요:</strong><p>{@html selectedLocation.overview}</p></div> {/if}
			<p style="font-size:0.8em; color: #666;">ID: {selectedLocation.contentid}</p>
			<p style="font-size:0.8em; color: #666;">
				좌표: 
				{selectedLocation.mapy ? parseFloat(selectedLocation.mapy).toFixed(6) : 'N/A'}, 
				{selectedLocation.mapx ? parseFloat(selectedLocation.mapx).toFixed(6) : 'N/A'}
			</p>
		</div>
	</div>
{/if}

<style>
	/* Global and Map Styles */
	:global(html), 
	:global(body) { 
		height: 100%; 
		margin: 0; 
		padding: 0; 
		overflow: hidden; 
	}
	.map-fullscreen { 
		width: 100vw; 
		height: 100vh; 
		position: relative; 
		z-index: 1; 
	}

	/* Search Bar Styles */
	.search-bar-container { 
		position: fixed; 
		top: 15px; 
		left: 15px; 
		z-index: 1000; 
		background-color: white; 
		padding: 10px; 
		border-radius: 8px; 
		box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
		display: flex; 
		gap: 8px; 
	}
	.search-bar-container input[type="text"] { 
		padding: 8px 12px; 
		border: 1px solid #ccc; 
		border-radius: 4px; 
		min-width: 280px; 
		font-size: 1em; 
	}
	.search-bar-container button { 
		padding: 8px 15px; 
		border: none; 
		background-color: #5E7FF1; 
		color: white; 
		border-radius: 4px; 
		cursor: pointer; 
		font-size: 1em; 
		font-weight: bold; 
	}
	.search-bar-container button:hover { 
		background-color: #4a6cde; 
	}

	/* Status Message Styles */
	.status-message { 
		position: fixed; 
		top: 80px; 
		left: 50%; 
		transform: translateX(-50%); 
		padding: 10px 15px; 
		border-radius: 5px; 
		z-index: 1001; 
		font-size: 0.9em; 
		box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
		text-align: center;
	}
	.status-message ul {
		font-size: 0.8em; 
		margin-top: 5px; 
		padding-left: 15px;
		text-align: left;
	}
	.error-message { background-color: rgba(255,0,0,0.8); color: white; }
	.info-message { background-color: rgba(100,100,100,0.8); color: white; }
	.loading-message { background-color: rgba(0,0,0,0.5); color: white; }

	/* Search Results Panel Styles */
	.search-results-panel { 
		position: fixed; 
		bottom: 0; 
		left: 0; 
		width: 100%; 
		height: calc(100vh / 2.5); 
		max-height: 45vh; 
		background-color: white; 
		border-top: 1px solid #ddd; 
		box-shadow: 0 -2px 10px rgba(0,0,0,0.1); 
		z-index: 997; 
		display: flex; 
		flex-direction: column; 
		box-sizing: border-box; 
	}
	.panel-header { 
		display: flex; 
		justify-content: space-between; 
		align-items: center; 
		padding: 10px 15px; 
		border-bottom: 1px solid #eee;
		flex-shrink: 0;
	}
	.panel-header h4 { 
		margin: 0; 
		font-size: 1.1em; 
	}
	.close-panel-button { 
		background: none; 
		border: none; 
		font-size: 1.6em; 
		cursor: pointer; 
		line-height: 1; 
		padding: 0 5px; 
	}
	.search-results-panel ul { 
		list-style: none; 
		padding: 0; 
		margin: 0; 
		overflow-y: auto; 
		flex-grow: 1; 
	}
	.search-results-panel li {
		padding: 0; 
		border-bottom: 1px solid #f0f0f0;
	}
	.search-results-panel li:last-child {
		border-bottom: none;
	}
    .list-item-button {
        display: block; 
        width: 100%;
        padding: 12px 15px; 
        background: none;
        border: none;
        cursor: pointer;
        text-align: left; 
        font-size: 0.95em; 
		line-height: 1.4;
    }
    .list-item-button:hover {
		background-color: #f9f9f9;
	}
	.list-item-button p { 
		font-size: 0.85em; 
		color: #555; 
		margin: 4px 0 0 0; 
	}

	/* Bottom Sheet (Detail Panel) Styles */
	.bottom-sheet-overlay { 
		position: fixed; 
		top: 0; 
		left: 0; 
		width: 100%; 
		height: 100%; 
		background-color: rgba(0,0,0,0.3); 
		z-index: 998; 
		border: none; 
		padding: 0; 
		cursor: pointer; 
	}
	.bottom-sheet { 
		position: fixed; 
		bottom: 0; 
		left: 0; 
		width: 100%; 
		height: calc(100vh / 3); 
		max-height: 40vh; 
		background-color: white; 
		border-top-left-radius: 16px; 
		border-top-right-radius: 16px; 
		box-shadow: 0 -2px 10px rgba(0,0,0,0.15); 
		z-index: 999; 
		display: flex; 
		flex-direction: column; 
		box-sizing: border-box; 
	}
	.bottom-sheet-header { 
		display: flex; 
		justify-content: space-between; 
		align-items: center; 
		padding: 12px 16px; 
		border-bottom: 1px solid #eee;
		flex-shrink: 0;
	}
	.bottom-sheet-header h3 { 
		margin: 0; 
		font-size: 1.1em; 
		white-space: nowrap; 
		overflow: hidden; 
		text-overflow: ellipsis; 
		padding-right: 10px; 
	}
	.close-button { /* 바텀 시트 헤더의 닫기 버튼 */
		background: none; 
		border: none; 
		font-size: 1.5em; 
		cursor: pointer; 
		padding: 0px 5px; 
		line-height: 1; 
		flex-shrink: 0; 
	}
	.bottom-sheet-content { 
		padding: 16px; 
		overflow-y: auto; 
		flex-grow: 1; 
	}
	.bottom-sheet-content p { 
		margin: 0 0 10px 0; 
		font-size: 0.9em; 
		line-height: 1.5; 
	}
	.bottom-sheet-content strong { 
		font-weight: 600; /* .list-item-button strong {} 에서도 이 스타일이 적용될 수 있음 (상속) */
	}
	.overview-content { 
		max-height: 100px; 
		overflow-y: auto; 
		border: 1px solid #f0f0f0; 
		padding: 8px; 
		margin-top: 5px; 
		border-radius: 4px; 
		font-size: 0.85em; 
		background-color: #f9f9f9; 
	}
	.overview-content p { 
		margin: 0; 
		word-break: break-all; 
	}
</style>