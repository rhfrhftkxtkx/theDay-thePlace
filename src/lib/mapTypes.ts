// src/lib/mapTypes.ts

// --- API 관련 타입들 ---

// TourAPI가 응답하는 개별 아이템의 모양
export interface KtoApiItem {
	contentid: string;
	title: string;
	addr1: string;
	mapx: string;
	mapy: string;
	overview: string;
	firstimage?: string;
}

// TourAPI의 전체 응답 구조
export interface KtoApiResponse {
	response: {
		header: {
			resultCode: string;
			resultMsg: string;
		};
		body: {
			items: {
				item?: KtoApiItem[];
			};
			totalCount: number;
		};
	};
}


// --- 우리 앱 내부에서 사용할 데이터 타입 ---

// 우리 앱에서 사용할 위치 데이터의 최종적인 모양 (프론트엔드, 백엔드 공통 사용)
export interface LocationData {
    contentid: number;
    title: string | null;
    mapx: string | null;
    mapy: string | null;
    type: string;
    addr1?: string | null;
    overview?: string | null;
}

// 서버 API(/api/locations)의 최종 응답 형태이자,
// 페이지(load 함수)가 받는 데이터의 형태
export interface PageData {
    locations: LocationData[];
    error: string | null;
    // 이 부분은 현재 사용되지 않으므로, 원한다면 삭제해도 됩니다.
    partialErrorDetails?: { table: string; message: string; }[] | null;
}