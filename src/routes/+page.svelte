<script lang="ts">
  import {onMount} from 'svelte';

  let mapContainer: HTMLDivElement; 
  let map: any;

  onMount(() => {
    if(window.kakao && window.kakao.maps){
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 7,
      };
      
      try {
				map = new window.kakao.maps.Map(mapContainer, options);
				console.log('지도 생성 성공:', map);

				// 지도 생성 후 잠시 뒤에 relayout 호출
				setTimeout(() => {
					if (map && typeof map.relayout === 'function') {
						map.relayout();
						console.log('map.relayout() called');
					}
				}, 100); // 0.1초 후 실행

			} catch (error) {
				console.error('지도 생성 중 에러 발생:', error);
			}
		} else {
			console.error('Kakao Maps SDK가 로드되지 않았거나, maps 객체를 찾을 수 없습니다.');
		}

		return () => {
		};
	});
</script>

<div bind:this={mapContainer} class="map-fullscreen"></div>

<style>
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
  }
</style>