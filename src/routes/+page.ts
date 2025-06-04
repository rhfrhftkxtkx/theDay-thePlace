import type { PageLoad } from './$types';
// +server.ts 에서 export 한 ApiLocationData 타입을 ServerApiLocationData라는 별칭으로 가져옵니다.
import type { ApiLocationData as ServerApiLocationData } from './api/locations/+server';

// ServerApiLocationData를 ApiLocationData라는 이름으로 다시 export 합니다.
// 이렇게 하면 +page.svelte에서 import type { ApiLocationData } from './+page'; 로 사용할 수 있습니다.
export type ApiLocationData = ServerApiLocationData;

// +page.svelte 로 전달될 데이터의 타입을 정의합니다.
export interface PageData {
	locations: ApiLocationData[]; // 이제 이 ApiLocationData는 위에서 re-export된 타입을 가리킵니다.
	error: string | null;
	partialErrorDetails?: { table: string; message: string }[] | null;
}

// load 함수는 이전과 동일하게 유지됩니다.
export const load: PageLoad<PageData> = async ({ fetch }) => {
	console.log('(+page.ts) load 함수 실행됨: /api/locations API 호출을 시도합니다.');
	try {
		const response = await fetch('/api/locations');
		const result: { // API 응답이 이 구조를 따를 것으로 기대
			locations: ApiLocationData[]; // ServerApiLocationData 또는 로컬 ApiLocationData 사용
			error: string | null;
			partialErrorDetails?: { table: string; message: string }[] | null;
		} = await response.json();

		if (!response.ok && !(result && typeof result.locations !== 'undefined')) {
			const errorMsg = result?.error || `API 요청 실패, 상태 코드: ${response.status}`;
			console.error('(+page.ts) API 응답 에러 (HTTP 또는 구조 문제):', response.status, errorMsg);
			return {
				locations: [],
				error: errorMsg,
				partialErrorDetails: result?.partialErrorDetails || null
			};
		}
		
		console.log('(+page.ts) /api/locations로부터 받은 데이터:', result);
		return {
			locations: result.locations || [],
			error: result.error || null,
			partialErrorDetails: result.partialErrorDetails || null
		};

	} catch (e: unknown) {
		console.error('(+page.ts) load 함수 내에서 예외 발생:', e);
		let errorMessage = "데이터 로딩 중 알 수 없는 오류가 발생했습니다.";
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        }
		return {
			locations: [],
			error: `데이터 로딩 중 예외 발생: ${errorMessage}`,
			partialErrorDetails: null
		};
	}
};