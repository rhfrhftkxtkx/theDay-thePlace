import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const formData = await request.formData();
        const email = (formData.get('email') as string).trim();
        const password = (formData.get('password') as string).trim();

        const { error } = await locals.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('로그인 오류:', error);
            return fail(401, { error: '로그인 정보가 올바르지 않습니다.' });
        }

        // 로그인 성공 시 리디렉션
        throw redirect(303, '/');
    }
};