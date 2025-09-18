// src/routes/favorites/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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