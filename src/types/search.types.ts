export interface Category {
	code: string;
	name: string;
	item: Category[];
}

export interface CcbaItemAPIResponse {
	result: {
		totalCnt: number;
		pageUnit: number;
		pageIndex: number;
		item: CcbaItemResponse[]; // CcbaItemResponse 배열
	};
}

export interface CcbaItemResponse {
	sn: number; // 순번
	no: number; // 고유 키값
	ccmaName: string; // 국가유산종목
	ccbaMnm1: string; // 국가유산명(국문)
	ccbaMnm2: string; // 국가유산명(한자)
	ccbaCtcdNm: string; // 시도명
	ccsiName: string; // 시군구명
	ccbaAdmin: string; // 관리기관(관리자)
	ccbaKdcd: string; // 종목코드
	ccbaCtcd: string; // 시도코드
	ccbaAsno: string; // 관리번호
	ccbaCncl: string; // 지정해제여부
	ccbaCpno: string; // 국가유산연계번호
	longitude: string; // 경도
	latitude: string; // 위도
	regDt: string; // 최종수정일시
}

export interface CcbaItemImageResponse {
	ccbaKdcd: string; //	종목코드
	ccbaAsno: string; //	관리번호
	ccbaCtcd: string; //	시도코드
	ccbaMnm1: string; //	국가유산명(국문)
	ccbaMnm2: string; //	국가유산명(한자)
	sn: number; //	순번
	imageNuri: string; //	공공누리 타입 A : 제1유형, B : 제2유형, C : 제3유형, D : 제4유형 공공누리 유형안내 - https://www.kogl.or.kr/info/license.do
	imageUrl: string; //	메인노출이미지URL
	ccimDesc: string; //	이미지설명
}

export interface SearchedCcbaItem {
	no: number; // 고유 키값
	ccmaName: string; // 국가유산종목
	ccbaMnm1: string; // 국가유산명(국문)
	ccbaCtcdNm: string; // 시도명
	ccbaAdmin: string; // 관리기관(관리자)
	ccbaKdcd: string; // 종목코드
	ccbaAsno: string; // 관리번호
	ccbaCtcd: string; // 시도코드
	imageUrl: string; // 메인노출이미지URL
	ccimDesc: string; // 이미지설명
}

export interface MuseumAPIResponse {
	response: {
		header: {
			resultCode: string; // 결과 코드
			resultMsg: string; // 결과 메시지
		};
		body: {
			items: {
				item: MuseumItemResponse[]; // MuseumItemResponse 배열
			};
			numOfRows: number; // 한 페이지에 보여줄 아이템 수
			pageNo: number; // 현재 페이지 번호
			totalCount: number; // 전체 아이템 수
		};
	};
}

export interface MuseumItemResponse {
	addr1: string; // 주소(예, 서울중구다동)를응답
	addr2: string; // 상세주소
	areacode: string; // 지역코드
	cat1: string; // 대분류코드
	cat2: string; // 중분류코드
	cat3: string; // 소분류코드
	contentid: string; // 콘텐츠ID
	contenttypeid: string; // 관광타입(관광지, 숙박등) ID
	createdtime: string; // 콘텐츠최초등록일
	firstimage: string; // 원본대표이미지 (약 500*333 size) URL 응답
	firstimage2: string; // 썸네일대표이미지 (약 150*100 size) URL 응답
	cpyrhtDivCd: string; // 필수요청파라메터가없음(NO_MANDATORY_REQUEST_PARAMETERS_ERROR)
	mapx: string; // GPS X좌표(WGS84 경도좌표) 응답
	mapy: string; // GPS Y좌표(WGS84 위도좌표) 응답
	mlevel: string; // Map Level 응답
	modifiedtime: string; // 콘텐츠수정일
	sigungucode: string; // 시군구코드
	tel: string; // 전화번호
	title: string; // 콘텐츠제목
	zipcode: string; // 우편번호
	lDongRegnCd: string; // 법정동 시도코드
	lDongSignguCd: string; // 법정동 시군구코드
	lclsSystm1: string; // 분류체계 1Deth
	lclsSystm2: string; // 분류체계 2Deth
	lclsSystm3: string; // 분류체계 3Deth
}

export interface SearchedMuseumItem {
	contentid: string;
	title: string;
	firstimage: string;
	addr1: string;
	tel: string;
	mapx: string;
	mapy: string;
}

export interface ServerResponse {
	ccbaItems: SearchedCcbaItem[];
	museumItems: SearchedMuseumItem[];
}
