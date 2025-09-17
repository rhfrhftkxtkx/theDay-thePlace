// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password
		});

		if (error) {
			return fail(401, { error: '로그인 정보가 올바르지 않습니다.' });
		}

		throw redirect(303, '/');
	}
};