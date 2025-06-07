// 국가유산청의 Open API를 사용하여 검색하는 코드드

import { XMLParser } from 'fast-xml-parser';
import type {
	Category,
	CcbaItemAPIResponse,
	CcbaItemResponse,
	CcbaItemImageResponse,
	SearchedCcbaItem
} from '$/lib/searchTypes';

const CCBA_API_URL: string = 'http://www.khs.go.kr/cha/SearchKindOpenapiList.do';
const CCBA_IMAGE_API_URL: string = 'http://www.khs.go.kr/cha/SearchImageOpenapi.do';

// 아이템 목록을 검색하는 함수
// ccbaFilter는 server.ts에서 국가유산 종목만 필터링된 Category 배열
export async function ccbaItemSearch(
	ccbaFilter: Category,
	Keyword: string,
	pageNo: number
): Promise<SearchedCcbaItem[]> {
	console.log('[ccbaSearch] ccbaItemSearch: called');
	const isInvalidFilter =
		!ccbaFilter || !ccbaFilter.item || ccbaFilter.item.length === 0 || ccbaFilter === undefined;

	const ccbaItems: Category[] = isInvalidFilter ? [] : ccbaFilter.item;

	let result: SearchedCcbaItem[] = [];

	// 상위 함수에서 try-catch로 에러를 처리
	// API query에 한 항목을 여러 개 요청 할 수 없으므로, map을 사용하여 해당 동작을 하도록 구현
	if (isInvalidFilter) {
		await fetch(
			`${CCBA_API_URL}?pageIndex=${pageNo}&pageUnit=10${Keyword ? `&ccbaMnm1=${encodeURIComponent(Keyword)}` : ''}`
		).then(async (response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const xml = await response.text();
			const ccbaItems: SearchedCcbaItem[] = await getCCbaItems(xml);
			result.push(...ccbaItems);
		});
	} else {
		for (const cat2 of ccbaItems) {
			const cat3: Category[] = cat2.item;
			for (const item of cat3) {
				console.log(`[ccbaSearch] Fetching items for category: ${cat2.name} - ${item.name}`);
				console.log(
					`${CCBA_API_URL}?${cat2.code}=${item.code}pageIndex=${pageNo}&pageUnit=10${
						Keyword ? `&ccbaMnm1=${encodeURIComponent(Keyword)}` : ''
					}`
				);
				await fetch(
					`${CCBA_API_URL}?${cat2.code}=${item.code}&pageIndex=${pageNo}&pageUnit=10${
						Keyword ? `&ccbaMnm1=${encodeURIComponent(Keyword)}` : ''
					}`
				).then(async (response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const xml = await response.text();
					const ccbaItems: SearchedCcbaItem[] = await getCCbaItems(xml);
					result.push(...ccbaItems);
				});
			}
		}
	}

	// 중복 제거
	result = result.filter(
		(item, index, self) =>
			index === self.findIndex((t) => t.ccbaAsno === item.ccbaAsno && t.ccbaKdcd === item.ccbaKdcd)
	);

	// Keyword가 있는 경우, 결과를 필터링
	if (Keyword) {
		result = result.filter((item) => item.ccbaMnm1.toLowerCase().includes(Keyword.toLowerCase()));
	}

	return result;
}

async function getCCbaItems(responseXML: string): Promise<SearchedCcbaItem[]> {
	const ccbaItems = parseXMLToCcbaItemResponse(responseXML);
	const result: SearchedCcbaItem[] = [];
	try {
		for (const item of ccbaItems) {
			await fetch(
				`${CCBA_IMAGE_API_URL}?ccbaKdcd=${item.ccbaKdcd}&ccbaAsno=${item.ccbaAsno}&ccbaCtcd=${item.ccbaCtcd}`
			).then(async (response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const xml = await response.text();
				const image: CcbaItemImageResponse = parseXMLToCcbaItemImageResponse(xml);
				const searchedItem: SearchedCcbaItem = {
					no: item.no,
					ccmaName: item.ccmaName,
					ccbaMnm1: item.ccbaMnm1,
					ccbaCtcdNm: item.ccbaCtcdNm,
					ccbaAdmin: item.ccbaAdmin,
					ccbaKdcd: item.ccbaKdcd,
					ccbaAsno: item.ccbaAsno,
					ccbaCtcd: item.ccbaCtcd,
					imageUrl: image.imageUrl,
					ccimDesc: image.ccimDesc
				};
				result.push(searchedItem);
			});
		}
	} catch (error) {
		console.error('[ccbaSearch] getCCbaItems error:', error);
		throw new Error('Failed to fetch CCBA items');
	}
	return result;
}

function parseXMLToCcbaItemResponse(xml: string): CcbaItemResponse[] {
	// XML 파싱 로직을 구현합니다.
	const parser: XMLParser = new XMLParser();
	const jsonDoc: CcbaItemAPIResponse = parser.parse(xml);
	const items: CcbaItemResponse[] = jsonDoc.result.item;

	for (const item of items) {
		if (item.ccbaAsno.toString().length < 8) {
			item.ccbaAsno = item.ccbaAsno.toString().padStart(8, '0');
		}
	}

	return items;
}

function parseXMLToCcbaItemImageResponse(xml: string): CcbaItemImageResponse {
	// XML 파싱 로직을 구현합니다.
	const parser: XMLParser = new XMLParser();
	const jsonDoc = parser.parse(xml);
	const result = jsonDoc.result;

	if (!result.item || result.item === undefined) {
		return {
			ccbaKdcd: '',
			ccbaAsno: '',
			ccbaCtcd: '',
			ccbaMnm1: '',
			ccbaMnm2: '',
			sn: 0,
			imageNuri: '',
			imageUrl: '',
			ccimDesc: ''
		};
	}

	const results: CcbaItemImageResponse = {
		ccbaKdcd: result.ccbaKdcd || '',
		ccbaAsno:
			result.ccbaAsno.toString().length < 8
				? result.ccbaAsno.toString().padStart(8, '0')
				: result.ccbaAsno,
		ccbaCtcd: result.ccbaCtcd || '',
		ccbaMnm1: result.ccbaMnm1 || '',
		ccbaMnm2: result.ccbaMnm2 || '',
		sn: result.item.sn[0] || 0,
		imageNuri: result.item.imageNuri[0] || '',
		imageUrl: result.item.imageUrl[0] || '',
		ccimDesc: result.item.ccimDesc[0] || ''
	};

	return results;
}
