import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Category, ServerResponse } from '$lib/searchTypes';
import { ccbaItemSearch } from './ccbaSearch';
import { museumItemSearch } from './museumSearch';

// API 정보
const API_KEY: string | undefined = env.OPEN_API_KEY;

// Client Side에서 POST 요청을 보낼 때의 POST Data 형식
interface ApiRequestData {
	searchKeyword: string;
	searchFilter: Category[];
	searchCcba?: boolean;
	searchMuseum?: boolean;
	pageNo: number;
}

// POST 요청에 대한 응답
export async function POST({ request }: RequestEvent): Promise<Response> {
	// Data를 JSON 형식으로 파싱
	const requestData: ApiRequestData = await request.json();

	// API 키가 정의되어 있는지 확인
	if (!API_KEY) {
		console.error('API_KEY is not defined');
		return json({ error: 'API_KEY is not defined' }, { status: 400 });
	}

	try {
		// 우선, 필터를 뜯어 CCBA와 Meseum으로 분리
		const ccbaFilter: Category = requestData.searchFilter.filter((cat) => cat.code === 'ccba')[0];
		const museumFilter: Category = requestData.searchFilter.filter(
			(cat) => cat.code === 'museum'
		)[0];

		// CCBA 아이템 검색
		const ccbaItems =
			requestData.searchCcba === undefined || requestData.searchCcba
				? await ccbaItemSearch(ccbaFilter, requestData.searchKeyword, requestData.pageNo)
				: [];

		// Museum 아이템 검색
		const museumItems =
			requestData.searchMuseum === undefined || requestData.searchMuseum
				? await museumItemSearch(museumFilter, requestData.searchKeyword, requestData.pageNo)
				: [];

		// 응답 데이터 생성
		const responseData: ServerResponse = {
			ccbaItems: ccbaItems,
			museumItems: museumItems
		};

		// 응답을 JSON 형식으로 반환
		return json(responseData, { status: 200 });

		// CCBA는 API가 Keyword를 parameter로 받지 않으므로, 필터 검색 후,
	} catch (error) {
		console.error('[api/+server.ts] API request error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
	}
}
