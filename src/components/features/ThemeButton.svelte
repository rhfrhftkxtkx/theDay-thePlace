<script lang="ts">
  import Fa from 'svelte-fa';
  import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

  let theme: string = $state('light');

  $effect(() => {
    if (!localStorage.theme) {
      localStorage.theme = 'light';
    }

    theme = localStorage.theme;
    document.documentElement.setAttribute('data-theme', theme);
  });

  function toggleThemeHandler() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.theme = theme;
  }
</script>

<button
  class="rounded-full transition-colors duration-300 ease-in-out hover:bg-gray-300 p-3 dark:hover:bg-gray-600 focus:outline-none"
  onclick={toggleThemeHandler}
>
  <div class="flex items-center justify-center w-6 h-6">
    {#if theme === 'dark'}
      <Fa icon={faSun} size="lg" />
    {:else}
      <Fa icon={faMoon} size="lg" />
    {/if}
  </div>
</button>
