import { json, type RequestEvent } from '@sveltejs/kit';
import { OPEN_API_KEY } from '$env/static/private';
import type {
	Category,
	SearchedCcbaItem,
	SearchedMuseumItem,
	ServerResponse
} from '$/types/search.types';
import { ccbaItemSearch } from './ccbaSearch';
import { museumItemSearch } from './museumSearch';

// API 정보
const API_KEY: string | undefined = OPEN_API_KEY;

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
		const ccbaFilter: Category | undefined = requestData.searchFilter.find(
			(cat) => cat.code === 'ccba'
		);

		const museumFilter: Category | undefined = requestData.searchFilter.find(
			(cat) => cat.code === 'museum'
		);

		let ccbaItems: SearchedCcbaItem[] = [];
		let museumItems: SearchedMuseumItem[] = [];

		// CCBA 아이템 검색
		if (requestData.searchCcba == undefined && requestData.searchMuseum == undefined) {
			requestData.searchCcba = true;
			requestData.searchMuseum = true;
		}

		try {
			ccbaItems = requestData.searchCcba
				? await ccbaItemSearch(ccbaFilter, requestData.searchKeyword, requestData.pageNo)
				: [];
		} catch (error) {
			console.error('[api/+server.ts] CCBA item search error:', error);
		}

		try {
			// Museum 아이템 검색
			museumItems = requestData.searchMuseum
				? await museumItemSearch(museumFilter, requestData.searchKeyword, requestData.pageNo)
				: [];
		} catch (error) {
			console.error('[api/+server.ts] Museum item search error:', error);
		}

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
