// src/routes/login/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	if (url.searchParams.get('signup') === 'success') {
		return {
			message: '회원가입이 완료되었습니다! 이제 로그인해주세요.'
		};
	}
};