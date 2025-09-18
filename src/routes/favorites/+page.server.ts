// src/routes/favorites/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	// 로그인하지 않은 사용자는 로그인 페이지로 보냅니다.
	if (!session) {
		throw redirect(303, '/login?message=즐겨찾기 목록을 보려면 로그인이 필요합니다.');
	}

	// Supabase DB에서 현재 로그인된 사용자의 즐겨찾기 목록을 가져옵니다.
	const { data: favorites, error } = await locals.supabase
		.from('favorites')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('즐겨찾기 목록 로딩 오류:', error);
		return { favorites: [], error: '즐겨찾기 목록을 불러오는 데 실패했습니다.' };
	}

	return { favorites };
};

// --- ▼▼▼ 즐겨찾기 삭제 action 추가 ▼▼▼ ---
export const actions: Actions = {
	deleteFavorite: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { error: '로그인이 필요합니다.' });
		}

		const formData = await request.formData();
		const favoriteId = formData.get('favoriteId');

		if (!favoriteId || typeof favoriteId !== 'string') {
			return fail(400, { error: '잘못된 요청입니다.' });
		}

		// DB에서 삭제 (반드시 user_id를 함께 확인하여 본인의 즐겨찾기만 삭제하도록 합니다)
		const { error } = await locals.supabase
			.from('favorites')
			.delete()
			.match({ id: favoriteId, user_id: session.user.id });

		if (error) {
			console.error('즐겨찾기 삭제 오류:', error);
			return fail(500, { error: '삭제 중 문제가 발생했습니다.' });
		}

		// 성공적으로 삭제되면 성공 상태를 반환합니다.
		// use:enhance를 사용하면 페이지가 자동으로 새로고침되어 목록이 갱신됩니다.
		return { success: true };
	}
};