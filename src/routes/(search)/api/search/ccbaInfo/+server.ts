import type { RequestEvent } from '@sveltejs/kit';
import { getCcbaItemResponse } from '../ccbaSearch';

export async function GET({ url }: RequestEvent): Promise<Response> {
	const query = url.searchParams.get('query') || '';

	// type assertion
	const searchedCcbaLocations = await getCcbaItemResponse(query, 1, 100);

	return new Response(JSON.stringify(searchedCcbaLocations), {
		headers: { 'Content-Type': 'application/json' }
	});
}
