import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import type { Category } from '$/types/search.types';

const API_KEY: string | undefined = env.OPEN_API_KEY;
const API_URL = 'https://apis.data.go.kr/B551011/KorService2/areaCode2';

interface AreaCodeResponse {
	response: {
		header: {
			resultCode: string;
			resultMsg: string;
		};
		body: {
			items: {
				item: {
					rnum: number;
					code: string;
					name: string;
				}[];
			};
			numOfRows: number;
			pageNo: number;
			totalCount: number;
		};
	};
}

export async function GET({ params }: RequestEvent): Promise<Response> {
	// visitKor는 지역 코드 조회를 제공하므로, 해당 API를 호출하여 지역 코드를 가져옴

	if (!API_KEY) {
		console.error('API_KEY is not defined');
		return Response.json({ error: 'API_KEY is not defined' }, { status: 400 });
	}

	const mobileOS = 'WEB';
	const mobileApp = 'theday-theplace';
	const _type = 'json';
	const numOfRows = 100; // 한 번에 가져올 데이터 수

	try {
		const url = `${API_URL}?MobileOS=${mobileOS}&MobileApp=${mobileApp}&_type=${_type}&numOfRows=${numOfRows}&serviceKey=${API_KEY}`;

		const response: AreaCodeResponse = await fetch(url).then((res) => res.json());

		if (response.response.header.resultMsg !== 'OK') {
			console.error('Failed to fetch area codes:', response.response.header.resultMsg);
			return Response.json({ error: 'Failed to fetch area codes' }, { status: 500 });
		}

		const areaList: Category[] = [];
		areaList.push({ code: '', name: '전체', item: [] });

		response.response.body.items.item.forEach((area) => {
			areaList.push({ code: area.code, name: area.name, item: [] });
		});

		return Response.json(areaList);
	} catch (error) {
		console.error('Error fetching area codes:', error);
		return Response.json({ error: 'Error fetching area codes' }, { status: 500 });
	}
}
