// src/routes/api/locations/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { LocationData, KtoApiResponse, KtoApiItem } from '$lib/mapTypes';

const VISITKOREA_API_KEY = env.OPEN_API_KEY;
const VISITKOREA_API_URL = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';

export const GET: RequestHandler = async () => {
	if (!VISITKOREA_API_KEY) {
		const errorMsg = '서버에 API 키가 설정되지 않았습니다.';
		console.error(`[+server.ts] ${errorMsg}`);
		return json({ locations: [], error: errorMsg }, { status: 500 });
	}

	try {
		// 조회할 카테고리 목록 정의
		const categories = [
			{ type: 'museum', cat3: 'A02060100' }, // 박물관
			{ type: 'memorial', cat3: 'A02060300' }, // 기념관
			{ type: 'exhibition', cat3: 'A02060200' } // 전시관
		];

		// 각 카테고리에 대한 API 요청을 Promise 배열로 생성
		const fetchPromises = categories.map(async (category) => {
			const requestUrl = `${VISITKOREA_API_URL}?serviceKey=${VISITKOREA_API_KEY}&numOfRows=10000&MobileApp=TheDay_ThePlace&MobileOS=ETC&_type=json&arrange=A&cat1=A02&cat2=A0206&cat3=${category.cat3}`;
			const response = await fetch(requestUrl);

			if (!response.ok) {
				throw new Error(`API 요청 실패: ${category.type}`);
			}

			const apiResult = (await response.json()) as KtoApiResponse;

			if (apiResult.response?.header?.resultCode !== '0000') {
				throw new Error(`API 에러 (${category.type}): ${apiResult.response?.header?.resultMsg}`);
			}

			const items = apiResult.response.body.items.item || [];
			// 각 아이템에 'type' 속성을 추가하여 반환
			return items.map((item) => ({ ...item, type: category.type }));
		});

		// 모든 API 요청을 동시에 실행하고 결과 기다리기
		const results = await Promise.allSettled(fetchPromises);
		let allLocations: LocationData[] = [];

		results.forEach((result, index) => {
			if (result.status === 'fulfilled') {
				// 성공한 요청의 결과(items 배열)를 allLocations에 추가
				const itemsWithType = result.value;
				const locations = itemsWithType.map((item: KtoApiItem & { type: string }) => ({
					contentid: Number(item.contentid),
					title: item.title,
					mapx: item.mapx,
					mapy: item.mapy,
					type: item.type,
					addr1: item.addr1
				}));
				allLocations = allLocations.concat(locations);
			} else {
				// 실패한 요청은 콘솔에 에러 기록
				console.error(
					`[+server.ts] '${categories[index].type}' 카테고리 데이터 로딩 실패:`,
					result.reason
				);
			}
		});

		console.log(`[+server.ts] TourAPI에서 가져온 총 데이터 ${allLocations.length}개`);
		return json({ locations: allLocations, error: null }, { status: 200 });
	} catch (e) {
		const message = e instanceof Error ? e.message : '알 수 없는 서버 오류 발생';
		console.error('[+server.ts] API 라우트에서 예외 발생:', message);
		return json({ locations: [], error: message }, { status: 500 });
	}
};
