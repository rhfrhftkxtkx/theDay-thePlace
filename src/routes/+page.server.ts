// src/routes/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	addFavorite: async ({ request, locals: { supabase } }) => {
		// getSession() 대신 getUser()를 사용합니다.
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) {
			return fail(401, { error: '로그인이 필요합니다.' });
		}

		const formData = await request.formData();
		const locationId = Number(formData.get('locationId'));
		const title = formData.get('title') as string;
		const addr1 = formData.get('addr1') as string;

		// session.user.id 대신 user.id를 사용합니다.
		const userId = user.id;

		if (!locationId || !title || !userId) {
			return fail(400, { error: '필수 정보가 누락되었습니다.' });
		}

		const { error } = await supabase.from('favorites').insert({
			user_id: userId,
			location_id: locationId,
			title: title,
			addr1: addr1
		});

		if (error) {
			if (error.code === '23505') {
				return fail(409, { error: '이미 즐겨찾기에 추가된 장소입니다.' });
			}
			return fail(500, { error: '즐겨찾기 추가에 실패했습니다.' });
		}
		return { success: true, message: '즐겨찾기에 추가되었습니다!' };
	},

	deleteFavorite: async ({ request, locals: { supabase } }) => {
		// getSession() 대신 getUser()를 사용합니다.
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) {
			return fail(401, { error: '로그인이 필요합니다.' });
		}

		const formData = await request.formData();
		const locationId = Number(formData.get('locationId'));
		// session.user.id 대신 user.id를 사용합니다.
		const userId = user.id;

		if (!locationId) {
			return fail(400, { error: '잘못된 요청입니다.' });
		}

		const { error } = await supabase
			.from('favorites')
			.delete()
			.match({ user_id: userId, location_id: locationId });

		if (error) {
			return fail(500, { error: '삭제 중 문제가 발생했습니다.' });
		}

		return { success: true, message: '즐겨찾기에서 삭제되었습니다.' };
	}
};