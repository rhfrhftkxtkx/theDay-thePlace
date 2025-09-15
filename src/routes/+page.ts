// src/routes/locations/+page.ts

import type { PageLoad } from './$types';
import type { PageData } from '$lib/mapTypes';

export const load: PageLoad<PageData> = async ({ fetch }) => {
	try {
        // API에 데이터를 요청하고, 응답을 PageData 타입으로 기대합니다.
		const response = await fetch('/api/locations');
		const data: PageData = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'API로부터 데이터를 가져오는 데 실패했습니다.');
		}

		return data; // 성공 시, 받은 데이터를 그대로 페이지에 전달

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