import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, getSession } }) => {
	// getSession()을 유지하여 클라이언트에 세션 정보를 전달하고,
	// getUser()를 통해 인증된 사용자로 DB 조회를 합니다.
	const session = await getSession();
	let favoriteLocationIds: number[] = [];

	if (session) {
		// getUser()로 현재 인증된 사용자를 다시 한번 확인합니다.
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (user) {
			const { data } = await supabase
				.from('favorites')
				.select('location_id')
				.eq('user_id', user.id); // user.id로 조회

			if (data) {
				favoriteLocationIds = data.map((fav) => fav.location_id);
			}
		}
	}

	return {
		session,
		favoriteLocationIds: new Set(favoriteLocationIds)
	};
};