import type { PageLoad } from './$types';
// +server.ts 에서 export 한 타입을 가져옵니다.
import type { ApiLocationData as ServerApiLocationData } from './api/locations/+server'; // 이름 충돌을 피하기 위해 alias 사용

// +page.svelte 및 다른 곳에서 사용할 수 있도록 ApiLocationData 타입을 다시 export 합니다.
export type ApiLocationData = ServerApiLocationData;

// +page.svelte 로 전달될 데이터의 타입을 정의합니다.
export interface PageData {
	locations: ApiLocationData[];
	error: string | null;
	partialErrorDetails?: { table: string; message: string }[] | null;
}

export const load: PageLoad<PageData> = async ({ fetch }) => {
	console.log('(+page.ts) load 함수 실행됨: /api/locations API 호출을 시도합니다.');
	try {
		const response = await fetch('/api/locations');
		const resultFromApi: { 
			locations: ApiLocationData[], // 이제 여기서도 ServerApiLocationData 대신 로컬 export된 ApiLocationData 사용 가능
			error: string | null, 
			partialErrorDetails?: any 
		} = await response.json();

		if (!response.ok && !(resultFromApi && typeof resultFromApi.locations !== 'undefined')) {
			console.error('(+page.ts) API 응답 에러 (HTTP):', response.status, resultFromApi?.error || response.statusText);
			return {
				locations: [],
				error: resultFromApi?.error || `API 요청 실패, 상태 코드: ${response.status}`,
				partialErrorDetails: resultFromApi?.partialErrorDetails || null
			};
		}
		
		console.log('(+page.ts) /api/locations로부터 받은 데이터:', resultFromApi);
		return {
			locations: resultFromApi.locations || [],
			error: resultFromApi.error || null,
			partialErrorDetails: resultFromApi.partialErrorDetails || null
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