import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
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
