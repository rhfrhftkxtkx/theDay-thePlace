import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const formData = await request.formData();
        const nickname = (formData.get('nickname') as string).trim();
        const email = (formData.get('email') as string).trim();
        const password = (formData.get('password') as string).trim();
        const passwordConfirm = (formData.get('password-confirm') as string).trim();

        if (password !== passwordConfirm) {
            return fail(400, {
                error: '비밀번호가 일치하지 않습니다.',
                email,
            });
        }

        const { error } = await locals.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { nickname: nickname }
            }
        });

        if (error) {
            return fail(400, {
                error: '회원가입에 실패했습니다: ' + error.message,
                email,
            });
        }
        
        throw redirect(303, '/login?signup=success');
    }
};