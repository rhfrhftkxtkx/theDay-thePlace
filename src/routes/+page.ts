// src/routes/+page.ts

import type { PageLoad } from './$types';
// PageData 타입은 최종적으로 컴포넌트가 받을 데이터의 타입이므로,
// 이 load 함수의 반환 타입을 지정하는 데에는 사용하지 않습니다.
// import type { PageData } from '$lib/mapTypes';

// V V V KEY CHANGE HERE V V V
// load 함수의 타입에서 <PageData> 제네릭을 삭제합니다.
export const load: PageLoad = async ({ fetch }) => {
	try {
		// 서버의 api 엔드포인트(/api/locations)로부터 장소 데이터 GET 요청
		const response = await fetch('/api/locations');
		// 응답받은 JSON 데이터를 파싱
		const apiResponse = await response.json();

		// 응답이 실패한 경우 에러 발생
		if (!response.ok) {
			throw new Error(apiResponse.error || 'API로부터 데이터를 가져오는 데 실패했습니다.');
		}

		// 성공 시, 이 함수가 책임지는 'locations' 데이터만 객체로 감싸서 반환합니다.
		// 이 데이터는 나중에 layout에서 온 { session } 데이터와 합쳐집니다.
		return {
			locations: apiResponse.locations || []
		};
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		console.error('(+page.ts) load 함수 에러:', message);

		// 실패 시에도 성공했을 때와 동일한 데이터 구조를 반환합니다.
		// 여기에는 'session'이 포함되지 않아도 괜찮습니다.
		return {
			locations: [],
			error: message
		};
	}
};