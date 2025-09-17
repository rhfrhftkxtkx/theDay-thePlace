<script lang="ts">
  import '../app.css';
  import SideMenu from '../components/features/SideMenu.svelte';

  export let data;
</script>

<SideMenu session={data.session} />

<main>
  <slot />
</main>