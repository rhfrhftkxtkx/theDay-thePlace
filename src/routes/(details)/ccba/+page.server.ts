import type { ccbaDtApiResponse } from '$/types/detail.types';
import { XMLParser } from 'fast-xml-parser';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const CCBA_DT_SEARCH_API_URL: string = 'http://www.khs.go.kr/cha/SearchKindOpenapiDt.do';

	const ccbaKdcd = url.searchParams.get('ccbaKdcd') || '11';
	const ccbaAsno = url.searchParams.get('ccbaAsno') || '0000030000000';
	const ccbaCtcd = url.searchParams.get('ccbaCtcd') || '11';

	let ccbaDetails: ccbaDtApiResponse | null = null;
	let errorMsg: string | null = null;

	try {
		const response = await fetch(
			`${CCBA_DT_SEARCH_API_URL}?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`
		);

		if (!response.ok) {
			return { ccba: null, error: 'Failed to fetch CCBA details' };
		}
		const xml = await response.text();
		ccbaDetails = parseXml(xml);
	} catch (e) {
		console.error('Error fetching CCBA details:', e);
		errorMsg = 'Failed to load CCBA details';
	}

	return { ccba: ccbaDetails, error: errorMsg };
};

const parseXml = (xmlString: string): ccbaDtApiResponse => {
	const parser: XMLParser = new XMLParser();
	const jsonDoc = parser.parse(xmlString);

	return jsonDoc.result;
};
