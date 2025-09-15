import khsCategories from '$data/khsCategories.json';

export async function GET(): Promise<Response> {
	return Response.json(khsCategories);
}
