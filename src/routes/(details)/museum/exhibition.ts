import type { Exhibition } from './exhibition.type';
import { supabase } from '$lib/supabaseClient';

export async function getExhibitionList(contentId: string): Promise<Exhibition[]> {
	const { data, error } = await supabase
		.from('exhibitions')
		.select('*')
		.eq('venue_visit_kor2_id', contentId);
	if (error) {
		console.error('Error fetching exhibitions:', error);
		return [];
	}

	return data as Exhibition[];
}
