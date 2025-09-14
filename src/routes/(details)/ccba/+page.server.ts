import type {
	ccbaDtApiResponse,
	ccbaImageApiItem,
	ccbaImageApiParsedItem,
	ccbaImageApiResponse
} from '$/types/detail.types';
import { XMLParser } from 'fast-xml-parser';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const CCBA_DT_SEARCH_API_URL: string = 'http://www.khs.go.kr/cha/SearchKindOpenapiDt.do';
	const CCBA_IMAGE_SEARCH_API_URL: string = 'http://www.khs.go.kr/cha/SearchImageOpenapi.do';

	const ccbaKdcd = url.searchParams.get('ccbaKdcd') || '11';
	const ccbaAsno = url.searchParams.get('ccbaAsno') || '0000030000000';
	const ccbaCtcd = url.searchParams.get('ccbaCtcd') || '11';

	let ccbaDetails: ccbaDtApiResponse | null = null;
	let ccbaImages: ccbaImageApiItem[] | null = null;
	let errorMsg: string | null = null;

	try {
		const response = await fetch(
			`${CCBA_DT_SEARCH_API_URL}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`
		);

		if (!response.ok) {
			return { ccba: null, imgs: null, error: 'Failed to fetch CCBA details' };
		}
		const xml = await response.text();
		ccbaDetails = parseXml(xml);

		const imgResponse = await fetch(
			`${CCBA_IMAGE_SEARCH_API_URL}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`
		);

		if (!imgResponse.ok) {
			return { ccba: ccbaDetails, imgs: null, error: null };
		}

		const imgxml = await imgResponse.text();
		ccbaImages = parseImageXml(imgxml).item;
	} catch (e) {
		console.error('Error fetching CCBA details:', e);
		errorMsg = 'Failed to load CCBA details';
	}

	return { ccba: ccbaDetails, imgs: ccbaImages, error: errorMsg };
};

const parseXml = (xmlString: string): ccbaDtApiResponse => {
	const parser: XMLParser = new XMLParser();
	const jsonDoc = parser.parse(xmlString);

	return jsonDoc.result;
};

const parseImageXml = (xmlString: string): ccbaImageApiResponse => {
	const parser: XMLParser = new XMLParser();
	const jsonDoc = parser.parse(xmlString);
	const result = jsonDoc.result;

	const itemRes: ccbaImageApiParsedItem = jsonDoc.result.item;
	const items: ccbaImageApiItem[] = [];

	// 만약 sn이 배열이 아니라 단일 객체라면, 이를 배열로 변환
	if (
		!Array.isArray(itemRes.sn) &&
		!Array.isArray(itemRes.imageNuri) &&
		!Array.isArray(itemRes.imageUrl) &&
		!Array.isArray(itemRes.ccimDesc)
	) {
		items.push({
			sn: itemRes.sn,
			imageNuri: itemRes.imageNuri,
			imageUrl: itemRes.imageUrl,
			ccimDesc: itemRes.ccimDesc
		});
	} else {
		itemRes.sn.forEach((sn: number, index: number) => {
			items.push({
				sn: sn,
				imageNuri: itemRes.imageNuri[index],
				imageUrl: itemRes.imageUrl[index],
				ccimDesc: itemRes.ccimDesc[index]
			});
		});
	}

	const obj: ccbaImageApiResponse = {
		totalCnt: result.totalCnt,
		ccbaKdcd: result.ccbaKdcd,
		ccbaAsno: result.ccbaAsno,
		ccbaCtcd: result.ccbaCtcd,
		ccbaMnm1: result.ccbaMnm1,
		ccbaMnm2: result.ccbaMnm2,
		item: items
	};

	return obj;
};
