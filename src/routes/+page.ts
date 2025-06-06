import type { PageLoad } from './$types';
// +server.ts 에서 ApiLocationData 를 가져올 때, 구분을 위해 임시로 ServerApiLocationData로 명명
import type { ApiLocationData as ServerApiLocationData } from './api/locations/+server';

export type ApiLocationData = ServerApiLocationData;

export interface PageData {
	locations: ApiLocationData[]; // 이제 이 ApiLocationData는 위에서 re-export된 타입
	error: string | null;
	partialErrorDetails?: { table: string; message: string }[] | null;
}

export const load: PageLoad<PageData> = async ({ fetch }) => {
	try {
		const response = await fetch('/api/locations');
		const result: { // API 응답이 이 구조를 따를 것으로 기대
			locations: ApiLocationData[]; // ServerApiLocationData 또는 로컬 ApiLocationData 사용
			error: string | null;
			partialErrorDetails?: { table: string; message: string }[] | null;
		} = await response.json();
		
		// 오류 처리
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