import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$: '/src',
			$lib: '/src/lib',
			$components: '/src/components',
			$data: '/src/data',
			$stores: '/src/stores'
		}
	}
});
