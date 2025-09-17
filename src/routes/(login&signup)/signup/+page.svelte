<script lang="ts">
	import Fa from 'svelte-fa';
	import { faUser, faEnvelope, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

	export let form;
</script>

<div class="relative flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
	<button
		type="button"
		onclick={() => history.back()}
		class="absolute top-6 left-6 p-3 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
		aria-label="뒤로가기"
	>
		<Fa icon={faArrowLeft} size="lg" />
	</button>

	<div class="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl dark:bg-gray-800">
		<div>
			<h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white">회원가입</h2>
			<p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
				새로운 계정을 만들어주세요.
			</p>
		</div>

		<form class="space-y-4" method="POST">
			{#if form?.error}
				<div
					class="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
					role="alert"
				>
					{form.error}
				</div>
			{/if}

			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<Fa icon={faUser} class="text-gray-400" />
				</div>
				<input
					type="text" name="nickname" id="nickname"
					class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
					placeholder="닉네임" required
				/>
			</div>

			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<Fa icon={faEnvelope} class="text-gray-400" />
				</div>
				<input
					type="email" name="email" id="email"
					class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
					placeholder="이메일 주소" required
				/>
			</div>

			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<Fa icon={faLock} class="text-gray-400" />
				</div>
				<input
					type="password" name="password" id="password"
					class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
					placeholder="비밀번호" required
				/>
			</div>

			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
					<Fa icon={faLock} class="text-gray-400" />
				</div>
				<input
					type="password" name="password-confirm" id="password-confirm"
					class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
					placeholder="비밀번호 확인" required
				/>
			</div>

			<div class="pt-2">
				<button
					type="submit"
					class="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					가입하기
				</button>
			</div>
		</form>

		<div class="text-sm text-center">
			<span class="text-gray-600 dark:text-gray-400">이미 계정이 있으신가요?</span>
			<a href="/login" class="font-medium text-blue-600 hover:text-blue-500"> 로그인하기 </a>
		</div>
	</div>
</div>