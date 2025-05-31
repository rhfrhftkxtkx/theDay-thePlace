// src/routes/api/locations/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types'; // SvelteKit이 생성한 타입 사용
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// API가 반환하는 각 위치 항목의 타입을 정의 (다른 파일에서도 import하여 사용 가능)
export interface ApiLocationData {
	contentid: number;
	title: string | null;
	mapx: string | null; // 경도 (Longitude)
	mapy: string | null; // 위도 (Latitude)
	type: 'museum' | 'memorial' | 'exhibition';
	addr1?: string | null;
	overview?: string | null;
}

interface ApiErrorDetail {
	table: string;
	message: string;
}

// API 응답 전체 구조에 대한 타입 (선택 사항이지만, 일관성을 위해 정의 가능)
export interface ApiResponse {
    locations: ApiLocationData[];
    error: string | null;
    partialErrorDetails?: ApiErrorDetail[] | null;
}

export const GET: RequestHandler = async () => {
	console.log('[+server.ts] API /api/locations: 서울 지역 데이터 요청 시작');
	try {
		const seoulAreaCode = '1';
		const selectColumns = 'contentid, title, mapx, mapy, addr1, overview';

		const tablesToQuery = [
			{ name: 'museum_info', type: 'museum' as const },
			{ name: 'memorial_info', type: 'memorial' as const },
			{ name: 'exhibition_info', type: 'exhibition' as const }
		];

		const promises = tablesToQuery.map(tableInfo =>
			supabase
				.from(tableInfo.name)
				.select(selectColumns)
				.eq('areacode', seoulAreaCode)
		);

		const results = await Promise.allSettled(promises);

		let allLocations: ApiLocationData[] = [];
		let errors: ApiErrorDetail[] = [];

		results.forEach((result, index) => {
			const tableName = tablesToQuery[index].name;
			const itemType = tablesToQuery[index].type;

			if (result.status === 'fulfilled') {
				const { data, error } = result.value;
				if (error) {
					console.error(`[+server.ts] Supabase error (${tableName}):`, error);
					errors.push({ table: tableName, message: error.message });
				} else if (data) {
					allLocations = allLocations.concat(
						data.map(item => ({ ...item, type: itemType }))
					);
				}
			} else {
				console.error(`[+server.ts] Promise rejected (${tableName}):`, result.reason);
				errors.push({ table: tableName, message: 'Supabase query promise rejected' });
			}
		});
		

		if (allLocations.length > 0 || errors.length === 0) { // 데이터가 있거나, 데이터는 없지만 명시적인 DB 에러도 없는 경우 (빈 결과 포함)
			console.log(`[+server.ts] Supabase에서 가져온 전체 서울 위치 데이터 (${allLocations.length}개)`);
			const responsePayload: ApiResponse = {
				locations: allLocations,
				error: errors.length > 0 ? `일부 테이블(${errors.map(e => e.table).join(', ')})에서 데이터를 가져오는 데 실패했습니다.` : null,
				partialErrorDetails: errors.length > 0 ? errors : null
			};
			return json(responsePayload, { status: 200 });
		} else { // allLocations.length === 0 && errors.length > 0 (데이터도 없고, 에러만 있는 경우)
			console.error('[+server.ts] 모든 테이블에서 데이터를 가져오는데 실패했거나 데이터가 없습니다:', errors);
			const responsePayload: ApiResponse = {
				locations: [],
				error: `모든 테이블에서 데이터를 가져오지 못했거나 오류가 발생했습니다. (${errors.map(e => e.table).join(', ')})`,
				partialErrorDetails: errors
			};
			return json(responsePayload, { status: 500 }); // 에러가 주된 상황이므로 500
		}

	} catch (e: unknown) {
		console.error('[+server.ts] API 라우트에서 최상위 예외 발생:', e);
		let errorMessage = "알 수 없는 서버 오류 발생";
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        }
		const responsePayload: ApiResponse = { locations: [], error: errorMessage, partialErrorDetails: null };
		return json(responsePayload, { status: 500 });
	}
};