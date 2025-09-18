import type {
	VisitKorCategoryResponse,
	VisitKorDetailCommon2Response,
	VisitKorDetailIntroItem,
	VisitKorDetailIntroResponse,
	VisitKorDetailItem,
	VisitKorImageItem,
	VisitKorImageResponse
} from '$/types/detail.types';
import { OPEN_API_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types';
import { getExhibitionList } from './exhibition';

export const load: PageServerLoad = async ({ url }) => {
	const VISITKOR_DETAIL_API_URL: string =
		'http://apis.data.go.kr/B551011/KorService2/detailCommon2';
	const VISITKOR_DITAIL_INTRO_API_URL: string =
		'http://apis.data.go.kr/B551011/KorService2/detailIntro2';
	const VISITKOR_CATEGORY_API_URL: string =
		'http://apis.data.go.kr/B551011/KorService2/categoryCode2';
	const VISITKOR_IMAGE_API_URL: string = 'http://apis.data.go.kr/B551011/KorService2/detailImage2';

	const MOBILE_OS: string = 'WEB';
	const MOBILE_APP: string = 'theday-theplace';
	const SERVICE_KEY: string = OPEN_API_KEY;

	const contentId = url.searchParams.get('contentId');

	let museumDetails: VisitKorDetailItem | null = null;
	let museumIntro: VisitKorDetailIntroItem | null = null;
	let museumImg: VisitKorImageItem[] | null = null;
	let catName: string | null = null;
	let errorMsg: string | null = null;

	if (!contentId) {
		console.log('[museum] No contentId provided');
		return {
			result: 404,
			museumDetails: null,
			museumIntro: null,
			museumImg: null,
			catName: null,
			error: 'No contentId provided'
		};
	}

	try {
		const response = await fetch(
			`${VISITKOR_DETAIL_API_URL}?MobileOS=${MOBILE_OS}&MobileApp=${MOBILE_APP}&serviceKey=${SERVICE_KEY}&contentId=${contentId}&_type=json`
		);

		if (!response.ok) {
			console.error('[museum] Failed to fetch museum details');
			return {
				result: response.status,
				museumDetails: null,
				museumIntro: null,
				museumImg: null,
				catName: null,
				error: 'Failed to fetch museum details'
			};
		}

		const json = await response.json();
		const detailData: VisitKorDetailCommon2Response = json.response;

		if (detailData.header.resultMsg !== 'OK') {
			console.error('[museum] Error in API response for museum details');
			return {
				result: 500,
				museumDetails: null,
				museumIntro: null,
				museumImg: null,
				catName: null,
				error: 'Error in API response for museum details'
			};
		}
		museumDetails = detailData.body.items.item[0];

		// console.log(museumDetails);

		const catResponse = await fetch(
			`${VISITKOR_CATEGORY_API_URL}?MobileOS=${MOBILE_OS}&MobileApp=${MOBILE_APP}&serviceKey=${SERVICE_KEY}&contentTypeId=14&cat1=${museumDetails.cat1}&cat2=${museumDetails.cat2}&cat3=${museumDetails.cat3}&_type=json`
		);

		if (catResponse.ok) {
			const jsonCat = await catResponse.json();
			const catData: VisitKorCategoryResponse = jsonCat.response;
			if (catData.header.resultMsg === 'OK' && catData.body.items) {
				catName = catData.body.items.item[0]?.name || null;
			}
		} else {
			console.warn('Failed to fetch category name');
			return {
				result: catResponse.status,
				museumDetails,
				museumIntro: null,
				museumImg: null,
				catName: null,
				error: 'Failed to fetch category name'
			};
		}

		const introResponse = await fetch(
			`${VISITKOR_DITAIL_INTRO_API_URL}?MobileOS=${MOBILE_OS}&MobileApp=${MOBILE_APP}&serviceKey=${SERVICE_KEY}&contentId=${contentId}&contentTypeId=14&_type=json`
		);
		if (!introResponse.ok) {
			console.error('[museum] Failed to fetch museum intro');
			return {
				result: introResponse.status,
				museumDetails,
				museumIntro: null,
				museumImg: null,
				catName,
				error: 'Failed to fetch museum intro'
			};
		}

		const jsonIntro = await introResponse.json();
		const introData: VisitKorDetailIntroResponse = jsonIntro.response;

		if (introData.header.resultMsg !== 'OK') {
			console.error('[museum] Error in API response for museum intro');
			return {
				result: 500,
				museumDetails,
				museumIntro: null,
				museumImg: null,
				catName,
				error: 'Error in API response for museum intro'
			};
		}

		museumIntro = introData.body.items.item[0];

		const imgResponse = await fetch(
			`${VISITKOR_IMAGE_API_URL}?MobileOS=${MOBILE_OS}&MobileApp=${MOBILE_APP}&serviceKey=${SERVICE_KEY}&contentId=${contentId}&_type=json`
		);

		if (!imgResponse.ok) {
			console.error('[museum] Failed to fetch museum images');
			return {
				result: imgResponse.status,
				museumDetails,
				museumIntro,
				museumImg: null,
				catName,
				error: 'Failed to fetch museum images'
			};
		}

		const jsonImg = await imgResponse.json();
		const imgData: VisitKorImageResponse = jsonImg.response;

		if (imgData.header.resultMsg !== 'OK') {
			console.error('[museum] Error in API response for museum images');
			return {
				result: 500,
				museumDetails,
				museumIntro,
				museumImg: null,
				catName,
				error: 'Error in API response for museum images'
			};
		}

		// console.log(imgData);

		museumImg = imgData.body.items.item;
	} catch (e) {
		console.error('Error fetching museum details:', e);
		errorMsg = 'Failed to load museum details';
		return {
			result: 500,
			museumDetails: null,
			museumIntro: null,
			museumImg: null,
			catName: null,
			error: errorMsg
		};
	}

	const exhibitionList = await getExhibitionList(contentId);

	return {
		result: 200,
		museumDetails,
		museumIntro,
		museumImg,
		catName,
		exhibitionList,
		error: null
	};
};
