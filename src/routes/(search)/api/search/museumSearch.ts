// 국가유산청의 Open API를 사용하여 검색하는 코드드

import { env } from '$env/dynamic/private';
import type {
	Category,
	MuseumAPIResponse,
	MuseumItemResponse,
	SearchedMuseumItem
} from '$/lib/searchTypes';

const API_KEY: string | undefined = env.OPEN_API_KEY;
const VISITKOREA_API_URL: string = 'https://apis.data.go.kr/B551011/KorService2';

// 아이템 목록을 검색하는 함수
// museumFilter server.ts에서 국가유산 종목만 필터링된 Category 배열
export async function museumItemSearch(
	museumFilter: Category,
	Keyword: string,
	pageNo: number
): Promise<SearchedMuseumItem[]> {
	console.log('[museumSearch] museumItemSearch: called');
	const isInvalidFilter =
		!museumFilter ||
		!museumFilter.item ||
		museumFilter.item.length === 0 ||
		museumFilter === undefined;

	const museumLocationFilter: Category[] = isInvalidFilter ? [] : museumFilter.item;

	let result: SearchedMuseumItem[] = [];

	const apiType = Keyword === '' || !Keyword ? 'areaBasedSyncList2' : 'searchKeyword2';
	if (isInvalidFilter) {
		await fetch(
			`${VISITKOREA_API_URL}/${apiType}?serviceKey=${
				API_KEY
			}&MobileOS=WEB&MobileApp=TheDay_ThePlace&cat1=A02&cat2=A0206&cat3=A02060300&_type=json&${
				apiType === 'searchKeyword2' ? `keyword=${encodeURIComponent(Keyword)}` : ''
			}&numOfRows=10&pageNo=${pageNo}`
		).then(async (response) => {
			await processingResponse(response)
				.then((data) => {
					result = data;
				})
				.catch((error) => {
					console.error(error);
				});
		});
	} else {
		for (const cat2 of museumLocationFilter) {
			const items: Category[] = cat2.item;
			for (const item of items) {
				await fetch(
					`${VISITKOREA_API_URL}/${apiType}?serviceKey=${
						API_KEY
					}&MobileOS=WEB&MobileApp=TheDay_ThePlace&cat1=A02&cat2=A0206&cat3=A02060300&_type=json&${
						cat2.code
					}=${item.code}&${
						apiType === 'searchKeyword2' ? `keyword=${encodeURIComponent(Keyword)}` : ''
					}&numOfRows=10&pageNo=${pageNo}`
				).then(async (response) => {
					await processingResponse(response)
						.then((data) => {
							result = [...result, ...data];
						})
						.catch((error) => {
							console.error(error);
						});
				});
			}
		}
	}
	return result;
}

async function processingResponse(response: Response): Promise<SearchedMuseumItem[]> {
	const result: SearchedMuseumItem[] = [];
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data: MuseumAPIResponse = await response.json();
	const museumItems: MuseumItemResponse[] = data.response.body.items.item;
	for (const mItem of museumItems) {
		const searchedItem: SearchedMuseumItem = {
			contentid: mItem.contentid,
			title: mItem.title,
			firstimage: mItem.firstimage || '',
			addr1: mItem.addr1,
			tel: mItem.tel || '',
			mapx: mItem.mapx,
			mapy: mItem.mapy
		};
		result.push(searchedItem);
	}
	return result;
}
