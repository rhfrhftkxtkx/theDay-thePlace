import type { ccbaDtApiResponse } from '$/types/detail.types';
import type { RequestEvent } from '@sveltejs/kit';
import { XMLParser } from 'fast-xml-parser';

const CCBA_API_URL: string = 'http://www.khs.go.kr/cha/SearchKindOpenapiDt.do';

export async function GET({ url }: RequestEvent): Promise<Response> {
	const query = url.search;
	console.log(`${CCBA_API_URL}${query}`);
	return await fetch(`${CCBA_API_URL}${query}`).then(async (response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const xml = await response.text();
		const result = parseXml(xml);

		return new Response(JSON.stringify(result.item.content || ''), {
			headers: { 'Content-Type': 'application/json' }
		});
	});
}

const parseXml = (xmlString: string): ccbaDtApiResponse => {
	const parser: XMLParser = new XMLParser();
	const jsonDoc = parser.parse(xmlString);

	return jsonDoc.result;
};
