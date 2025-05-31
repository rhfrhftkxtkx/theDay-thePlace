<script lang="ts">
	import { onMount } from 'svelte';
	// +page.ts에서 PageData와 (re-export된) ApiLocationData 타입을 가져옵니다.
	import type { PageData, ApiLocationData } from './+page';
	import { slide } from 'svelte/transition'; // 바텀 시트 애니메이션 효과

	export let data: PageData;

	let mapContainer: HTMLDivElement;
	let map: any; // 카카오맵 지도 객체 (타입은 kakao.maps.Map)
	let currentDbMarkers: Array<{ marker: any; infowindow: any }> = [];

	// --- 바텀 시트를 위한 상태 변수 ---
	let selectedLocation: ApiLocationData | null = null;
	let isBottomSheetOpen = false;
	// --- 바텀 시트를 위한 상태 변수 끝 ---

	// 국립중앙박물관 좌표
	const NATIONAL_MUSEUM_OF_KOREA_LAT = 37.5238506;
	const NATIONAL_MUSEUM_OF_KOREA_LNG = 126.9804702;

	function openBottomSheet(location: ApiLocationData) {
		selectedLocation = location;
		isBottomSheetOpen = true;
	}

	function closeBottomSheet() {
		isBottomSheetOpen = false;
		// 애니메이션 시간을 고려하여 약간의 딜레이 후 selectedLocation을 null로 설정할 수 있습니다.
		// setTimeout(() => { selectedLocation = null; }, 300); // slide out duration
	}

	onMount(() => {
		console.log('(+page.svelte) onMount 시작됨');
		console.log('(+page.svelte) load 함수로부터 받은 data:', data);

		if (window.kakao && window.kakao.maps) {
			const options = {
				center: new window.kakao.maps.LatLng(NATIONAL_MUSEUM_OF_KOREA_LAT, NATIONAL_MUSEUM_OF_KOREA_LNG),
				level: 7, // 초기 확대 레벨
			};

			try {
				map = new window.kakao.maps.Map(mapContainer, options);
				console.log('(+page.svelte) 지도 생성 성공:', map);

				if (map && data && !data.error && data.locations && data.locations.length > 0) {
					currentDbMarkers.forEach(item => {
						item.marker.setMap(null);
						if (item.infowindow) item.infowindow.close();
					});
					currentDbMarkers = [];
					// const bounds = new window.kakao.maps.LatLngBounds(); // 중심 고정을 위해 주석 처리

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
							// bounds.extend(markerPosition); // 중심 고정을 위해 주석 처리
						} else {
							console.warn(`[${loc.title || '제목 없음'}] 유효하지 않은 위치 데이터 또는 제목: mapy=${loc.mapy}, mapx=${loc.mapx}`);
						}
					});

					console.log(`(+page.svelte) ${currentDbMarkers.length}개의 DB 마커 생성 완료`);

					// 국립중앙박물관 중심 고정을 위해 setBounds 관련 코드 주석 처리
					/*
					if (currentDbMarkers.length > 0) {
						map.setBounds(bounds);
						if (map.getLevel() > 9 && currentDbMarkers.length <= 3) { 
							map.setLevel(9);
						}
					}
					*/

				} else if (data && data.error) {
					console.error('(+page.svelte) 위치 데이터 로딩 에러:', data.error);
				} else if (data && (!data.locations || data.locations.length === 0)) {
					console.log('(+page.svelte) 표시할 위치 데이터가 없습니다 (DB 데이터).');
				}

				setTimeout(() => {
					if (map && typeof map.relayout === 'function') { map.relayout(); console.log('map.relayout() called'); }
				}, 100);

			} catch (error: unknown) {
				console.error('(+page.svelte) 지도 또는 마커 생성 중 에러 발생:', error);
			}
		} else {
			console.error('(+page.svelte) Kakao Maps SDK가 로드되지 않았거나, maps 객체를 찾을 수 없습니다.');
		}
	});
</script>

{#if data}
	{#if data.error}
		<div class="status-message error-message">
			데이터 로딩 오류: {data.error}
			{#if data.partialErrorDetails && data.partialErrorDetails.length > 0}
				<ul style="font-size: 0.8em; margin-top: 5px; padding-left: 15px;">
					{#each data.partialErrorDetails as detail}
						<li>{detail.table}: {detail.message}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if data.locations && data.locations.length === 0}
		<div class="status-message info-message">
			표시할 서울특별시 장소 데이터가 없습니다.
		</div>
	{/if}
{:else if !data} <div class="status-message loading-message">
		위치 데이터를 불러오는 중...
	</div>
{/if}

<div bind:this={mapContainer} class="map-fullscreen"></div>

{#if isBottomSheetOpen && selectedLocation}
	<button 
		class="bottom-sheet-overlay" 
		on:click={closeBottomSheet} 
		aria-label="상세 정보 패널 닫기"
		transition:slide={{ duration: 100, axis: 'y' }}
	></button>
	<div class="bottom-sheet" transition:slide={{ duration: 300, axis: 'y' }} role="dialog" aria-modal="true" aria-labelledby="bottomSheetTitle">
		<div class="bottom-sheet-header">
			<h3 id="bottomSheetTitle">{selectedLocation.title || '상세 정보'}</h3>
			<button class="close-button" on:click={closeBottomSheet} aria-label="닫기">&times;</button>
		</div>
		<div class="bottom-sheet-content">
			<p><strong>종류:</strong> 
				{#if selectedLocation.type === 'museum'}박물관
				{:else if selectedLocation.type === 'memorial'}기념관
				{:else if selectedLocation.type === 'exhibition'}전시관
				{:else}장소{/if}
			</p>
			{#if selectedLocation.addr1}
				<p><strong>주소:</strong> {selectedLocation.addr1}</p>
			{/if}
			{#if selectedLocation.overview}
				<div class="overview-content">
					<strong>개요:</strong>
					<p>{@html selectedLocation.overview}</p> 
				</div>
			{/if}
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
	:global(html),
	:global(body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden; /* 바텀 시트가 열려도 전체 스크롤은 방지 */
	}
	.map-fullscreen {
		width: 100vw;
		height: 100vh;
		position: relative; /* 자식 absolute 요소들의 기준점 */
		z-index: 1; /* 바텀시트보다 아래에 있도록 */
	}

	.status-message {
		position: fixed; /* viewport 기준 */
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		padding: 10px 15px;
		border-radius: 5px;
		z-index: 1001; /* 지도 위에 표시 */
		font-size: 0.9em;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}
	.error-message { background-color: rgba(255,0,0,0.8); color: white; }
	.info-message { background-color: rgba(100,100,100,0.8); color: white; }
	.loading-message { background-color: rgba(0,0,0,0.5); color: white; }


	.bottom-sheet-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.3); /* 반투명 검은색 배경 */
		z-index: 998; /* 바텀시트 바로 아래 */
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.bottom-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: calc(100vh / 3); /* 화면 높이의 약 1/3 */
		max-height: 40vh; /* 너무 커지지 않도록 최대 높이 제한 (선택 사항) */
		background-color: white;
		border-top-left-radius: 16px;
		border-top-right-radius: 16px;
		box-shadow: 0 -2px 10px rgba(0,0,0,0.15);
		z-index: 999; /* 다른 요소들 위에 표시 */
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
	}

	.bottom-sheet-header h3 {
		margin: 0;
		font-size: 1.1em;
		/* 긴 제목 처리 */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding-right: 10px; /* 닫기 버튼과의 간격 */
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5em;
		cursor: pointer;
		padding: 0px 5px; /* 패딩 조정 */
		line-height: 1;
		flex-shrink: 0; /* 헤더 제목이 길어도 줄어들지 않도록 */
	}

	.bottom-sheet-content {
		padding: 16px;
		overflow-y: auto; /* 내용이 많으면 스크롤 */
		flex-grow: 1;
	}
	.bottom-sheet-content p {
		margin: 0 0 10px 0;
		font-size: 0.9em;
		line-height: 1.5;
	}
	.bottom-sheet-content strong {
		font-weight: 600;
	}
	.overview-content {
		max-height: 100px; /* 개요 내용이 너무 길 경우 스크롤 (선택 사항) */
		overflow-y: auto;
		border: 1px solid #f0f0f0;
		padding: 8px;
		margin-top: 5px;
		border-radius: 4px;
		font-size: 0.85em;
		background-color: #f9f9f9;
	}
	.overview-content p { /* 개요 내부 p 태그 여백 제거 */
		margin: 0;
		word-break: break-all; /* 긴 영어나 URL 줄바꿈 */
	}
</style>