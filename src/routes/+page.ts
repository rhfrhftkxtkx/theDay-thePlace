import type { PageLoad } from './$types';
import type { PageData } from '$lib/mapTypes';

export const load: PageLoad<PageData> = async ({ fetch }) => {
	try {
        // 서버의 api 엔드포인트(/api/locations)로부터 장소 데이터 GET 요청
		const response = await fetch('/api/locations');
		// 응답받은 JSON 데이터를 PageData 타입으로 파싱
		const data: PageData = await response.json();
		// 응답이 실패한 경우 에러 발생
		if (!response.ok) {
			throw new Error(data.error || 'API로부터 데이터를 가져오는 데 실패했습니다.');
		}
		// 성공적으로 데이터를 가져왔을 경우, 페이지(+page.svelte)에 데이터 반환
		return data; 

	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		console.error('(+page.ts) load 함수 에러:', message);
		// 실패 시, 에러 정보를 포함한 PageData 객체를 페이지에 전달
		return {
			locations: [],
			error: message
		};
	}
};