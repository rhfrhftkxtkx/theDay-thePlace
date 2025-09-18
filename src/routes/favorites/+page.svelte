<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowLeft, faMapLocationDot, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { enhance } from '$app/forms';

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
			<div class="w-8" ></div>
		</div>
	</header>

	<main class="container mx-auto p-4">
		{#if data.error}
			<p class="text-center text-red-500">{data.error}</p>
		{:else if data.favorites && data.favorites.length > 0}
			<ul class="space-y-3">
				{#each data.favorites as fav (fav.id)}
					<li class="bg-white dark:bg-gray-800 rounded-lg shadow flex items-center">
						<a
							href="/museum?contentId={fav.location_id}"
							class="flex-grow p-4 rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
						>
							<h2 class="font-bold text-lg">{fav.title}</h2>
							<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{fav.addr1}</p>
						</a>

						<div class="flex-shrink-0 pr-4">
							<form method="POST" action="?/deleteFavorite" use:enhance>
								<input type="hidden" name="favoriteId" value={fav.id} />
								<button
									type="submit"
									class="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
									aria-label="{fav.title} 삭제"
								>
									<Fa icon={faTrash} />
								</button>
							</form>
						</div>
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