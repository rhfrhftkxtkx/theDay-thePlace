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

	// 각 필드를 독립적으로 배열로 변환하여 정규화
	const snArr = Array.isArray(itemRes.sn) ? itemRes.sn : [itemRes.sn];
	const imageNuriArr = Array.isArray(itemRes.imageNuri) ? itemRes.imageNuri : [itemRes.imageNuri];
	const imageUrlArr = Array.isArray(itemRes.imageUrl) ? itemRes.imageUrl : [itemRes.imageUrl];
	const ccimDescArr = Array.isArray(itemRes.ccimDesc) ? itemRes.ccimDesc : [itemRes.ccimDesc];

	for (let i = 0; i < snArr.length; i++) {
		items.push({
			sn: snArr[i],
			imageNuri: imageNuriArr[i],
			imageUrl: imageUrlArr[i],
			ccimDesc: ccimDescArr[i]
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
