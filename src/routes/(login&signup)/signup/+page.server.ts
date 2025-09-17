// src/routes/signup/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const nickname = formData.get('nickname') as string;
		const passwordConfirm = formData.get('password-confirm') as string;

		if (password !== passwordConfirm) {
			return fail(400, { error: '비밀번호가 일치하지 않습니다.' });
		}

		const { error } = await supabase.auth.signUp({
			email: email,
			password: password,
			options: {
				data: {
					nickname: nickname
				}
			}
		});

		if (error) {
			return fail(500, { error: `서버 오류: ${error.message}` });
		}

		throw redirect(303, '/login?signup=success');
	}
};