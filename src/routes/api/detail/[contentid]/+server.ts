// src/routes/api/detail/[contentid]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { VisitKorDetailCommon2Response, VisitKorDetailItem } from '$/types/detail.types';

const VISITKOREA_API_KEY: string | undefined = env.OPEN_API_KEY;
// 상세 정보 조회를 위한 'detailCommon1' 오퍼레이션을 사용합니다.
const VISITKOREA_DETAIL_URL = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';

export const GET: RequestHandler = async ({ params }) => {
	const { contentid } = params;

	// console.log(`[detail server] Fetching details for contentId: ${contentid}`);
	// console.log(`Using API Key: ${VISITKOREA_API_KEY ? 'Provided' : 'Not Provided'}`);

	if (!VISITKOREA_API_KEY) {
		return json({ error: '서버에 API 키가 설정되지 않았습니다.' }, { status: 500 });
	}

	try {
		const requestUrl = `${VISITKOREA_DETAIL_URL}?serviceKey=${VISITKOREA_API_KEY}&MobileApp=TheDay_ThePlace&MobileOS=WEB&_type=json&contentId=${contentid}`;
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error('API 서버에서 상세 정보 응답을 받지 못했습니다.');
		}

		const jsonDoc = await response.json();
		const apiResult: VisitKorDetailCommon2Response = jsonDoc.response;

		if (apiResult!.header.resultCode !== '0000') {
			throw new Error(apiResult!.header?.resultMsg || 'API가 상세 정보 조회에 실패했습니다.');
		}

		const item: VisitKorDetailItem = apiResult.body.items.item[0];
		if (!item || !item.overview) {
			// 에러 대신, 개요 정보가 없다는 정상적인 메시지를 보냅니다.
			return json({ overview: '등록된 개요 정보가 없습니다.' }, { status: 200 });
		}
		// overview 정보만 추출하여 반환합니다.
		return json({ overview: item.overview }, { status: 200 });
	} catch (e) {
		const message = e instanceof Error ? e.message : '상세 정보 조회 중 오류 발생';
		return json({ error: message }, { status: 500 });
	}
};
