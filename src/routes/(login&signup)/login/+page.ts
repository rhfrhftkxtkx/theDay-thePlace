import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	// URL 쿼리 파라미터에서 'message' 값을 가져옵니다.
	const messageFromQuery = url.searchParams.get('message');

	// 회원가입 성공 메시지를 우선적으로 처리합니다.
	if (url.searchParams.get('signup') === 'success') {
		return {
			message: '회원가입이 완료되었습니다! 이제 로그인해주세요.'
		};
	}

	// 그 외의 경우, URL에 message가 있으면 해당 메시지를 반환합니다.
	if (messageFromQuery) {
		return {
			message: messageFromQuery
		};
	}

	// 아무 메시지도 없으면 빈 객체를 반환합니다.
	return {};
};