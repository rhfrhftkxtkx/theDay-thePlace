// src/routes/api/locations/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);

export interface ApiLocationData {
	contentid: number;
	title: string | null;
	mapx: string | null;
	mapy: string | null;
	type: 'museum' | 'memorial' | 'exhibition';
	addr1?: string | null;
	overview?: string | null;
}

interface ApiErrorDetail {
	table: string;
	message: string;
}

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

		const promises = tablesToQuery.map((tableInfo) =>
			supabase.from(tableInfo.name).select(selectColumns).eq('areacode', seoulAreaCode)
		);

		const results = await Promise.allSettled(promises);

		let allLocations: ApiLocationData[] = [];
		let errors: ApiErrorDetail[] = [];

		results.forEach((result, index) => {
			const tableName = tablesToQuery[index].name;
			const itemType = tablesToQuery[index].type;

			if (result.status === 'fulfilled') {
				const { data, error: supabaseQueryError } = result.value; // supabase specific error
				if (supabaseQueryError) {
					console.error(`[+server.ts] Supabase error (${tableName}):`, supabaseQueryError);
					errors.push({ table: tableName, message: supabaseQueryError.message });
				} else if (data) {
					allLocations = allLocations.concat(data.map((item) => ({ ...item, type: itemType })));
				}
			} else {
				console.error(`[+server.ts] Promise rejected (${tableName}):`, result.reason);
				errors.push({ table: tableName, message: 'Supabase query promise rejected' });
			}
		});

		const responsePayload: ApiResponse = {
			locations: allLocations,
			error:
				errors.length > 0
					? `일부 테이블(${errors.map((e) => e.table).join(', ')})에서 데이터를 가져오는 데 실패했습니다.`
					: null,
			partialErrorDetails: errors.length > 0 ? errors : null
		};

		if (allLocations.length > 0 || errors.length === 0) {
			console.log(
				`[+server.ts] Supabase에서 가져온 전체 서울 위치 데이터 (${allLocations.length}개)`
			);
			return json(responsePayload, { status: 200 });
		} else {
			// allLocations.length === 0 && errors.length > 0
			console.error(
				'[+server.ts] 모든 테이블에서 데이터를 가져오는데 실패했거나 데이터가 없습니다:',
				errors
			);
			// 에러가 주된 상황이므로 HTTP 상태 코드를 500으로 할 수도 있지만,
			// 클라이언트에서 error 메시지를 보고 판단하도록 200으로 하고 error 필드를 채울 수도 있습니다.
			// 여기서는 500으로 명확한 서버측 문제를 알립니다.
			return json(responsePayload, { status: 500 });
		}
	} catch (e: unknown) {
		console.error('[+server.ts] API 라우트에서 최상위 예외 발생:', e);
		let errorMessage = '알 수 없는 서버 오류 발생';
		if (e instanceof Error) {
			errorMessage = e.message;
		} else if (typeof e === 'string') {
			errorMessage = e;
		}
		const responsePayload: ApiResponse = {
			locations: [],
			error: errorMessage,
			partialErrorDetails: null
		};
		return json(responsePayload, { status: 500 });
	}
};
