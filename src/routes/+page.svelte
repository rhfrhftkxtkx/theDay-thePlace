<script lang="ts">
	import { onMount, onDestroy } from 'svelte'; //
    // onMount: Svelte 컴포넌트가 처음 화면에 딱 그려지고 준비가 되었을 때, 그 직후에 *한 번만* 실행할 코드를 등록하는 함수 
    // onDestroy: Svelte 컴포넌트가 화면에서 사라지기 직전에 실행할 코드를 등록하는 함수
	// onMount에서 등록했던 이벤트 리스너 등을 여기서 정리(제거)하여 메모리 누수를 방지
	import { slide } from 'svelte/transition'; // 애니메이션

	import type { PageData, ApiLocationData } from './+page';

	// Props
	export let data: PageData;

	// 초기 위치 국립중앙박물관 기준
	const NATIONAL_MUSEUM_OF_KOREA_LAT = 37.5238506;
	const NATIONAL_MUSEUM_OF_KOREA_LNG = 126.9804702;

	// 지도 관련 변수
	let mapContainer: HTMLDivElement; // 지도가 그려질 div를 가르키는 변수
	let map: any; // 실제 지도 객체를 저장할 변수
	let currentDbMarkers: Array<{ locationData: ApiLocationData; marker: any; infowindow: any }> = [];
	// locationData는 마커가 특정하는 위치(박물관)에 대한 모든 상세 정보 
	let mapClickListener: any = null; // 지도 클릭 이벤트 관련 정보 저장

	// 하단 상세정보 시트 관련 변수
	let selectedLocation: ApiLocationData | null = null; // 사용자가 선택한 장소의 상세정보 저장 
	let isBottomSheetOpen = false; // 하단 상세정보 시트 Open 여부
	
	// 검색 기능 관련 변수
	let searchQuery: string = ''; // 검색창에 사용자가 입력한 검색어를 저장
	let searchResultItems: ApiLocationData[] = []; // 검색 결과로 필터링 된 장소 데이터 저장
	let isSearchResultsPanelVisible = false; // 검색 결과 목록이 보이는 지 여부
	
	// --- Helper Functions ---

	// 하단 상세정보 시트 여는 함수
	function openBottomSheet(location: ApiLocationData): void {
		selectedLocation = location;
		isBottomSheetOpen = true;
	}

	// 하단 상세정보 시트 닫는 함수
	function closeBottomSheet(): void {
		isBottomSheetOpen = false;
		selectedLocation = null;
	}

	// 마커를 표시하는 함수
	function setDbMarkersVisibility(visible: boolean, options?: { filterIds?: Set<number> }): void {
		//Set: 중복되지 않는 값들의 집합을 저장하는 자료구조
		//has()메소드: 특정 값이 집합 안에 있는지 빠르게 확인할 때 유용
		const filterIds = options?.filterIds;
		currentDbMarkers.forEach(item => { // item은 forEach 안에서 마커, 하단 시트, 위치 정보를 모두 가진 객체체
			let shouldBeVisible = visible; // 각각의 개별 마커가 표시되어야 하는 지 아닌 지 boolean 값을 가짐
			if (visible && filterIds && filterIds.size > 0) {
				shouldBeVisible = filterIds.has(item.locationData.contentid);
			}
			item.marker.setMap(shouldBeVisible ? map : null);
			if (!shouldBeVisible && item.infowindow) item.infowindow.close(); //마커 표시가 false일 때, 하단 시트가 열려 있다면 닫아라.
		});
	}

	// 검색 상태 초기화 후 지도 위 전체 마커 재 생성 함수
	function clearSearchResultsAndShowAllDbMarkers(): void {
		isSearchResultsPanelVisible = false;
		searchResultItems = [];
		searchQuery = ''; 
		if (isBottomSheetOpen) closeBottomSheet();
		setDbMarkersVisibility(true);
	}

	// 지도를 클릭 시 호출될 함수
	function handleMapClick(): void {
		if (isBottomSheetOpen) {
			closeBottomSheet();
		} else if (isSearchResultsPanelVisible || searchResultItems.length > 0) { 
			clearSearchResultsAndShowAllDbMarkers();
		}
	}

	// 검색 함수
	async function handleSearch(): Promise<void> {
		const query = searchQuery.toLowerCase().trim(); // 사용자가 입력한 검색어를 정제해서 저장
		if (!query) {
			clearSearchResultsAndShowAllDbMarkers();
			return;
		}
		
		closeBottomSheet();
		isSearchResultsPanelVisible = false;
		searchResultItems = [];
		// filteredDbLocations는 검색 결과에 맞는 장소 정보를 저장
		const filteredDbLocations = (data.locations || []).filter(loc => // data.locations가 배열로 존재하면 사용 아니면 빈 [] 사용
			loc.title?.toLowerCase().includes(query) ||
			loc.addr1?.toLowerCase().includes(query) ||
			loc.overview?.toLowerCase().includes(query)
		);

		if (filteredDbLocations.length > 0) {
			searchResultItems = filteredDbLocations;
			isSearchResultsPanelVisible = true;
			const filteredContentIds = new Set(filteredDbLocations.map(loc => loc.contentid)); // map()은 배열의 각 요소에 주어진 함수를 실행 후 그 반환 값으로 이루어진 새로운 배열을 생성성
			setDbMarkersVisibility(true, { filterIds: filteredContentIds });                   // 즉 Set은 contentid로 이루어진 집합. 
			// bounds는 마커를 모두 포함하는 최소한의 영역 																				   
			const bounds = new window.kakao.maps.LatLngBounds();
			let visibleMarkersForBounds = 0;
			currentDbMarkers.forEach(dbItem => {
				if(dbItem.marker.getMap()) { 
					bounds.extend(dbItem.marker.getPosition());
					visibleMarkersForBounds++;
				}
			});
			// 검색 장소로 이동
			if (map && visibleMarkersForBounds > 0 && !bounds.isEmpty()) {
				 map.setBounds(bounds);
				 if (map.getLevel() > 10 && visibleMarkersForBounds <=3 ) map.setLevel(10);
				 else if (map.getLevel() < 5 && visibleMarkersForBounds === 1) map.setLevel(5);
			}
		} else {
			alert('검색된 장소가 없습니다.');
			setDbMarkersVisibility(false);
		}
	}

	// --- Lifecycle Functions ---

	onMount(() => {
		if (window.kakao && window.kakao.maps) { // kakao SDK가 제대로 왔다면면
			window.kakao.maps.load(() => {
				const mapOptions = { 
					center: new window.kakao.maps.LatLng(NATIONAL_MUSEUM_OF_KOREA_LAT, NATIONAL_MUSEUM_OF_KOREA_LNG),
					level: 7,
				};
				try { // 지도 생성
					map = new window.kakao.maps.Map(mapContainer, mapOptions);
					mapClickListener = window.kakao.maps.event.addListener(map, 'click', handleMapClick);

					if (map && data && !data.error && data.locations && data.locations.length > 0) {
						currentDbMarkers = [];
						data.locations.forEach(loc => { // 각 장소 정보(loc)에서 위도(mapy)와 경도(mapx)를 가져와 숫자로 변환
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
								currentDbMarkers.push({ marker, infowindow, locationData: loc });
							} else { console.warn(`[${loc.title || '제목 없음'}] 유효하지 않은 위치 데이터: mapy=${loc.mapy}, mapx=${loc.mapx}`); }
						});
					}
					// 지도 안전성을 위한 미세한 텀텀
					setTimeout(() => { if (map && map.relayout) map.relayout(); console.log('map.relayout() called'); }, 100);
				} catch (mapInitError: unknown) { console.error('(+page.svelte) 지도 또는 DB 마커 처리 중 에러 발생:', mapInitError); }
			}); // kakao.maps.load() 콜백의 끝
		} else { console.error('(+page.svelte) Kakao Maps SDK 찾을 수 없음'); alert('지도 서비스 초기화 불가.'); }
	});

	onDestroy(() => { 
		if (mapClickListener && window.kakao && window.kakao.maps && map) {
			window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
		}
	});
</script>

<div class="top-left-controls">
    <form class="search-bar-container" on:submit|preventDefault={handleSearch}>
        <input 
            type="text" 
            bind:value={searchQuery} 
            placeholder="박물관, 기념관, 전시관 검색..." 
        />
        <button type="submit">검색</button>
    </form>
</div>

<div class="filter-buttons-container">
    <a href="/page1" class="filter-button">박물관</a>
    <a href="/page2" class="filter-button">유적지</a>
    <a href="/page3" class="filter-button">소장 박물관</a>
    <a href="/page4" class="filter-button">국보/유물</a>
</div>

{#if data}
	{#if data.error && !isSearchResultsPanelVisible}
		<div class="status-message error-message">
			데이터 로딩 오류: {data.error}
			{#if data.partialErrorDetails && data.partialErrorDetails.length > 0}
				<ul> {#each data.partialErrorDetails as detail} <li>{detail.table}: {detail.message}</li> {/each} </ul>
			{/if}
		</div>
	{:else if data.locations && data.locations.length === 0 && !data.error && !isSearchResultsPanelVisible}
		<div class="status-message info-message">
			표시할 서울특별시 장소 데이터가 없습니다.
		</div>
	{/if}
{:else if !data && !isSearchResultsPanelVisible} 
	<div class="status-message loading-message">
		위치 데이터를 불러오는 중...
	</div>
{/if}

<div bind:this={mapContainer} class="map-fullscreen"></div>

{#if isSearchResultsPanelVisible && searchResultItems.length > 0}
	<div class="search-results-panel" transition:slide={{ duration: 200, axis: 'y' }}>
		<div class="panel-header">
			<h4>검색 결과 ({searchResultItems.length}건)</h4>
			<button class="close-panel-button" on:click={clearSearchResultsAndShowAllDbMarkers} aria-label="검색 결과 닫기">&times;</button>
		</div>
		<ul>
			{#each searchResultItems as loc (loc.contentid)}
				<li>
                    <button type="button" class="list-item-button"
                        on:click={() => { 
                            if (map && loc.mapy && loc.mapx) {
                                const lat = parseFloat(loc.mapy);
                                const lng = parseFloat(loc.mapx);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    map.panTo(new window.kakao.maps.LatLng(lat, lng));
                                }
                            }
                            openBottomSheet(loc);
                        }}>
                        <strong>{loc.title}</strong>
                        <p>{loc.addr1 || '주소 정보 없음'}</p>
                    </button>
                </li>
			{/each}
		</ul>
	</div>
{/if}

{#if isBottomSheetOpen && selectedLocation}
	<button class="bottom-sheet-overlay" on:click={closeBottomSheet} aria-label="상세 정보 패널 닫기" transition:slide={{ duration: 100, axis: 'y' }}></button>
	<div class="bottom-sheet" transition:slide={{ duration: 300, axis: 'y' }} role="dialog" aria-modal="true" aria-labelledby="bottomSheetTitle">
		<div class="bottom-sheet-header">
			<h3 id="bottomSheetTitle">{selectedLocation.title || '상세 정보'}</h3>
			<button class="close-button" on:click={closeBottomSheet} aria-label="닫기">&times;</button>
		</div>
		<div class="bottom-sheet-content">
            <p class="preparation-message">
				...
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
        background-color: #e9e5dc;
    }

    /* --- Search Area Styles (수정됨) --- */
    .top-left-controls {
        position: fixed;
        top: 15px;
        left: 15px;
        right: 15px;
        z-index: 1000;
        display: flex;
        align-items: center;
    }

    .search-bar-container {
        flex-grow: 1;
        background-color: white; 
        padding: 8px;
        border-radius: 8px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
        display: flex; 
        gap: 8px; 
        align-items: center;
        min-width: 0;
    }
    .search-bar-container input[type="text"] { 
        padding: 8px 12px; 
        border-radius: 4px; 
        width: 100%;
        font-size: 1em;
        border: none;
        outline: none;
        background: transparent;
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
        height: 38px;
        white-space: nowrap;
    }
    .search-bar-container button:hover { 
        background-color: #4a6cde; 
    }

	/* --- Filter Buttons Styles --- */
    .filter-buttons-container {
        position: fixed;
        top: 84px;
        left: 15px;
        right: 15px;
        z-index: 1000;
        display: flex;
        gap: 8px;
    }
    .filter-button {
        flex-grow: 1; /* 버튼들이 동일한 비율로 공간을 차지 */
        flex-basis: 0; /* 모든 버튼이 동일한 기본 너비에서 시작 */
        
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-radius: 15px;
        background-color: rgba(255, 255, 255, 0.9);
        color: #333;
        font-size: 0.9em;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.2s, color 0.2s;
        text-decoration: none; 
        text-align: center; /* 버튼 너비가 변하므로 텍스트 중앙 정렬 */
    }

    .filter-button:hover {
        background-color: #f0f0f0;
    }

    /* --- 기타 UI 스타일 --- */
    .status-message { 
        position: fixed; 
        top: 85px; 
        left: 50%; 
        transform: translateX(-50%); 
        padding: 10px 15px; 
        border-radius: 5px; 
        z-index: 1001; 
        font-size: 0.9em; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
        text-align: center;
    }
    
    .bottom-sheet-content {
        flex-grow: 1;
        display: flex;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
    }
    .preparation-message {
        font-size: 1.1em;
        text-align: center;
        line-height: 1.6;
    }
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
        min-height: 25vh;
        max-height: 90vh; 
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
        font-size: 1.4em; 
        font-weight: 600;
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
        padding-right: 10px; 
    }
    .close-button {
        background: none; 
        border: none; 
        font-size: 1.5em; 
        cursor: pointer; 
        padding: 0px 5px; 
        line-height: 1; 
        flex-shrink: 0; 
    }
</style>