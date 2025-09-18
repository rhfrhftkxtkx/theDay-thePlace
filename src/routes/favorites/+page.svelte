<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowLeft, faMapLocationDot } from '@fortawesome/free-solid-svg-icons';

	export let data;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
	<header class="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md z-10">
		<div class="container mx-auto px-4 py-3 flex items-center justify-between">
			<a
				href="/"
				class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
				aria-label="지도로 돌아가기"
			>
				<Fa icon={faArrowLeft} />
			</a>
			<h1 class="text-xl font-bold">즐겨찾기 목록</h1>
			<div class="w-8"></div>
			</div>
	</header>

	<main class="container mx-auto p-4">
		{#if data.error}
			<p class="text-center text-red-500">{data.error}</p>
		{:else if data.favorites && data.favorites.length > 0}
			<ul class="space-y-3">
				{#each data.favorites as fav (fav.id)}
					<li class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
						<h2 class="font-bold text-lg">{fav.title}</h2>
						<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{fav.addr1}</p>
						</li>
				{/each}
			</ul>
		{:else}
			<div class="text-center py-12">
				<p class="text-gray-500">아직 즐겨찾기한 장소가 없습니다.</p>
				<a
					href="/"
					class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					<Fa icon={faMapLocationDot} />
					<span>지도로 돌아가 장소 찾아보기</span>
				</a>
			</div>
		{/if}
	</main>
</div>