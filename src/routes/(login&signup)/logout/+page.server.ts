import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals }) => {
		// 폼 요청을 받으면 로그아웃을 실행
		await locals.supabase.auth.signOut();

		// 메인 페이지로 리디렉션
		throw redirect(303, '/');
	}
};