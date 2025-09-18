import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

// 즐겨찾기 추가 함수
export const actions: Actions = {
	addFavorite: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { error: '로그인이 필요합니다.' });
		}

		const formData = await request.formData();
		const locationId = Number(formData.get('locationId'));
		const title = formData.get('title') as string;
		const addr1 = formData.get('addr1') as string;
		const userId = session.user.id;

		if (!locationId || !title || !userId) {
			return fail(400, { error: '필수 정보가 누락되었습니다.' });
		}

		const { error } = await locals.supabase.from('favorites').insert({
			user_id: userId,
			location_id: locationId,
			title: title,
			addr1: addr1
		});

		if (error) {
			// UNIQUE 제약 조건 위반 (이미 추가된 항목) 에러 처리
			if (error.code === '23505') {
				return fail(409, { error: '이미 즐겨찾기에 추가된 장소입니다.' });
			}
			console.error('즐겨찾기 추가 오류:', error);
			return fail(500, { error: '즐겨찾기 추가에 실패했습니다.' });
		}

		return { success: true, message: '즐겨찾기에 추가되었습니다!' };
	}
};