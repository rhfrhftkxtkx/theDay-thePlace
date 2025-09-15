export interface ccbaDtApiResponse {
	ccbaKdcd: string;
	ccbaAsno: string;
	ccbaCtcd: string;
	ccbaCpno: string;
	longitude: string;
	latitude: string;
	item: {
		ccmaName: string;
		ccbaMnm1: string;
		ccbaMnm2: string;
		gcodeName: string;
		bcodeName: string;
		mcodeName: string;
		scodeName: string;
		ccbaQuan: string;
		ccbaAsdt: string;
		ccbaCtcdNm: string;
		ccsiName: string;
		ccbaLcad: string;
		ccceName: string;
		ccbaPoss: string;
		ccbaAdmin: string;
		ccbaCncl: string;
		ccbaCndt: string;
		imageUrl: string;
		content: string;
	};
}

export interface ccbaImageApiParsedItem {
	sn: number[];
	imageNuri: string[];
	imageUrl: string[];
	ccimDesc: string[];
}

export interface ccbaImageApiItem {
	sn: number;
	imageNuri: string;
	imageUrl: string;
	ccimDesc: string;
}

export interface ccbaImageApiResponse {
	totalCnt: number;
	ccbaKdcd: number;
	ccbaAsno: string;
	ccbaCtcd: number;
	ccbaMnm1: string;
	ccbaMnm2: string;
	item: ccbaImageApiItem[];
}

export interface VisitKorDetailItem {
	overview: string;
	contentid: string;
	sigungucode: string;
	cat1: string;
	cat2: string;
	cat3: string;
	addr1: string;
	addr2: string;
	zipcode: string;
	mapx: string;
	mapy: string;
	mlevel: string;
	cpyrhtDivCd: string;
	contenttypeid: string;
	createdtime: string;
	homepage: string;
	modifiedtime: string;
	tel: string;
	telname: string;
	title: string;
	firstimage: string;
	firstimage2: string;
	areacode: string;
	lDongRegnCd: string;
	lDongSignguCd: string;
	lclsSystm1: string;
	lclsSystm2: string;
	lclsSystm3: string;
}

export interface VisitKorDetailCommon2Response {
	header: {
		resultMsg: string;
		resultCode: string;
	};
	body: {
		numOfRows: number;
		items: {
			item: VisitKorDetailItem[];
		};
		pageNo: number;
		totalCount: number;
	};
}

export interface VisitKorDetailIntroItem {
	contentid: string;
	contenttypeid: string;
	accomcountculture: string;
	chkbabycarriageculture: string;
	chkcreditcardculture: string;
	chkpetculture: string;
	discountinfo: string;
	infocenterculture: string;
	parkingculture: string;
	parkingfee: string;
	restdateculture: string;
	usefee: string;
	usetimeculture: string;
	scale: string;
	spendtime: string;
}

export interface VisitKorDetailIntroResponse {
	header: {
		resultCode: string;
		resultMsg: string;
	};
	body: {
		pageNo: 0;
		numOfRows: 0;
		totalCount: 0;
		items: {
			item: VisitKorDetailIntroItem[];
		};
	};
}

export interface VisitKorCategoryResponse {
	header: {
		resultCode: number;
		resultMsg: string;
	};
	body: {
		items: {
			item: [
				{
					code: string;
					name: string;
					rnum: number;
				}
			];
		};
		numOfRows: number;
		pageNo: number;
		totalCount: number;
	};
}

export interface VisitKorImageItem {
	cpyrhtDivCd: string;
	contentid: string;
	imgname: string;
	originimgurl: string;
	serialnum: string;
	smallimgurl: string;
}

export interface VisitKorImageResponse {
	header: {
		resultCode: string;
		resultMsg: string;
	};
	body: {
		numOfRows: number;
		pageNo: number;
		totalCount: number;
		items: {
			item: VisitKorImageItem[];
		};
	};
}
